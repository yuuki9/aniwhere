# 인기도 이벤트·랭킹 API 설계

## 범위

- **서버만** 구현. 클라이언트 이벤트 전송·UI 연동은 별도 담당.
- 토스 인앱: 이벤트 `POST`는 인증 필수, 랭킹 `GET`은 기존 카탈로그 API와 동일하게 공개 조회.

## 이벤트 (클라이언트 POST)

| type | 가중치 | 필수 |
|------|--------|------|
| `SEARCH_AUTOCOMPLETE_SELECTED` | 3 | shopId 또는 workId |
| `SEARCH_KEYWORD_SUBMITTED` | 2 | keyword, scope(shop\|work) |
| `DISCOVERY_WORK_EXPLORE_ENTERED` | 2 | workKeyword 또는 workId |
| `DISCOVERY_RESULT_CLICKED` | 1 | shopId 또는 workId/workKeyword, source=search\|explore |

- 매장 상세 GET 집계 **없음** (shop/work 대칭).
- 동일 user+type+식별자 **5분 디바운스**.

## 랭킹 API

| API | 설명 |
|-----|------|
| `GET /api/v1/rankings/shops` | 인기 매장 |
| `GET /api/v1/rankings/works` | 인기 작품 |
| `GET /api/v1/rankings/search/keywords` | 인기 검색어 TOP (기본 10) |
| `GET /api/v1/rankings/search/entities` | 매장+작품 혼합 TOP (기본 10) |

- `window`: `7d`(기본), `24h`
- 콜드스타트: 윈도우 이벤트 부족 시 정적 지표(review/favorite/popularity) 소량 블렌드
- `sampleSufficient`: 윈도우 전체 이벤트 ≥ 50일 때 true (등락 필드는 2단계)

## 집계

- `popularity_events` 적재 후 조회 시 윈도우 내 가중 합산.
- 추후 트래픽 증가 시 `popularity_scores` 증분·배치로 이전 가능.
