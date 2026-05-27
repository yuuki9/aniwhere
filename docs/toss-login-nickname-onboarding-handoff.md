# Toss Login Nickname Onboarding Handoff

Date: 2026-05-28

## Context

Aniwhere should keep Toss login as the only login mechanism inside Apps in Toss. After `appLogin()` succeeds, the client sends the authorization code to the Aniwhere server. The server exchanges it with Toss, receives the app-scoped `userKey`, and creates or finds the Aniwhere user record.

Nickname entry is not a second login or a replacement for Toss identity. It is Aniwhere-owned profile setup shown only when `/api/v1/users/me` returns an empty nickname or the login result marks a new user.

Recommended user-facing framing:

- `후기와 제보에 표시될 닉네임을 정해주세요`
- Secondary help copy should explain that the name is used inside Aniwhere, not in Toss.

## Official Docs Checked

- Apps in Toss login intro: https://developers-apps-in-toss.toss.im/login/intro.md
- Apps in Toss login development: https://developers-apps-in-toss.toss.im/login/develop.md
- `appLogin` reference: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EB%A1%9C%EA%B7%B8%EC%9D%B8/appLogin.md
- TDS Mobile TextField: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-field/
- TDS Mobile Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- TDS Mobile Toast: https://tossmini-docs.toss.im/tds-mobile/components/toast/

## API Contract

Swagger User APIs checked from `https://api.aniwhere.link/v3/api-docs`:

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me/nickname`
- `GET /api/v1/users/nickname/availability`
- `GET /api/v1/users`
- `GET /api/v1/users/{id}`

Client files already related to this flow:

- `client/src/shared/api/users.ts`
- `client/src/shared/lib/auth.ts`
- `client/src/shared/lib/authEntryFlow.ts`
- `client/src/shared/lib/authSession.ts`
- `client/src/pages/IntroPage.tsx`
- `client/tests/authEntryFlow.test.ts`
- `client/tests/introPage.test.ts`
- `client/tests/apiContracts.test.ts`

## Target Flow

1. User taps Toss login in `/intro`.
2. Client calls `appLogin()`.
3. Client sends `{ authorizationCode, referrer }` to `/api/v1/auth/toss/login`.
4. Server exchanges the code and maps Toss `userKey` to an Aniwhere user.
5. Client calls `/api/v1/users/me` with the Aniwhere access token.
6. If `nickname` is missing, show Aniwhere nickname setup.
7. Check `GET /api/v1/users/nickname/availability?nickname=...`.
8. Save with `PATCH /api/v1/users/me/nickname`.
9. Update local auth session user and navigate to `/home`.

## Test Strategy

Use fast local tests for product UI and API contract:

- Existing unit/source tests should cover API paths, nickname-needed state, duplicate nickname rejection, save success, session user update, and intro UI rendering.
- Add UI tests before broad styling changes if the nickname form is extracted into a dedicated component.

Use `.ait` upload for SDK-dependent runtime checks only:

- `appLogin()` can return an authorization code in the uploaded Apps in Toss environment.
- Server login succeeds with the returned `referrer`.
- `/users/me` works with the Aniwhere access token.
- Missing nickname shows the setup UI.
- Nickname save returns to `/home`.

Local sandbox login has repeatedly failed while `.ait` console upload succeeds. Treat this as `Needs sandbox / console upload verification` until the Apps in Toss inquiry is answered.

## Next Slice

Recommended branch from here:

- Continue on `chore/toss-login-nickname-onboarding-handoff` only for planning/docs.
- For implementation, branch or rename to `feature/toss-login-nickname-onboarding` after PR #81 is merged or rebased.

Suggested implementation tasks:

- Extract nickname setup UI from `IntroPage` if it grows beyond the current inline form.
- Replace temporary/mojibake copy in intro nickname labels/help/buttons with final Korean copy.
- Prefer TDS `TextField`, `Button`, and `Toast` through `@aniwhere/tds-mobile` when the facade supports the needed props.
- Record the route-level TDS audit in `docs/tds-route-audit.md` before changing visible intro UI.
- Verify local tests, `npm run lint`, `npm run build`, and `.ait` upload behavior.

