/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  test: {
    // jsdom so stores, hooks and components are testable — several of them
    // touch localStorage or the DOM.
    environment: 'jsdom',
  },
})
