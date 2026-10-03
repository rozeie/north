import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "North — 지금 필요한 성장 방향",
  description:
    "이력과 현재 커리어 고민을 분석해 지금 필요한 성장 방향을 제시하고, 그 방향에 맞는 학습 자료와 회고를 연결하는 AI 커리어 가이드",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
