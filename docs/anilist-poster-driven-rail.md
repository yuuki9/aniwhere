# AniList 기반 Poster-driven Rail 기획 메모

작성일: 2026-05-06

## 목적

`/home`의 작품 rail은 현재 저작권 이미지와 로고 사용 리스크 때문에 텍스트 + 중립 그래픽 중심으로 보수적으로 구성되어 있다. AniList API가 제공하는 애니메이션 메타데이터와 포스터 이미지를 서버에서 수집/정규화하면, `/home`을 `trend 점수 + poster 기반 이미지 카드 + 해당 작품을 다루는 매장 정보`로 연결하는 Poster-driven Rail 구조로 고도화할 수 있다.

이 문서는 다른 세션이나 다른 컴퓨터에서 이어 작업할 때 사용할 지시서 역할을 한다.

## 검증한 사실

공식 AniList API 문서 기준:

- AniList API는 GraphQL API다.
- `Media` 객체는 `coverImage`, `bannerImage`, `trending`, `popularity`, `averageScore`, `siteUrl`, `title` 등을 제공한다.
- `coverImage`는 포스터형 이미지로 쓸 수 있으며 `extraLarge`, `large`, `medium`, `color` 필드를 제공한다.
- `bannerImage`는 가로형 배너 이미지로 쓸 수 있다.
- `trending`은 최근 활동량 기반 지표이고, `popularity`는 유저 리스트 등록 수 기반 지표다.
- rate limit은 일반적으로 분당 90회지만, 문서상 API degraded 상태에서는 분당 30회로 제한될 수 있다.
- AniList API를 백업/대량 수집 저장소처럼 쓰는 것은 금지되어 있으며, 상업 사용은 월 매출 기준 조건이 있다.

공식 문서:

- AniList API docs: https://anilist.gitbook.io/anilist-apiv2-docs
- Media object: https://anilist.gitbook.io/anilist-apiv2-docs/docs/reference/object/media
- Rate limiting: https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/rate-limiting
- Terms of use: https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/terms-of-use

2026-05-06에 실제 GraphQL 호출로 아래 필드가 응답되는 것을 확인했다.

```graphql
query {
  Page(page: 1, perPage: 3) {
    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      trending
      popularity
      averageScore
      siteUrl
    }
  }
}
```

## 권장 제품 구조

### Home: Poster-driven Rail

`/home`에는 작품 기반 rail을 아래 구조로 둔다.

1. 상단: 작품 포스터 chip rail
   - 포스터는 `coverImage.large` 또는 `coverImage.extraLarge` 사용
   - 선택 상태는 라프텔스토어처럼 하단 pointer 또는 선명한 선택 ring으로 표시
   - 텍스트 로고 이미지를 억지로 만들지 않는다

2. 중간: 선택 작품 요약
   - 제목은 `title.native` 우선, 없으면 `title.english`, 없으면 `title.romaji`
   - 보조 지표는 내부 운영용으로 `trending`, `popularity`, `averageScore`를 저장하되, 사용자 UI에는 과도하게 노출하지 않는다
   - 문구는 “요즘 찾는 작품”처럼 직접적이고 짧게 유지한다

3. 하단: 해당 작품을 다루는 매장 카드
   - 카드 형태는 `/home`의 매장 신호 리스트 또는 올리브영 매장 카드형 레퍼런스를 따른다
   - 필수 표시 정보는 API가 제공하는 매장명, 지역/주소, 영업 상태, 등록된 취급 작품 정도로 제한한다
   - “추정 추천 사유”, “추정 취급 품목”, “가짜 업데이트 사유” 같은 프론트 생성 카피는 만들지 않는다

## 백엔드 요구사항

프론트에서 AniList를 직접 호출하지 않는다. 서버가 AniList 메타데이터를 가져와 캐시/정규화하고, 프론트는 Aniwhere API만 사용한다.

### 1. Anime metadata sync

서버는 AniList에서 trending anime 목록을 주기적으로 가져온다.

필요 저장 필드 예시:

```ts
type AnimeMetadata = {
  id: number
  anilistId: number
  malId: number | null
  titleRomaji: string | null
  titleEnglish: string | null
  titleNative: string | null
  coverImageExtraLargeUrl: string | null
  coverImageLargeUrl: string | null
  coverImageMediumUrl: string | null
  coverImageColor: string | null
  bannerImageUrl: string | null
  trending: number | null
  popularity: number | null
  averageScore: number | null
  siteUrl: string | null
  isAdult: boolean
  sourceUpdatedAt: string | null
  syncedAt: string
}
```

주의:

- AniList를 대량 저장소처럼 쓰지 않는다.
- `/home` 노출에 필요한 최소 필드만 저장한다.
- rate limit과 장애에 대비해 서버 캐시를 둔다.
- `coverImage*Url`은 원본 URL을 저장할지, 서버 이미지 프록시/CDN 캐시를 둘지 백엔드에서 결정한다.
- 상업 사용 가능 범위와 이미지 사용 조건은 출시 전 별도 확인이 필요하다.

### 2. Shop-work relation

관리자 샵 등록/수정 화면에서 “취급 작품”을 연결할 수 있어야 한다.

필요 관계:

```ts
type ShopAnimeRelation = {
  shopId: number
  animeMetadataId: number
  source: 'ADMIN' | 'REVIEW' | 'IMPORT'
  confidence: 'CONFIRMED' | 'UNVERIFIED'
  note: string | null
  updatedAt: string
}
```

초기 MVP에서는 `source: ADMIN`, `confidence: CONFIRMED`만 사용해도 된다. 리뷰/제보 기반 자동 연결은 후순위다.

