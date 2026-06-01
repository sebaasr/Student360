import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      accessTier: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessTier?: number;
  }
}
