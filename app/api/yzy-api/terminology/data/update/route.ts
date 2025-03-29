import { NextResponse } from "next/server";

export async function POST(): Promise<Response> {
  console.log("terminology create");
  return NextResponse.json({
    code: 0,
    message: "",
    result: {},
  });
}
