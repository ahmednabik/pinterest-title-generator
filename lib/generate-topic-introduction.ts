import OpenAI from "openai";
import prompts from "./prompts.json";
import { z } from "zod";
import { llmConfig } from "../config/llm-config";

// Input validation schema
const inputSchema = z.object({
  topic: z.string().min(1).max(200).trim(),
  keywords: z.array(z.string().min(1).max(50).trim()),
  maxLength: z.number().min(1).max(500),
  temperature: z.number().min(0).max(1),
});

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateTopicIntroduction(
  topic: string,
  keywords: string[],
  maxLength: number,
  temperature: number
) {
  // Validate inputs
  const validated = inputSchema.parse({
    topic,
    keywords,
    maxLength,
    temperature,
  });

  try {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await delay(RETRY_DELAY * Math.pow(2, attempt));
          console.log(
            `Retry attempt ${attempt + 1} for topic: ${validated.topic}`
          );
        }

        const response = await openai.chat.completions.create({
          model: llmConfig.topicIntroductionConfig.model,
          messages: [
            {
              role: "system",
              content: prompts.topicIntroductionPrompt.join("\n"),
            },
            {
              role: "user",
              content: `Write a short engaging introduction for topic: ${
                validated.topic
              } and consider including the keywords: ${validated.keywords.join(
                ", "
              )} where relevant.`,
            },
          ],
          temperature: llmConfig.topicIntroductionConfig.temperature,
          max_tokens: llmConfig.topicIntroductionConfig.maxTokens,
          presence_penalty: llmConfig.topicIntroductionConfig.presence_penalty,
          frequency_penalty:
            llmConfig.topicIntroductionConfig.frequency_penalty,
        });

        const content = response.choices[0].message.content;

        if (!content) {
          throw new Error("Empty response from OpenAI");
        }

        return { content, error: null };
      } catch (error) {
        lastError = error as Error;

        if (error instanceof OpenAI.APIError) {
          if (["rate_limit_exceeded", "timeout"].includes(error.code || "")) {
            continue;
          }
          return {
            content: null,
            error: `OpenAI API error: ${error.message}`,
          };
        }

        throw error;
      }
    }

    return {
      content: null,
      error: `Failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`,
    };
  } catch (error) {
    console.error("Error in generateTopicIntroduction:", error);

    if (error instanceof z.ZodError) {
      return {
        content: null,
        error: `Invalid input: ${error.errors
          .map((e) => e.message)
          .join(", ")}`,
      };
    }

    return {
      content: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
