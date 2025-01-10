import OpenAI from "openai";
const openai = new OpenAI();
import prompts from "./prompts.json";

export async function writeSubTopicDescription(
  imageUrl: string,
  topic: string,
  keywords: string[]
) {
  console.log("PROMPT: ", prompts.imageDescriptionPrompt.join("\n"));
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 1,
    top_p: 1,
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
