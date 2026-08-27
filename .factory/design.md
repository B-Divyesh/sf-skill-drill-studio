# Skill Drill Studio — visual thesis

## Direction: the night workshop

Skill Drill Studio is a cinematic environmental workspace: a quiet field station at blue hour where a learner repeats small, precise actions until a path becomes familiar. It is not a dashboard theme. The interface uses a deep, single-mode nocturnal treatment so authored material feels like the illuminated workbench and controls feel like physical instruments. Amber path lights denote the next action; mineral teal confirms a correct action; coral is reserved for repair.

The hero is an original wide environmental illustration of a cliffside practice observatory. Three stations connected by a lit trail stand for sequence, command, and hotspot drills. The scene explains the product's central idea—make a route, walk it, improve—without pretending that the product simulates code execution.

## Tokens

- `ink-950` `#081214`: page background, explicitly painted for the single-mode direction.
- `ink-900` `#0d1a1c`: raised workspace.
- `ink-800` `#132628`: field surfaces.
- `paper` `#f3eee1`: primary text (13.7:1 on `ink-950`).
- `mist` `#b9c7c2`: supporting text (8.7:1 on `ink-950`).
- `amber` `#f3b552`: primary action and focus (9.3:1 on `ink-950`).
- `amber-ink` `#251808`: text on amber.
- `teal` `#70d6c1`: correct/success, always paired with a check and text.
- `coral` `#ff8c78`: error/repair, always paired with an icon and text.
- `line` `#345054`: dividers and input outlines.

## Type and spacing

Headlines use the self-hosted local serif `Fraunces`, whose variable optical shapes feel editorial and human. Interface and body text use the self-hosted `Atkinson Hyperlegible`, selected for distinct glyph shapes during command entry. Both are subset WOFF2 files and use `font-display: swap`. The scale is 16, 18, 22, 29, 38, 54 px with 1.5 body leading. The spacing rhythm is 4/8 px, with primary gaps of 16, 24, 32, 48, and 72 px. Reading measures stop at 68 characters.

## Interaction grammar

- An amber “trail marker” line and numeric labels describe authoring progress: Choose → Make → Test → Share.
- Inputs are inset work surfaces; buttons are solid tools, never decoration.
- Drill types have hand-authored geometric SVG marks and distinct nouns: Route (ordered steps), Terminal (exact command), and Field map (hotspot).
- Learner feedback always includes words and symbols in addition to color. A mistake reveals one deterministic hint and leaves the learner in control.
- On phones, the atmospheric hero crop recedes, authoring steps stack, and persistent action bars become normal flow so content is never obscured.

## Motion

Panels enter with a 220 ms opacity + 8 px transform and reorderable steps move with 180 ms transforms. Feedback appears from the submitted control's location. No motion loops. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are disabled and state changes are instant opacity swaps.

## Asset plan and provenance

Hero prompt sheet:

- Subject/world: a remote cliffside learning observatory with three small practice stations linked by an illuminated footpath; no people.
- Materials: rain-dark basalt, oxidized copper, warm glass, paper maps, subtle moss.
- Light/lens: cinematic blue-hour atmosphere, warm practical lights, wide 35 mm composition, soft mist and depth; useful dark negative space at left.
- Palette words: midnight spruce, slate teal, parchment, controlled amber, mineral mint.
- Negative list: no text, watermark, logos, brands, people, screens with legible UI, neon cyberpunk, fantasy castle, generic office, gradients.

The raster hero is generated for this product with the factory Azure image deployment (`factory-image`) on 2026-08-27 using the prompt above, then reviewed and converted locally to responsive WebP. It is original generated imagery, disclosed in the footer. Product icons and the hotspot sample are original SVG/CSS geometry authored in-repository under the project's MIT license.

