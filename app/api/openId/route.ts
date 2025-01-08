import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const appId = "wx2584d463c0bb7200"; // 替换为你的小程序 AppID
const appSecret = "4f07200792becd8348ed877f59b9c2b2"; // 替换为你的小程序 AppSecret

export async function POST(req: NextRequest): Promise<Response> {
  if (req.method !== "POST") {
    // 只接受 POST 请求
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const body = await req.json();
  const { code } = body; // 从请求体中获取 code

  if (!code) {
    return NextResponse.json(
      { error: "Missing code in request body" },
      { status: 400 }
    );
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

  try {
    // 调用微信官方接口
    const response = await axios.get(url);
    const data = response.data;

    if (data.openid) {
      return NextResponse.json({ openid: data.openid }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Failed to get openid", details: data },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("请求微信接口失败:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
