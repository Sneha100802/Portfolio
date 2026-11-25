import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { roomLabel, roomSlug, stops } from './src/lib/gallery.js'
import { content } from './src/lib/content.js'

const htmlEscape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

function staticRooms() {
  return {
    name: 'gallery-static-rooms',
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const html = bundle['index.html']
        if (html?.type !== 'asset') this.error('Gallery HTML entry is missing')
        for (const stop of stops.slice(1)) {
          const slug = roomSlug(stop)
          const title = htmlEscape(`${roomLabel(stop)} | ${content.meta.name}`)
          const source = String(html.source)
            .replace(/(<title>)[^<]*(<\/title>)/, (_, start, end) => `${start}${title}${end}`)
            .replace(/(<meta property="og:title" content=")[^"]*(")/, (_, start, end) => `${start}${title}${end}`)
            .replace(/((?:rel="canonical" href|property="og:url" content)=")([^"]+)"/g, (_, attribute, url) => `${attribute}${new URL(slug, url).href}"`)
          this.emitFile({ type: 'asset', fileName: `${slug}index.html`, source })
        }
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), staticRooms()],
  base: '/Portfolio/',
  css: { postcss: { plugins: [] } },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-core', test: /[\\/]three[\\/]build[\\/]three\.core\.js$/, includeDependenciesRecursively: false },
            { name: 'three-renderer', test: /[\\/]three[\\/]build[\\/]three\.module\.js$/, includeDependenciesRecursively: false },
            { name: 'gallery-effects', test: /[\\/]postprocessing[\\/]/, includeDependenciesRecursively: false },
            { name: 'gallery-geometry', test: /[\\/]three-stdlib[\\/]/, includeDependenciesRecursively: false },
          ],
        },
      },
    },
  },
})
