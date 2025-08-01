import { NextRequest, NextResponse } from "next/server";

// CORS 头部配置
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 内存存储用于频次限制（生产环境建议使用Redis）
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// 频次限制配置
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1分钟窗口
  maxRequests: 10, // 每分钟最多10次请求
  blockDuration: 5 * 60 * 1000, // 超过限制后封禁5分钟
};

// IP地理位置信息接口
interface GeoLocationInfo {
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  proxy: boolean;
  hosting: boolean;
  mobile: boolean;
}

// 动态IP池特征
interface IPPoolFeatures {
  isDynamic: boolean;
  isProxy: boolean;
  isVPN: boolean;
  isTor: boolean;
  isHosting: boolean;
  isMobile: boolean;
  riskScore: number; // 0-100，越高风险越大
}

// 获取客户端真实IP地址
function getClientIP(request: NextRequest): string {
  // 优先检查 X-Forwarded-For 头部（适用于代理环境）
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // 检查 X-Real-IP 头部
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // 检查 CF-Connecting-IP 头部（Cloudflare）
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) {
    return cfIP;
  }

  // 默认返回 localhost（开发环境）
  return "127.0.0.1";
}

// 频次限制检查
function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    // 首次请求
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      firstRequest: now,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      blocked: false,
    };
  }

  // 检查是否在封禁期内
  if (
    entry.count > RATE_LIMIT_CONFIG.maxRequests &&
    now - entry.firstRequest < RATE_LIMIT_CONFIG.blockDuration
  ) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.firstRequest + RATE_LIMIT_CONFIG.blockDuration,
      blocked: true,
    };
  }

  // 检查窗口是否重置
  if (now > entry.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      firstRequest: now,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      blocked: false,
    };
  }

  // 增加计数
  entry.count++;
  rateLimitStore.set(ip, entry);

  const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxRequests - entry.count);
  const allowed = entry.count <= RATE_LIMIT_CONFIG.maxRequests;

  return { allowed, remaining, resetTime: entry.resetTime, blocked: false };
}

// 获取IP地理位置信息
async function getGeoLocationInfo(ip: string): Promise<GeoLocationInfo | null> {
  try {
    // 如果是本地IP，返回默认信息
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
      return {
        country: "Local",
        countryCode: "LOCAL",
        region: "Local",
        regionCode: "LOCAL",
        city: "Local",
        timezone: "Local",
        isp: "Local Network",
        org: "Local Network",
        as: "Local Network",
        proxy: false,
        hosting: false,
        mobile: false,
      };
    }

    console.log(`🌍 [GEO CHECK] 获取IP地理位置信息: ${ip}`);

    // 使用免费的IP地理位置API
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        "User-Agent": "ipcheck-api/1.0",
      },
    });

    if (!response.ok) {
      console.error("❌ [GEO CHECK] IP地理位置API请求失败");
      return null;
    }

    const data = await response.json();
    console.log("📍 [GEO CHECK] IP地理位置信息:", data);

    return {
      country: data.country_name || "Unknown",
      countryCode: data.country_code || "Unknown",
      region: data.region || "Unknown",
      regionCode: data.region_code || "Unknown",
      city: data.city || "Unknown",
      timezone: data.timezone || "Unknown",
      isp: data.org || "Unknown",
      org: data.org || "Unknown",
      as: data.asn || "Unknown",
      proxy: data.proxy || false,
      hosting: data.hosting || false,
      mobile: data.mobile || false,
    };
  } catch (error) {
    console.error("❌ [GEO CHECK] 获取IP地理位置信息时出错:", error);
    return null;
  }
}

