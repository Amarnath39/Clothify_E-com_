import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// connectDB(); // This line is commented out, so it won't be executed.

export async function checkAdminMiddleware(request: NextRequest) {
  let token: string | null = null; // Initialize token as null

  // 1. Check for token in cookies
  const tokenCookie = request.cookies.get("token");
  if (tokenCookie) {
    token = tokenCookie.value;
  }

  // 2. If token not found in cookies, check for it in the Authorization header
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Extract the token by removing "Bearer "
    }
  }

  // If no token is found after checking both locations, redirect to login
  if (!token) {
    const url = new URL("/login/admin", request.url); // Construct the absolute URL
    return NextResponse.redirect(url);
  }

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = (await jwtVerify(token, secretKey)) as JwtPayload;

    const admin = payload; // Assuming payload directly contains admin details including 'role'

    // Check if admin exists and if their role is one of "Admin", "SuperAdmin", or "Sales person"
    if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin" && admin.role !== "Sales person")) {
      const url = new URL("/login/admin", request.url); // Construct the absolute URL
      return NextResponse.redirect(url);
    }

    // If validation passes, allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Token verification or role check failed:", error); // Use console.error for errors
    const url = new URL("/login/admin", request.url); // Construct the absolute URL
    return NextResponse.redirect(url);
  }
}