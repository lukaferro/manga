import { NextResponse, type NextRequest } from "next/server";
import {
  RETURN_TO_COOKIE,
  STATE_COOKIE,
  TOKEN_COOKIE,
  getAniListClientId,
  getAniListClientSecret,
  getAppUrl,
  safeReturnTo,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  const appUrl = getAppUrl();
  const returnTo = safeReturnTo(request.cookies.get(RETURN_TO_COOKIE)?.value);
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  function failWith(reason: string) {
    const redirectUrl = new URL(returnTo, appUrl);
    redirectUrl.searchParams.set("auth_error", reason);
    const response = NextResponse.redirect(redirectUrl.toString());
    response.cookies.delete(RETURN_TO_COOKIE);
    response.cookies.delete(STATE_COOKIE);
    return response;
  }

  if (error || !code) {
    console.error("AniList OAuth callback error:", error);
    return failWith(error || "no_code");
  }

  if (!state || !expectedState || state !== expectedState) {
    console.error("AniList OAuth state mismatch");
    return failWith("invalid_state");
  }

  const clientId = getAniListClientId();
  const clientSecret = getAniListClientSecret();
  const redirectUri = `${appUrl}/api/auth/callback/anilist`;

  try {
    const tokenRes = await fetch("https://anilist.co/api/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Failed to exchange code for token:", tokenData);
      return failWith("token_exchange_failed");
    }

    const redirectUrl = new URL(returnTo, appUrl);
    const response = NextResponse.redirect(redirectUrl.toString());

    // AniList tokens are valid for 1 year
    response.cookies.set(TOKEN_COOKIE, tokenData.access_token, {
      path: "/",
      maxAge: 31536000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.delete(RETURN_TO_COOKIE);
    response.cookies.delete(STATE_COOKIE);

    return response;
  } catch (err) {
    console.error("Unexpected error during token exchange:", err);
    return failWith("server_error");
  }
}
