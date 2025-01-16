import { NextRequest, NextResponse } from "next/server";
import openai from "../../../lib/openai";
import prompts from "../../../lib/prompts.json";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { llmConfig } from "../../../config/llm-config";

const titleSchema = z.object({
  title_1: z.string(),
  title_2: z.string(),
  title_3: z.string(),
});
const descriptionSchema = z.object({
  description: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { topic, primaryKeyword, secondaryKeywords } = await req.json();

    if (!topic || !primaryKeyword || !secondaryKeywords) {
      return NextResponse.json(
        { error: "Missing topic, primary keyword, or secondary keywords" },
        { status: 400 }
      );
    }

    const titleCompletion = await openai.beta.chat.completions.parse({
      model: llmConfig.titleAndDescriptionConfig.model,
      messages: [
        {
          role: "system",
          content: JSON.stringify(prompts.titlePrompt.join("\n")),
        },
        {
          role: "user",
          content: `Generate 3 Pinterest pin titles for the topic "${topic}" using the primary keyword "${primaryKeyword}".`,
        },
      ],
      n: 1,
      temperature: llmConfig.titleAndDescriptionConfig.temperature,
      response_format: zodResponseFormat(titleSchema, "titles"),
    });
    const titles = titleCompletion.choices[0].message.parsed || {};

    const options = await Promise.all(
      Object.values(titles).map(async (title) => {
        const descriptionCompletion = await openai.beta.chat.completions.parse({
          model: llmConfig.titleAndDescriptionConfig.model,
          messages: [
            {
              role: "system",
              content: JSON.stringify(prompts.descriptionPrompt.join("\n")),
            },
            {
              role: "user",
              content: `Generate a Pinterest pin description for the title "${title}" using the primary keyword "${primaryKeyword}" and the secondary keywords "${secondaryKeywords.join(
                ", "
              )}".`,
            },
          ],
          n: 1,
          temperature: llmConfig.titleAndDescriptionConfig.temperature,
          response_format: zodResponseFormat(descriptionSchema, "description"),
        });

        const description =
          descriptionCompletion.choices[0].message &&
          descriptionCompletion.choices[0].message.parsed
            ? descriptionCompletion.choices[0].message.parsed.description
            : "";
        return { title, description };
      })
    );

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Error generating options:", error);
    return NextResponse.json(
      { error: "Failed to generate options" },
      { status: 500 }
    );
  }
}
