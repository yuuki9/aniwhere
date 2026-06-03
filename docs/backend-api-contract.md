# Backend API Contract

Frontend API types and request functions must use the deployed Swagger/OpenAPI contract as the first reference when server changes are merged into `main`.

## Source Of Truth

- Swagger UI: https://api.aniwhere.link/swagger-ui/index.html
- OpenAPI JSON: https://api.aniwhere.link/v3/api-docs

## Deployment Assumption

When server-related branches are merged into `main`, the backend is automatically deployed to `https://api.aniwhere.link`.

Use the deployed Swagger UI above for frontend contract comparison after those merges. Local server routes can be checked with:

- Local Swagger UI: http://localhost:8080/swagger-ui.html
- Local OpenAPI JSON: http://localhost:8080/v3/api-docs

## Frontend Sync Rule

When the backend contract changes:

1. Compare the deployed Swagger/OpenAPI paths, methods, query parameters, request bodies, and response schemas.
2. Update `client/src/shared/api/types.ts` and request functions under `client/src/shared/api/`.
3. Remove frontend usage of fields or endpoints that no longer exist in the Swagger contract.
4. Do not add fallback endpoints unless the backend contract explicitly documents them.

## Current Catalog Contract Notes

- `GET /api/v1/regions` returns `RegionListItem[]` with `id`, `name`, `city`, and `count`.
- `GET /api/v1/categories` returns `CategoryListItem[]` with `id`, `name`, and `count`.
- Current deployed category masters checked from `GET /api/v1/categories`: `가챠`, `굿즈`, `제일복권`, `피규어`.
- `GET /api/v1/works` accepts optional `type=ANIMATION|GAME`.
- `GET /api/v1/shops/facets` provides search facet payload (`regions`, `categories`, `workTypes`, `sorts`) for filter UI.
- `GET /api/v1/shops/facets` accepts optional `includeRegions`, `includeCategories`, `includeWorkTypes`, and `includeSorts` boolean query params.
- Current deployed work type facets checked from `GET /api/v1/shops/facets`: `ANIMATION` (`애니메이션`), `GAME` (`게임`).
- The deployed Swagger contract for `GET /api/v1/shops/facets` does not expose `keyword`, selected filter IDs, `status`, `type`, or map bounds. Use `GET /api/v1/shops` for result filtering.
- `GET /api/v1/shops` accepts `sort=NEWEST|REVIEW_COUNT_DESC|FAVORITE_COUNT_DESC`.
- `GET /api/v1/search/autocomplete` accepts required `q` and `scope=shop|work`, plus optional `limit` defaulting to 8 and capped by the server.
- `SearchAutocompleteItem` returns `label`, `kind=SHOP|WORK`, and optional `shopId` or `workId`.
- `GET /api/v1/shops/nearby` accepts required `lat` and `lng` query params and returns `Shop[]` for the server-defined 1km nearby search.
- `GET /api/v1/shops` keeps compatibility for both `category` (name filter) and `categoryIds[]` (ID filter); when both are present, both filters are applied.
- `ShopRequest` sends `categoryIds` and `workIds` arrays for create/update.
- `Shop.categories` is `CategorySummary[]` (`id`, `name`), not `string[]`.
- `Shop` responses now include `averageRating`, `reviewCount`, and `favoriteCount` for shop-review and favorite summaries.
- `GET /api/v1/users/me/favorite-shops` returns the authenticated user's favorite `Shop[]`.
- `PATCH /api/v1/users/me/nickname` accepts optional `emojiIconFilename` alongside `nickname`.
- `UserSummary` includes optional `emojiIconFilename`.
- Legacy `/api/v1/posts` community endpoints are removed. Frontend review work must use shop-scoped review APIs.
- `GET /api/v1/shops/{shopId}/reviews` returns `PageResponse<ShopReview>` and accepts `sort=NEWEST|OLDEST|RATING_HIGH|RATING_LOW`.
- `POST /api/v1/shops/{shopId}/reviews` and `PATCH /api/v1/shops/{shopId}/reviews/{reviewId}` send `rating` and `content` as query params, with optional `images` in multipart form data.
- `PATCH /api/v1/shops/{shopId}/reviews/{reviewId}` accepts optional `replaceImages` and repeated `existingImageIds` query params. When `replaceImages=true`, `existingImageIds` defines retained existing review image IDs/order and `images` adds new image files; sending neither retained IDs nor files deletes all review images.
- `GET /api/v1/users/me/reviews` returns the authenticated user's `PageResponse<ShopReview>` for owner review-management surfaces.
- `ShopReview` includes `authorEmojiIconFilename`, `likeCount`, and `likedByMe`, and `POST/DELETE /api/v1/shops/{shopId}/reviews/{reviewId}/likes` toggles review likes.
- Deployed Swagger does not expose a review report endpoint yet. Client UI may show a report entry point, but it must not call an invented API path.
- `UserSummary` includes `role`, and `PATCH /api/v1/admin/users/{userId}/role` accepts `{ "role": "ADMIN" | "USER" }`.

## Contract Sync Checklist

Use this checklist after server-related branches are merged into `main`:

- [ ] Open https://api.aniwhere.link/swagger-ui/index.html and confirm the deployed Swagger reflects the merged server branch.
- [ ] Check https://api.aniwhere.link/v3/api-docs when path, method, schema, or enum details need exact comparison.
- [ ] Compare changed backend endpoints against `client/src/shared/api/` request functions.
- [ ] Compare request and response schemas against `client/src/shared/api/types.ts`.
- [ ] Confirm shop taxonomy fields use IDs for writes and summary objects for reads.
- [ ] Remove frontend fields, query parameters, or fallback endpoints that are no longer present in Swagger.
- [ ] Run TypeScript and lint verification after updating the frontend API layer.
