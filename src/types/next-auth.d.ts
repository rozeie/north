import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      googleId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
