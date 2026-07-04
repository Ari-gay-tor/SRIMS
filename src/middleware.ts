import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.json({
      token: req.nextauth.token,
    });
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/dashboard"],
};