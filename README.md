# Skill Drill Studio

Skill Drill Studio is a no-account authoring tool for small procedural skills. Teachers, bootcamp instructors, and self-learners can build three kinds of deterministic browser drill:

- ordered steps for sequences and processes;
- exact command input for commands, formulas, shortcuts, or syntax;
- image hotspots for identifying a control, region, tool, or component.

Authors test each drill in the same learner view, then export a portable `.skill-drill.json` file. Drills, uploaded images, and practice history stay in the browser unless the user explicitly exports a file. Learner-entered commands are compared as text and are never executed.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
```

`npm run build` is the deployment command. It type-checks the source and writes the static site to `dist/`, with `dist/index.html` at its root. The Playwright suite starts a production preview automatically and checks desktop plus a 390 px mobile viewport. If Chromium is not installed for Playwright, run `npx playwright install chromium` once.

## Use the studio

1. Choose a drill format.
2. Add a title, instructions, and the deterministic answer key.
3. Select **Save & test** and complete the drill as a learner.
4. Select **Export drill** to download the JSON file. Another learner can use **Import JSON** to add it to their browser.

Uploaded hotspot images must be PNG, JPEG, or WebP and smaller than 2 MB. Import validation rejects unsupported schemas and active SVG/HTML media.

## Privacy and deployment

There are no runtime dependencies, third-party scripts, analytics, accounts, or payment services. Fonts and images are self-hosted. A small service worker caches the app shell and previously fetched assets for offline return visits. Azure Static Web Apps routing and security headers are configured in `public/staticwebapp.config.json`.

The production URL is <https://skill-drill-studio.sociobot.in>. See [`.factory/design.md`](.factory/design.md) for the visual system and asset provenance, and [`.factory/handoff.md`](.factory/handoff.md) for verification details.

## License

MIT © 2026 Sociobot (Param Factory).
