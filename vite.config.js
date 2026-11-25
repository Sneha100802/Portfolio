import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
