// middleware/adminAuth.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// connectDB();

export async function adminAuthMiddleware(
  request: NextRequest,
  // Note: In Next.js middleware, you typically return NextResponse.next()
  // or a new NextResponse.json(). The 'res' argument is not usually passed
  // and modified directly like in traditional Express.js.
  // If you intend to pass information down, consider modifying the request
  // headers or using a different pattern.
  // For now, I'll assume 'res' is intended to be the next response in the chain,
  // and will create a new one if necessary.
  _res: NextResponse // Renamed to _res to indicate it might not be directly used as passed
) {
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

  // If no token is found after checking both locations, return Unauthorized JSON response
  if (!token) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized: No token provided" }, // More specific message
      { status: 401 }
    );
  }

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = (await jwtVerify(token, secretKey)) as JwtPayload;

    const admin = payload; // Assuming payload directly contains admin details including 'role'

    // Check if admin exists and if their role is one of "Admin", "SuperAdmin", or "Sales person"
    if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin" && admin.role !== "Sales person")) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized: Insufficient role" }, // More specific message
        { status: 403 } // 403 Forbidden is often more appropriate for role-based access
      );
    }

    // Create a new response object to modify headers or pass to the next handler
    const response = NextResponse.next(); // Use NextResponse.next() to allow the request to proceed

    // Set the admin ID in the response headers to be available downstream
    // Make sure 'payload.id' is indeed a string.
    if (payload.id) {
        response.headers.set("x-admin-id", payload.id as string);
    }
    
    return response;

  } catch (error) {
    // Log the error for debugging purposes
    console.error("Token verification or role check failed:", error); // Use console.error for errors
    return NextResponse.json(
      { success: false, msg: "Invalid token or server error", error: (error as Error).message }, // Include error message for debugging
      { status: 401 }
    );
  }
}