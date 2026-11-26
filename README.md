# Sneha Jha · 3D portfolio

A developer portfolio with a full-screen 3D entrance and individual exhibit rooms, built with Vite, React, and React Three Fiber. The static build generates an HTML entry for each room under the `/Portfolio/` base path. Gallery work belongs on `dev`.

## Run on Windows PowerShell

Use Node.js 24 LTS, or another Node.js version supported by Vite 8.

```powershell
npm ci
npm run dev
```

Open [the development site](http://localhost:5173/Portfolio/). To check the production output:

```powershell
npm run lint
npm run build
npx vite preview --host 127.0.0.1 --port 4174
```

Open [the static preview](http://127.0.0.1:4174/Portfolio/). The build writes `dist/`. Add `?fx=0` to disable post-processing while checking shaders and composition. Room scenes play behind the captions on desktop and phones. Reduced-motion and WebGL-failure modes keep every room accessible with its own HTML and navigation.

## Edit the portfolio

Edit `src/content.json`. The loader in `src/lib/content.js` removes values exactly equal to `"TODO"`. It also supplies navigation labels. Add links or locations only when you want them to appear. Current placeholders include the profile photo, two experience locations, five project URLs, and two publication URLs. Technologies appear as text even if Simple Icons has no matching brand glyph.

The [camera and lighting plan](docs/PLAN.md) describes the exhibits. [Asset credits](CREDITS.md) list the HDRI, font families, and icon source.

## Check gallery framing

With Vite preview running on port 4174, run:

```powershell
npm install --no-save playwright
npx playwright install chromium
node scripts/gallery-qa.mjs review all
```

The script captures the entrance and each chapter’s first room at the configured sizes. Use `exhibits` in place of `all` to capture each individual job and project. Images and console diagnostics go to the ignored `docs/screens/` directory.

The [review notes](docs/QA.md) record the visual revisions, changed files, and content placeholders. For a hardware-only 1080p timing sample, run `node scripts/gallery-perf.mjs` while the preview is running.
