import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // هنا سنضع كود الاتصال بـ Laravel API لاحقاً
        // حالياً نرجعه فارغاً حتى تعمل الصفحة
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
});