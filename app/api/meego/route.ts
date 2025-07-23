import { NextRequest, NextResponse } from "next/server";

// CORS 头部配置
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 处理 OPTIONS 预检请求
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_request: NextRequest) {
  console.log("🚀 [MEEGO API] OPTIONS 预检请求");
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 处理 GET 请求
export async function GET(request: NextRequest) {
  console.log("📝 [MEEGO API] 收到 GET 请求");
  console.log("🔗 请求 URL:", request.url);
  console.log("📋 请求头:", Object.fromEntries(request.headers.entries()));
  
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const queryParams = Object.fromEntries(searchParams.entries());
  console.log("❓ 查询参数:", queryParams);

  const responseData = {
    method: "GET",
    message: "Hello from MEEGO API! 🎉",
    timestamp: new Date().toISOString(),
    queryParams: queryParams,
    headers: Object.fromEntries(request.headers.entries()),
    info: "这是一个测试接口，支持 GET 和 POST 请求"
  };

  console.log("✅ [MEEGO API] 返回响应数据:", responseData);

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// 处理 POST 请求
export async function POST(request: NextRequest) {
  console.log("📝 [MEEGO API] 收到 POST 请求");
  console.log("🔗 请求 URL:", request.url);
  console.log("📋 请求头:", Object.fromEntries(request.headers.entries()));

  try {
    // 获取请求体数据
    const requestBody = await request.json();
    console.log("📦 请求体数据:", requestBody);

    const responseData = {
      method: "POST",
      message: "Hello from MEEGO API! 🎉",
      timestamp: new Date().toISOString(),
      receivedData: requestBody,
      headers: Object.fromEntries(request.headers.entries()),
      info: "这是一个测试接口，已成功接收您的 POST 数据"
    };

    console.log("✅ [MEEGO API] 返回响应数据:", responseData);

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("❌ [MEEGO API] 解析请求体时出错:", error);
    
    const errorResponse = {
      method: "POST",
      message: "请求体解析失败",
      error: error instanceof Error ? error.message : "未知错误",
      timestamp: new Date().toISOString(),
      info: "请确保发送有效的 JSON 数据"
    };

    return NextResponse.json(errorResponse, {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}
