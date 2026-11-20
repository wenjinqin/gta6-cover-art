# Neon Coast — Cover Art Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/wenjinqin/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/wenjinqin/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photos into a Vice City-style poster cover, in the browser, offline.

## What it does

- **Any photo:** add up to three photos from your machine (never uploaded).
  Each of the three panels can show any of the three photos, or one photo can
  fill every panel.
- **Crop and position:** click a panel on the live preview to select it, drag
  to pan the photo inside it, and use the zoom slider to frame it.
- **Multi-panel poster look:** two layouts — **Hero** (one big panel plus two
  small ones) and **Triptych** (three equal panels) — with a bold caption band
  along the foot.
- **Bold caption lettering:** an editable main caption and sub-caption, in
  three styles — Block, Neon Sign, and Sunset Stripe — drawn with system fonts
  only (no font files shipped, no Rockstar artwork, logo, or font anywhere).
- **Sunset / neon colour grade:** four grades — Vice Sunset, Neon Night, Teal
  Dawn, Mono Noir — washed over every panel with a vignette.
- **Fast and easy:** pick photos, type a caption, export. Three post sizes:
  Square 1080 × 1080, Portrait 1080 × 1350, Wide 1920 × 1080, exported as PNG.

## Try it

```sh
node serve.ts   # then open http://localhost:8080
```

`app/` is plain static files — serve it with any static server, or open
`app/index.html` from one. It makes no network requests at runtime.

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor styling
- `app/src/main.js` — wiring: photo slots, panel selection, pan/zoom, export
- `app/src/cover.js` — the cover renderer (layouts, grades, caption band)
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor`, `?shot=cover`)
- `app/samples/` — two sample photos made with an image model for make.fun,
  free to use (used by the screenshot scenes)
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored library
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged

## Screenshots

- `1-cover.jpg` — a wide cover the app drew (1920 × 1080, shown at 1280 × 720)
- `2-editor.jpg` — the editor in a browser with sample photos loaded
- `3-cover-portrait.jpg` — a portrait cover (1080 × 1350, shown at 1024 × 1280)
- `4-cover-square.jpg` — a square cover (1080 × 1080, shown at 1024 × 1024)

## License

MIT — see `LICENSE`. Original work; no Rockstar Games logo, wordmark,
artwork, character, or font is used.

---

<sub>Entered on [make.fun](https://make.fun/?ref=d5a50dzy&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
