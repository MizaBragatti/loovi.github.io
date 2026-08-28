import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // sso.loovi.app.br nao envia headers Access-Control-Allow-* (sem CORS habilitado no backend).
      // Em dev, o Vite repassa a requisicao server-to-server (sem CORS) para contornar o bloqueio do browser.
      // Isso NAO resolve producao (loovi.github.io/Firebase Hosting) - so ajuda no `npm run dev` local.
      '/api/sso': {
        target: 'https://sso.loovi.app.br',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/sso/, '/api/auth/otp'),
      },
    },
  },
})
