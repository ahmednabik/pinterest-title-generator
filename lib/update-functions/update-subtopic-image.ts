"use server";

import dbConnect from "@/lib/mongodb";
import SubTopicSchema from "@/models/subtopic";
import Replicate from "replicate";
import { revalidatePath } from "next/cache";
import { uploadImageToCloudinary } from "@/lib/upload-cloudinary";
import { updateImageDescription } from "./update-image-description";

const replicate = new Replicate({
  useFileOutput: false,
});
const model = "black-forest-labs/flux-schnell";
// Utility functions
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number, baseDelay: number) => {
  const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85-1.15
  return Math.min(baseDelay * Math.pow(2, attempt - 1) * jitter, 10000); // Cap at 10s
};

interface ReplicateInput {
  prompt: string;
  aspect_ratio: string;
  num_outputs: number;
  num_inference_steps: number;
  guidance_scale: number;
  negative_prompt: string;
  output_quality: number;
  sampler: string;
}

export async function updateSubtopicImage(subtopicId: string) {
  await dbConnect();

  // Validate and fetch subtopic
  const subtopic = await validateAndFetchSubtopic(subtopicId);

  try {
    // Generate and process image
    const imageUrl = await generateImage(subtopic.metadata.prompt);

    // Upload to Cloudinary and update description
    const cloudinaryImage = await uploadImageToCloudinary(
      imageUrl,
      subtopic.title,
      subtopic
    );
    // Update subtopic with new image and description
    await Promise.all([
      updateSubtopicWithImage(subtopic, cloudinaryImage.url),
      updateImageDescription(subtopicId, cloudinaryImage.url),
    ]);
    revalidatePath(`/write/${subtopic.topic}`);
  } catch (error) {
    logImageGenerationError(error, subtopic.title);
    throw error;
  }
}

async function validateAndFetchSubtopic(subtopicId: string) {
  if (!subtopicId?.trim()) {
    throw new Error("Invalid subtopic: title is required and cannot be empty");
  }

  const subtopic = await SubTopicSchema.findById(subtopicId);
  if (!subtopic) {
    throw new Error("Subtopic not found");
  }
  return subtopic;
}

async function generateImage(prompt: string) {
  const input: ReplicateInput = {
    prompt,
    aspect_ratio: "2:3",
    num_outputs: 1,
    num_inference_steps: 4,
    guidance_scale: 2,
    negative_prompt: "low quality, watermark, text, logo, cropped, incomplete",
    output_quality: 100,
    sampler: "euler_a",
  };

  const output = await retryReplicate(input);
  const imageUrl = output[0];

  if (!imageUrl || !imageUrl.startsWith("http")) {
    throw new Error(`Invalid image URL received: ${imageUrl}`);
  }

  return imageUrl;
}

async function updateSubtopicWithImage(subtopic: any, imageUrl: string) {
  subtopic.imageUrl = imageUrl;
  subtopic.imageGeneratedAt = new Date();

  try {
    await subtopic.save();
  } catch (error) {
    console.error("Failed to save subtopic:", error);
    throw error;
  }
}

function logImageGenerationError(error: unknown, subtopicTitle: string) {
  console.error("Image generation failed:", {
    subtopic: subtopicTitle,
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : "Unknown error",
    timestamp: new Date().toISOString(),
  });
}

async function retryReplicate(
  input: ReplicateInput,
  maxRetries = 3,
  initialDelay = 1000
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 40000);

      try {
        const output = (await replicate.run(model, {
          input,
          signal: controller.signal,
          wait: { mode: "block", interval: 1000, timeout: 30 },
        })) as string[];

        return output;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error: any) {
      lastError = error;

      const isRetriableError =
        error.code === "ETIMEDOUT" ||
        error.name === "TypeError" || // Add this to catch fetch failures
        error.message.includes("fetch failed") || // Add this to catch fetch failures
        error.message.includes("timeout") ||
        error.message.includes("rate limit") ||
        error.message.includes("socket hang up") ||
        (error.response?.status >= 500 && error.response?.status < 600);

      if (isRetriableError && attempt < maxRetries) {
        const delay = getBackoffDelay(attempt, initialDelay);
        console.warn(
          `Replicate error (${error.message}), attempt ${attempt}/${maxRetries}, waiting ${delay}ms`
        );
        await wait(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
