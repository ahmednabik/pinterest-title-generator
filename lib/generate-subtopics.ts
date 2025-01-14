import OpenAI from "openai";
import prompts from "./prompts.json";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// Validation schemas
const designConceptSchema = z.object({
  room_type: z.string(),
  style: z.string(),
  target_demographic: z.string(),
  spatial_configuration: z.string(),
  color_palette: z.string(),
  material_selection: z.string(),
  lighting_design: z.string(),
  storage_solutions: z.string(),
  functional_innovations: z.string(),
});

const subtopicSchema = z.object({
  title: z.string(),
  camera_shot: z.string(),
  design_concept_details: designConceptSchema,
});

const responseSchema = z.object({
  subtopics: z.array(subtopicSchema),
});

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 10000,
  REQUEST_TIMEOUT: 30000, // Increased for larger responses
  MAX_SUBTOPICS: 25,
} as const;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  //   timeout: CONFIG.REQUEST_TIMEOUT,
  maxRetries: 0, // We handle retries ourselves
});

const delay = async (attempt: number) => {
  const baseDelay = Math.min(
    CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, attempt),
    CONFIG.MAX_RETRY_DELAY
  );
  const jitter = Math.random() * 0.3 * baseDelay;
  await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
};

export async function getSubTopics(
  topic: string,
  count: number = CONFIG.MAX_SUBTOPICS
): Promise<{
  subtopics: Array<z.infer<typeof subtopicSchema>>;
  error?: string;
}> {
  const startTime = performance.now();

  try {
    // Input validation
    if (!topic?.trim()) {
      throw new Error("Topic is required");
    }

    const requestedCount = Math.min(Math.max(1, count), CONFIG.MAX_SUBTOPICS);
    const sanitizedTopic = topic.trim().replace(/\s+/g, " ");

    // Construct the prompt to emphasize diversity
    const systemPrompt = `${prompts.subtopicPrompt.join("\n")}
    
Important: Generate exactly ${requestedCount} unique and diverse subtopic ideas. 
Each idea should be distinctly different from others in terms of:
- Design style and aesthetic
- Target demographic
- Spatial approach
- Color schemes and materials

Ensure each subtopic is approximately 300 words in total description.
Format the response as a JSON object with a 'subtopics' array containing ${requestedCount} items.`;

    let lastError: Error | null = null;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await delay(attempt);
          console.log(
            `Retry attempt ${attempt + 1}/${
              CONFIG.MAX_RETRIES
            } for topic: ${sanitizedTopic}`
          );
        }

        const response = await openai.beta.chat.completions.parse({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "developer",
              content: [
                {
                  type: "text",
                  text: systemPrompt,
                },
              ],
            },
            {
              role: "user",
              content: `Generate ${requestedCount} diverse subtopic ideas for: ${sanitizedTopic}`,
            },
          ],
          temperature: 0.9, // Higher temperature for more diversity
          response_format: zodResponseFormat(responseSchema, "response"),
        });

        const content = response.choices[0]?.message?.parsed;
        if (!content) {
          throw new Error("Empty response from OpenAI");
        }

        // Parse and validate the response
        const validatedResponse = responseSchema.parse(content);

        // Verify we got the requested number of subtopics
        if (validatedResponse.subtopics.length !== requestedCount) {
          console.error(
            `Expected ${requestedCount} subtopics but got ${validatedResponse.subtopics.length}`
          );
        }

        // Log performance metrics
        const endTime = performance.now();
        console.log(
          `Generated ${validatedResponse.subtopics.length} subtopics in ${(
            (endTime - startTime) /
            1000
          ).toFixed(2)}s`
        );

        return {
          subtopics: validatedResponse.subtopics,
        };
      } catch (error) {
        lastError = error as Error;

        if (error instanceof OpenAI.APIError) {
          const retryableErrors = [
            "rate_limit_exceeded",
            "timeout",
            "service_unavailable",
            "internal_server_error",
          ];

          if (retryableErrors.includes(error.code || "")) {
            console.warn(`Retryable error encountered: ${error.code}`);
            continue;
          }
        }

        // Don't retry parsing or validation errors
        if (error instanceof z.ZodError || error instanceof SyntaxError) {
          throw error;
        }
      }
    }

    throw new Error(
      `Failed after ${CONFIG.MAX_RETRIES} attempts. Last error: ${lastError?.message}`
    );
  } catch (error) {
    console.error("Error in getSubTopics:", error);

    if (error instanceof z.ZodError) {
      return {
        subtopics: [],
        error: `Invalid response format: ${error.errors
          .map((e) => e.message)
          .join(", ")}`,
      };
    }

    return {
      subtopics: [],
      error:
        error instanceof Error ? error.message : "Failed to generate subtopics",
    };
  }
}

