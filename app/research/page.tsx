"use client";

import { useState } from "react";
import { columns } from "../../components/columns";
import { DataTable } from "../../components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { Keyword } from "../../components/columns";

export default function KeywordResearch() {
  const [keyword, setKeyword] = useState("");
  const [data, setData] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/get-ranked-annotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const annotations = await response.json();
      setData(annotations);
    } catch (err) {
      setError("Failed to fetch keyword data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Keyword Research</h1>
        <p className="text-muted-foreground">
          Analyze and explore keyword metrics for your search terms
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-4">
        <Input
          placeholder="Enter a keyword..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Search
        </Button>
      </form>

      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      {data.length > 0 && <DataTable columns={columns} data={data} />}

      {!data.length && !isLoading && !error && (
        <div className="text-center text-muted-foreground">
          Enter a keyword above to see related annotations and metrics
        </div>
      )}
    </div>
  );
}
