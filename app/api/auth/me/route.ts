import { NextResponse } from "next/server";
import { LOGGED_IN_COOKIE, getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getViewer();
  const response = NextResponse.json({ user });
  if (!user) {
    response.cookies.delete(LOGGED_IN_COOKIE);
  }
  return response;
}
