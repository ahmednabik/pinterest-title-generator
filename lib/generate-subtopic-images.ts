import Replicate from "replicate";
import cloudinary from "@/lib/cloudinary";
import { llmConfig } from "../config/llm-config";

// Interfaces
interface SubTopic {
  title: string;
  [key: string]: any;
}

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

// Configuration
const replicate = new Replicate({
  useFileOutput: false,
});
// const model = llmConfig.replicateImageConfig.model;
// Utility functions
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number, baseDelay: number) => {
  const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85-1.15
  return Math.min(baseDelay * Math.pow(2, attempt - 1) * jitter, 10000); // Cap at 10s
};

export async function generateSubTopicImages(subtopic: SubTopic) {
  // Input validation
  if (!subtopic?.title?.trim()) {
    throw new Error("Invalid subtopic: title is required and cannot be empty");
  }

  const sanitizedTitle = subtopic.title
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 100); // Limit length for safety

  try {
    const input: ReplicateInput = {
      prompt: JSON.stringify(subtopic),
      aspect_ratio: llmConfig.replicateImageConfig.aspect_ratio,
      num_outputs: llmConfig.replicateImageConfig.num_outputs,
      num_inference_steps: llmConfig.replicateImageConfig.num_inference_steps,
      guidance_scale: llmConfig.replicateImageConfig.guidance_scale,
      output_quality: llmConfig.replicateImageConfig.output_quality,
      sampler: llmConfig.replicateImageConfig.sampler,
      negative_prompt: llmConfig.replicateImageConfig.negative_prompt,
    };

    const output = await retryReplicate(input);
    const imageUrl = output[0];

    if (!imageUrl || !imageUrl.startsWith("http")) {
      throw new Error(`Invalid image URL received: ${imageUrl}`);
    }

    return await uploadImageToCloudinary(imageUrl, sanitizedTitle, subtopic);
  } catch (error) {
    // Enhanced error logging
    console.error("Image generation failed:", {
      subtopic: subtopic.title,
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
    throw error;
  }
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
        const output = (await replicate.run(
          llmConfig.replicateImageConfig.model as `${string}/${string}`,
          {
            input,
            signal: controller.signal,
            wait: {
              mode: "block",
              interval: 1000,
              timeout: llmConfig.replicateImageConfig.timeout,
            },
          }
        )) as string[];

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

async function uploadImageToCloudinary(
  imageUrl: string,
  sanitizedTitle: string,
  subtopic: SubTopic,
  maxRetries = 3,
  initialDelay = 1000
) {
  const uploadOptions = {
    public_id: sanitizedTitle,
    folder: "Pinterest",
    timeout: 10000,
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  };

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout handling for cloudinary upload
      const uploadPromise = cloudinary.uploader.upload(imageUrl, uploadOptions);
      const uploadResponse = await Promise.race([
        uploadPromise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Cloudinary upload timeout")),
            15000
          )
        ),
      ]);

      return {
        title: subtopic.title,
        url: uploadResponse.secure_url,
        generated_at: new Date().toISOString(),
      };
    } catch (error: any) {
      lastError = error;

      const isRetriableError =
        error.message.includes("timeout") ||
        error.message.includes("network") ||
        error.message.includes("rate limit") ||
        (error.http_code >= 500 && error.http_code < 600);

      if (isRetriableError && attempt < maxRetries) {
        const delay = getBackoffDelay(attempt, initialDelay);
        console.warn(
          `Cloudinary upload failed (${error.message}), attempt ${attempt}/${maxRetries}, waiting ${delay}ms`
        );
        await wait(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
