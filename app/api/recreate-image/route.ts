// import { NextResponse } from "next/server";
// import Replicate from "replicate";

// const replicate = new Replicate({
//   auth: process.env.REPLICATE_API_TOKEN,
// });

// export async function POST(request: Request) {
//   try {
//     const { imageUrl } = await request.json();

//     if (!imageUrl) {
//       return NextResponse.json(
//         { error: "Image URL is required" },
//         { status: 400 }
//       );
//     }

//     const output = await replicate.run(
//       "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
//       {
//         input: {
//           image: imageUrl,
//           prompt:
//             "Enhance this image with more details and better lighting, make it look professional and high quality",
//           negative_prompt: "blurry, low quality, distorted",
//           num_outputs: 1,
//           scheduler: "K_EULER",
//           num_inference_steps: 50,
//         },
//       }
//     );

//     return NextResponse.json({ imageUrl: output[0] });
//   } catch (error) {
//     console.error("Error recreating image:", error);
//     return NextResponse.json(
//       { error: "Failed to recreate image" },
//       { status: 500 }
//     );
//   }
// }
