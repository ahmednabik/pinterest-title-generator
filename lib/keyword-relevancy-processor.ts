import natural from 'natural';
import { stringSimilarity } from 'string-similarity-js';

// Types
type Weights = {
  wordOverlap: number;
  sequence: number;
  levenshtein: number;
  cosine: number;
};

type KeywordSuggestion = {
  annotation: string;
  volume: number;
  relevancy_score?: number;
  normalized_annotation?: string;
};

type ScoreCache = Map<string, number>;

// Default weights
const DEFAULT_WEIGHTS: Weights = {
  wordOverlap: 0.3,
  sequence: 0.3,
  levenshtein: 0.2,
  cosine: 0.2
};

// Core scoring functions
const normalizeKeyphrase = (keyphrase: string): string => 
  keyphrase.toLowerCase().trim();

const calculateWordOverlapScore = (words1: string[], words2: string[]): number => {
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  return (2 * intersection.size) / (set1.size + set2.size);
};

const calculateSequenceScore = (words1: string[], words2: string[]): number => {
  const m = words1.length;
  const n = words2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  let maxLength = 0;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        maxLength = Math.max(maxLength, dp[i][j]);
      }
    }
  }
  
  return (2 * maxLength) / (m + n);
};

const getCacheKey = (target: string, suggestion: string): string => 
  `${target}|${suggestion}`;

const calculateRelevancyScore = (
  normalizedTarget: string,
  targetWords: string[],
  normalizedSuggestion: string,
  weights: Weights,
  cache: ScoreCache
): number => {
  const cacheKey = getCacheKey(normalizedTarget, normalizedSuggestion);
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const suggestionWords = normalizedSuggestion.split(/\s+/);
  
  const scores = {
    wordOverlap: calculateWordOverlapScore(targetWords, suggestionWords),
    sequence: calculateSequenceScore(targetWords, suggestionWords),
    levenshtein: 1 - (natural.LevenshteinDistance(normalizedTarget, normalizedSuggestion) / 
      Math.max(normalizedTarget.length, normalizedSuggestion.length)),
    cosine: stringSimilarity(normalizedTarget, normalizedSuggestion)
  };

  const finalScore = Object.entries(weights).reduce(
    (acc, [method, weight]) => acc + scores[method as keyof typeof scores] * weight,
    0
  ) / Object.values(weights).reduce((a, b) => a + b, 0);

  cache.set(cacheKey, finalScore);
  return finalScore;
};

// Main processing function
const processKeywordSuggestions = (
  targetKeyphrase: string,
  suggestions: KeywordSuggestion[],
  weights: Weights = DEFAULT_WEIGHTS
): KeywordSuggestion[] => {
  const cache: ScoreCache = new Map();
  const normalizedTarget = normalizeKeyphrase(targetKeyphrase);
  const targetWords = normalizedTarget.split(/\s+/);

  const processedSuggestions = suggestions.map(suggestion => {
    const normalizedSuggestion = normalizeKeyphrase(suggestion.annotation);
    const relevancyScore = calculateRelevancyScore(
      normalizedTarget,
      targetWords,
      normalizedSuggestion,
      weights,
      cache
    );

    return {
      ...suggestion,
      relevancy_score: relevancyScore,
      normalized_annotation: normalizedSuggestion
    };
  });

  return processedSuggestions.sort((a, b) => 
    (b.relevancy_score ?? 0) - (a.relevancy_score ?? 0) || b.volume - a.volume
  );
};

// Create a processor with custom configuration
const createKeywordProcessor = (customWeights?: Partial<Weights>) => {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };
  
  return (targetKeyphrase: string, suggestions: KeywordSuggestion[]) =>
    processKeywordSuggestions(targetKeyphrase, suggestions, weights);
};

export {
  processKeywordSuggestions,
  createKeywordProcessor,
  type KeywordSuggestion,
  type Weights
};