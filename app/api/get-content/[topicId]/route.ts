import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import SubTopicSchema from "@/models/subtopic";
import TopicSchema from "@/models/topics";

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  const { topicId } = params;

  try {
    if (!topicId || !topicId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid Topic ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    const topic = await TopicSchema.findById(topicId);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const subtopics = await SubTopicSchema.find({ topicId })
      .select("title imageUrl description")
      .sort({ order: 1 })
      .lean();

    if (!topic.title || !topic.introduction) {
      return NextResponse.json(
        { error: "Incomplete topic data" },
        { status: 500 }
      );
    }

    const content = {
      title: topic.title,
      introduction: topic.introduction,
      subtopics: subtopics.map((subtopic) => ({
        subtopicId: subtopic._id,
        subheading: subtopic.title,
        imageUrl: subtopic.imageUrl || null,
        description: subtopic.description,
      })),
      createdAt: topic.createdAt,
    };

    return NextResponse.json(content);
  } catch (error: any) {
    console.error("Error fetching content:", error);
    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
