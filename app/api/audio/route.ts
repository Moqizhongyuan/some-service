import fs from "fs";
import { NextRequest } from "next/server";
import path from "path";
export async function GET(req: NextRequest): Promise<Response> {
  const audioUrl = req.nextUrl.searchParams.get("audio");
  const audioPath = path.resolve("public", "audio", audioUrl + ".mp3");

  try {
    const audioBuffer = fs.readFileSync(audioPath);
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error reading audio:", error);
    return new Response("Failed to load audio", {
      status: 500,
    });
  }
}
