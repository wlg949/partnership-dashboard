import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page, API routes, and static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const appPassword = process.env.APP_PASSWORD;
  const authSecret = process.env.AUTH_SECRET || "default-secret";

  // If no password is configured, allow access (dev convenience)
  if (!appPassword) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;
  const expectedToken = btoa(`${appPassword}:${authSecret}`);

  if (token !== expectedToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
