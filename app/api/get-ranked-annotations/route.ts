import { NextResponse } from 'next/server';
import { Annotations } from '@/types/pindata';
// import Pinterest from 'pinterest.js';
import scrapAnnotations from '@/lib/scrapAnnotations';
// import fetchAnnotationVolume from '@/lib/fetch-annotations-volume-cheerio';
import fetchAnnotationVolume from '@/lib/fetch-annotations-volume-node-parser';
import { createKeywordProcessor, processKeywordSuggestions } from '@/lib/keyword-relevancy-processor';

const Pinterest = require('pinterest.js')

const MAX_PINS = 1

export async function POST(request: Request) {
  const startTime = performance.now();
  // const { searchParams } = new URL(request.url);
  // const keyword = searchParams.get('keyword');
  const { keyword } = await request.json()
  const processKeywords = createKeywordProcessor({
    wordOverlap: 0,
    sequence: 0,
    levenshtein: 0,
    cosine: 1
  });

  const validationError = validateKeyword(keyword);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (!keyword || typeof keyword !== 'string') {
    return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 });
  }

  try {
    const annotationsWithVolumes = await fetchAnnotationsWithVolumes(keyword);

    const rankedAnnotationsWithVolumes = processKeywords(keyword, annotationsWithVolumes);
    return NextResponse.json(rankedAnnotationsWithVolumes);
  } catch (error) {
    console.error('Error processing keyword:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    const endTime = performance.now();
    console.log(`OVERALL ROUTE EXECUTION TIME: ${endTime - startTime} ms`);
  }
}

function validateKeyword(keyword: string | null): string | null {
  if (!keyword || typeof keyword !== 'string') {
    return 'Invalid keyword';
  }
  const sanitizedKeyword = sanitizeKeyword(keyword);
  if (!isValidKeyword(sanitizedKeyword)) {
    return 'Invalid keyword';
  }
  return null;
}

async function fetchAnnotationsWithVolumes(keyword: string): Promise<any[]> {
  const sanitizedKeyword = sanitizeKeyword(keyword);
  const topPinsIds = await fetchTopPinsIds(sanitizedKeyword);
  const scrappedAnnotations = await fetchScrappedAnnotations(topPinsIds);
  const errors = logErrors(scrappedAnnotations.errors);
  
  const flattenedAnnotationsArray = scrappedAnnotations.annotations.flatMap(obj => 
    Object.values(obj).map(item => ({
      url: item?.url ?? '',
      name: item?.name ?? ''
    })).filter(item => item.url && item.name)
  );

  return await fetchVolumes(flattenedAnnotationsArray);
}

async function fetchTopPinsIds(keyword: string): Promise<string[]> {
  const topPins = await Pinterest.searchPins(keyword, { limit: 40 });
  return topPins.response?.map((pin: any) => pin.id).filter((id: any): id is string => id !== undefined) || [];
}

async function fetchScrappedAnnotations(topPinsIds: string[]): Promise<{ annotations: Annotations[], errors: { error: true; message: string }[] }> {
  const annotationsArray: Annotations[] = [];
  const errors: { error: true; message: string }[] = [];

  const scrappedAnnotations = await Promise.allSettled(
    topPinsIds.slice(0, MAX_PINS).map((id: string) => scrapAnnotations(id))
  );

  scrappedAnnotations.forEach((annotation) => {
    if (annotation.status === 'fulfilled') {
      if ('error' in annotation.value) {
        errors.push(annotation.value as { error: true; message: string });
      } else {
        annotationsArray.push(annotation.value);
      }
    } else {
      errors.push({ error: true, message: annotation.reason.toString() });
    }
  });

  return { annotations: annotationsArray, errors };
}

async function fetchVolumes(flattenedAnnotationsArray: { url: string; name: string }[]): Promise<any[]> {
  return await Promise.all(flattenedAnnotationsArray.map(async (annotation) => {
    const url = `https://in.pinterest.com/${annotation.url}`;
    const volume = await fetchAnnotationVolume(url);
    return { annotation: annotation.name, volume: volume };
  }));
}

function sanitizeKeyword(keyword: string): string {
  return keyword.replace(/<[^>]*>?/gm, '').trim();
}

function isValidKeyword(keyword: string): boolean {
  const minLength = 2;
  const maxLength = 100;
  return keyword.length >= minLength && keyword.length <= maxLength;
}

function logErrors(errors: { error: true; message: string }[]): void {
  errors.forEach(({ message }) => {
    console.error(`Error scraping pin: ${message}`);
  });
}