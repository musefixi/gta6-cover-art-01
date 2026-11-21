# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/musefixi/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/musefixi/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Panels** is a GTA-style cover art maker that runs entirely in the browser, offline. Load your own photos (or the three bundled sample photos, made with an image model), and Vice Panels deals them across a multi-panel poster collage — five layouts with slanted, ink-keylined panels — then grades the sheet (Vice Sunset, Neon Nights, Golden Hour, Noir, Clean Pop), sets it with bold caption lettering, a subtitle and a corner badge, and exports a finished cover as a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080. Every panel's photo can be repositioned by dragging, zoomed with the scroll wheel or the slider, swapped with a click, and nudged with the arrow keys. Photos are read on your own machine and never uploaded; the lettering is drawn with system fonts and the whole app is original — no game artwork, logos or fonts.

The app is plain static files under `app/` (no build step): `app/src/layouts.js` holds the panel collages, `app/src/grades.js` the colour grades, `app/src/render.js` the canvas composition engine that paints both the live preview and the full-size export, and `app/src/app.js` the editor. `main.ts` is the hand-in program: it copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library in `vendor/`. The screenshots show real covers the app exported and the editor at work.

## Run it

```sh
cd app && python3 -m http.server 8080   # then open http://localhost:8080
# hand the entry in (Node 22+):  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---
<sub>Entered on [make.fun](https://make.fun/?ref=4yp70nzv&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
