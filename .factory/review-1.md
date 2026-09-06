# Review 1 — Create short browser drills

## Result: FAIL

**Job:** Turn a small procedural skill into an ordered-step, exact-command, or image-hotspot browser drill with deterministic feedback and a portable JSON file.

**Audience:** Teachers, bootcamp instructors, and self-learners who need short repeatable practice.

**First action before scrolling:** The page offers **Make your first drill**. It only scrolls to the format cards. **Try a 30-second drill** opens a starter command drill, but it is not the required one-click demo sandbox.

**Implementation reviewed:** `3630d9265fc9b554f5c77fe21063751a9d76225f` (`fix: cache fingerprinted bundles immutably`)

**Documentation SHA:** `7041864716b035220d4a300f67c146908f4730e7`

**Live URL:** https://skill-drill-studio.sociobot.in

The live HTML, JS, and CSS byte-match a clean build of the reviewed implementation. Later commits are verification/report changes (plus a generated-artifact test adjustment) and do not change the shipped application bundle.

There are **6 findings** and **10 untested public claims**. This is not a release PASS.

## Findings

### 1. High — the required one-click demo sandbox is absent and the sample changes ordinary data

There is no `.factory/demo.md`, no `/demo` behavior, no `?demo=1` behavior, no persistent `Demo — sample data, nothing is saved` label, no **Reset demo**, and no **Start for real** control. Fresh live `/demo` returns the ordinary landing page.

On a fresh live browser, **Try a 30-second drill** opened the starter command drill. Completing it wrote this ordinary storage key:

```
skill-drill-runs
```

It did not use a `demo:` namespace. This fails the demo-sandbox contract: the sample path must be directly linkable, visibly labelled, resettable, and unable to read or write real data.

**Repair:** Implement `/demo` or `?demo=1`, seed all three realistic drill formats there, use a separate `demo:` storage namespace, show the persistent banner and both controls, and document the behavior in `.factory/demo.md`. Add sandbox tests that prove sample completion does not alter ordinary local storage.

### 2. High — `.factory/claims.json` and required claim tests are missing

No `.factory/claims.json` exists. There are no `@claim:<id>` tests and therefore no declared claim commands to run. Existing unit and Playwright tests do not meet the contract because they are neither mapped to public copy nor run from the required demo entry point.

The following public claims are untested under the claims contract:

| # | Claim | Where |
|---|---|---|
| 1 | Immediate deterministic feedback | landing first screen |
| 2 | No accounts | landing first screen and product promises |
| 3 | Learner commands are never executed | landing, editor, player, README |
| 4 | Everything stays in the browser until export | landing first screen |
| 5 | Portable JSON sharing | landing and README |
| 6 | Keyboard, touch, and screen-reader paths | landing promise |
| 7 | No tracking | footer and privacy page |
| 8 | Drills, images, and history stay in the browser | README and privacy page |
| 9 | PNG/JPEG/WebP and size restrictions are enforced | README and editor |
| 10 | Offline return visits work | README |

**Repair:** Add one claims entry and one clean-demo test command for each claim. Record the observable outcome, including request capture for privacy and an isolated offline browser context for offline reload. Remove any claim that cannot be tested.

### 3. Medium — the first screen does not state the job and audience in plain words

The visible `h1`, **Build the path. Then walk it.**, is a metaphor rather than the job. The first screen does not name teachers, instructors, or self-learners. It also provides one privacy fact rather than the required three plain facts, and its primary action only scrolls rather than saying what will be created next. The later headings and labels repeat the same trail/route metaphor.

**Repair:** Use a job-based headline such as “Create short practice drills”, name the intended authors in the supporting sentence, make the primary action direct to the right next state, and place three tested plain facts beside it. Remove metaphor-only headings and labels from the landing and supporting UI. Add the required `.factory/copy-audit.md` with sentence counts and terminology table.

### 4. Medium — invalid authoring does not return focus to the invalid field

