# Aniwhere

갸챠샵, 피규어샵, 굿즈샵 같은 서브컬처 매장 정보를 모아 보여주는 서비스 프로젝트입니다.

## 구조

- `client/`: Apps in Toss WebView 기반 프론트엔드
- `server/`: 백엔드 작업 영역
- `docs/`: 기획 및 참고 문서

## Frontend

`client`는 다음 기준으로 작업합니다.

- React + TypeScript + Vite
- `@apps-in-toss/web-framework`
- Toss 스타일의 모바일 정보 탐색 UX
- 매장 탐색, 커뮤니티, 상세 화면 중심 구성

실행:

```bash
cd client
npm install
npm run dev
```

빌드:

```bash
cd client
npm run build
```

## 현재 범위

- 샵 목록/상세 조회
- 커뮤니티 게시글/댓글 조회 및 작성
- 지도 기반 매장 탐색 UI
- Swagger 스펙 기반 API 타입/호출 함수 정리

## 브랜치 전략

- 기본 브랜치: `main`
- 작업 브랜치: `codex/...`
- 기능 단위로 작업 후 `main`에 병합
- 상세 규칙은 `GIT_CONVENTIONS.md`를 기준으로 따릅니다.
- 다른 Codex 세션도 작업 전 `AGENTS.md`와 `GIT_CONVENTIONS.md`를 먼저 확인합니다.
