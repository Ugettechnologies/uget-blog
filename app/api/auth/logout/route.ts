import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });

  response.cookies.set("uget_session", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
