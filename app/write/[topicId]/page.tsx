"use client";

import { Content } from "@/types/content";
import { updateSubtopicImage } from "@/lib/update-functions/update-subtopic-image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Send } from "lucide-react";
import { createWordPressPost } from "@/lib/create-wordpress-post";
import useSWR from "swr";
import { useParams } from "next/navigation";
import SendToWordPressButton from "./send-to-wp-button";

// You might want to move this fetcher to a separate utility file
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch content");
  return res.json();
};

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const topicId = useParams().topicId;
  const [isRegenerating, setIsRegenerating] = useState<{
    [key: string]: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);

  const {
    data: content,
    error: swrError,
    mutate,
  } = useSWR<Content>(`/api/get-content/${topicId}`, fetcher, {
    revalidateOnFocus: false, // Prevent reloading when window regains focus
  });

  if (swrError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Error loading content</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading blog post...</span>
        </div>
      </div>
    );
  }

  const handleRegenerate = async (subtopicId: string) => {
    setIsRegenerating((prev) => ({ ...prev, [subtopicId]: true }));
    setError(null);
    try {
      await updateSubtopicImage(subtopicId);
      // Revalidate the data after updating the image
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update image");
    } finally {
      setIsRegenerating((prev) => ({ ...prev, [subtopicId]: false }));
    }
  };

  const handleSendToWordPress = async () => {
    createWordPressPost({
      title: content.title,
      content: content,
      onProgress: (status) => {
        if (status.phase === "draft") {
          console.log(
            `Draft creation: ${status.success ? "success" : "failed"}`
          );
        } else {
          console.log(
            `Subtopic ${status.current}/${status.total} "${status.subtopic}": ${
              status.success ? "success" : `failed - ${status.error}`
            }`
          );
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="space-y-6 mb-16 px-4">
          <h1 className="text-4xl font-bold tracking-tight text-purple-600 sm:text-5xl">
            {content.title}
          </h1>
          <div className="space-y-4 text-gray-600">
            <p className="leading-relaxed whitespace-pre-line">
              {content.introduction}
            </p>
            {/* <p className="leading-relaxed">{blogPost.context}</p> */}
          </div>
        </header>
        <div className="space-y-5">
          {content.subtopics.map((subtopic, index) => (
            <section
              key={subtopic.subtopicId}
              className="space-y-8 p-4 rounded-lg transition-all duration-300 ease-in-out group hover:bg-gray-50"
            >
              <h2 className="text-2xl font-semibold text-gray-900">
                {index + 1}. {subtopic.subheading}
              </h2>

              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={subtopic.imageUrl}
                  alt={subtopic.subheading}
                  className="w-full shadow-md transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {subtopic.description}
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRegenerate(subtopic.subtopicId)}
                  disabled={isRegenerating[subtopic.subtopicId]}
                  className="relative overflow-hidden text-purple-600 hover:text-purple-700 hover:bg-transparent transition-colors group/button"
                >
                  <span className="relative z-10 flex items-center">
                    <RefreshCw
                      className={`w-4 h-4 mr-2 transition-transform duration-300 ease-in-out ${
                        isRegenerating[subtopic.subtopicId]
                          ? "animate-spin"
                          : "group-hover/button:rotate-180"
                      }`}
                    />
                    <span className="overflow-hidden">
                      <span className="inline-block transition-transform duration-300 ease-in-out">
                        Regenerate idea
                      </span>
                    </span>
                  </span>
                  <span className="absolute inset-0 z-0 bg-purple-100 opacity-0 transition-opacity duration-300 ease-in-out group-hover/button:opacity-100" />
                </Button>
              </div>
            </section>
          ))}
        </div>
        <SendToWordPressButton content={content} />
      </article>
    </div>
  );
}
