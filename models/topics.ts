import mongoose, { Schema, InferSchemaType } from "mongoose";

const TopicSchema = new Schema({
  title: String,
  introduction: String,
  keywords: [String],
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Topic || mongoose.model("Topic", TopicSchema);

export type TopicInterface = InferSchemaType<typeof TopicSchema>;
