import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const modulePath = process.env.GALLERY_PLAYWRIGHT;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const [tag = 'gallery', selection = 'all'] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/i.test(tag)) throw new Error('Use a simple screenshot run name.');
const output = resolve('docs/screens', tag);
await mkdir(output, { recursive: true });
const galleryURL = process.env.GALLERY_URL ?? 'http://127.0.0.1:4174/Portfolio/';
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const viewports = [[1920,1080], [1440,900], [1280,720], [390,844]]
  .filter(([width]) => !process.env.GALLERY_WIDTH || String(width) === process.env.GALLERY_WIDTH);
if (!viewports.length) throw new Error('GALLERY_WIDTH must be one of the four configured viewport widths.');
const chapters = ['start', 'home', 'experience', 'projects', 'skills', 'research', 'education', 'contact'];
const errors = [];
const browser = await chromium.launch({ args });

try {
  for (const [width, height] of viewports) {
    const page = await browser.newPage({
      viewport: { width, height }, deviceScaleFactor: 1,
      isMobile: width < 500, hasTouch: width < 500,
    });
    const protocol = await page.context().newCDPSession(page);
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window);
      let held = false;
      let pending = [];
      window.requestAnimationFrame = (callback) => request((time) => {
        if (held) pending.push(callback);
        else callback(time);
      });
      window.galleryHoldFrame = (next) => {
        held = next;
        if (!held) {
          const callbacks = pending;
          pending = [];
          callbacks.forEach(callback => request(callback));
        }
      };
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
    await page.goto(galleryURL, { waitUntil: 'networkidle' });
    await page.locator('[data-scene="ready"]').waitFor();
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const scenes = selection === 'exhibits' ? ['start', ...await page.locator('[data-stop]').evaluateAll(items => items.map(item => item.id))]
      : selection === 'all' ? chapters : ['start', selection];
    for (const scene of scenes) {
      await page.evaluate(id => {
        const element = document.getElementById(id);
        const top = element ? element.getBoundingClientRect().top + scrollY : 0;
        const midpoint = element ? top + Math.min(element.offsetHeight, innerHeight) / 2 - innerHeight / 2 : 0;
        scrollTo(0, Math.max(0, midpoint));
      }, scene);
      if (width > 880 || scene === 'start' || scene === 'home') {
        const station = width <= 880 || scene === 'start' ? 'home' : scene;
        await page.locator(`[data-station="${station}"]`).waitFor({ timeout: 35000 });
        await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      }
      await page.waitForTimeout(240);
      const file = resolve(output, `${width}x${height}-${scene}.png`);
      await page.evaluate(() => window.galleryHoldFrame(true));
      try {
        const screenshot = await protocol.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        await writeFile(file, Buffer.from(screenshot.data, 'base64'));
      } finally {
        await page.evaluate(() => window.galleryHoldFrame(false));
      }
      console.log(`${width}x${height} ${scene}`);
    }
    if (width === 1440 && selection === 'all') {
      const timeline = page.getByRole('navigation', { name: 'Gallery chapters' }).last();
      await timeline.getByRole('link', { name: 'Home', exact: true }).focus();
      await page.keyboard.press('ArrowDown');
      await page.waitForURL('**/#experience');
      await page.keyboard.press('End');
      await page.waitForURL('**/#contact');
      await page.keyboard.press('Home');
      await page.waitForURL('**/#home');
      await timeline.locator('a[aria-current="location"][href="#home"]').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'home');
    }
    await page.close();
  }
  if (selection === 'all') {
    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await reduced.goto(new URL('#research', galleryURL).href);
    await reduced.locator('.gallery--plain[data-graphics="reduced"]').waitFor();
    assert.equal(await reduced.locator('canvas').count(), 0);
    assert.equal(await reduced.locator('[data-stop]').count(), 16);
    assert.equal(await reduced.getByText('TODO', { exact: true }).count(), 0);
    await reduced.waitForFunction(() => Math.abs(document.getElementById('research').getBoundingClientRect().top) < 3);
    const accessibility = await reduced.locator('main').ariaSnapshot();
    assert.match(accessibility, /Research & publications/);
    assert.match(accessibility, /Multimodal RAG Platform/);
    await writeFile(resolve(output, 'accessibility.yml'), accessibility);
    await reduced.close();

    const noWebGL = await browser.newPage();
    await noWebGL.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return type.startsWith('webgl') ? null : original.call(this, type, ...args);
      };
    });
    await noWebGL.goto(new URL('?fx=0', galleryURL).href);
    await noWebGL.locator('.gallery--plain[data-graphics="unavailable"]').waitFor();
    assert.equal(await noWebGL.locator('[data-stop]').count(), 16);
    await noWebGL.close();
  }
  assert.deepEqual([...new Set(errors)], []);
} finally {
  await browser.close();
  await writeFile(resolve(output, 'console.json'), JSON.stringify([...new Set(errors)], null, 2) + '\n');
}
