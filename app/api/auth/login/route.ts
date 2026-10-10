import { NextResponse, type NextRequest } from "next/server";
import {
  RETURN_TO_COOKIE,
  STATE_COOKIE,
  getAniListClientId,
  getAppUrl,
  safeReturnTo,
} from "@/lib/auth";

const SHORT_LIVED_COOKIE = {
  path: "/",
  maxAge: 600, // 10 minutes
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  const clientId = getAniListClientId();
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/callback/anilist`;

  // Random state ties the callback to this browser and prevents login CSRF
  const state = crypto.randomUUID();

  const anilistAuthUrl = new URL("https://anilist.co/api/v2/oauth/authorize");
  anilistAuthUrl.searchParams.set("client_id", clientId);
  anilistAuthUrl.searchParams.set("response_type", "code");
  anilistAuthUrl.searchParams.set("redirect_uri", redirectUri);
  anilistAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(anilistAuthUrl.toString());
  response.cookies.set(RETURN_TO_COOKIE, returnTo, SHORT_LIVED_COOKIE);
  response.cookies.set(STATE_COOKIE, state, SHORT_LIVED_COOKIE);

  return response;
}
