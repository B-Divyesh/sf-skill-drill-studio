# Independent verification 2 — PASS

**Candidate:** `44b50a40326563c3808c48102941a835ece89f59`

**Live URL:** https://skill-drill-studio.sociobot.in

**Verified:** 2026-08-27 UTC
**Scope:** clean install/build, automated and independent browser QA, deployment parity, privacy/security policy, accessibility, responsive behavior, PWA offline behavior, and performance.

## Result

**PASS.** The candidate is a functioning local-first static authoring tool for ordered-step, exact-command, and image-hotspot drills. The prior release-blocking cache-policy defect is fixed in source and confirmed on the live custom domain.

## Quality gates

- Clean checkout at the exact candidate SHA; `npm ci` installed 58 packages and reported **0 vulnerabilities**.
- `npm test`: **5/5** unit/schema tests passed. Its generated-artifact check rebuilt the app and confirmed that the two JS/CSS artifacts receiving immutable caching are content-hashed.
- `npm run build`: passed TypeScript strict checking and Vite production build; `dist/` was produced.
- No separate lint script is defined. Type checking is part of the production build.
- `CI=1 npx playwright test --workers=1`: **6 passed, 2 skipped**. The two skips are intentional project-specific skips; the executed checks include author-to-learner command flow, desktop offline reload, mobile viewport/hotspot keyboard operation, console errors, and axe scans.
- Fresh mobile Lighthouse against the live site: Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP **1.1 s**, LCP **1.7 s**, TBT **140 ms**, CLS **0**.

## Independent functional QA

Against a local production preview made from this exact `dist/`:

- Exact command: authored a command drill; wrong casing produced deterministic text feedback and `aria-invalid`; correcting the input completed the drill; JSON export downloaded with a safe slugged filename.
- Ordered steps: authored the two-step boundary case, received wrong-order feedback, moved by keyboard-operable buttons, and completed successfully. The author UI protects the two-step minimum and caps the author at 12 steps.
- Hotspot: attempted an SVG upload and received the recoverable PNG/JPEG/WebP-only error. Authored a sample-image target and completed it by focusing the image control and pressing Enter.
- Import/delete/error recovery: malformed JSON produced a visible error toast; a valid drill whose title was `<img src=x onerror=alert(1)>` rendered literally, created no `img[src="x"]`, and could be confirmation-deleted.
- Empty form submission focused the invalid title control and displayed the validation error.

These checks also confirm the contract’s deterministic feedback, no command execution path, local authoring/export workflow, media restrictions, and text sanitization.

## Accessibility and responsive checks

- `/opt/fleet/lib/verify-url.sh` against the live URL: HTTP 200, title present, `lang="en"`, exactly one `h1`, a `main` landmark, 0 images missing `alt`, 0 unlabeled buttons, and 0 console/page errors. Evidence: `.factory/evidence/verify-2/verify.json`.
- Fresh Playwright axe scans of live desktop and 390 × 844 mobile home pages: **0 serious or critical** findings. Repository axe checks also passed for home, privacy, and populated editor flows.
- Keyboard smoke test: the first Tab focuses the skip link with the designed `rgb(243, 181, 82) solid 3px` ring. Ordered controls and the hotspot crosshair are keyboard-operable.
- At 390 px, `scrollWidth` and `clientWidth` were both **390**. Visual review of desktop and mobile confirmed intentional stacking, no obscured action bar, legible content, and no horizontal overflow.
- With `prefers-reduced-motion: reduce`, the observed transition duration was `0.00001s`; no looping or flashing behavior was found.

## Privacy, security, PWA, and deployment parity

- Live browser capture made runtime requests only to `https://skill-drill-studio.sociobot.in`; no analytics, CDN, font, or other third-party request occurred. Browser console and page-error capture were empty.
- Source and behavior use browser local storage for drills/runs, render authored text escaped, compare commands as strings, and restrict imported/uploaded image forms. No account or remote data API is present.
- Live headers include HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, camera/microphone/geolocation denial, and a same-origin CSP with `connect-src 'self'`.
- PWA desktop offline reload passed in the Playwright suite. The active worker uses the versioned `skill-drill-studio-v2` cache, `skipWaiting`, stale-cache deletion, and `clients.claim`; `/sw.js` is served revalidating so an updated worker is discoverable.
- Live `index.html`, `assets/index-FmtXtAii.js`, and `assets/index-DKb9jCgy.css` SHA-256 values exactly match the candidate build. The live asset names are the build names, establishing that the deployed app matches this candidate.
- The prior deployment-only failure is resolved: live JS/CSS return `Cache-Control: public, max-age=31536000, immutable`; `/` and `/sw.js` return `Cache-Control: public, max-age=0, must-revalidate`.

## Budget evidence

- Initial JS: **30,812 B** / **10,830 B gzip** (budget: 200 KB).
- CSS: **20,109 B** / **5,350 B gzip** (budget: 50 KB).
- Self-hosted fonts: **102,036 B** total (budget: 120 KB).
- Mobile hero: **28,296 B**; largest hero source: **64,572 B** (budget: 300 KB).

## Defects by severity

None found. No release-blocking, high, medium, or low defects were observed in the tested scope.

## Reproduce

```sh
npm ci
npm test
npm run build
npx playwright install chromium
CI=1 npx playwright test --workers=1
CHROME_PATH=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome \
  npx --yes lighthouse https://skill-drill-studio.sociobot.in \
  --quiet --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
  --only-categories=performance,accessibility,seo,best-practices
```
