import { executarIngestaoContratos } from '../services/ingestao.service.js'
import { logger } from '../lib/logger.js'

executarIngestaoContratos()
  .then((resumo) => {
    logger.info(resumo, 'Carga finalizada')
    process.exit(0)
  })
  .catch((err) => {
    logger.error({ err }, 'Carga falhou')
    process.exit(1)
  })
