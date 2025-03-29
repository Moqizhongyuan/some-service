import { NextResponse } from "next/server";

export async function POST(): Promise<Response> {
  console.log("terminology create");
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
      },
    }
  );
}
