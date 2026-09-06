# Demo sandbox

## Entry point

Open `https://skill-drill-studio.sociobot.in/demo`. Local verification uses `http://127.0.0.1:4173/demo`. The query form `/?demo=1` also enters the same sandbox.

The first demo screen contains three ready-made drills:

- **Prepare a microscope slide** — an ordered four-step procedure;
- **Create a project folder** — an exact `mkdir field-notes` command;
- **Find the compass** — an image-hotspot task with an illustrated workbench.

Two earlier command runs are seeded so the next completed run shows a first-to-third comparison.

## Isolation

Demo drills use `demo:skill-drill-library`. Demo practice runs use `demo:skill-drill-runs`. Normal work uses `skill-drill-library` and `skill-drill-runs`. Demo reads and writes never use the normal keys.

The persistent banner reads **Demo — sample data, nothing is saved**. It also explains that saved drills stay separate.

## Reset and exit

**Reset demo** removes both demo keys and restores the three drills and two earlier runs. **Start for real** removes both demo keys, loads the normal storage namespace, and returns to `/`.

The claim suite starts at `/demo` in a fresh browser context and checks this separation.
