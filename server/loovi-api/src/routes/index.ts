import { Router } from 'express'
import { contratosRouter } from './contratos.routes.js'
import { cargaRouter } from './carga.routes.js'

export const router = Router()

router.use('/contratos', contratosRouter)
router.use('/carga', cargaRouter)
