"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface OptionProp {
  options: { title: string; description: string }[];
}

export default function OptionsDisplay(options: OptionProp) {
  // const [options, setOptions] = useState<Option[]>([])
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );

  const handleCopy = (
    text: string,
    type: "title" | "description",
    index: number
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [`${type}-${index}`]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [`${type}-${index}`]: false }));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center mb-4">
        Choose a Title and Description
      </h2>
      {Object.values(options.options).map((option, index) => (
        <Card key={index} className="hover:bg-gray-50 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Title:</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(option.title, "title", index)}
              >
                {copiedStates[`title-${index}`] ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p>{option.title}</p>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Description:</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleCopy(option.description, "description", index)
                }
              >
                {copiedStates[`description-${index}`] ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p>{option.description}</p>
            {/* <Button
              onClick={() => onSelection(option.title, option.description)}
              className="w-full mt-2"
            >
              Select
            </Button> */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