// Export types for TypeScript support
export type SubTopic = z.infer<typeof subtopicSchema>;
export type DesignConcept = z.infer<typeof designConceptSchema>;

// import prompts from "./prompts.json";
// import { zodResponseFormat } from "openai/helpers/zod";
// import { z } from "zod";
// import openai from "./openai";

// const MAX_SUBTOPICS = 5;

// const promptSchema = z.object({
//   title: z.string(),
//   camera_shot: z.string(),
//   design_concept_details: z.object({
//     room_type: z.string(),
//     style: z.string(),
//     target_demographic: z.string(),
//     spatial_configuration: z.string(),
//     color_palette: z.string(),
//     material_selection: z.string(),
//     lighting_design: z.string(),
//     storage_solutions: z.string(),
//     functional_innovations: z.string(),
//   }),
// });

// export async function getSubTopics(topic: string) {
//   const subtopics = [];
//   for (let i = 0; i < MAX_SUBTOPICS; i++) {
//     const completion = await openai.beta.chat.completions.parse({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "developer",
//           content: [
//             {
//               type: "text",
//               text: prompts.subtopicPrompt.join("\n"),
//             },
//           ],
//         },
//         {
//           role: "user",
//           content: `Generate subtopics idea for the topic: ${topic}`,
//         },
//       ],
//       response_format: zodResponseFormat(promptSchema, "prompt"),
//     });

//     subtopics.push(completion.choices[0].message.parsed);
//   }
//   return subtopics;
// }

//   const sampleSubtopics = [
//     {
//       title: `Industrial Elegance Workshop`,
//       camera_shot: `Professional high-quality interior design photograph of a modern workshop space, shot with a SONY ALPHA 7R V, 16K, top photographer, full frame, highly detailed, ultra-sharp image showcasing industrial-modern aesthetics.`,
//       design_concept_details: {
//         room_type: `Garage Workshop`,
//         style: `Industrial Modern with Luxury Details`,
//         target_demographic: `Automotive enthusiasts, professional craftsmen`,
//         spatial_configuration: `Linear workflow layout with distinct zones for different activities, 12-foot ceilings with exposed structural elements, Floor-to-ceiling windows with black metal frames, Polished concrete flooring with embedded LED strips`,
//         color_palette: `Matte black primary surfaces, Brushed stainless steel accents, Warm wood tones for workbenches, Subtle gray undertones`,

//         material_selection: `Corrugated metal wall panels, Premium butcher block workbenches, Diamond plate rubber flooring in high-traffic areas, Powder-coated steel storage systems`,

//         lighting_design: `Adjustable LED track lighting system, Pendant industrial fixtures over workstations, Under-cabinet task lighting, Natural light from strategically placed skylights`,

//         storage_solutions: `Floor-to-ceiling modular cabinets with soft-close mechanisms, Magnetic tool walls with customizable configurations, Overhead storage racks with hydraulic lift system, Built-in charging stations for power tools`,

//         functional_innovations: `Retractable air and power lines from ceiling, Mobile workbenches with integrated power supplies, Climate control system with air filtration, Sound dampening wall treatments`,
//       },
//     },
//   ];
