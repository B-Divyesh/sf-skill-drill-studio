# Skill Drill Studio — repair 2 handoff

## Result: PASS

**Implementation SHA:** `884fde180f7741e448d493237389d39054ca0efa`

**Documentation revision:** this handoff and the reusable live-check script are committed after the implementation SHA. The exact documentation SHA is reported with the final evidence.

**Live URL:** <https://skill-drill-studio.sociobot.in>

**Demo URL:** <https://skill-drill-studio.sociobot.in/demo>

**Deployed resource:** `sf-skill-drill-studio` production environment only.

## What changed

- Added an isolated one-click demo with three seeded drill formats and two prior command runs. Demo storage uses only `demo:skill-drill-library` and `demo:skill-drill-runs`.
- Added the persistent **Demo — sample data, nothing is saved** banner, **Reset demo**, and **Start for real**. Exiting removes demo keys and reloads normal storage.
- Rewrote the first screen around the job, audience, first action, sample result, and three plain facts. Removed metaphor-only interface headings and documented the copy audit.
- Added ten public claims in `.factory/claims.json`. Each claim has one outcome-based Playwright test that starts from `/demo` in a fresh context.
- Fixed blank authoring recovery. The first invalid input now receives focus, `aria-invalid`, an error description, and an announced action.
- Added a dedicated, product-styled 404 document and Azure routing that returns HTTP 404 for unknown GET and HEAD requests.
- Added canonical, Open Graph, Twitter, 1200 × 630 social image, and 180 px Apple touch metadata. SPA routes update titles, descriptions, canonical URLs, and social text.
- Added route-heading focus and announcements for client navigation and back/forward navigation.
- Added keyboard positioning for authored hotspots and retained keyboard operation for all learner formats.
- Preserved the existing immutable cache policy, CSP, local-only command checking, JSON validation, service-worker offline behavior, and three working drill engines.
- Updated README, demo documentation, visual provenance, catalog copy, sitemap, and service-worker cache version.

## Finding disposition

| Review item | Disposition and evidence |
|---|---|
| Missing isolated demo | Resolved. `/demo` is seeded, labelled, resettable, and uses only `demo:` keys. The browser-storage claim seeds real sentinels and proves they remain unchanged. |
| Missing claims manifest/tests | Resolved. Ten manifest commands passed individually from a clean checkout. `npm test` also runs the complete claim suite. |
| Non-plain first screen | Resolved. The headline is “Create short browser practice drills”; the audience, primary action, result, and three facts fit the 390 × 844 first screen. `.factory/copy-audit.md` has no sentence over 22 words or banned term. |
| Invalid form did not focus field | Resolved. Blank save focuses the title field and associates the announced recovery message. Covered on desktop and phone. |
| Missing 404 | Resolved. Unknown URLs return HTTP 404 with the dedicated page and home link in both the SWA emulator and production. |
| Incomplete metadata | Resolved. Required canonical, social, touch-icon, route title, description, and image metadata are present. |
| Earlier immutable-cache failure | Remains resolved. Live hashed JS and CSS return `public, max-age=31536000, immutable`. |
| Earlier functional, accessibility, privacy, mobile, and offline checks | Reconfirmed in clean local and fresh production browsers. |

## Clean verification

A fresh local clone checked out the exact implementation SHA above. `npm ci` installed 59 packages with zero audit vulnerabilities. Every command in `.factory/claims.json` passed separately.

```sh
npm ci
npx playwright install chromium
npm test
npm run build
npm run test:e2e
```

- `npm test`: 5 unit/schema tests, generated-artifact checks, and 10/10 claim tests passed.
- `npm run build`: strict TypeScript and Vite build passed; `dist/index.html` was produced.
- `npm run test:e2e`: 13 passed, 3 intentionally skipped by project targeting. The executed checks cover desktop and 390 px phone behavior, focus recovery, demo reset/isolation, route history, metadata, Axe, invalid imports, keyboard hotspots, reduced motion, and a 200% equivalent viewport.
- Azure Static Web Apps emulator: `/`, `/demo`, and `/privacy` returned 200; an unknown route returned 404 with the designed document; hashed bundles retained immutable caching.
- Local mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.8 s, TBT 10 ms, CLS 0.

## Production verification

- Deployed the build from `884fde180f7741e448d493237389d39054ca0efa` to the existing production Static Web App.
- Fresh desktop browser: first-screen job, audience, action, and facts present; one-click demo contained three formats and two prior runs; wrong and correct feedback worked; reset restored two runs; exit removed demo keys; real sentinel storage was unchanged.
- Fresh 390 × 844 browser: no horizontal overflow (`390` scroll width and client width); landing and demo screenshots reviewed; demo banner and three samples were visible.
- Browser capture: no console errors, page errors, or cross-origin runtime requests.
- Live Axe scan through the production flow: 0 serious or critical findings.
- Factory URL verifier: HTTP 200, correct title and language, one `h1`, a `main`, no missing alt text, no unnamed buttons, and no browser errors; measured load 657 ms.
- Unknown live URL: GET and HEAD both return 404 and the response contains `Page not found — Skill Drill Studio`.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.6 s, TBT 0 ms, CLS 0.
- Live hashed JavaScript is 38,322 bytes raw / 12,394 bytes gzip. CSS is 25,113 bytes raw / 6,261 bytes gzip. Fonts total 102,036 bytes. The mobile hero is 28,296 bytes.

Evidence is in `/work/.evidence/`, including `live-check.json`, live desktop/phone screenshots, Lighthouse JSON, URL verifier output, and the copied catalog description.

## Known limits

- Storage is intentionally device-local. Users must export JSON for backup or classroom sharing.
- The service worker supports return visits offline after one online load. A first-ever offline visit cannot install the app.
- There is no LMS integration, cloud sync, student profile, arbitrary code execution, AI feature, backend, or paid offer. These are outside the researched free product scope.
