import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../../../lib/prisma";

// Extend the Session type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
          access_type: "offline", // refresh token support
          prompt: "consent",      // always ask for consent to get refresh token
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist refresh_token and access_token if available
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
        // Expose user ID + tokens to frontend if needed
        if (session.user) {
          (session.user as any).id = token.sub as string | undefined;
          session.accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
        }
        return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };