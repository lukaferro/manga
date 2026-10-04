import { NextResponse, type NextRequest } from "next/server";
import { getAppUrl } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("returnTo") || "/";

  const appUrl = getAppUrl();
  const response = NextResponse.redirect(new URL(returnTo, appUrl).toString());

  response.cookies.delete("anilist_token");

  return response;
}
