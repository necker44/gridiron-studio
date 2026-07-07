import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'gridiron-studio' to your actual GitHub repo name
// if deploying to GitHub Pages (e.g. yourusername.github.io/gridiron-studio)
// If deploying to Vercel, set base to '/'
export default defineConfig({
  plugins: [react()],
  base: '/gridiron-studio/',   // ← change to '/' for Vercel
})
