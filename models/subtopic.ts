import mongoose, { Schema, InferSchemaType } from "mongoose";

const SubTopicSchema = new Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
  },
  title: String,
  imageUrl: String,
  description: String,
  keywords: [String],
  metadata: {
    prompt: String,
    model: String,
  },
  order: Number, // To maintain subtopic order if needed
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.SubTopic ||
  mongoose.model("SubTopic", SubTopicSchema);

// Infer the TypeScript type from the schema
export type SubTopicInterface = InferSchemaType<typeof SubTopicSchema>;
