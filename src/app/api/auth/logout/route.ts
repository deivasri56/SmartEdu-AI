import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  // Clear the auth cookie using the utility helper
  await clearAuthCookie();

  return response;
}
