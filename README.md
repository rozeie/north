# North (가칭)

이력과 현재 커리어 고민을 분석해 지금 필요한 성장 방향을 제시하고, 그 방향에 맞는 학습 자료와 회고를 연결하는 AI 커리어 가이드.
기획 기준은 [PRD.md](./PRD.md) 입니다. Next.js (App Router) + TypeScript + Tailwind CSS.

## 실행
```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 참고)
npm run dev                  # http://localhost:3000
```
- **Google OAuth 없이 둘러보기:** `.env.local` 에 `DEV_AUTH_BYPASS=true` 를 두면 랜딩에 "개발용 로그인" 버튼이 나타납니다(production 에서는 무시).
- **AI:** `ANTHROPIC_API_KEY` 가 없으면 규칙 기반 mock AI 로 동작합니다.
- 데이터는 `.data/db.json` 에 저장됩니다(삭제하면 초기화).

## 구조
```
src/
  app/                 화면(S0~S7)과 API 라우트
    page.tsx           S0 랜딩 + Google 로그인
    start/             S1 최초 입력(PDF 업로드)
    direction/         S2 성장 방향 초안 검토·수정·확정 (확정 후 수정도 동일 화면)
    home/              S3 현재 성장 방향 + 오늘의 추천 3개 + 선택 확인 모달
    library/           S4 내 서재(조회 전용)
    reflection/[id]/   S5 회고
    profile/           S6 커리어 프로필(4개 항목)
    settings/          S7 추천 교체 시각, 로그아웃
    api/               auth, profile, direction, recommendations, reflections, settings, events
  components/          UI 컴포넌트
  lib/
    auth.ts            Google OAuth(next-auth), 온보딩 상태 가드
    repo.ts, db.ts     데이터 접근 / 임시 JSON 저장소
    recommend.ts       후보 선정 + 지연 생성
    cycle.ts           오전 6시 기준 추천 주기 계산
    ai/                mock / Anthropic 호출 / 스키마
  data/contents.json   콘텐츠 DB 샘플(39건)
scripts/import-contents.mjs   콘텐츠 JSON/CSV 임포트
```

## 콘텐츠 갱신
`src/data/README.md` 참고.
