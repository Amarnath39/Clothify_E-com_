// middleware/userAuth.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// connectDB(); // Ensure this is uncommented and configured if needed for user lookup

export async function userAuthMiddleware(
  request: NextRequest,
  res: NextResponse
) {
  let token: string | null = null;

  // 1. Try to get token from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Remove "Bearer " prefix
  }

  // 2. If not found in header, try to get token from cookies
  if (!token) {
    const tokenCookie = request.cookies.get("token");
    token = tokenCookie ? tokenCookie.value : null;
  }

  // If token is still not found, return unauthorized
  if (!token) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized: No token provided" },
      { status: 401 }
    );
  }

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    // Ensure the type assertion is correct for your 'jose' version
    const { payload } = (await jwtVerify(token, secretKey)) as { payload: JwtPayload };

    // You might want to re-enable user lookup if you need to ensure the user still exists in DB
    // const user = await User.findById(payload.id);
    const user = payload; // Using payload directly as user for now

    if (!user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized: User not found or invalid payload" },
        { status: 401 }
      );
    }

    // Set the user ID in the response headers for downstream use
    res.headers.set("x-user-id", payload.id as string);
    return NextResponse.next({
  headers: {
    "x-user-id": payload.id as string,
  },
});

  } catch (error) {
    console.error("Token validation error:", error); // Use console.error for errors
    return NextResponse.json(
      { success: false, msg: "Invalid token", error: (error as Error).message }, // Send error message
      { status: 401 }
    );
  }
}