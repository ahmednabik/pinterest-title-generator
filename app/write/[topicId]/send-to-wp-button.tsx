"use client";

import { Button } from "@/components/ui/button";
import { createWordPressPost } from "@/lib/create-wordpress-post";
import { Content } from "@/types/content";
import { Send } from "lucide-react";
import { Check } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function sendToWordPressButton({
  content,
}: {
  content: Content;
}) {
  const [postingStatus, setPostingStatus] = useState<{
    isPosting: boolean;
    phase: "idle" | "draft" | "images";
    current: number;
    total: number;
    success?: boolean;
    error?: string;
  }>({
    isPosting: false,
    phase: "idle",
    current: 0,
    total: 0,
  });

  const handleSendToWordPress = async (content: Content) => {
    setPostingStatus({
      isPosting: true,
      phase: "idle",
      current: 0,
      total: content.subtopics.length,
    });

    try {
      await createWordPressPost({
        title: content.title,
        content: content,
        onProgress: (status) => {
          if (status.phase === "draft") {
            setPostingStatus((prev) => ({
              ...prev,
              phase: "draft",
              success: status.success,
              error: status.success ? undefined : "Failed to create draft",
            }));
          } else {
            setPostingStatus((prev) => ({
              ...prev,
              phase: "images",
              current: status.current,
              total: status.total,
              error: status.success ? undefined : status.error,
            }));
          }
        },
      });

      // Set final success state
      setPostingStatus((prev) => ({
        ...prev,
        isPosting: false,
        success: true,
      }));
    } catch (error) {
      setPostingStatus((prev) => ({
        ...prev,
        isPosting: false,
        success: false,
        error: "Failed to post to WordPress",
      }));
    }
  };
  return (
    <div className="mt-16 space-y-4">
      <div className="flex justify-center">
        <Button
          onClick={() => handleSendToWordPress(content)}
          disabled={postingStatus.isPosting}
          className={`
      relative bg-purple-600 text-white hover:bg-purple-700 
      transition-colors duration-300 px-6 py-3 rounded-md 
      shadow-md hover:shadow-lg flex items-center space-x-2 
      text-lg font-semibold
      ${postingStatus.isPosting ? "opacity-80" : ""}
      ${postingStatus.success ? "bg-green-600 hover:bg-green-700" : ""}
      ${postingStatus.error ? "bg-red-600 hover:bg-red-700" : ""}
    `}
        >
          {postingStatus.isPosting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>
                {postingStatus.phase === "draft"
                  ? "Creating draft..."
                  : `Processing images (${postingStatus.current}/${postingStatus.total})`}
              </span>
            </>
          ) : postingStatus.success ? (
            <>
              <Check className="w-5 h-5" />
              <span>Posted successfully!</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send draft to WordPress</span>
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {postingStatus.error && (
        <div className="text-center text-red-600">{postingStatus.error}</div>
      )}

      {/* Progress bar */}
      {postingStatus.isPosting && (
        <div className="max-w-md mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{
                width: `${
                  postingStatus.phase === "draft"
                    ? "50"
                    : (postingStatus.current / postingStatus.total) * 100
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
