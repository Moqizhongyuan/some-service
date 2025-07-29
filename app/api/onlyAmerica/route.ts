import { NextRequest, NextResponse } from "next/server";

// CORS 头部配置
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 获取客户端真实IP地址
function getClientIP(request: NextRequest): string {
  // 优先检查 X-Forwarded-For 头部（适用于代理环境）
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // 检查 X-Real-IP 头部
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // 检查 CF-Connecting-IP 头部（Cloudflare）
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }
  
  // 默认返回 localhost（开发环境）
  return '127.0.0.1';
}

// 检查IP是否来自美国
async function isIPFromUSA(ip: string): Promise<boolean> {
  try {
    // 如果是本地IP，在开发环境中允许访问
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      console.log("🏠 [USA CHECK] 检测到本地IP，开发环境允许访问");
      return true;
    }
    
    console.log(`🌍 [USA CHECK] 检查IP地理位置: ${ip}`);
    
    // 使用免费的IP地理位置API
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'nextjs-app/1.0'
      }
    });
    
    if (!response.ok) {
      console.error("❌ [USA CHECK] IP地理位置API请求失败");
      return false;
    }
    
    const data = await response.json();
    console.log("📍 [USA CHECK] IP地理位置信息:", data);
    
    // 检查国家代码是否为US
    return data.country_code === 'US';
    
  } catch (error) {
    console.error("❌ [USA CHECK] 检查IP地理位置时出错:", error);
    return false;
  }
}

// 处理 OPTIONS 预检请求
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_request: NextRequest) {
  console.log("🚀 [USA ONLY API] OPTIONS 预检请求");
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 处理 GET 请求
export async function GET(request: NextRequest) {
  console.log("📝 [USA ONLY API] 收到 GET 请求");
  console.log("🔗 请求 URL:", request.url);
  
  // 获取客户端IP
  const clientIP = getClientIP(request);
  console.log("🌐 客户端IP:", clientIP);
  
  // 检查IP是否来自美国
  const isUSA = await isIPFromUSA(clientIP);
  
  if (!isUSA) {
    console.log("🚫 [USA ONLY API] IP不在美国，拒绝访问");
    return NextResponse.json(
      {
        message: "无法访问",
        error: "该服务仅限美国用户访问",
        ip: clientIP,
        timestamp: new Date().toISOString()
      },
      {
        status: 403,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
  
  console.log("✅ [USA ONLY API] 美国IP，允许访问");
  
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const queryParams = Object.fromEntries(searchParams.entries());
  
  const responseData = {
    method: "GET",
    message: "欢迎来自美国的用户! 🇺🇸",
    timestamp: new Date().toISOString(),
    ip: clientIP,
    queryParams: queryParams,
    info: "这是一个仅限美国用户访问的API接口"
  };

  console.log("✅ [USA ONLY API] 返回响应数据:", responseData);

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
  console.log("📝 [USA ONLY API] 收到 POST 请求");
  console.log("🔗 请求 URL:", request.url);
  
  // 获取客户端IP
  const clientIP = getClientIP(request);
  console.log("🌐 客户端IP:", clientIP);
  
  // 检查IP是否来自美国
  const isUSA = await isIPFromUSA(clientIP);
  
  if (!isUSA) {
    console.log("🚫 [USA ONLY API] IP不在美国，拒绝访问");
    return NextResponse.json(
      {
        message: "无法访问",
        error: "该服务仅限美国用户访问",
        ip: clientIP,
        timestamp: new Date().toISOString()
      },
      {
        status: 403,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
  
  console.log("✅ [USA ONLY API] 美国IP，允许访问");

  try {
    // 获取请求体数据
    const requestBody = await request.json();
    console.log("📦 请求体数据:", requestBody);

    const responseData = {
      method: "POST",
      message: "欢迎来自美国的用户! 🇺🇸",
      timestamp: new Date().toISOString(),
      ip: clientIP,
      receivedData: requestBody,
      info: "这是一个仅限美国用户访问的API接口，已成功接收您的POST数据"
    };

    console.log("✅ [USA ONLY API] 返回响应数据:", responseData);

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("❌ [USA ONLY API] 解析请求体时出错:", error);
    
    const errorResponse = {
      message: "请求体解析失败",
      error: error instanceof Error ? error.message : "未知错误",
      timestamp: new Date().toISOString(),
      ip: clientIP,
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
