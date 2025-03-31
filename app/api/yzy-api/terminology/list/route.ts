import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
  const json = await req.json();
  const text = await req.text();
  const { page, limit } = json;
  console.log("terminology create", json, text);
  const data = [];
  for (let i = 0; i < 100; i++) {
    data.push(
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
      }
    );
  }
  console.log("terminology create");
  return new NextResponse(
    JSON.stringify({
      code: 0,
      message: "",
      result: {
        page,
        limit,
        data,
        total: 82,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
