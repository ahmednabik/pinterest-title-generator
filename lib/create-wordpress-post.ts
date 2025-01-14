import { Content } from "@/types/content";

type ProgressStatus = {
  phase: "draft" | "subtopic";
  current: number;
  total: number;
  subtopic?: string;
  success: boolean;
  error?: string;
};

type ProgressCallback = (status: ProgressStatus) => void;

type WordPressPostParams = {
  title: string;
  content: Content;
  onProgress?: ProgressCallback;
};

export async function createWordPressPost({
  title,
  content,
  onProgress,
}: WordPressPostParams): Promise<number> {
  const total = content.subtopics.length + 1; // +1 for initial draft
  const baseUrl = "https://ispru.com";
  const username = "ahmednabi04@gmail.com";
  const password = "vm9k Es0E Ec86 wVnH EvRc x2XC";
  const token = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    // Create initial draft
    onProgress?.({
      phase: "draft",
      current: 0,
      total,
      success: true,
    });

    const draft = await createInitialDraft({
      title,
      introduction: content.introduction,
      baseUrl,
      token,
    });

    onProgress?.({
      phase: "draft",
      current: 1,
      total,
      success: true,
    });

    // Add subtopics one by one
    for (let i = 0; i < content.subtopics.length; i++) {
      const subtopic = content.subtopics[i];
      try {
        await addSubtopicToPost({
          postId: draft.id,
          subtopic,
          baseUrl,
          token,
        });

        onProgress?.({
          phase: "subtopic",
          current: i + 2, // +2 because we start after draft (1) and want to be 1-based
          total,
          subtopic: subtopic.subheading,
          success: true,
        });
      } catch (error) {
        onProgress?.({
          phase: "subtopic",
          current: i + 2,
          total,
          subtopic: subtopic.subheading,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Continue with next subtopic even if one fails
        console.error(
          `Failed to add subtopic "${subtopic.subheading}":`,
          error
        );
      }
    }

    return draft.id;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    onProgress?.({
      phase: "draft",
      current: 0,
      total,
      success: false,
      error: errorMessage,
    });
    throw error;
  }
}

async function uploadImageToWordPress(
  imageUrl: string,
  baseUrl: string,
  token: string
): Promise<{ id: number; url: string } | null> {
  try {
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const filename = imageUrl.split("/").pop() || "image.jpg";

    const formData = new FormData();
    formData.append("file", new Blob([imageBuffer]), filename);

    const uploadResponse = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const mediaData = await uploadResponse.json();
    return {
      id: mediaData.id,
      url: mediaData.source_url,
    };
  } catch (error) {
    console.error("Image upload failed:", error);
    return null;
  }
}

async function createInitialDraft({
  title,
  introduction,
  baseUrl,
  token,
}: {
  title: string;
  introduction: string;
  baseUrl: string;
  token: string;
}) {
  const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: { raw: title },
      content: {
        raw: `
            <p class="introduction">${introduction}</p>
          `.trim(),
      },
      status: "draft",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create draft: ${response.statusText}`);
  }

  return await response.json();
}

async function addSubtopicToPost({
  postId,
  subtopic,
  baseUrl,
  token,
}: {
  postId: number;
  subtopic: Content["subtopics"][0];
  baseUrl: string;
  token: string;
}) {
  // Upload image if exists
  let uploadedImage = null;
  if (subtopic.imageUrl) {
    uploadedImage = await uploadImageToWordPress(
      subtopic.imageUrl,
      baseUrl,
      token
    );
  }

  // Get current post content
  const currentPost = await fetch(`${baseUrl}/wp-json/wp/v2/posts/${postId}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!currentPost.ok) {
    throw new Error(`Failed to fetch post: ${currentPost.statusText}`);
  }

  const postData = await currentPost.json();
  const currentContent = postData.content.rendered;

  // Append new subtopic
  const newContent = {
    raw: `
        ${currentContent}
  
        <h2>${subtopic.subheading}</h2>
        ${
          uploadedImage
            ? `
          <figure class="alignwide">
            <img src="${uploadedImage.url}" 
                 class="wp-image-${uploadedImage.id} is-style-default" 
                 alt="${subtopic.subheading}"/>
          </figure>
        `
            : subtopic.imageUrl
            ? `
          <!-- Fallback to original image if upload failed -->
          <figure class="alignwide">
            <img src="${subtopic.imageUrl}"
                 class="is-style-default"
                 alt="${subtopic.subheading}"/>
          </figure>
        `
            : ""
        }
        <div class="has-text-align-left">
          ${subtopic.description}
        </div>
      `.trim(),
  };

  // Update post
  const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts/${postId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: newContent,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update post: ${response.statusText}`);
  }

  return await response.json();
}
