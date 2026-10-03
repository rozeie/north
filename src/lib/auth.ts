import "server-only";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";
import * as repo from "./repo";
import type { OnboardingState, User } from "./types";

/** 개발 전용 로그인 버튼 노출 여부. production 에서는 항상 false. */
export const devAuthEnabled = () => process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true";

const providers: NextAuthOptions["providers"] = [];

// 로그인 수단은 Google OAuth 하나뿐이다(F1). 이메일/비밀번호·매직링크는 제공하지 않는다.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Google 설정 없이 로컬에서 화면을 확인하기 위한 개발 전용 우회(입력 폼 없음).
if (devAuthEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "dev",
      name: "개발용 로그인",
      credentials: {},
      async authorize() {
        return { id: "dev-user", name: "개발용 사용자", email: "dev@example.com" };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    async session({ session, token }) {
      session.user.googleId = token.sub ?? "";
      return session;
    },
  },
};

/** 로그인한 사용자를 반환한다. 최초 로그인이면 계정을 생성한다(F1-2). */
export async function getSessionUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.googleId) return null;
  return repo.findOrCreateUser({
    google_id: session.user.googleId,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  });
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return user;
}

export const routeForState = (state: OnboardingState) =>
  state === "SignedIn" ? "/start" : state === "DraftReady" ? "/direction" : "/home";

/** 성장 방향 확정(DirectionConfirmed) 이후에만 접근 가능한 화면용 가드 (10.1). */
export async function requireConfirmedUser(): Promise<User> {
  const user = await requireUser();
  const state = await repo.getOnboardingState(user.id);
  if (state !== "DirectionConfirmed") redirect(routeForState(state));
  return user;
}
