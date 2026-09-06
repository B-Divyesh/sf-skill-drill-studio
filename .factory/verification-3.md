# Independent verification 3 — FAIL

**Job:** Create short browser practice drills with deterministic feedback and portable JSON sharing.

**Audience:** Teachers, instructors, and self-learners who need repeatable practice.

**First action before scrolling:** **Try it with sample data**. It opens three ready-made drills in a separate demo workspace.

**Candidate implementation:** `884fde10d0b0270b5e2442fc88d0845c9c4d7e9b`

**Documentation baseline:** `e0d3b2330408413d2c322b2b5ed1468425073698`

**Live URL:** <https://skill-drill-studio.sociobot.in>

**Verified:** 2026-09-06 UTC

## Verdict

**FAIL — 1 finding, 0 untested public claims.** The live product, clean checkout, and all declared claim commands otherwise passed. The single finding prevents a PASS under the zero-findings acceptance rule.

## Finding

### Low — the ordered-step upper boundary gives no feedback

An author can add steps until an ordered drill contains 12. At that point **Add a step** remains enabled. Selecting it adds no step, gives no message, and leaves no explanation of the limit. The live check recorded 12 fields before and after the thirteenth selection, `disabled: false`, and an empty form-error region.

This is a boundary/recovery defect. It conflicts with the product interaction requirement that every action give immediate feedback, and it leaves keyboard and screen-reader authors without a way to understand why the action had no result.

**Repair:** Disable the control at 12 steps and expose the limit in its accessible name/description, or keep it enabled and announce a clear “You can add up to 12 steps” message. Add a browser test for the boundary and recovery message.

## Declared claims

From a separate clean checkout at the documentation baseline, after `npm ci` and the documented `npx playwright install chromium`, every command in `.factory/claims.json` passed independently:

| Claim ID | Result |
|---|---|
| deterministic-feedback | PASS |
| free-no-account | PASS |
| commands-not-run | PASS |
| browser-storage | PASS |
| json-sharing | PASS |
| keyboard-drills | PASS |
| no-tracking | PASS |
| image-limits | PASS |
| offline-reload | PASS |
| three-formats | PASS |

There are no missing manifest entries, missing `@claim:` tests, failed claim commands, or untested public claims found in the landing page, product copy, README, privacy page, or terms.

## Quality gates

- `npm ci`: passed; 59 packages installed, 0 audit vulnerabilities.
- `npm test`: passed: 5 unit tests, generated-artifact cache-policy test, and 10 claim tests.
- `npm run build`: passed and produced `dist/index.html`; build assets were 38.32 KB JS (12.43 KB gzip) and 25.11 KB CSS (6.24 KB gzip).
- `npm run test:e2e -- --workers=1`: 13 passed, 3 intentional desktop/mobile project skips.
- Live candidate parity: SHA-256 matched for `index.html`, `index-DXl3iPVi.js`, and `index-BSe7zQWP.css`. Live JS and CSS have `Cache-Control: public, max-age=31536000, immutable`.

## Live browser and route checks

- Fresh desktop: the first screen states the job, audience, action, and three facts. The one-click demo contained three realistic drill formats and two seeded runs.
- The persistent **Demo — sample data, nothing is saved** label was present during practice. Wrong and correct command feedback appeared; **Reset demo** restored two runs; **Start for real** removed the `demo:` keys and preserved a real-storage sentinel.
- Fresh 390 × 844 phone: landing and demo loaded without horizontal overflow (`scrollWidth = clientWidth = 390`). Screenshots were reviewed.
- No console errors, page errors, or external runtime requests occurred in the completed desktop demo flow. Live Axe scans on home and demo reported 0 serious or critical findings.
- The factory URL verifier passed: HTTP 200, title, `lang=en`, one h1, one main landmark, no missing image alt text, no unnamed buttons, and no browser errors (591 ms load).
- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with correct titles, h1s, canonical URLs, and one main landmark. An unknown URL returned the dedicated designed page with HTTP 404, title `Page not found — Skill Drill Studio`, and a route back home. Its HTTP HEAD response also returned 404.
- All discovered product links returned 200 except the deliberate current-404 page’s skip-link target, which correctly returned 404. The external source link returned 200.
- Keyboard skip-link focus, reduced-motion behavior, blank-form focus recovery, JSON-import recovery, keyboard drill paths, and offline reload were covered by the clean browser suites. The live boundary check produced the finding above.

## Earlier review and verification disposition

| Earlier item | Current disposition |
|---|---|
| Immutable fingerprinted asset caching | Resolved and reconfirmed live. |
| Isolated one-click demo and reset/exit behavior | Resolved and reconfirmed live on desktop and phone. |
| Claims manifest and outcome tests | Resolved; all ten commands passed individually. |
| Plain first screen and copy audit | Resolved; the live first screen plainly states job, audience, and first action. |
| Blank authoring focus recovery | Resolved; the title field receives focus with an announced error. |
| Designed HTTP 404 and route metadata | Resolved and reconfirmed live. |
| Prior functional, privacy, accessibility, mobile, and offline checks | Reconfirmed, except for the newly found silent 12-step boundary. |

## Evidence

Live evidence is in `/work/.evidence/`: `live-check.json`, desktop and phone screenshots, `verify-3/verify.json`, and this copied QA report. The implementation and current live assets match; later documentation-only changes do not alter the reviewed product image.
