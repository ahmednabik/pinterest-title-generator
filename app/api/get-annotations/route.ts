import { NextResponse } from 'next/server';
import { Annotations } from '@/types/pindata';
import Pinterest from 'pinterest.js';
import scrapAnnotations from '@/lib/scrapAnnotations';
import fetchSearchVolumeWithCheerio from '@/lib/fetch-annotations-volume-cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  const validationError = validateKeyword(keyword);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (!keyword || typeof keyword !== 'string') {
    return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 });
  }

  try {
    const annotationsWithVolumes = await fetchAnnotationsWithVolumes(keyword);
    return NextResponse.json(annotationsWithVolumes);
  } catch (error) {
    console.error('Error processing keyword:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
  return topPins.response?.map((pin) => pin.id).filter((id): id is string => id !== undefined) || [];
}

async function fetchScrappedAnnotations(topPinsIds: string[]): Promise<{ annotations: Annotations[], errors: { error: true; message: string }[] }> {
  const annotationsArray: Annotations[] = [];
  const errors: { error: true; message: string }[] = [];

  const scrappedAnnotations = await Promise.allSettled(
    topPinsIds.slice(0, 1).map((id: string) => scrapAnnotations(id))
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
    const url = `https://pinterest.com/${annotation.url}`;
    const volume = await fetchSearchVolumeWithCheerio(url);
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



//Returned annotations format
// [
//   {
//     "annotation": "Delicious Dairy Free Dinner Recipes",
//     "volume": 93
//   },
//   {
//     "annotation": "Vegan Gluten Free Easy Recipes",
//     "volume": 36
//   },
//   {
//     "annotation": "Vegan Recipes For One Person",
//     "volume": 97
//   },
//   {
//     "annotation": "Few Ingredient Meals Vegetarian",
//     "volume": 105
//   },
//   {
//     "annotation": "College Recipes Vegetarian",
//     "volume": 62
//   },
//   {
//     "annotation": "Vegan 5 Ingredient Recipes",
//     "volume": 81
//   },
//   {
//     "annotation": "Inexpensive Vegan Meals",
//     "volume": 93
//   },
//   {
//     "annotation": "Kid Vegan Meals",
//     "volume": 170
//   },
//   {
//     "annotation": "Dinner Idea No Meat",
//     "volume": 107
//   }
// ]