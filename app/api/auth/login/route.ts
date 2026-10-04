import { NextResponse, type NextRequest } from "next/server";
import { getAniListClientId, getAppUrl } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("returnTo") || "/";

  const clientId = getAniListClientId();
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/callback/anilist`;

  const anilistAuthUrl = new URL("https://anilist.co/api/v2/oauth/authorize");
  anilistAuthUrl.searchParams.set("client_id", clientId);
  anilistAuthUrl.searchParams.set("response_type", "code");
  anilistAuthUrl.searchParams.set("redirect_uri", redirectUri);

  const response = NextResponse.redirect(anilistAuthUrl.toString());

  // Store returnTo in a short-lived cookie
  response.cookies.set("auth_return_to", returnTo, {
    path: "/",
    maxAge: 600, // 10 minutes
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
