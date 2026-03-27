import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  console.log("proxy hit:", req.nextUrl.pathname, "auth:", !!req.auth)
  
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next|api/auth|login|favicon.ico).*)"],
}