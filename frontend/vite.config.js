import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 3001,      //frontend
    proxy: {
      "/api": {
        // target: "http://localhost:4002",     //backend
        target: "https://chatapp-backend-fauk.onrender.com",
        changeOrigin: true,
      },
    },
  },
})

