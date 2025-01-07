import fs from "fs";
import { NextRequest } from "next/server";
import path from "path";

export async function GET(req: NextRequest): Promise<Response> {
  // 获取图片的文件路径
  const imgUrl = req.nextUrl.searchParams.get("img");
  const imagePath = path.resolve("public", "images", imgUrl + ".png"); // 假设图片位于 public 文件夹内

  try {
    // 读取图片文件内容
    const imageBuffer = fs.readFileSync(imagePath);
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error reading image:", error);
    return new Response("Failed to load image", {
      status: 500,
    });
  }
}
