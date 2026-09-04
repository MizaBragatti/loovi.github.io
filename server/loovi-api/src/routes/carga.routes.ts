import { Router } from 'express'
import { executarIngestaoContratos } from '../services/ingestao.service.js'
import { ok, fail } from '../lib/apiResponse.js'
import { logger } from '../lib/logger.js'

export const cargaRouter = Router()

cargaRouter.post('/contratos', async (_req, res) => {
  try {
    const resumo = await executarIngestaoContratos()
    res.json(ok(resumo, 'Carga concluída.'))
  } catch (err) {
    logger.error({ err }, 'Falha na carga de contratos')
    res.status(502).json(fail('CARGA_FALHOU', 'Não foi possível concluir a carga de contratos.'))
  }
})
