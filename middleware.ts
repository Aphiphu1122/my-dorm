import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("role")?.value;

  const userOnlyRoutes = [
    "/profile",
    "/bills",
    "/maintenance",
    "/receipts",
    "/Payment_bank",
    "/home",
  ];

  // 🛡 ป้องกันไม่ให้เข้าหน้า user หากยังไม่ได้ login
  if (userOnlyRoutes.some((route) => pathname.startsWith(route)) && !role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🛡 ป้องกันไม่ให้ user เข้า admin
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🛡 ป้องกัน admin เข้า user-only routes (ถ้าต้องการแยกชัดเจน)
  if (userOnlyRoutes.some((route) => pathname.startsWith(route)) && role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // ⛔ ป้องกันคนที่ login แล้ว เข้าหน้า login/register ซ้ำ
  if ((pathname === "/login" || pathname === "/register") && role) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile",
    "/bills/:path*",
    "/maintenance/:path*",
    "/receipts/:path*",
    "/Payment_bank/:path*",
    "/home",
    "/login",
    "/register",
  ],
};
