"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function WritePage() {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Input validation
    if (!topic.trim()) {
      toast.error("Please enter a valid topic");
      setIsLoading(false);
      return;
    }

    if (!keywords.trim()) {
      toast.error("Please enter at least one keyword");
      setIsLoading(false);
      return;
    }

    try {
      const keywordArray = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean); // Remove empty strings

      if (keywordArray.length === 0) {
        toast.error("Please enter valid keywords");
        return;
      }

      const response = await fetch("/api/create-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          keywords: keywordArray,
        }),
      });

      if (!response.ok) {
        toast.error(`HTTP error! status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.topic_id) {
        toast.error("Something went wrong.");
        throw new Error("No topic ID received from server");
      }

      router.push(`/write/${data.topic_id}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate content. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          AI-Powered Content Generation
        </h1>
        <p className="mt-4 text-gray-600">
          Generate stunning visuals and content in seconds with our advanced AI
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white rounded-xl shadow-lg p-8"
      >
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            What would you like to create?
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="e.g. Modern kitchen designs, Cozy bedroom setups"
            required
          />
        </div>

        <div>
          <label
            htmlFor="keywords"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Add some keywords to enhance your results
          </label>
          <input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="minimalist, scandinavian, natural light"
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            Separate keywords with commas
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Content →"
          )}
        </button>
      </form>
    </div>
  );
}
