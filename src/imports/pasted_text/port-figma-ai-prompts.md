=======================================================
PORT — Figma AI 통합 디자인 프롬프트 (7 Pages)
-------------------------------------------------------
공통 디자인 토큰:
  bg=#0D0D0D  surface=#1A1A1A  accent=#7C3AED
  text=#E5E5E5  muted=#888888  success=#22C55E  error=#EF4444
  font: Pretendard(KR) / Inter(EN)
  radius: card=12px  button=8px  chip=6px
=======================================================

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE 1: 문서 에디터
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [STEP 1] 레이아웃
Left sidebar 240px (collapsible) + main editor (flex-1).
Sidebar: document tree. Section headers = category labels.
Each row = icon + title + read-time badge.
Active item = purple left border 3px + #242424 bg.

// [STEP 2] 상단 바
Top bar 64px: breadcrumb left (프로젝트명 > 문서명),
center = inline-editable title (32px bold).
Right: read-time badge + Export dropdown (PDF/PPT) + 'AI 도움받기' btn (sparkle icon).

// [STEP 3] 에디터 콘텐츠
72px top padding, max-width 860px centered.
Show: H1 + paragraph + code block (syntax highlight) + callout (purple tint).
Floating '/' slash-menu: block type grid (H1/H2/H3, Text, Image, Code, Callout, Divider, Toggle).
Block hover: drag handle (⠿) left, (+) add below, (…) options right.
Empty block: placeholder '내용을 입력하거나 \'/\'를 눌러 블록을 추가하세요'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE 2: AI 워크스페이스
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [STEP 1] 레이아웃
Left session panel 220px + main chat area (flex-1).
Session list: title + relative time. Active = purple bg.
Top: tab bar with session tabs (close x each) + (+) new session.

// [STEP 2] 채팅
Assistant: left-aligned, PORT logo icon, #1C1C1C card, max-width 70%.
User: right-aligned, #7C3AED bg, white text.
Streaming state: assistant bubble with pulsing dots (•••) animation.

// [STEP 3] 입력 영역
Quick prompt chips (horizontal scroll): '포트폴리오 자동 완성' '프로젝트 요약 작성'
'기술 스택 추천' '성과 문장 다듬기' — purple border, dark fill.
Input: full-width, send btn (purple when active / gray when empty).
Empty state: 'AI 생성 시작' gradient purple CTA centered.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE 3: 탐색/검색
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [STEP 1] 필터 영역
Search bar (full-width, rounded-xl, search icon left, clear x right).
직군 chips: 전체/개발/디자인/PM/데이터/기타 (active=filled purple).
기술스택 multi-select dropdown + count badge.
정렬 dropdown: 최신순/인기순/조회수순.
Toggle: '팔로우 중인 사람만 보기'.

// [STEP 2] 카드 그리드
3-column, gap-6. Each card: 16:9 thumbnail, avatar 32px + name + job title,
skill chips (max 3 + '+N'), eye+count, heart+count, bookmark toggle.
Hover: translateY -4px + #7C3AED border.

// [STEP 3] 빈/로딩 상태
Skeleton: 6 cards shimmer animation (gray placeholder).
Empty: icon + '검색 결과가 없어요' + '다른 키워드로 검색해보세요' + CTA btn.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE 4: 분석 대시보드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [STEP 1] 상단 컨트롤
Title '포트폴리오 분석' left.
Portfolio selector dropdown center-right (thumbnail + title).
Period toggle right: 7일 / 30일 / 90일 (active=purple filled).

// [STEP 2] KPI 카드
4 equal-width cards: 총 조회수 / 방문자 수 / 채용담당자 수 / 즐겨찾기.
Each: label + large number 28px bold + delta badge (green up / red down).

// [STEP 3] 차트 & 인기 프로젝트
Left 60%: line chart '조회수 추이' — purple line + gradient area fill + hover tooltip.
Right 40%: horizontal bar '유입 경로' — GitHub/LinkedIn/Direct/Google/기타.
Bottom: '인기 프로젝트' top-3 list = rank badge + 48px thumb + name + view bar.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE 5: 저장함
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [STEP 1] 탭 & 정렬
Tabs + count badges: 북마크(12) / 좋아요(34) / 저장한 포트폴리오(8).
Active = purple underline. Sort dropdown: 최근 저장순 / 이름순 / 인기순.

// [STEP 2] 카드 & 빈 상태
3-column grid: thumbnail + avatar + name + role + skill chips + bookmark/heart icon.
Empty state: illustration + '아직 저장한 포트폴리오가 없어요'
+ '포트폴리오 탐색하러 가기' outlined purple CTA.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE 6: 메시지
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [STEP 1] 3단 레이아웃
Left 260px: conversation list with search input.
Each item: avatar + name + job title + last msg preview + time + unread badge.
Active = purple left border 3px.

// [STEP 2] 채팅 패널
Top bar: recipient name + '프로필 보기' link.
Sent right #7C3AED, received left #1C1C1C. Date separator centered gray.
Input: multiline textarea + emoji + attach + send btn (purple/gray state).
Character count shown over 80% limit.

// [STEP 3] 우측 사용자 사이드바
Right 280px: avatar 80px + name + job + location.
Skills chips, '포트폴리오 보기' full-width purple CTA,
stats (팔로워/팔로잉/프로젝트), external link icon btns.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE 7: AI 생성 진행 화면
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [STEP 1] 센터 카드
Center card max-width 560px: PORT logo 64px (purple glow pulse),
title '포트폴리오 생성 중' 24px bold, subtitle muted 14px.

// [STEP 2] 진행 단계
5-step vertical list: GitHub 분석 / 블록 구성 / 컨텐츠 생성 / 디자인 레이아웃 / 완성.
Done: green checkmark + muted text + '완료' badge.
In-progress: purple spinner + bold text + '진행 중' badge (pulse).
Pending: gray circle + muted text + '대기'.
Progress bar below: purple gradient + % label right.

// [STEP 3] 로그 스트림
Log area 100px scroll: monospace 12px #888888.
Streaming lines bottom-up: '✓ React 컴포넌트 분석 완료'
'→ TypeScript 파일 처리 중...' '⚙ 주요 기술: TypeScript 45%, Python 23%'
'생성 취소' text btn below card (muted red).
=======================================================
