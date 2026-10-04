import { NextResponse, type NextRequest } from "next/server";
import { getAniListClientId, getAniListClientSecret, getAppUrl } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = getAppUrl();
  const returnTo = request.cookies.get("auth_return_to")?.value || "/";

  if (error || !code) {
    console.error("AniList OAuth callback error:", error);
    const redirectUrl = new URL(returnTo, appUrl);
    redirectUrl.searchParams.set("auth_error", error || "no_code");
    return NextResponse.redirect(redirectUrl.toString());
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
      const redirectUrl = new URL(returnTo, appUrl);
      redirectUrl.searchParams.set("auth_error", "token_exchange_failed");
      return NextResponse.redirect(redirectUrl.toString());
    }

    const redirectUrl = new URL(returnTo, appUrl);
    const response = NextResponse.redirect(redirectUrl.toString());

    // Set anilist_token cookie (valid for 1 year)
    response.cookies.set("anilist_token", tokenData.access_token, {
      path: "/",
      maxAge: 31536000, // 1 year
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Clear returnTo cookie
    response.cookies.delete("auth_return_to");

    return response;
  } catch (err) {
    console.error("Unexpected error during token exchange:", err);
    const redirectUrl = new URL(returnTo, appUrl);
    redirectUrl.searchParams.set("auth_error", "server_error");
    return NextResponse.redirect(redirectUrl.toString());
  }
}
