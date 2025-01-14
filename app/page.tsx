"use client";
import { useState } from "react";
import TopicKeywordInput from ".././components/TopicKeywordInput";
import OptionsDisplay from ".././components/OptionsDisplay";

export default function PinterestPinGenerator() {
  const [options, setOptions] =
    useState<{ title: string; description: string }[]>();
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-800">
          Title & Descriptions
        </h1>
        <TopicKeywordInput
          setOptions={
            setOptions as React.Dispatch<
              React.SetStateAction<
                { title: string; description: string }[] | undefined
              >
            >
          }
        />
        {options && <OptionsDisplay options={options} />}
      </div>
    </div>
  );
}
