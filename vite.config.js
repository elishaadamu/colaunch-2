import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, __dirname, ''),
    ...loadEnv(mode, process.cwd(), ''),
  }
  const backendTarget = env.VITE_BACKEND_URL || env.VITE_API_URL || 'https://creator-forge-backend-jj1y.onrender.com'

  return {
    plugins: [react()],
    server: {
      port: 3002,
      strictPort: false,
      open: true,

      proxy: {
        // Google Gemini — text generation
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/gemini/, ''),
        },
        // OpenAI — text and image generation
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/openai/, ''),
        },
        // Anthropic — Claude text generation
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/anthropic/, ''),
        },
        // Together.ai — free FLUX image generation
        '/api/together': {
          target: 'https://api.together.xyz',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/together/, ''),
        },
        // FastAPI backend — CoLaunch ops pipeline (points to Render backend in .env)
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          timeout: 300000,
          proxyTimeout: 300000,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.warn(`[Vite proxy] FastAPI backend not running at ${backendTarget}:`, err.message)
            })
          },
        },
        // Static generated media files (Veo videos, Gemini images)
        '/static': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

