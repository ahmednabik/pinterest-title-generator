import { NextResponse } from "next/server";
import { getSubTopics } from "@/lib/generate-subtopics";
import { generateSubTopicImages } from "@/lib/generate-subtopic-images";
import { generateSubTopicDescription } from "@/lib/generate-image-descriptions";
import dbConnect from "@/lib/mongodb";
import SubTopicSchema from "@/models/subtopic";
import TopicSchema from "@/models/topics";
import { generateTopicIntroduction } from "@/lib/generate-topic-introduction";
import { z } from "zod";
import { llmConfig } from "@/config/llm-config";

//Max number of subtopics to generate
// const MAX_SUBTOPICS = llmConfig.subtopicIdeasConfig.max_ideas;

// Input validation schema
const requestSchema = z.object({
  topic: z.string().min(1).max(200).trim(),
  keywords: z.array(z.string().min(1).max(50).trim()),
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export async function POST(request: Request) {
  const startTime = performance.now();

  try {
    // Input validation
    const body = await request.json();
    const validatedData = requestSchema.parse(body);
    const { topic, keywords } = validatedData;

    // Basic rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const userRequests = requestCounts.get(ip);

    if (userRequests) {
      if (
        now - userRequests.timestamp < RATE_LIMIT_WINDOW &&
        userRequests.count >= MAX_REQUESTS
      ) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        );
      }
      if (now - userRequests.timestamp >= RATE_LIMIT_WINDOW) {
        requestCounts.set(ip, { count: 1, timestamp: now });
      } else {
        userRequests.count++;
      }
    } else {
      requestCounts.set(ip, { count: 1, timestamp: now });
    }

    await dbConnect();

    // Parallel processing for initial data
    const [topicIntroductionResponse, subtopicsResponse] = await Promise.all([
      generateTopicIntroduction(topic, keywords, 200, 0.6), // 200 is the max length of the introduction and 0.6 is the temperature
      getSubTopics(topic, llmConfig.subtopicIdeasConfig.max_ideas), // second argument is the number of subtopics to generate
    ]);

    const subtopics = subtopicsResponse.subtopics;
    const topicIntroduction = topicIntroductionResponse.content;

    console.log("SUBTOPICS: ", JSON.stringify(subtopics, null, 2));

    if (!subtopics?.length) {
      throw new Error(`No subtopics generated: ${subtopicsResponse.error}`);
    }

    // Create main topic
    const mainTopic = await TopicSchema.create({
      title: topic,
      introduction: topicIntroduction,
      keywords: keywords,
      status: "draft",
      createdAt: new Date(),
    });

    //Process subtopics in batches to avoid overwhelming external services
    const BATCH_SIZE = 3;
    for (let i = 0; i < subtopics.length; i += BATCH_SIZE) {
      const batch = subtopics.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (subtopic, batchIndex) => {
          if (!subtopic?.title) return;

          try {
            const image = await generateSubTopicImages(subtopic);
            const description = await generateSubTopicDescription(
              image.url,
              subtopic.title,
              keywords
            );

            await SubTopicSchema.create({
              topicId: mainTopic._id,
              title: subtopic.title,
              imageUrl: image.url,
              description: description,
              keywords,
              order: i + batchIndex,
              metadata: {
                prompt: JSON.stringify(subtopic),
                model: llmConfig.replicateImageConfig.model,
                processedAt: new Date(),
              },
            });
          } catch (error) {
            console.error(
              `Error processing subtopic ${subtopic.title}:`,
              error
            );
            // Log error but continue processing other subtopics
          }
        })
      );
    }

    // Update main topic status to complete
    await TopicSchema.findByIdAndUpdate(mainTopic._id, {
      status: "published",
      completedAt: new Date(),
    });

    return NextResponse.json({
      topic_id: mainTopic._id,
      message: "Content created successfully",
    });
  } catch (error) {
    console.error("Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to process content",
        details: errorMessage,
      },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  } finally {
    const endTime = performance.now();
    console.log(
      `Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds.`
    );
  }
}
