import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract auth status from request cookies
  const tokenCookie = request.cookies.get("curis_token");
  const roleCookie = request.cookies.get("curis_role");
  
  const token = tokenCookie?.value;
  const role = roleCookie?.value;

  console.log(`[Middleware DEBUG] Path: ${pathname} | Token present: ${!!token} | Role: ${role}`);

  // 1. Patient routes protection (/patient/:path*)
  if (pathname.startsWith("/patient")) {
    if (!token) {
      // Redirect unauthenticated to patient login page
      return NextResponse.redirect(new URL("/login/patient", request.url));
    }
    if (role !== "PATIENT") {
      // Redirect unauthorized doctor/admin back to their appropriate page
      if (role === "DOCTOR") {
        return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/login/patient", request.url));
    }
  }

  // 2. Doctor routes protection (/doctor/:path*)
  if (pathname.startsWith("/doctor")) {
    if (!token) {
      // Redirect unauthenticated to doctor login page
      return NextResponse.redirect(new URL("/login/doctor", request.url));
    }
    if (role !== "DOCTOR") {
      // Redirect unauthorized patient back to patient dashboard
      if (role === "PATIENT") {
        return NextResponse.redirect(new URL("/patient/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/login/doctor", request.url));
    }
  }

  return NextResponse.next();
}

// Specify matcher to intercept only dashboard routes for patients and doctors
export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
  ],
};
