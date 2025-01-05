'use server'
// import type { Element } from 'cheerio';
const cheerio = require('cheerio');
// import cheerio from 'cheerio'
import { UserAgentGenerator } from './user-agent-generator';
import { LRUCache } from 'lru-cache';

// Initialize LRU cache
const cache = new LRUCache({
  max: 50, // Maximum number of items
  maxSize: 5 * 1024 * 1024, // 5MB max cache size
  sizeCalculation: (value) => {
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
  },
  ttl: 1000 * 60 * 60 // 1 hour
});

export default async function fetchSearchVolumeWithCheerio(url: string): Promise<number | null> {
  const startTime = performance.now(); // Start timing

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
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: userAgent.getHeaders(),
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.text();
    const $ = cheerio.load(data);

    // More specific selector and better error handling
    const searchVolumeElements = $('div').filter((_: number, el: Element) => 
      $(el).text().toLowerCase().includes('people searched this')
    );

    if (searchVolumeElements.length === 0) {
      console.log('Search volume element not found on page');
      return null;
    }

    // Extract the search volume text
    const searchVolumeText = $('div:contains("people searched this")').text();

    // Extract the numeric value from the text
    const searchVolumeMatch = searchVolumeText.match(/(\d+(\.\d+)?[kM]?)\s*people searched this/i);

    if (searchVolumeMatch) {
      let searchVolume = searchVolumeMatch[1];

      // Convert shorthand to a number
      if (searchVolume.toLowerCase().endsWith('k')) {
        searchVolume = parseFloat(searchVolume) * 1_000;
      } else if (searchVolume.toLowerCase().endsWith('m')) {
        searchVolume = parseFloat(searchVolume) * 1_000_000;
      } else {
        searchVolume = parseFloat(searchVolume);
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
    // More specific error handling
    if (error instanceof TypeError) {
      console.error('Network error:', error.message);
    } else {
      console.error('Error processing page:', error);
    }
    return null;
  } finally {
    const endTime = performance.now(); // End timing
    console.log(`Execution time: ${endTime - startTime} ms`); // Log execution time
  }
}