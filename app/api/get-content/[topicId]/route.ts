import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SubTopicSchema from "@/models/subtopic";
import TopicSchema from "@/models/topics";

export async function GET(
  request: Request,
  context: { params: { topicId: string } }
) {
  const { topicId } = await context.params;

  try {
    if (!topicId) {
      return NextResponse.json(
        { error: "Topic ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const topic = await TopicSchema.findById(topicId);

    const subtopics = await SubTopicSchema.find({ topicId })
      .sort({ order: 1 })
      .lean();

    const content = {
      title: topic.title,
      introduction: topic.introduction,
      subtopics: subtopics.map((subtopic) => ({
        subheading: subtopic.title,
        imageUrl: subtopic.imageUrl,
        description: subtopic.description,
      })),
    };

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