### 3. Home API

프론트가 모든 shop을 긁어서 작품 rail을 만들면 안 된다. `/home` 전용 API가 필요하다.

권장 응답:

```ts
type HomeAnimeRailResponse = {
  generatedAt: string
  items: Array<{
    anime: AnimeMetadata
    handledShopCount: number
    shops: Array<{
      id: number
      name: string
      address: string
      regionName: string | null
      status: string
      floor: string | null
      primaryPhotoUrl: string | null
    }>
  }>
}
```

권장 endpoint:

```http
GET /api/v1/home/anime-rail
```

쿼리 옵션은 후순위로 둔다.

```http
GET /api/v1/home/anime-rail?limit=8&shopLimit=3
```

## 프론트 요구사항

프론트는 아래 원칙을 지킨다.

- AniList API를 직접 호출하지 않는다.
- `GET /api/v1/home/anime-rail`이 생기기 전에는 포스터 기반 rail을 구현하지 않는다.
- API가 없으면 준비 중/문서화 상태로 둔다. 추정 함수로 rail을 만들지 않는다.
- 이미지가 없으면 텍스트 + 중립 그래픽 chip으로 fallback한다.
- 포스터 이미지는 카드의 핵심 시각 요소로 쓰되, 화면 전체를 이미지로 과밀하게 만들지 않는다.
- 375px 기준에서 첫 viewport가 정보 과다로 보이지 않아야 한다.
- TDS/App in Toss 방향상 CTA는 한 화면에 과도하게 늘리지 않고, `Top + rail + 선택 작품 매장 카드` 정도로 압축한다.

## 구현 순서 제안

이 작업은 관리자 페이지의 샵 등록 화면과 이미지 업로드가 완성된 뒤에 진행하는 편이 낫다.

정확히는 “이미지 업로드” 자체보다 “관리자가 어떤 매장이 어떤 작품을 다루는지 연결할 수 있는 구조”가 먼저 필요하다. 포스터는 AniList에서 제공할 수 있지만, 포스터를 클릭했을 때 보여줄 매장 연결 데이터가 없으면 `/home` rail은 다시 추정형 UI가 된다.

권장 순서:

1. `/admin/shops` 등록/수정 MVP 완료
   - 현재 Swagger 기준 shop 필드만 사용
   - 추정 필드 추가 금지

2. 샵 사진 업로드/대표 사진 API 정리
   - 매장 카드의 `primaryPhotoUrl` 확보
   - 포스터 rail 하단의 매장 카드 완성도 향상

3. 관리자 샵 수정 화면에 “취급 작품 연결” 추가
   - AniList metadata 검색/선택 또는 서버에 저장된 AnimeMetadata 검색
   - 초기에는 관리자 수동 연결만 허용

4. 서버에 AniList metadata sync 추가
   - `TRENDING_DESC` 기반 목록 수집
   - `isAdult: false`
   - 캐시/갱신 주기/rate limit 처리

5. `/api/v1/home/anime-rail` 추가
   - trend 점수 + 취급 매장 수 + 대표 매장 3개
   - 프론트가 shop aggregate를 직접 긁지 않도록 함

6. `/home` Poster-driven Rail 적용
   - 포스터 chip rail
   - 선택 작품 하단 pointer
   - 선택 작품 취급 매장 카드
   - 더보기는 `/search?keyword=작품명` 또는 후속 `/works/:id/shops`

## Jira 작성용 요약

### Epic: AniList 기반 작품 메타데이터와 Home Poster Rail

목표:

- AniList API의 trending anime와 cover image를 서버에서 수집하고, 관리자 샵 등록 정보의 취급 작품과 연결해 `/home`에서 포스터 기반 작품 rail과 관련 매장 카드를 제공한다.

Backend tasks:

- AniList GraphQL client 추가
- `AnimeMetadata` 저장 모델 추가
- AniList `TRENDING_DESC` sync job 추가
- rate limit, retry, cache 정책 추가
- `ShopAnimeRelation` 모델 추가
- 관리자용 작품 검색/연결 API 추가
- `GET /api/v1/home/anime-rail` API 추가

Frontend tasks:

- `/admin/shops`에 취급 작품 연결 UI 추가
- `/home`에서 `GET /api/v1/home/anime-rail` 사용
- 포스터 chip rail + 선택 작품 매장 카드 구현
- 이미지 없는 작품 fallback 처리
- 375px WebView 기준 레이아웃 검수

Acceptance criteria:

- 프론트가 AniList를 직접 호출하지 않는다.
- `/home` rail은 backend가 제공하는 작품/매장 연결 데이터만 사용한다.
- 추정형 카피/추정형 매장 연결을 만들지 않는다.
- `isAdult: false` 작품만 노출한다.
- API 실패 시 `/home`의 핵심 탐색 흐름이 깨지지 않는다.
- 포스터 이미지는 TDS/App in Toss 모바일 화면에서 과밀하지 않게 표시된다.

## 보류/리스크

- AniList API의 이미지 사용 가능 범위는 출시 전 법무/정책 확인이 필요하다.
- AniList terms상 대량 수집/백업 저장소 용도는 금지되어 있으므로 필요한 최소 필드만 캐시한다.
- AniList 장애나 rate limit 시 `/home`이 빈 화면이 되면 안 된다.
- 작품 포스터가 강하면 Aniwhere가 “매장 탐색 서비스”보다 “애니 정보 서비스”처럼 보일 수 있으므로, 항상 포스터 아래에 실제 취급 매장 정보를 연결한다.
- 광고/수익화 규모가 커져 AniList commercial usage 조건에 닿을 수 있으면 사전 문의가 필요하다.

