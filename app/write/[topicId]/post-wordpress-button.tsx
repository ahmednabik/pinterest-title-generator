"use client";

import { createWordPressPost } from "@/lib/create-wordpress-post";
import { Content } from "@/types/content";
import { useState } from "react";

interface PostButtonProps {
  content: Content;
}

export default function PostButton({ content }: PostButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        const postId = await createWordPressPost({
          title: content.title,
          content: content,
          onProgress: (status) => {
            if (status.phase === "draft") {
              console.log(
                `Draft creation: ${status.success ? "success" : "failed"}`
              );
            } else {
              console.log(
                `Subtopic ${status.current}/${status.total} "${
                  status.subtopic
                }": ${status.success ? "success" : `failed - ${status.error}`}`
              );
            }
          },
        });
      }}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? "Creating..." : "Create Post"}
    </button>
  );
}
