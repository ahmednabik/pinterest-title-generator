import Image from "next/image";
import PostButton from "./post-wordpress-button";
import { Content } from "@/types/content";
export default async function TopicPage({
  params,
}: {
  params: { topicId: string };
}) {
  const awaitedParams = await params; // Await the param for some stupid reason in Nextjs 15+
  const topicId = awaitedParams.topicId;
  const response = await fetch(
    `http://localhost:3000/api/get-content/${topicId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch content", {
      cause: response.statusText,
    });
  }

  const content: Content = await response.json();

  if (!content) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>No content found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-8">{content.title}</h1>
      <div className="space-y-4">
        <p className="text-gray-700 whitespace-pre-line">
          {content.introduction}
        </p>
      </div>
      {content.subtopics.map((subtopic) => (
        <div key={subtopic.subheading} className="space-y-8">
          <h1 className="text-3xl font-bold mb-8 text-left">
            {subtopic.subheading}
          </h1>

          <div>
            <Image
              src={subtopic.imageUrl}
              alt={subtopic.subheading}
              width={2000}
              height={2000}
              className="w-full h-auto rounded-lg max-w-[720px]"
              priority
            />
          </div>

          <div className="space-y-4">
            <p className="text-gray-700 whitespace-pre-line">
              {subtopic.description}
            </p>
          </div>
        </div>
      ))}
      <PostButton content={content} />
    </div>
  );
}
