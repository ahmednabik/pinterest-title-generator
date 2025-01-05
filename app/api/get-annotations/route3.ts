import { NextResponse } from 'next/server';
import { Annotations } from '@/types/pindata';
import Pinterest from 'pinterest.js'
import scrapAnnotations from '@/lib/scrapAnnotations';
import fetchSearchVolumeWithCheerio from '@/lib/fetch-annotations-volume-cheerio';
// import { hasAccess } from '@/lib/payment/database-actions';

export async function GET(request: Request) {
//   if (!(await hasAccess())) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }
const annotationsArray: Annotations[] = [];
const errors: { error: true; message: string }[] = [];
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 });
    }

    const sanitizedKeyword = sanitizeKeyword(keyword);
    if (!isValidKeyword(sanitizedKeyword)) {
      return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 });
    }

    const topPins = await Pinterest.searchPins(sanitizedKeyword, { limit: 40 });
    const topPinsIds = topPins.response?.map((pin) => pin.id).filter((id): id is string => id !== undefined) || [];

    const scrappedAnnotations = await Promise.allSettled(
      topPinsIds.slice(0,4).map((id: string) => scrapAnnotations(id))
    );


//clean scrapped annotations from failed fetch errors
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
    logErrors(errors);

    const flattenedAnnotationsArray = annotationsArray.flatMap(obj => 
      Object.values(obj).map(item => ({
        url: item?.url,
        name: item?.name
      }))
    );

const AnnotationsWithVolumes = await Promise.all(flattenedAnnotationsArray.map(async (annotation) => {
  const url = `https://pinterest.com/${annotation.url}`;
  const volume = await fetchSearchVolumeWithCheerio(url);

  return {annotation: annotation.name, volume: volume}
}));


    return NextResponse.json(AnnotationsWithVolumes);
  } catch (error) {
    console.error('Error processing keyword:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function sanitizeKeyword(keyword: string): string {
  // Remove any HTML tags and trim whitespace
  return keyword.replace(/<[^>]*>?/gm, '').trim();
}

function isValidKeyword(keyword: string): boolean {
  // Check if the keyword is not empty and within a reasonable length
  const minLength = 2;
  const maxLength = 100;
  return keyword.length >= minLength && keyword.length <= maxLength;
}

function logErrors(errors: { error: true; message: string }[]): void {
  errors.forEach(({ message }) => {
    console.error(`Error scraping pin: ${message}`);
  });
}