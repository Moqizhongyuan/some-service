import { NextResponse } from "next/server";

export async function POST(): Promise<Response> {
  console.log("terminology create");
  return new NextResponse(
    JSON.stringify({
      code: 0,
      message: "",
      result: {
        page: 2,
        limit: 10,
        data: [
          {
            terminology_id: "efe5646c-0eff-46ca-922f-9e9d98e06624",
            chunk_id: "efe5646c-0eff-46ca-922f-9e9d98e06624",
            key: "测试",
            value: ["同义词", "同义词"],
            created_time: 1742295327,
            update_time: 1742295327,
          },
          {
            terminology_id: "efe5646c-0eff-46ca-922f-9e9d98e06624",
            chunk_id: "5f0231be-9bb5-4178-b974-77f0255dcb66",
            key: "测试",
            value: ["同义词", "同义词"],
            created_time: 1742295327,
            update_time: 1742295327,
          },
        ],
        total: 82,
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
