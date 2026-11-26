# Sneha Jha · Developer Portfolio

An interactive 3D portfolio for Sneha Jha, a Python developer and AI/ML engineer. The gallery presents experience, personal projects, research, and education through individual rooms, with an HTML view for visitors who prefer reduced motion or whose browser cannot render WebGL.

[Published portfolio](https://sneha100802.github.io/Portfolio/)

## Explore the gallery

- Open **Rooms** to jump to any exhibit, start the guided tour, open the printable **Quick view**, or watch the 30-second reel. The reel has landscape and portrait cuts, optional sound, English captions, and a visual description.
- Visit **Projects → Document Retrieval** to run the interactive demo. Pick a fictional request, then play or step through ingestion, masking, retrieval, and citation. The selected excerpt moves between the 3D stations. The answer and its source also appear as readable HTML.
- Use **Light / Dark** to switch themes, **Sound** to enable 3D audio cues, and **Skip opening** to go straight to an exhibit. Each room has its own URL and supports normal browser history.

Professional descriptions and employer names follow the résumé. The exhibit environments, sample records, reference passages, and props are illustrative. The demo runs locally in the browser with keyword ranking over bundled passages. It needs no credentials, API keys, or server.

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open [the development site](http://localhost:5173/Portfolio/). Vite serves the gallery under `/Portfolio/`.

```sh
npm run lint
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

Open [the production preview](http://127.0.0.1:4174/Portfolio/). The build writes `dist/` and generates an HTML entry for each room, plus a printable Quick view. Add `?fx=0` to a local room URL to inspect the scene with post-processing disabled.

## Project structure

| Path | Purpose |
| --- | --- |
| [`src/content.json`](src/content.json) | Portfolio copy, navigation labels, and fictional demo data |
| [`src/gallery.jsx`](src/gallery.jsx) | Room routing, theme, sound, and shared interaction state |
| [`src/scene/gallery/`](src/scene/gallery/) | React Three Fiber sets, camera choreography, lighting, and animated props |
| [`src/ui/gallery/`](src/ui/gallery/) | Accessible room navigation, reel player, and walkthrough controls |
| [`src/lib/ragDemo.js`](src/lib/ragDemo.js) | Client-side masking, keyword ranking, and cited answers |
| [`public/reel/`](public/reel/) | Landscape and portrait MP4s, posters, and captions |

The site uses React, Vite, Three.js, React Three Fiber, and Drei. The content loader omits fields whose value is exactly `TODO`. Review the [asset credits](CREDITS.md) before replacing imagery, fonts, or HDR lighting.

## Check framing locally

With the production preview running on port 4174, install Playwright locally if needed and capture the rooms.

```sh
npm install --no-save playwright
npx playwright install chromium
node scripts/gallery-qa.mjs review exhibits
```

Screenshots and browser diagnostics go to the ignored `docs/screens/` directory. Use `node scripts/gallery-perf.mjs` for a timing sample with a hardware renderer. See the [camera and lighting plan](docs/PLAN.md) and [review notes](docs/QA.md) for more about the gallery.
