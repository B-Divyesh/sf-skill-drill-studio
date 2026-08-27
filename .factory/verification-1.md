# Independent verification 1 — FAIL

**Candidate:** `bf9faa474440ac78f8b86222ecab7535f4cfe45d`  
**Live URL:** https://skill-drill-studio.sociobot.in  
**Verified:** 2026-08-27 UTC  
**Scope:** clean install/build, automated and independent browser QA, deployment parity, privacy/security headers, performance, accessibility, offline behavior.

## Result

**FAIL.** The product works end to end and the published files exactly match the candidate, but the live deployment violates the required cache policy for fingerprinted static assets. This is a deployment/configuration defect, not a source-build failure.

## Release-blocking defect

### High — hashed static assets are not long-lived immutable cached

The acceptance contract requires long-lived immutable caching for hashed assets. The live response headers on 2026-08-27 for both built assets were:

```
/assets/index-FmtXtAii.js  Cache-Control: public, must-revalidate, max-age=30
/assets/index-DKb9jCgy.css Cache-Control: public, must-revalidate, max-age=30
```

Both filenames are content-hashed. A 30-second revalidating cache is not long-lived or immutable, so it defeats the required CDN/browser caching policy and fails the static-web performance contract. `public/staticwebapp.config.json` supplies security headers but no route-level cache policy. Configure the deployer/SWA to return a long-lived immutable policy (for example, `public, max-age=31536000, immutable`) for `/assets/index-*.js` and `/assets/index-*.css` (and other fingerprinted build assets), while keeping HTML and `sw.js` short-lived.

## Evidence that passed

### Clean checkout and quality gates

- Created an independent clean clone, checked out the exact candidate, and ran `npm ci`: 58 packages installed; `npm audit` reported 0 vulnerabilities.
- `npm test`: **5/5 passed**.
- `npm run build`: **passed** (`tsc --noEmit && vite build`); generated `dist/`.
- No separate lint script exists. Type checking is part of the required production build.
- After installing the repository-declared Playwright Chromium binary, `npm run test:e2e`: **6 passed, 2 skipped**. The skips are the suite's intentional cross-project skips (desktop-only offline check and mobile-only viewport check), not failures.
- Lighthouse on the production build preview, mobile defaults, with full-page screenshot collection disabled to avoid an environment-only Chrome screenshot crash: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP **1.1 s**, LCP **2.0 s**, TBT **30 ms**, CLS **0**.

### Independent functional QA

- Author-to-practice flows passed for all contract drill types:
  - ordered steps: blank submission error, wrong-order deterministic feedback, button-based recovery, successful completion;
  - exact command: wrong answer feedback and recovery; case-insensitive option accepted `ping` for authored `PING`;
  - image hotspot: keyboard focus, wrong Enter feedback, Arrow-key positioning, and successful completion.
- Invalid JSON import showed a recoverable error. A valid imported title containing `<img src=x onerror=alert(1)>` rendered as text; no `img[src="x"]` was created.
- Browser request capture found **no outbound runtime requests**. Console and page-error capture were empty.
- Local storage is used for authored drills/runs; commands are compared as text. The CSP permits only same-origin connections/scripts and local data/blob images.

### Accessibility, responsiveness, and PWA behavior

- Axe serious/critical findings: **0** on home, privacy, editor, and independent populated shelf scans (desktop and mobile coverage from the repository suite).
- Keyboard smoke test passed: skip link receives focus; computed focus indicator is `rgb(243, 181, 82) solid 3px`; ordered and hotspot controls worked with keyboard.
- At 390 × 844, `scrollWidth` = `clientWidth` = **390** (no horizontal overflow).
- With `prefers-reduced-motion: reduce`, measured transition/animation durations were `0.00001s`.
- The desktop offline reload Playwright check passed. The service worker has a versioned cache (`skill-drill-studio-v2`), `skipWaiting`, stale-cache deletion, and `clients.claim`, which supplies the intended update path.

### Production parity, policy, and budgets

- SHA-256 values of live and local production output matched exactly for `index.html`, `assets/index-FmtXtAii.js`, `assets/index-DKb9jCgy.css`, `sw.js`, and both generated WebP hero images.
- Live `/`, `/privacy`, `/terms`, `/studio`, and `/play` return HTTP 200 with the SPA shell.
- Live response policy passed: HTTPS/HSTS, `nosniff`, CSP (`default-src 'self'`; `connect-src 'self'`; no third-party scripts), referrer policy, and camera/microphone/geolocation denial were present.
- Budgets passed: initial JS **30,812 B** (**10,798 B gzip**) below 200 KB; CSS **20,109 B** (**5,374 B gzip**) below 50 KB; fonts **102,036 B** below 120 KB; largest hero image **64,572 B** below 300 KB.

## Retest

After fixing deployed asset cache headers, rerun the header check below and then this verification should be eligible for PASS:

```sh
curl -sSI https://skill-drill-studio.sociobot.in/assets/index-FmtXtAii.js
curl -sSI https://skill-drill-studio.sociobot.in/assets/index-DKb9jCgy.css
```

Each fingerprinted asset must return a long-lived `Cache-Control` with `immutable`.
