import { NextResponse } from "next/server";

export async function POST(): Promise<Response> {
  return new NextResponse(
    JSON.stringify({
      code: 0,
      message: "",
      result: {},
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
