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
- `GET /api/v1/works` accepts optional `type=ANIMATION|GAME`.
- `ShopRequest` sends `categoryIds` and `workIds` arrays for create/update.
- `Shop.categories` is `CategorySummary[]` (`id`, `name`), not `string[]`.

## Contract Sync Checklist

Use this checklist after server-related branches are merged into `main`:

- [ ] Open https://api.aniwhere.link/swagger-ui/index.html and confirm the deployed Swagger reflects the merged server branch.
- [ ] Check https://api.aniwhere.link/v3/api-docs when path, method, schema, or enum details need exact comparison.
- [ ] Compare changed backend endpoints against `client/src/shared/api/` request functions.
- [ ] Compare request and response schemas against `client/src/shared/api/types.ts`.
- [ ] Confirm shop taxonomy fields use IDs for writes and summary objects for reads.
- [ ] Remove frontend fields, query parameters, or fallback endpoints that are no longer present in Swagger.
- [ ] Run TypeScript and lint verification after updating the frontend API layer.
