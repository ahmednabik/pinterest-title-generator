import Replicate from "replicate";
const replicate = new Replicate({
  useFileOutput: false,
});
const model = "black-forest-labs/flux-schnell";
import cloudinary from "@/lib/cloudinary";

// Add retry utility
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryReplicate(input: any, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 40000); // cancel request after 40 seconds

      const output = (await replicate.run(model, {
        input,
        signal: controller.signal,
        wait: { mode: "block", interval: 1000, timeout: 30 },
      })) as string[];

      clearTimeout(timeout);

      return output;
    } catch (error: any) {
      lastError = error;

      // Check if it's a timeout error
      if (error.code === "ETIMEDOUT" || error.message.includes("timeout")) {
        console.warn(
          `Replicate ETIMEDOUT error, attempt ${attempt}/${maxRetries}`
        );

        if (attempt < maxRetries) {
          await wait(delay);
          delay *= 2; // Exponential backoff
          continue;
        }
      }

      // If it's not a timeout error or we're out of retries, throw
      throw error;
    }
  }

  throw lastError;
}

export async function generateSubTopicImage(subtopic: any) {
  if (!subtopic?.title) {
    throw new Error("Invalid subtopic: title is required");
  }

  const sanitizedTitle = subtopic.title.replace(/[^a-zA-Z0-9-_]/g, "_");

  try {
    const input = {
      prompt: JSON.stringify(subtopic),
      aspect_ratio: "2:3",
      num_outputs: 1,
      num_inference_steps: 4,
      guidance_scale: 2,
      negative_prompt:
        "low quality, watermark, text, logo, cropped, incomplete",
      output_quality: 100,
      sampler: "euler_a",
    };

    // Use the retry wrapper instead of direct call
    const output = await retryReplicate(input);

    if (!output?.[0]) {
      throw new Error("No image generated from Replicate");
    }

    const uploadOptions = {
      public_id: sanitizedTitle,
      folder: "Pinterest",
      timeout: 10000,
      quality: "auto",
      fetch_format: "auto",
      secure: true,
    };

    const uploadResponse = await cloudinary.uploader.upload(
      output[0],
      uploadOptions
    );

    return {
      title: subtopic.title,
      url: uploadResponse.secure_url,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Image generation failed:", {
      subtopic: subtopic.title,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
