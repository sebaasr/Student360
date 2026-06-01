import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";

const useDevAuth =
  process.env.DEV_AUTH_ENABLED === "true" || !process.env.OIDC_CLIENT_ID;

const providers: NextAuthConfig["providers"] = useDevAuth
  ? [
      Credentials({
        id: "dev-credentials",
        name: "Development sign-in (email only)",
        credentials: {
          email: { label: "NCF email", type: "email" },
        },
        async authorize(creds) {
          const email = String(creds?.email ?? "").toLowerCase();
          if (!email) return null;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.isActive) return null;
          return { id: user.id, email: user.email, name: user.name };
        },
      }),
    ]
  : [
      {
        id: "ncf-sso",
        name: "NCF Single Sign-On",
        type: "oidc",
        issuer: process.env.OIDC_ISSUER,
        clientId: process.env.OIDC_CLIENT_ID,
        clientSecret: process.env.OIDC_CLIENT_SECRET,
        profile(profile: Record<string, unknown>) {
          return {
            id: String(profile.sub ?? ""),
            email: String(profile.email ?? ""),
            name: String(profile.name ?? ""),
          };
        },
      },
    ];

export const authConfig: NextAuthConfig = {
  providers,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (!dbUser || !dbUser.isActive) return false;
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() },
      });
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        token.userId = dbUser?.id;
        token.accessTier = dbUser?.accessTier ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? "";
        session.user.accessTier = (token.accessTier as number) ?? 0;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
