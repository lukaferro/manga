import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getViewer();
  return NextResponse.json({ user });
}
