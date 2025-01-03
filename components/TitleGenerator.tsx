'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const generateTitles = async (topic: string, keyword: string): Promise<string[]> => {
  try {
    const response = await fetch('/api/generate-titles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, keyword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.titles || !Array.isArray(data.titles)) {
      throw new Error('Invalid response format');
    }

    return data.titles;
  } catch (error) {
    console.error('Error generating titles:', error);
    throw new Error(`Failed to generate titles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

interface TitleGeneratorProps {
  onTitleSelect: (title: string) => void
}

export default function TitleGenerator({ onTitleSelect }: TitleGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [keyword, setKeyword] = useState('')
  const [titles, setTitles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const generatedTitles = await generateTitles(topic, keyword)
      setTitles(generatedTitles)
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // You might want to set an error state here and display it to the user
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <Input
          placeholder="Enter your topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <Input
          placeholder="Enter target keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Titles'}
        </Button>
      </form>
      {titles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-4">Choose a Title</h2>
          {titles.map((title, index) => (
            <Card key={index} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onTitleSelect(title)}>
              <CardContent className="p-4">
                <p>{title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

