import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.BETTER_AUTH_SECRET, // ← 明示的に渡す
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const allowed =
        process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim()) ?? [];
      if (allowed.includes(user.email ?? "")) return true;
      return "/login?error=unauthorized"; // ← カスタムエラーページへ
    },
  },
});
