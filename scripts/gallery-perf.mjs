import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.GALLERY_PLAYWRIGHT;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const url = process.env.GALLERY_URL ?? 'http://127.0.0.1:4174/Portfolio/';
const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-software-rasterizer', '--force-low-power-gpu'],
});
const results = { renderer: null, frames: [] };

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(kind, settings) {
      const options = kind === 'webgl2' ? { ...settings, powerPreference: 'low-power' } : settings;
      return native.call(this, kind, options);
    };
  });
  await page.goto(url);
  await page.locator('.gallery:not([data-graphics="checking"])').waitFor();
  if (await page.locator('.gallery').getAttribute('data-graphics') === 'unavailable') {
    results.error = 'Chromium did not expose a hardware WebGL renderer.';
  } else {
    await page.locator('[data-scene="ready"]').waitFor();
    results.renderer = await page.locator('canvas').evaluate(canvas => {
      const gl = canvas.getContext('webgl2');
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
    });
    for (const id of ['home', 'experience', 'projects', 'skills', 'research', 'education', 'contact']) {
      await page.goto(new URL(id === 'home' ? '' : `${id}/`, url).href);
      await page.locator(`[data-station="${id}"]`).waitFor();
      await page.waitForTimeout(700);
      const sample = await page.evaluate(() => new Promise(resolve => {
        const intervals = [];
        let start;
        let last;
        function measure(time) {
          if (start === undefined) start = time;
          if (last !== undefined) intervals.push(time - last);
          last = time;
          if (time - start >= 3300) {
            const sorted = [...intervals].sort((a, b) => a - b);
            resolve({
              fps: Math.round(intervals.length / (time - start) * 10000) / 10,
              p95Ms: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10,
            });
          } else {
            requestAnimationFrame(measure);
          }
        }
        requestAnimationFrame(measure);
      }));
      results.frames.push({ chapter: id, ...sample });
    }
  }
} catch (error) {
  results.error = error.message;
} finally {
  await browser.close();
  await mkdir('docs/screens', { recursive: true });
  await writeFile('docs/screens/hardware-report.json', JSON.stringify(results, null, 2) + '\n');
  console.log(results);
}
