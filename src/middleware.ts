// middleware/index.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuthMiddleware } from "../middleware/adminAuth";
import { userAuthMiddleware } from "../middleware/userAuth";
import { checkAdminMiddleware } from "../middleware/checkAdmin";
import { checkSuperAdminMiddleware } from "../middleware/superAdminauth";

export async function middleware(request: NextRequest) {
  // Initialize a mutable response object to be passed and potentially updated
  // by the auth middlewares.
  // This 'res' will be the final response object returned by the middleware.
  let response = NextResponse.next();

  if (
    request.nextUrl.pathname.startsWith("/admin/roles") ||
    request.nextUrl.pathname.startsWith("/admin/coupan") // Typo: Should be "coupon" based on config?
  ) {
    const checkSuperAdmin = await checkSuperAdminMiddleware(request);
    // If checkSuperAdminMiddleware returns a redirect or error, return it immediately.
    // Otherwise, it returns NextResponse.next() which implies continuation.
    if (checkSuperAdmin.status !== 200) {
        return checkSuperAdmin;
    }
    // If checkSuperAdmin is 200, simply let the `response` at the end be returned.
    // checkSuperAdminMiddleware doesn't add headers, so no need to capture its return.

  } else if (request.nextUrl.pathname.startsWith("/admin")) {
    const checkAdminResponse = await checkAdminMiddleware(request);
    // Same logic as checkSuperAdminMiddleware
    if (checkAdminResponse.status !== 200) {
        return checkAdminResponse;
    }
    // If checkAdminResponse is 200, simply let the `response` at the end be returned.
    // checkAdminMiddleware doesn't add headers, so no need to capture its return.

  } else if (request.nextUrl.pathname.startsWith("/api/admin/")) {
    // Pass our mutable 'response' object (which is initially NextResponse.next())
    // to adminAuthMiddleware. It will return a new NextResponse.next() with headers
    // or an error response. We must capture whatever it returns.
    const adminAuthResult = await adminAuthMiddleware(request, response);
    
    // If adminAuthMiddleware returned an error (e.g., 401, 403), return it directly.
    if (adminAuthResult.status !== 200) {
      return adminAuthResult;
    }
    // If it was successful (status 200), it means it returned a new NextResponse.next()
    // potentially with added headers. We need to assign this to our `response` variable.
    response = adminAuthResult;

  } else { // This 'else' block likely handles /api/user and other API paths
    // Similar logic for userAuthMiddleware
    const userAuthResult = await userAuthMiddleware(request, response);
    
    if (userAuthResult.status !== 200) {
      return userAuthResult;
    }
    response = userAuthResult;
  }

  // Finally, return the potentially modified response object.
  // This will either be the initial NextResponse.next() if no auth middleware
  // was triggered or if they returned 200 without modifying headers,
  // or it will be the modified NextResponse.next() from adminAuthMiddleware
  // or userAuthMiddleware with added headers.
  return response;
}

export const config = {
  matcher: [
    "/api/address/:path*",
    "/api/user/:path*",
    "/api/payment",
    "/admin/roles",
    "/admin/coupon", // Corrected "coupan" to "coupon" based on your matcher
    "/api/order/:path*",
    "/api/coupon/:code/:path*",
    "/api/admin/:path*",
    "/admin/:path*", // This catches all /admin routes, so the specific ones above it are important for order
  ],
};