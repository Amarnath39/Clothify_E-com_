import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function checkSuperAdminMiddleware(request: NextRequest) {
  let token: string | null = null;

  // 1. Check for token in cookies
  const tokenCookie = request.cookies.get("token");
  if (tokenCookie) {
    token = tokenCookie.value;
  }

  // 2. If not in cookies, check for token in Authorization header
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }
  }

  // If no token is found in either cookies or headers, redirect to login
  if (!token) {
    const url = new URL("/login/admin", request.url);
    return NextResponse.redirect(url);
  }

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = (await jwtVerify(token, secretKey)) as JwtPayload;

    const admin = payload;

    if (!admin || admin.role !== "SuperAdmin") {
      const url = new URL("/login/admin", request.url);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.log("Token verification error:", error); // More specific error message
    const url = new URL("/login/admin", request.url);
    return NextResponse.redirect(url);
  }
}