"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WritePage() {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const keywordArray = keywords.split(",").map((k) => k.trim());

      const response = await fetch("/api/create-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          keywords: keywordArray,
        }),
      });

      const topic_id = await response.json();

      if (topic_id) {
        router.push(`/write/${topic_id}`);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Generate Images</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic" className="block mb-2">
            Topic
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter topic"
            required
          />
        </div>

        <div>
          <label htmlFor="keywords" className="block mb-2">
            Keywords (comma separated)
          </label>
          <input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="keyword1, keyword2, keyword3"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </form>
    </div>
  );
}
