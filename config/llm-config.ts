export const llmConfig = {
  subtopicIdeasConfig: {
    model: "gpt-4o",
    temperature: 0.9,
    max_ideas: 10,
  },
  topicIntroductionConfig: {
    model: "gpt-4o-mini",
    temperature: 0.5,
    presence_penalty: 0.2,
    frequency_penalty: 0.3,
  },
  titleAndDescriptionConfig: {
    model: "gpt-4o-mini",
    temperature: 0.7,
  },
  imageDescriptionConfig: {
    model: "gpt-4o-mini",
    temperature: 0.75,
    top_p: 0.9,
    frequency_penalty: 0.35,
    presence_penalty: 0.25,
    max_tokens: 100,
  },
  replicateImageConfig: {
    model: "black-forest-labs/flux-schnell",
    timeout: 30,
    aspect_ratio: "2:3",
    num_outputs: 1,
    num_inference_steps: 4,
    guidance_scale: 2,
    negative_prompt: "low quality, watermark, text, logo, cropped, incomplete",
    output_quality: 100,
    sampler: "euler_a",
  },
};
