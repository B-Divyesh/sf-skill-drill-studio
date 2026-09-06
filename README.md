# Skill Drill Studio

Create short browser practice drills for teachers, instructors, and self-learners. The studio supports three formats:

- ordered steps for a process;
- exact command input for commands, formulas, shortcuts, or syntax;
- image hotspots for finding a control, region, tool, or component.

Each answer gets clear, repeatable feedback. Command answers are compared as text and never run.

## Try the demo

Open <https://skill-drill-studio.sociobot.in/demo> or select **Try it with sample data** on the first screen.

The demo contains one realistic drill of each format and two earlier command runs. Its banner stays visible while you practise or edit. **Reset demo** restores the samples. **Start for real** removes the `demo:` storage keys and returns to your separate saved drills.

## Use the studio

1. Choose a drill format.
2. Add a title, instructions, and the correct answer.
3. Select **Save and test** and complete the learner view.
4. Select **Export JSON** to download a portable drill file.
5. Use **Import JSON** in another browser workspace to add that drill.

All three drill formats can be completed with a keyboard. Hotspot uploads accept PNG, JPEG, or WebP files up to 2 MB. Other formats and larger files are rejected.

## Run locally

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The app is free to use and needs no account.

## Test and build

Playwright 1.58.2 is pinned because its Chromium build is available in the factory worker.

```sh
npm ci
npx playwright install chromium
npm test
npm run test:e2e
npm run build
```

`npm test` runs unit checks, generated-artifact checks, and every declared browser claim in [`.factory/claims.json`](.factory/claims.json). Each claim can also run alone with its documented command.

`npm run build` type-checks the source and writes the deployable site to `dist/`. Azure Static Web Apps settings are in `public/staticwebapp.config.json`.

## Storage, privacy, and offline use

Real drills and practice history use `skill-drill-*` local storage keys. Demo state uses only `demo:skill-drill-*` keys. Drills, uploaded images, and practice history stay in the browser until you export a file.

The app uses no analytics, ads, or tracking tools. It loads fonts and images from the product origin. The app reloads offline after the first online visit.

See [/privacy](https://skill-drill-studio.sociobot.in/privacy) and [/terms](https://skill-drill-studio.sociobot.in/terms) for the public policies.

## Product scope

This tool does not run commands, create student profiles, generate questions, or replace an LMS. JSON export and import provide classroom sharing without an account.

The design system and asset provenance are in [`.factory/design.md`](.factory/design.md). Release verification and known gaps are in [`.factory/handoff.md`](.factory/handoff.md).

## License

MIT © 2026 Sociobot (Param Factory).
