import OpenAI from "openai";
const openai = new OpenAI();
import prompts from "./prompts.json";
import { llmConfig } from "../config/llm-config";

export async function generateSubTopicDescription(
  imageUrl: string,
  topic: string,
  keywords: string[]
) {
  const completion = await openai.chat.completions.create({
    model: llmConfig.imageDescriptionConfig.model,
    temperature: llmConfig.imageDescriptionConfig.temperature,
    top_p: llmConfig.imageDescriptionConfig.top_p,
    max_tokens: llmConfig.imageDescriptionConfig.max_tokens,
    messages: [
      {
        role: "developer",
        content: [
          {
            type: "text",
            text: prompts.imageDescriptionPrompt.join("\n"),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `write a description for this image using the following topic:${topic} and keywords: ${keywords.join(
              ", "
            )}`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
  });

  return completion.choices[0].message.content;
}
