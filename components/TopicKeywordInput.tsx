"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "./ui/textarea";

// Example of TopicKeywordInput component props
interface TopicKeywordInputProps {
  setOptions: React.Dispatch<
    React.SetStateAction<{ title: string; description: string }[] | undefined>
  >;
}

export default function TopicKeywordInput({
  setOptions,
}: TopicKeywordInputProps) {
  const [topic, setTopic] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, primaryKeyword, secondaryKeywords }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate options");
      }

      const data = await response.json();

      setOptions(data.options);
    } catch (error) {
      console.error("Error generating options:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Enter your topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        required
      />
      <Input
        placeholder="Enter primary keyword"
        value={primaryKeyword}
        onChange={(e) => setPrimaryKeyword(e.target.value)}
        required
      />
      <Textarea
        placeholder="Enter secondary keywords (newline separated)"
        value={secondaryKeywords.join("\n")}
        className="min-h-[4rem]"
        onChange={(e) =>
          setSecondaryKeywords(
            e.target.value.split("\n").map((kw) => kw.trim())
          )
        }
        required
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Options"}
      </Button>
    </form>
  );
}
