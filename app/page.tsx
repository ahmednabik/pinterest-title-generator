"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratedOption {
  title: string;
  description: string;
}

interface GenerateRequestBody {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
}

export default function PinterestGenerator() {
  const [topic, setTopic] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedMap, setCopiedMap] = useState<{ [key: string]: boolean }>({});
  const [generatedOptions, setGeneratedOptions] = useState<GeneratedOption[]>(
    []
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          primaryKeyword,
          secondaryKeywords,
        } as GenerateRequestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to generate options");
      }

      const data = await response.json();
      setGeneratedOptions(data.options);
    } catch (error) {
      console.error("Error generating options:", error);
      // You might want to add error handling UI here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (
    text: string,
    type: "title" | "description",
    index: number
  ) => {
    await navigator.clipboard.writeText(text);
    setCopiedMap({ ...copiedMap, [`${type}-${index}`]: true });
    setTimeout(() => {
      setCopiedMap({ ...copiedMap, [`${type}-${index}`]: false });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-purple-600 text-center mb-12">
          Title & Descriptions
        </h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <Input
              id="topic"
              placeholder="Main topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border-gray-200 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Input
              id="primaryKeyword"
              placeholder="Primary keyword"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              className="border-gray-200 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Textarea
              id="secondaryKeywords"
              placeholder="Secondary keywords (comma separated)"
              value={secondaryKeywords}
              onChange={(e) =>
                setSecondaryKeywords(
                  e.target.value.split("\n").map((kw) => kw.trim())
                )
              }
              className="min-h-[100px] border-gray-200 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-300"
          >
            <Sparkles
              className={cn("w-5 h-5 mr-2", isGenerating && "animate-pulse")}
            />
            {isGenerating ? "Generating options..." : "Generate options"}
          </Button>
        </div>

        {generatedOptions.length > 0 && (
          <div className="mt-12 space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              Choose a Title and Description
            </h2>

            <div className="space-y-6">
              {generatedOptions.map((option, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-6 space-y-4 transition-all duration-300 hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between group">
                      <h3 className="font-semibold text-gray-900 flex-grow">
                        Title:
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(option.title, "title", index)}
                        className="text-gray-500 hover:text-purple-600"
                      >
                        {copiedMap[`title-${index}`] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-gray-600">{option.title}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between group">
                      <h3 className="font-semibold text-gray-900 flex-grow">
                        Description:
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(option.description, "description", index)
                        }
                        className="text-gray-500 hover:text-purple-600"
                      >
                        {copiedMap[`description-${index}`] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-gray-600">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// "use client";
// import { useState } from "react";
// import TopicKeywordInput from ".././components/TopicKeywordInput";
// import OptionsDisplay from ".././components/OptionsDisplay";

// export default function PinterestPinGenerator() {
//   const [options, setOptions] =
//     useState<{ title: string; description: string }[]>();
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
//       <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
//         <h1 className="text-3xl font-bold text-center mb-8 text-purple-800">
//           Title & Descriptions
//         </h1>
//         <TopicKeywordInput
//           setOptions={
//             setOptions as React.Dispatch<
//               React.SetStateAction<
//                 { title: string; description: string }[] | undefined
//               >
//             >
//           }
//         />
//         {options && <OptionsDisplay options={options} />}
//       </div>
//     </div>
//   );
// }
