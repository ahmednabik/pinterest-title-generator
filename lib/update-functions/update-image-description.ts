import { generateSubTopicDescription } from "@/lib/generate-image-descriptions";
import dbConnect from "@/lib/mongodb";
import SubTopicSchema from "@/models/subtopic";

export async function updateImageDescription(
  subtopicId: string,
  imageUrl: string
) {
  await dbConnect();

  const subtopic = await SubTopicSchema.findById(subtopicId);
  if (!subtopic) {
    throw new Error("Subtopic not found");
  }

  const newDescription = await generateSubTopicDescription(
    imageUrl, //newly generated image url
    subtopic.title,
    subtopic.keywords
  );

  subtopic.description = newDescription;
  await subtopic.save();
}
