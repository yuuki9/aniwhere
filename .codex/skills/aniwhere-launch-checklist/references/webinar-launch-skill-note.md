# Webinar Launch Skill Note

Sources:

- PDF: `C:/Users/jdhn2/Downloads/앱인토스 웨비나 _ 미니앱 최종 검수 스킬 공유.pdf`
- Skill folder supplied later: `C:/Users/jdhn2/Downloads/appsintoss-nongame-launch-checklist-by-robin`

The PDF itself only explained Robin's private final-review skill, its installation/call pattern, and its purpose. It did not include the full 11-step checklist body.

The later supplied skill folder did include the checklist body and two references. Aniwhere imports that structure as `aniwhere-launch-checklist`, with repository-specific adjustments for:

- Apps in Toss WebView under `client/`.
- `client/granite.config.ts` as the miniapp config file.
- TDS/design-token work through `client/src/styles/tokens.css`.
- Aniwhere product scope from `docs/product-decisions.md`.
- Codex project skill layout under `.codex/skills/`.

Robin's original checklist categories:

1. Access and registered app functions.
2. Navigation bar.
3. Login/auth/permissions.
4. Guides/routing.
5. UI/UX.
6. Text/brand.
7. Payments.
8. In-app ads.
9. External link and app-install policy.
10. TDS design system.
11. Sharing rewards.

Final rule from the source skill:

- Steps 1-6 and 9 are required launch-review areas.
- Step 10 is recommended.
- Steps 7, 8, and 11 are required only when those features are used.
