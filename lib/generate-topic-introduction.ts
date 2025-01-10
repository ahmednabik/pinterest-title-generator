import OpenAI from "openai";
import prompts from "./prompts.json";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getTopicIntroduction(topic: string, keywords: string[]) {
  try {
    const prompt = `Write a short engaging introduction for topic: ${topic} and consider including the keywords: ${keywords.join(
      ", "
    )} where relevant.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "developer",
          content: [
            {
              type: "text",
              text: prompts.topicIntroductionPrompt.join("\n"),
            },
          ],
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating topic introduction:", error);
    throw new Error("Failed to generate topic introduction");
  }
}
