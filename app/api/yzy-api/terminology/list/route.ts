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
import { NextResponse } from "next/server";

export async function POST(): Promise<Response> {
  console.log("terminology create");
  return NextResponse.json({
    code: 0,
    message: "",
    result: {
      page: 2,
      limit: 10,
      data: [
        {
          terminology_id: "efe5646c-0eff-46ca-922f-9e9d98e06624",
          terminology_name: "cc",
          terminology_num: 6,
          created_time: 1742295327,
          update_time: 1742295327,
        },
        {
          terminology_id: "5f0231be-9bb5-4178-b974-77f0255dcb66",
          terminology_name: "dev-0212",
          terminology_num: 0,
          created_time: 1742295327,
          update_time: 1742295327,
        },
      ],
      total: 82,
    },
  });
}
