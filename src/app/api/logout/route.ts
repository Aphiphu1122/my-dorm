import { NextResponse } from "next/server";

export async function GET() {
  const response = new NextResponse("Logged out");

  response.cookies.set("userId", "", { maxAge: 0 });
  response.cookies.set("role", "", { maxAge: 0 });

  return response;
}
