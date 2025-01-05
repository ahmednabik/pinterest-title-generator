import { Annotations } from "@/types/pindata";
type ScrapedResult = Annotations | { error: true; message: string };
import { UserAgentGenerator } from './user-agent-generator';
import { limiter } from "./limiter";

export default async function scrapAnnotations(pinId: string): Promise<ScrapedResult> {
  const PIN_ID_REGEX = /^[0-9]+$/;
  if (!pinId || !PIN_ID_REGEX.test(pinId)) {
    return { error: true, message: 'Invalid pinId format' };
  }

  const URL = constructPinterestUrl(pinId);
  const userAgent = new UserAgentGenerator();
 
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await limiter.schedule(() => fetch(URL, {
      method: "GET",
      headers: userAgent.getHeaders(),
      signal: controller.signal
    }));

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} on https://pinterest.com/pin/${pinId}/`);
    }

    const data = await response.json();
    const resourceData = data?.resource_response?.data;

    if (!resourceData) {
      throw new Error('No data found in response');
    }

    const annotations: Annotations = resourceData?.pin_join?.annotations_with_links || [];


    return annotations;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: true, message: 'Request timed out' };
      }
      return { error: true, message: error.message };
    }
    return { error: true, message: 'Unknown error occurred' };
  }
}

function constructPinterestUrl(pinId: string): string {
  const params = {
    source_url: `/pin/${pinId}/`,
    data: {
      options: {
        id: pinId,
        field_set_key: "auth_web_main_pin",
        noCache: true,
        fetch_visual_search_objects: true,
      },
      context: {},
    }
  };
  return `https://in.pinterest.com/resource/PinResource/get/?source_url=${encodeURIComponent(
    params.source_url
  )}&data=${encodeURIComponent(JSON.stringify(params.data))}`;
}