import prompts from "./prompts.json";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import openai from "./openai";

const MAX_SUBTOPICS = 25;

const promptSchema = z.object({
  title: z.string(),
  camera_shot: z.string(),
  design_concept_details: z.object({
    room_type: z.string(),
    style: z.string(),
    target_demographic: z.string(),
    spatial_configuration: z.string(),
    color_palette: z.string(),
    material_selection: z.string(),
    lighting_design: z.string(),
    storage_solutions: z.string(),
    functional_innovations: z.string(),
  }),
});

export async function getSubTopics(topic: string) {
  const subtopics = [];
  for (let i = 0; i < MAX_SUBTOPICS; i++) {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "developer",
          content: [
            {
              type: "text",
              text: prompts.subtopicPrompt.join("\n"),
            },
          ],
        },
        {
          role: "user",
          content: `Generate subtopics idea for the topic: ${topic}`,
        },
      ],
      response_format: zodResponseFormat(promptSchema, "prompt"),
    });

    subtopics.push(completion.choices[0].message.parsed);
  }
  return subtopics;
}

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
