import { NextResponse } from "next/server";
import { getSubTopics } from "@/lib/generate-subtopics";
import { generateSubTopicImage } from "@/lib/genereate-ai-images";
import { writeSubTopicDescription } from "@/lib/write-image-descriptions";
import dbConnect from "@/lib/mongodb";
import SubTopicSchema from "@/models/subtopic";
import TopicSchema, { TopicInterface } from "@/models/topics";
import { getTopicIntroduction } from "@/lib/generate-topic-introduction";

export async function POST(request: Request) {
  const startTime = performance.now();
  const { topic, keywords } = await request.json();
  const topicIntroduction = await getTopicIntroduction(topic, keywords);
  const subtopics = await getSubTopics(topic);

  try {
    await dbConnect();

    // First create the main topic
    const mainTopic = await TopicSchema.create({
      title: topic,
      introduction: topicIntroduction,
      keywords: keywords,
    });

    for (const [index, subtopic] of subtopics.entries()) {
      if (!subtopic) continue;
      const image = await generateSubTopicImage(subtopic);
      const description = await writeSubTopicDescription(
        image.url,
        subtopic.title,
        keywords
      );

      // Create document in MongoDB with topic reference
      const generatedSubTopic = await SubTopicSchema.create({
        topicId: mainTopic._id,
        title: subtopic.title,
        imageUrl: image.url,
        description: description,
        keywords,
        order: index,
        metadata: {
          prompt: JSON.stringify(subtopic),
          model: "flux.1 dev schnell",
        },
      });
    }

    return NextResponse.json(mainTopic._id);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  } finally {
    const endTime = performance.now();
    console.log(
      `Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );
  }
}
