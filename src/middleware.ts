import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/((?!login|register|forgot-password|reset-password|api/auth|api/register|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-192.svg|shared).*)",
  ],
};
