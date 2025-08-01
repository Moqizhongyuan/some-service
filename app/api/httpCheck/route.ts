import { NextRequest, NextResponse } from "next/server";

// CORS 头部配置
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, User-Agent",
};

// 浏览器指纹特征检测
interface BrowserFingerprint {
  userAgent: string | null;
  acceptLanguage: string | null;
  acceptEncoding: string | null;
  accept: string | null;
  secFetchDest: string | null;
  secFetchMode: string | null;
  secFetchSite: string | null;
  referer: string | null;
  dnt: string | null;
}

// 已知爬虫的 User-Agent 模式
const knownCrawlerPatterns = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java/i,
  /ruby/i,
  /perl/i,
  /php/i,
  /go-http-client/i,
  /axios/i,
  /node-fetch/i,
  /okhttp/i,
  /apache-httpclient/i,
  /postman/i,
  /insomnia/i,
  /googlebot/i,
  /bingbot/i,
  /slackbot/i,
  /twitterbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegram/i
];

// 可疑的 User-Agent 模式
const suspiciousPatterns = [
  /^$/,  // 空 User-Agent
  /^Mozilla\/5\.0$/,  // 仅有基础 Mozilla 标识
  /HeadlessChrome/i,  // 无头浏览器
  /PhantomJS/i,
  /Selenium/i,
  /WebDriver/i
];

// 获取客户端指纹
function getClientFingerprint(request: NextRequest): BrowserFingerprint {
  const headers = request.headers;
  
  return {
    userAgent: headers.get('user-agent'),
    acceptLanguage: headers.get('accept-language'),
    acceptEncoding: headers.get('accept-encoding'),
    accept: headers.get('accept'),
    secFetchDest: headers.get('sec-fetch-dest'),
    secFetchMode: headers.get('sec-fetch-mode'),
    secFetchSite: headers.get('sec-fetch-site'),
    referer: headers.get('referer'),
    dnt: headers.get('dnt')
  };
}

// 计算指纹得分（0-100，越高越可能是真实用户）
function calculateFingerprintScore(fingerprint: BrowserFingerprint): number {
  let score = 0;
  
  // 检查 User-Agent (权重: 30分)
  if (fingerprint.userAgent) {
    // 检查是否为已知爬虫
    const isKnownCrawler = knownCrawlerPatterns.some(pattern => 
      pattern.test(fingerprint.userAgent!)
    );
    if (isKnownCrawler) {
      return 0; // 直接判定为爬虫
    }
    
    // 检查可疑模式
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(fingerprint.userAgent!)
    );
    if (!isSuspicious) {
      score += 30;
    }
    
    // 检查 User-Agent 长度和复杂度
    if (fingerprint.userAgent.length > 50) {
      score += 5;
    }
  }
  
  // 检查语言设置 (权重: 15分)
  if (fingerprint.acceptLanguage && fingerprint.acceptLanguage.length > 2) {
    score += 15;
  }
  
  // 检查编码支持 (权重: 10分)
  if (fingerprint.acceptEncoding && fingerprint.acceptEncoding.includes('gzip')) {
    score += 10;
  }
  
  // 检查 Accept 头部 (权重: 10分)
  if (fingerprint.accept && 
      (fingerprint.accept.includes('text/html') || 
       fingerprint.accept.includes('application/json'))) {
    score += 10;
  }
  
  // 检查 Sec-Fetch 头部（现代浏览器特征）(权重: 20分)
  if (fingerprint.secFetchDest || fingerprint.secFetchMode || fingerprint.secFetchSite) {
    score += 20;
  }
  
  // 检查 Referer (权重: 10分)
  if (fingerprint.referer) {
    score += 10;
  }
  
  // 检查 DNT (权重: 5分)
  if (fingerprint.dnt) {
    score += 5;
  }
  
  return Math.min(score, 100);
}

// 网络指纹检测
function getNetworkFingerprint(request: NextRequest) {
  // 获取客户端IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  const clientIP = forwardedFor?.split(',')[0].trim() || realIP || cfIP || 'unknown';
  
  // 检查是否通过代理
  const viaProxy = request.headers.get('via') !== null;
  const forwardedProto = request.headers.get('x-forwarded-proto');
  
  return {
    ip: clientIP,
    viaProxy,
    protocol: forwardedProto || 'unknown',
    connectionType: request.headers.get('connection')
  };
}

// 处理 OPTIONS 预检请求
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 处理 GET 请求
export async function GET(request: NextRequest) {
  console.log("🔍 [FINGERPRINT API] 收到 GET 请求");
  
  // 获取浏览器指纹
  const browserFingerprint = getClientFingerprint(request);
  console.log("🖥️ 浏览器指纹:", browserFingerprint);
  
  // 获取网络指纹
  const networkFingerprint = getNetworkFingerprint(request);
  console.log("🌐 网络指纹:", networkFingerprint);
  
  // 计算指纹得分
  const score = calculateFingerprintScore(browserFingerprint);
  console.log("📊 指纹得分:", score);
  
  // 判断是否为爬虫（得分低于50分视为爬虫）
  const isCrawler = score < 50;
  
  if (isCrawler) {
    console.log("🚫 [FINGERPRINT API] 检测到爬虫，拒绝访问");
    console.log("🔍 详细信息:", {
      userAgent: browserFingerprint.userAgent,
      score,
      reason: score === 0 ? "已知爬虫特征" : "指纹得分过低"
    });
    
    return NextResponse.json(
      {
        message: "访问被拒绝",
        error: "请使用正常的浏览器访问",
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
  
  console.log("✅ [FINGERPRINT API] 指纹验证通过，允许访问");
  
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const queryParams = Object.fromEntries(searchParams.entries());
  
  const responseData = {
    method: "GET",
    message: "欢迎访问！指纹验证通过 🎉",
    timestamp: new Date().toISOString(),
    fingerprint: {
      score,
      browser: {
        userAgent: browserFingerprint.userAgent,
        hasModernFeatures: !!(browserFingerprint.secFetchDest || browserFingerprint.secFetchMode),
        acceptsGzip: browserFingerprint.acceptEncoding?.includes('gzip') || false,
        hasLanguage: !!browserFingerprint.acceptLanguage
      },
      network: {
        ip: networkFingerprint.ip,
        viaProxy: networkFingerprint.viaProxy,
        protocol: networkFingerprint.protocol
      }
    },
    queryParams,
    info: "这是一个具有反爬虫指纹识别的API接口"
  };

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // 添加安全头部
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block"
    },
  });
}
