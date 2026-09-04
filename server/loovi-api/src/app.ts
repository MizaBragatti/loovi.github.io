import express from 'express'
import cors from 'cors'
import { pinoHttp } from 'pino-http'
import { router } from './routes/index.js'
import { notFound } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { requireAuth } from './middlewares/auth.js'
import { logger } from './lib/logger.js'

// Mesmas origens liberadas no proxy legado (server/proxy-server.js) - o
// frontend chama esta API diretamente do navegador, então precisa de CORS.
const ALLOWED_ORIGINS = [
  'https://sistema-de-seguros-loovi.web.app',
  'https://sistema-de-seguros-loovi.firebaseapp.com',
  'https://loovi.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: ALLOWED_ORIGINS,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  app.use(express.json())
  app.use(pinoHttp({ logger }))

  app.use(requireAuth)
  app.use(router)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
