# Obsidian Gallery review

## Visual checks

Playwright runs on Vite preview at `/Portfolio/`. It captures the opening and chapter midpoints at 1920×1080, 1440×900, 1280×720 and 390×844 with Chromium and SwiftShader. The original 1440×900 exhibit sweep also covers all six jobs and all five projects. Captures, contact sheets, the accessibility tree and console logs stay under the ignored `docs/screens/` directory.

| Review | What needed attention | Change |
| --- | --- | --- |
| 04 | The previous exhibit could intrude into the next composition. The unlit opening yielded a black frame. | Isolated the active fixture and started the camera independently of HDR loading. |
| 05 | Neighboring objects still showed through at rest. The mobile instrument overlaid the hero copy and controls. | Removed neighboring lights and meshes from the stationary shot, then moved the compact instrument below the introduction. |
| 06 | Startup lighting varied between consecutive shots. Research objects competed for the same foreground space. | Synchronized the reveal with studio lighting, separated the waveform and paper steles, and created a lightweight still for startup and fallback. |
| 07 | A settled camera marker could precede the appearance of the target fixture. | Required the selected fixture and a settled camera before capture. Added labelled chapter regions for assistive navigation. |
| 08 | The fallback check could land on the transient loading mode. The individual exhibit sweep also showed that empty job stacks resembled placeholder logos. | Added an explicit WebGL capability check and explicit fallback assertions. Used an unbranded physical object for jobs with an empty stack and refined the avatar and search exhibits. |
| Cinematic pass | The gallery lacked an architectural backdrop. The first arch render extended too far above the frame, and the floor competed with the models. | Added a softly lit vault, a camera approach and editorial caption reveals. Tightened the vault framing, darkened the plinth and floor, and brought the teal reticle forward on the hero lens. |

Keyboard checks cover arrow navigation, Home, End and Escape on the timeline. The HTML path is exercised with simulated WebGL failure and reduced motion. The accessibility-tree snapshot verifies section titles and representative source content. A live assistive-technology session was outside this test setup.

The higher graphics tier adds glass transmission, a reflector, ambient occlusion, and hero-only depth of field. Integrated and software rendering use simpler materials and lighting. In Chromium at 1920×1080 and device pixel ratio 1, Intel Iris Xe measured 53.2–58.4 fps across the seven chapters after tuning. The hero improved from 14.7 to 56.5 fps. This machine fell short of the 60 fps target. The timing script writes `docs/screens/hardware-report.json`.

The production build loads 94.82 kB of gzip-compressed initial JavaScript before requesting the 3D scene.

## Files changed

- `index.html`, `vite.config.js`, `package.json` and `package-lock.json` establish the Vite entry, base path, local metadata assets, and lazy bundles.
- `src/gallery.jsx`, `src/chapters/`, `src/ui/gallery/`, `src/lib/gallery.js`, `src/lib/icons.js`, and `src/styles/gallery.css` provide the semantic captions, keyboard timeline and responsive composition. The gallery added interface labels to `src/content.json`.
- `src/scene/gallery/`, `src/scene/Glyph.jsx`, `src/scene/Parts.jsx`, and `src/scene/visuals.jsx` provide the scroll camera, lighting, models and glyph materials.
- `public/hdr/` and `public/gallery-*.{png,webp}` contain the bundled studio map, icon, social preview and still.
- `scripts/gallery-qa.mjs`, `scripts/gallery-perf.mjs`, `README.md`, `CREDITS.md`, and `docs/PLAN.md` document and reproduce the build and checks.

The chapter views share a renderer and content flow and were committed together rather than as seven separate chapter commits. Prior working-copy files were kept, and the deployment workflow was excluded from the gallery commits.

## Remaining content

Project URL placeholders remain for Multimodal RAG Platform, Hotel Booking RAG Q&A, Multi-Agent System, Stock Price Prediction and AI Avatar Conversation Pipeline. Both publication URL fields are also placeholders. The blank experience locations for Hex N Bit and Gauravgo Technologies remain optional, as does the unused profile-photo field. The loader hides placeholder values.
