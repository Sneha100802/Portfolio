import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { roomLabel, roomSlug, stops } from './src/lib/gallery.js'
import { content } from './src/lib/content.js'
import { htmlEscape, renderQuickView } from './src/lib/quickViewPage.js'

const portfolioUrl = 'https://sneha100802.github.io/Portfolio/'

function staticRooms() {
  let base
  return {
    name: 'gallery-static-rooms',
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const route = request.url?.split('?')[0]
        if (route !== `${base}quick-view/` && route !== `${base}quick-view`) return next()
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(renderQuickView(base, new URL('quick-view/', portfolioUrl).href))
      })
    },
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
        this.emitFile({
          type: 'asset',
          fileName: 'quick-view/index.html',
          source: renderQuickView(base, new URL('quick-view/', portfolioUrl).href),
        })
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
