# Skill Drill Studio — build handoff

## Independent verification outcome (2026-08-27): FAIL

Candidate `bf9faa474440ac78f8b86222ecab7535f4cfe45d` was independently tested from a clean checkout and matched byte-for-byte to https://skill-drill-studio.sociobot.in. Product flows, tests, build, offline reload, accessibility, privacy/security policy, and bundle budgets passed. **Do not release this candidate as verified:** the live content-hashed JS and CSS each return `Cache-Control: public, must-revalidate, max-age=30`, rather than the contract-required long-lived immutable cache policy. This is a severity-high deployment/configuration defect. Full evidence and the exact retest are in `.factory/verification-1.md`.

## Delivered

- A finished Vite + vanilla TypeScript static product for ordered-step, exact-command, and image-hotspot drills.
- A fast four-step authoring path: choose a type, author the deterministic answer key, test it in the learner view, and export a portable JSON file.
- Local drill shelf with edit, delete confirmation, export, validated import, and three usable examples.
- Learner feedback for every attempt, repeat runs, attempt history, and a first-versus-third-run improvement message.
- Accessible ordered-step controls and a hotspot crosshair operable by pointer or keyboard arrows/Enter.
- Strict plain-text rendering, inert command comparison, raster-only uploaded media (PNG/JPEG/WebP, 2 MB limit), JSON schema validation, and no arbitrary HTML/code execution.
- Local-first storage, no accounts/analytics/runtime third parties, privacy and terms routes, and a versioned service worker for offline return visits.
- A product-specific cinematic “night workshop” visual system with self-hosted fonts, authored SVG graphics, and an original generated hero. Prompt and provenance are in `.factory/design.md` and `assets/src/night-workshop.prompt.json`.
- Responsive treatment verified at 390 × 844 px. Mobile stacks authoring panels and actions and crops the environmental art intentionally.

## Run and deploy

```sh
npm ci
npm test
npm run build
```

The exact deployment command is `npm run build`. Output is `./dist`, and `dist/index.html` is present at its root. Azure Static Web Apps navigation fallback and security headers are in `public/staticwebapp.config.json`.

Optional full browser suite:

```sh
npx playwright install chromium
npm run test:e2e
```

## Builder verification (2026-08-27; superseded by independent FAIL above)

- `npm test`: 5 deterministic core/schema tests passed.
- `npm run build`: passed TypeScript strict checking and Vite production build.
- `npm run test:e2e`: 6 passed, 2 intentionally skipped by project (desktop-only offline check and mobile-only viewport check). Covers desktop + 390 px author-to-learner flow, command completion, hotspot keyboard operation, console errors, local offline shell, and axe scans on home, privacy, and editor screens.
- Factory `verify-url.sh`: HTTP 200; title present; `lang="en"`; one `h1`; main landmark; zero missing image alts; zero unlabeled buttons; zero console/page errors. Machine-readable output is in `.factory/evidence/verify.json`.
- Lighthouse mobile production preview: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP **1.8 s**, CLS **0**, total blocking time **0 ms**. Lab hardware may vary.
- Production payload: initial app JS **30.81 KB** / **10.83 KB gzip**; CSS **20.11 KB** / **5.35 KB gzip**; largest hero source **64 KB**; self-hosted fonts **108 KB** total.
- Visual review completed using full-page desktop (1440 px) and mobile (390 px) screenshots.

## Known gaps and next steps

- Browser storage is intentionally device-local. JSON export/import is the sharing and backup mechanism; there is no cloud sync, LMS integration, or student profile system by design.
- Run improvement is measured per browser. A teacher does not receive learner attempt data; this protects privacy but means the pilot success measure must be assessed voluntarily outside the product.
- Uploaded images are embedded in JSON, so large classroom files can approach the 3 MB import cap. Keep hotspot art compressed for easy sharing.
- If future pilots need multiple prompts in one package, version the JSON schema instead of broadening v1 silently.
