# Nano Banana Icon Prompt Anchor

Last reviewed: 2026-05-11 KST

이 문서는 Aniwhere의 `/home`, `/intro` 아이콘을 Nano Banana 계열 이미지 모델로 생성할 때 반복해서 참조할 anchor 문서입니다. 목적은 예쁜 단발 이미지를 뽑는 것이 아니라, 앱 안에서 60px 전후로 읽히는 일관된 브랜드 아이콘 세트를 만드는 것입니다.

## Source Anchors

- Google Cloud Blog, [The ultimate Nano Banana prompting guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana?hl=en)
  - 구체적인 subject, lighting, composition을 제공합니다.
  - 부정형 지시보다 원하는 결과를 긍정형으로 설명합니다.
  - 강한 동사로 시작하고, 키워드 나열보다 목적이 분명한 서술형 prompt를 사용합니다.
  - 기본 구조는 `[Subject] + [Action] + [Location/context] + [Composition] + [Style]`입니다.
- Google AI for Developers, [Image generation with Gemini](https://ai.google.dev/gemini-api/docs/image-generation)
  - 아이콘, 스티커, asset 생성은 스타일을 명확히 쓰고 흰 배경을 요청합니다.
  - 현재 모델은 transparent background 직접 생성을 지원하지 않으므로, 흰 배경 생성 후 후처리로 배경을 제거합니다.
  - 기본 출력은 정방형이며, 필요하면 `responseModalities: ["IMAGE"]`, `aspectRatio: "1:1"`, `imageSize`를 설정합니다.
  - 생성 이미지에는 SynthID watermark가 포함됩니다.

## Aniwhere Icon Direction

### Output Target

- Usage: `/home` quick menu 60x60, `/intro` feature icon 44-48px.
- Source export: 1024x1024 PNG, white background.
- App asset: background-removed WebP or AVIF, preferably 256x256 source size before bundling.
- Visual density: object should occupy about 72-80% of the square so it stays readable at 60px.
- Safe area: keep at least 10-14% padding on every side.

### Style Rules

- Use a cohesive soft 3D clay or product-icon style.
- Keep forms rounded, friendly, and simple enough to read at small sizes.
- Use Aniwhere palette cues: coral `#ff674f`, blue `#3182f6`, mint, warm yellow, soft white.
- Use one primary object and one supporting accent at most.
- Prefer store discovery objects: map pin, storefront, goods box, note card, review pencil, admin card.
- Avoid existing brand logos, copyrighted characters, readable text, manga panel style, complex backgrounds, and decorative clutter.

### Prompt Structure

Use this structure for every icon:

```text
Create [asset type] for [Aniwhere context].
[Subject] ...
[Action/intent] ...
[Composition] ...
[Style/material] ...
[Color/lighting] ...
[Production constraints] ...
```

For icon generation, include these fixed constraints:

```text
Create a square 1:1 mobile app icon asset on a pure white background. The object is centered, large, and readable at 60x60 px. Use a soft 3D clay-style product icon look with rounded friendly shapes, crisp edges, gentle studio lighting, and a subtle contact shadow. Use Aniwhere colors: coral #ff674f, blue #3182f6, mint, warm yellow, and soft white. Keep the design text-free, logo-free, character-free, and simple enough for a Korean mobile WebView quick menu.
```

## Six Icon Prompts

### 1. Home: Store Finder

```text
Create a square 1:1 mobile app icon asset for Aniwhere's store finder quick menu on a pure white background.
Subject: a cute map pin combined with a tiny storefront facade inside the pin.
Action/intent: it should immediately communicate "find nearby anime goods stores".
Composition: centered object, large silhouette, 10-14% padding, readable at 60x60 px.
Style/material: soft 3D clay-style product icon, rounded friendly shapes, crisp edges, gentle contact shadow.
Color/lighting: Aniwhere coral #ff674f, blue #3182f6, mint, warm yellow, and soft white, with soft studio lighting.
Production constraints: text-free, logo-free, character-free, no copyrighted anime references, no complex background.
```

### 2. Home: Visit Review

```text
Create a square 1:1 mobile app icon asset for Aniwhere's visit review quick menu on a pure white background.
Subject: a friendly speech bubble with a small pencil and star-shaped rating accent.
Action/intent: it should communicate "read or write store visit reviews".
Composition: centered object, large silhouette, 10-14% padding, readable at 60x60 px.
Style/material: soft 3D clay-style product icon, rounded friendly shapes, crisp edges, gentle contact shadow.
Color/lighting: Aniwhere coral #ff674f, blue #3182f6, mint, warm yellow, and soft white, with soft studio lighting.
Production constraints: text-free, logo-free, character-free, no copyrighted anime references, no complex background.
```

### 3. Admin: Store Management

```text
Create a square 1:1 mobile app icon asset for Aniwhere's admin store management quick menu on a pure white background.
Subject: a small storefront management card with a gear badge and check mark.
Action/intent: it should communicate "manage store CRUD for an admin user" without looking like a public report button.
Composition: centered object, large silhouette, 10-14% padding, readable at 60x60 px.
Style/material: soft 3D clay-style product icon, rounded friendly shapes, crisp edges, gentle contact shadow.
Color/lighting: Aniwhere coral #ff674f, blue #3182f6, mint, warm yellow, and soft white, with soft studio lighting.
Production constraints: text-free, logo-free, character-free, no copyrighted anime references, no complex background.
```

### 4. Intro: Curated Goods Discovery

```text
Create a square 1:1 mobile app icon asset for Aniwhere's curated goods discovery feature on a pure white background.
Subject: a small collectible goods box with a sparkle and a simple acrylic stand silhouette.
Action/intent: it should communicate "discover interesting anime goods and related store information".
Composition: centered object, large silhouette, 10-14% padding, readable at 44-60px.
Style/material: soft 3D clay-style product icon, rounded friendly shapes, crisp edges, gentle contact shadow.
Color/lighting: Aniwhere coral #ff674f, blue #3182f6, mint, warm yellow, and soft white, with soft studio lighting.
Production constraints: text-free, logo-free, character-free, no copyrighted anime references, no complex background.
```

### 5. Intro: Map Exploration

```text
Create a square 1:1 mobile app icon asset for Aniwhere's map exploration feature on a pure white background.
Subject: a location pin standing on a simple folded map with one route curve.
Action/intent: it should communicate "check stores near the user's location".
Composition: centered object, large silhouette, 10-14% padding, readable at 44-60px.
Style/material: soft 3D clay-style product icon, rounded friendly shapes, crisp edges, gentle contact shadow.
Color/lighting: Aniwhere coral #ff674f, blue #3182f6, mint, warm yellow, and soft white, with soft studio lighting.
Production constraints: text-free, logo-free, character-free, no copyrighted anime references, no complex background.
```

### 6. Intro: Community Review

```text
Create a square 1:1 mobile app icon asset for Aniwhere's community review feature on a pure white background.
Subject: a note card with a pencil and a small heart or star accent.
Action/intent: it should communicate "collect and share store visit stories".
Composition: centered object, large silhouette, 10-14% padding, readable at 44-60px.
Style/material: soft 3D clay-style product icon, rounded friendly shapes, crisp edges, gentle contact shadow.
Color/lighting: Aniwhere coral #ff674f, blue #3182f6, mint, warm yellow, and soft white, with soft studio lighting.
Production constraints: text-free, logo-free, character-free, no copyrighted anime references, no complex background.
```

## Follow-Up Refinement Prompts

Use short iterative prompts instead of regenerating the whole direction:

```text
Keep the same object, style, colors, and composition. Make the silhouette simpler and more readable at 60x60 px.
```

```text
Keep everything the same, but increase the object scale slightly and reduce tiny decorative details.
```

```text
Keep the same style and lighting. Make this icon more consistent with the previous Aniwhere icon set.
```

```text
Keep the same object and composition. Replace the background with a pure white background suitable for later background removal.
```

## Implementation Notes

- Generate on white, then remove background locally or during asset preparation.
- Export final app assets as optimized WebP or AVIF.
- Keep file names semantic:
  - `home-quick-store.webp`
  - `home-quick-review.webp`
  - `home-quick-admin.webp`
  - `intro-feature-curation.webp`
  - `intro-feature-map.webp`
  - `intro-feature-review.webp`
- Do not ship image assets until they are visually checked at 375px mobile width and at the actual rendered icon sizes.
