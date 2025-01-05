'use server'
import { parse } from 'node-html-parser';
import { LRUCache } from 'lru-cache';
import { UserAgentGenerator } from './user-agent-generator';
import { limiter } from './limiter';

// Initialize LRU cache
const cache = new LRUCache({
  max: 50, // Maximum number of items
  maxSize: 5 * 1024 * 1024, // 5MB max cache size
  sizeCalculation: (value) => {
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
  },
  ttl: 1000 * 60 * 60 // 1 hour
});

export default async function fetchSearchVolume(url: string): Promise<number | null> {
  const startTime = performance.now();

  // Check cache first
  const cached = cache.get(url);
  if (cached !== undefined) {
    console.log('Cache hit for:', url);
    return cached as number;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    console.error('Invalid URL format:', url);
    return null;
  }

  const userAgent = new UserAgentGenerator();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // Stream the response instead of loading entire body
    const response = await limiter.schedule (() => fetch(url, {
      // signal: controller.signal,
      headers: userAgent.getHeaders(),
    }));
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    // Use streaming to process the response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let html = '';
    
    if (!reader) return null;

    // Read chunks until we find the search volume text
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      
      html += decoder.decode(value, {stream: true});
      
      // If we find our target text, we can stop reading
      if (html.toLowerCase().includes('people searched this')) {
        reader.cancel(); // Stop reading the rest of the response
        break;
      }
    }

    // Parse with node-html-parser
    const root = parse(html);

    // Find elements containing our target text
    const elements = root.querySelectorAll('*').filter(el => 
      el.text.toLowerCase().includes('people searched this')
    );

    if (elements.length === 0) {
      console.log('Search volume element not found on page');
      return null;
    }

    // Extract the search volume text from the first matching element
    const searchVolumeText = elements[0].text;

    // Extract the numeric value from the text
    const searchVolumeMatch = searchVolumeText.match(/(\d+(\.\d+)?[kM]?)\s*people searched this/i);

    if (searchVolumeMatch) {
      let searchVolume = searchVolumeMatch[1];

      // Convert shorthand to a number
      if (searchVolume.toLowerCase().endsWith('k')) {
        searchVolume = String(parseFloat(searchVolume) * 1_000);
      } else if (searchVolume.toLowerCase().endsWith('m')) {
        searchVolume = String(parseFloat(searchVolume) * 1_000_000);
      }

      const result = parseFloat(searchVolume);
      console.log(`Search Volume: ${result}`);
      
      // Store successful result in cache
      cache.set(url, result);
      
      return result;
    } else {
      console.log('Search volume not found.');
      return null;
    }
  } catch (error) {
    if (error instanceof TypeError) {
      console.error('Network error:', error.message);
    } else {
      console.error('Error processing page:', error);
    }
    return null;
  } finally {
    const endTime = performance.now();
    console.log(`Execution time: ${endTime - startTime} ms`);
  }
}
