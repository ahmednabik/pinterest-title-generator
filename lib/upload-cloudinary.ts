import cloudinary from "./cloudinary";

interface SubTopic {
  title: string;
  [key: string]: any;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number, baseDelay: number) => {
  const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85-1.15
  return Math.min(baseDelay * Math.pow(2, attempt - 1) * jitter, 10000); // Cap at 10s
};
export async function uploadImageToCloudinary(
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
