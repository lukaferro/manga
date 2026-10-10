import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, getAppUrl, safeReturnTo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  const appUrl = getAppUrl();
  const response = NextResponse.redirect(new URL(returnTo, appUrl).toString());

  response.cookies.delete(TOKEN_COOKIE);

  return response;
}
