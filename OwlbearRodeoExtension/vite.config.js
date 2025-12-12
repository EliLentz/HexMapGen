import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: true
  },
  build: {
    outDir: '../docs'
  },
  base: './'
})