On the live command-drill editor, selecting **Save & test** with required fields blank displays `This is not a valid Skill Drill Studio file.` but leaves `document.activeElement` without an input id. The first invalid field is not focused. This makes the recovery path harder for keyboard and screen-reader users.

The code uses `document.querySelector(':invalid')`, which can select the invalid form rather than a focusable control.

**Repair:** Select a focusable invalid input or textarea (for example, `input:invalid, textarea:invalid, select:invalid`) and add a test that asserts the focused field and announced error after a blank submission.

### 5. Medium — there is no designed 404 page

Fresh live `/404` returns HTTP 200 and the normal landing page, rather than a designed not-found page with a way home. The source configuration has no 404 response override and no `404.html`.

**Repair:** Add the product-specific 404 page and the Static Web Apps `responseOverrides` rewrite required by the site-structure contract. Test that an unknown URL shows the not-found heading and home link.

### 6. Medium — required route metadata is incomplete

`index.html` lacks a canonical link, Open Graph title/description/image, Twitter card metadata, and the required 180 px Apple touch icon. The landing, privacy, and terms route titles do update correctly, but metadata does not meet the required route/site structure.

**Repair:** Add the missing local metadata assets and per-route metadata updates. The social image must be a real 1200×630 product asset.

## Verification completed

- Fresh desktop and 390×844 phone browser contexts loaded the live page without console or page errors. Both had one `h1`, `lang="en"`, a `main` landmark, labelled controls, no horizontal overflow, and same-origin runtime requests only.
- `/opt/fleet/lib/verify-url.sh https://skill-drill-studio.sociobot.in <evidence-dir>` passed: HTTP 200, title, language, one h1, main, image alt text, and no browser errors.
- Fresh live Axe Playwright scans found zero serious or critical violations on `/`, `/privacy`, `/terms`, `/demo`, and `/404`. `/demo` and `/404` are structurally wrong despite passing generic Axe checks.
- Normal and recovery checks passed for starter command wrong-answer recovery, command completion, keyboard hotspot completion, malformed JSON import feedback, SVG upload rejection, and the ordered-drill 2-step minimum / 12-step maximum. The blank-authoring focus recovery failed as described above.
- All landing-page links returned HTTP 200, including Privacy, Terms, and Source.
- Live response headers retain the previously repaired cache policy: fingerprinted JS/CSS return `Cache-Control: public, max-age=31536000, immutable`; HTML returns `public, max-age=0, must-revalidate`.
- A clean clone at documentation SHA completed `npm ci` with 0 audit vulnerabilities, `npm test` (5/5), and `npm run build` (`dist/` produced). `CI=1 npx playwright test --workers=1` initially could not find Playwright Chromium after `npm ci`; after the README-documented `npx playwright install chromium`, `CI=1 npm run test:e2e` passed 6 tests with 2 intentional project skips.
- The clean implementation build and live `index.html`, JS, and CSS have identical SHA-256 values.

## Earlier findings and statements

| Earlier item | Current disposition |
|---|---|
| Verification 1 high: fingerprinted assets were not immutable | Resolved. Live hashed JS/CSS use the required immutable one-year cache header. |
| Verification 2: live asset/build parity | Confirmed again by matching SHA-256 values. |
| Verification 2: no console errors, Axe serious/critical findings, keyboard hotspot, mobile layout, privacy request capture, offline test | Confirmed within the checks listed above; the pre-existing local offline Playwright test passed after Chromium installation. |
| Verification 2 and handoff: invalid form focus recovery passed | Refuted. Fresh live blank submission did not focus an invalid control. |
| Verification 2 and handoff: no defects / PASS | Superseded by this review. The demo-sandbox and claims contracts were not met, and current runtime checks found the invalid-focus defect. |

## Required next verification

After repair, run every command listed in `.factory/claims.json` from a fresh demo context, then `npm test`, `npm run build`, and `npm run test:e2e` after the documented Chromium prerequisite. Recheck `/demo`, reset/start-real isolation, invalid-field focus, all metadata, and the HTTP 404 page on the live deployment.