// 动态IP池识别
function analyzeIPPool(ip: string, geoInfo: GeoLocationInfo): IPPoolFeatures {
  let riskScore = 0;

  // 检查是否为代理/VPN
  if (geoInfo.proxy) {
    riskScore += 30;
  }

  // 检查是否为托管服务
  if (geoInfo.hosting) {
    riskScore += 20;
  }

  // 检查是否为移动网络
  if (geoInfo.mobile) {
    riskScore += 10;
  }

  // 检查ISP特征
  const isp = geoInfo.isp.toLowerCase();
  const org = geoInfo.org.toLowerCase();

  // 已知的VPN/代理服务商
  const vpnProviders = [
    "nordvpn",
    "expressvpn",
    "surfshark",
    "protonvpn",
    "private internet access",
    "cyberghost",
  ];
  const proxyProviders = [
    "cloudflare",
    "fastly",
    "akamai",
    "aws",
    "google cloud",
    "azure",
  ];

  if (
    vpnProviders.some(
      (provider) => isp.includes(provider) || org.includes(provider)
    )
  ) {
    riskScore += 25;
  }

  if (
    proxyProviders.some(
      (provider) => isp.includes(provider) || org.includes(provider)
    )
  ) {
    riskScore += 15;
  }

  // 检查AS信息
  const as = geoInfo.as.toLowerCase();
  if (as.includes("tor") || as.includes("exit")) {
    riskScore += 40; // Tor网络
  }

  // 判断是否为动态IP池
  const isDynamic = riskScore > 30;

  return {
    isDynamic,
    isProxy: geoInfo.proxy,
    isVPN: vpnProviders.some(
      (provider) => isp.includes(provider) || org.includes(provider)
    ),
    isTor: as.includes("tor") || as.includes("exit"),
    isHosting: geoInfo.hosting,
    isMobile: geoInfo.mobile,
    riskScore: Math.min(riskScore, 100),
  };
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
  console.log("📝 [IP CHECK API] 收到 GET 请求");
  console.log("🔗 请求 URL:", request.url);

  // 获取客户端IP
  const clientIP = getClientIP(request);
  console.log("🌐 客户端IP:", clientIP);

  // 1. 频次限制检查
  const rateLimitResult = checkRateLimit(clientIP);
  console.log("⏱️ 频次限制检查:", rateLimitResult);

  if (!rateLimitResult.allowed) {
    console.log("🚫 [IP CHECK API] 频次限制，拒绝访问");
    return NextResponse.json(
      {
        message: "访问过于频繁",
        error: rateLimitResult.blocked ? "IP已被临时封禁" : "请求频率超限",
        ip: clientIP,
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(
            rateLimitResult.resetTime
          ).toISOString(),
        },
      }
    );
  }

  // 2. 获取地理位置信息
  const geoInfo = await getGeoLocationInfo(clientIP);
  console.log("📍 地理位置信息:", geoInfo);

  if (!geoInfo) {
    console.log("❌ [IP CHECK API] 无法获取地理位置信息");
    return NextResponse.json(
      {
        message: "地理位置验证失败",
        error: "无法获取IP地理位置信息",
        ip: clientIP,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 3. 检查IP是否来自美国
  const isUSA = geoInfo.countryCode === "US";
  console.log("🇺🇸 美国IP检查:", isUSA);

  if (!isUSA) {
    console.log("🚫 [IP CHECK API] IP不在美国，拒绝访问");
    return NextResponse.json(
      {
        message: "无法访问",
        error: "该服务仅限美国用户访问",
        ip: clientIP,
        geoLocation: {
          country: geoInfo.country,
          countryCode: geoInfo.countryCode,
          region: geoInfo.region,
          city: geoInfo.city,
        },
        timestamp: new Date().toISOString(),
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

  // 4. 动态IP池识别
  const ipPoolFeatures = analyzeIPPool(clientIP, geoInfo);
  console.log("🔍 IP池特征分析:", ipPoolFeatures);

  // 5. 风险评估
  const isHighRisk = ipPoolFeatures.riskScore > 70;
  console.log("⚠️ 风险评估:", {
    riskScore: ipPoolFeatures.riskScore,
    isHighRisk,
  });

  if (isHighRisk) {
    console.log("🚫 [IP CHECK API] 高风险IP，拒绝访问");
    return NextResponse.json(
      {
        message: "访问被拒绝",
        error: "检测到高风险IP特征",
        ip: clientIP,
        riskAnalysis: {
          riskScore: ipPoolFeatures.riskScore,
          isProxy: ipPoolFeatures.isProxy,
          isVPN: ipPoolFeatures.isVPN,
          isTor: ipPoolFeatures.isTor,
          isHosting: ipPoolFeatures.isHosting,
        },
        timestamp: new Date().toISOString(),
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

  console.log("✅ [IP CHECK API] 所有验证通过，允许访问");

  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const queryParams = Object.fromEntries(searchParams.entries());

  const responseData = {
    method: "GET",
    message: "欢迎访问！所有验证通过 🎉",
    timestamp: new Date().toISOString(),
    ip: clientIP,
    rateLimit: {
      remaining: rateLimitResult.remaining,
      resetTime: new Date(rateLimitResult.resetTime).toISOString(),
    },
    geoLocation: {
      country: geoInfo.country,
      countryCode: geoInfo.countryCode,
      region: geoInfo.region,
      regionCode: geoInfo.regionCode,
      city: geoInfo.city,
      timezone: geoInfo.timezone,
      isp: geoInfo.isp,
      org: geoInfo.org,
    },
    securityAnalysis: {
      riskScore: ipPoolFeatures.riskScore,
      isDynamic: ipPoolFeatures.isDynamic,
      isProxy: ipPoolFeatures.isProxy,
      isVPN: ipPoolFeatures.isVPN,
      isTor: ipPoolFeatures.isTor,
      isHosting: ipPoolFeatures.isHosting,
      isMobile: ipPoolFeatures.isMobile,
    },
    queryParams,
    info: "这是一个具有多重验证的IP检查API接口",
  };

  console.log("✅ [IP CHECK API] 返回响应数据:", responseData);

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
    },
  });
}
