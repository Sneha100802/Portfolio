import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
const content = JSON.parse(await readFile(new URL('../src/content.json', import.meta.url), 'utf8'));
const exhibits = ['start', 'home', 'experience', ...content.experience.slice(1).map(job => `job-${job.id}`), 'projects',
  ...content.projects.slice(1).map(project => `project-${project.id}`), ...chapters.slice(4)];
function roomURL(id) {
  const path = ['home', 'start'].includes(id) ? '' : id.startsWith('job-') ? `experience/${id.slice(4)}/`
    : id.startsWith('project-') ? `projects/${id.slice(8)}/` : `${id}/`;
  return new URL(path, galleryURL).href;
}
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
    const scenes = selection === 'exhibits' ? exhibits : selection === 'all' ? chapters : ['start', selection];
    for (const scene of scenes) {
      const response = await page.goto(roomURL(scene));
      assert.equal(response.status(), 200);
      const station = scene === 'start' ? 'home' : scene;
      await page.locator(`[data-stop="${station}"]`).waitFor();
      assert.equal(await page.locator('[data-stop]').count(), 1);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      if (width > 880 || scene === 'start' || scene === 'home') {
        await page.locator(`[data-station="${station}"]`).waitFor({ timeout: 35000 });
        await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      } else {
        await page.locator('canvas').waitFor({ timeout: 35000 });
      }
      await page.waitForTimeout(scene === 'start' ? 100 : 1100);
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
      await page.locator('[data-transit]').waitFor();
      await page.waitForURL(roomURL('experience'));
      await page.locator('[data-transit]').waitFor({ state: 'detached' });
      await timeline.getByRole('link', { name: 'Experience', exact: true }).focus();
      await page.keyboard.press('End');
      await page.waitForURL(roomURL('contact'));
      await timeline.getByRole('link', { name: 'Contact', exact: true }).focus();
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'contact');
      await page.goto(roomURL('home'));
      await page.locator('[data-scene="ready"]').waitFor();
      await page.locator('.gallery-hero .entry-link').click();
      await page.locator('[data-transit]').waitFor();
      await page.waitForURL(roomURL('experience'));
      assert.equal(await page.locator('[data-stop]').count(), 1);
      await page.goBack();
      await page.waitForURL(roomURL('home'));
      await page.locator('#home[data-stop]').waitFor();
    }
    await page.close();
  }
  if (selection === 'all') {
    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await reduced.goto(new URL('#research', galleryURL).href);
    await reduced.locator('.gallery--plain[data-graphics="reduced"]').waitFor();
    assert.equal(await reduced.locator('canvas').count(), 0);
    assert.equal(await reduced.locator('[data-stop]').count(), 1);
    assert.equal(await reduced.getByText('TODO', { exact: true }).count(), 0);
    await reduced.waitForURL(roomURL('research'));
    const accessibility = await reduced.locator('main').ariaSnapshot();
    assert.match(accessibility, /Research & publications/);
    await reduced.goto(roomURL('projects'));
    assert.match(await reduced.locator('main').ariaSnapshot(), /Multimodal RAG Platform/);
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
    assert.equal(await noWebGL.locator('[data-stop]').count(), 1);
    await noWebGL.close();
  }
  assert.deepEqual([...new Set(errors)], []);
} finally {
  await browser.close();
  await writeFile(resolve(output, 'console.json'), JSON.stringify([...new Set(errors)], null, 2) + '\n');
}
