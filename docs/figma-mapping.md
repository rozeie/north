# Figma 값 ↔ North 구현 매핑

출처: shadcn-fig-handoff.zip (core-components.json, tokens.json, semantic-tokens.css). 구현은 `src/app/globals.css`.
표기: **[FIG]** 파일에서 확인 / **[ADP]** North 브랜드에 맞춰 변경 / **[INF]** 추론·보완.

| 컴포넌트 | 항목 | 값 | 구분 | 노드 |
|---|---|---|---|---|
| Button | 높이 default/sm/lg/icon | 36 / 32 / 40 / 36×36 | FIG | 73:3673, 1463:5702, 1463:5737, 73:3669 |
| Button | padding / radius / 글자 | 16·8 / 10 / 14 medium | FIG | 73:3673 |
| Button | secondary | fill secondary, 테두리 없음 | FIG | 73:3670 |
| Button | outline | 흰 배경 + border + shadow-xs, hover fill accent | FIG | 73:3671, 73:3664 |
| Button | destructive | #dc2626, 글자 흰색 95% | FIG | 73:3667 |
| Button | hover | 노드 전체 opacity 0.9 (primary/destructive), 0.8 (secondary) | FIG | 73:3668, 73:3666, 73:3677 |
| Button | hover 구현 | 배경 알파로 대체 (전체 opacity 아님) | INF | |
| Button | active / focus-visible / disabled 포인터 | 파일에 없음 | INF | |
| Input | 높이 / padding / radius | 36 / 12·4 / 8 | FIG | 520:3061 |
| Input | border, shadow | border 토큰, 0 1px 2px #000/10% | FIG | 520:3061 |
| Input | focus | border #737373 + 4px 링 #a1a1a1/50% | FIG | 588:89 |
| Input | focus 링 색 | brand 남색 30% | ADP | |
| Textarea | padding / disabled | 12·8 / opacity 0.5 | FIG | 623:3530, 623:3552 |
| Card | radius / border / 세로 padding / gap | 14 / border / 24 / 24 | FIG | 73:4454 |
| Card | 그림자 | 없음 (노드에 effect 없음) | FIG | 73:4454 |
| Card | 제목·설명 | 24 semibold / 14 muted | FIG | 73:4339, 73:4341 |
| Card | 가로 padding 24 단일화, compact(16) | | ADP / INF | |
| Dialog | 패널 radius / padding / gap | 10 / 24 / 16 | FIG | 592:134 |
| Dialog | shadow | 0 4 6 -4 + 0 10 15 -3, #000/10% | FIG | 592:134 |
| Dialog | 오버레이 | #000 30% | FIG | 594:103 |
| Dialog | 제목 / 설명 / 푸터 gap | 18/28 semibold / 14/20 muted / 8 | FIG | 592:138, 592:141, 592:145 |
| Dialog | 패널 폭 | 샘플 423·600은 고정값이 아님 → max-width 28rem | INF | |
| Navigation | 항목 padding / radius / 글자 / 간격 | 16·8 / 8 / 14 medium / 4 | FIG | 600:421 |
| Navigation | 활성·열림 | fill accent(#f5f5f5) | FIG | 600:427 |
| Navigation | 모바일 가로 padding 12 | | ADP | |
| Navigation | hover, 포커스 링, aria-current | | INF | |
| Token | radius 스케일 | xs2 sm6 md8 lg10 xl14 2xl18 (mode 컬렉션) | FIG | semantic-tokens.css |
| Token | 색상 hex | FIG 는 중립 회색 → North 웜톤 유지 | ADP | |
| Token | destructive | #dc2626 | FIG | |
| Badge | padding / radius / 글자 | 10·2(높이 22) / 10 / 12 semibold, lh 16 | FIG | 73:3522 |
| Badge | variant | default·secondary·destructive·outline, 숫자 배지는 pill(9999)·높이 20 | FIG | 73:3519–3522, 424:366–372 |
| Badge | TypeBadge 3색, brand 변형, ai-label 을 badge 기하로 통일(pill→radius 10) | | ADP | |
| Tabs | 리스트 높이 / padding / radius / 배경 | 36 / 3 / 10 / muted | FIG | 76:10759 |
| Tabs | 트리거 padding / radius / 글자 | 8·4(높이 29) / 8 / 14 medium | FIG | 76:10760 |
| Tabs | 활성 | 배경 background + border | FIG | 76:10760 |
| Tabs | aria-selected 표현, hover, focus, disabled | | INF | |
| Select | 트리거 높이 / padding / radius / border | 36 / 12·8 / 8 / border | FIG | 614:1542 |
| Select | chevron-down 16, placeholder muted, 14 medium | | FIG | 614:1538, 614:1537 |
| Select | 드롭다운 radius / padding / shadow | 8 / 4 / 0 2 4 -2 + 0 4 6 -1 @10% | FIG | 614:1498 |
| Select | 항목 padding / radius / 포커스 | 8·6(높이 32) / 6 / fill accent | FIG | 614:1502 |
| Select | 그룹 라벨 | 14 semibold muted | FIG | 614:1500 |
| Select | 네이티브 select 는 트리거만 스타일링, 글자 16px 유지 | | ADP | |
| Select | .menu 클래스(미사용, 커스텀 드롭다운 도입용) | | INF | |

미반영: dark 모드 토큰(`.dark`)은 파일에 있으나 North 가 light 전용이라 적용하지 않음.
폰트: 파일은 Inter/Geist, North 는 Pretendard(본문)·Noto Serif KR(제목)을 유지.
