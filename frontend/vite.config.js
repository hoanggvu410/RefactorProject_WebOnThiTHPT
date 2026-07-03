import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://127.0.0.1:8000",
      "/users": "http://127.0.0.1:8000",
      "/subjects": "http://127.0.0.1:8000",
      "/news": "http://127.0.0.1:8000",
      "/documents": "http://127.0.0.1:8000",
      "/questions": "http://127.0.0.1:8000",
      "/exam": "http://127.0.0.1:8000",
      "/results": "http://127.0.0.1:8000",
      "/v1": "http://127.0.0.1:8000",
      "/static": "http://127.0.0.1:8000",
    }
  }
})
