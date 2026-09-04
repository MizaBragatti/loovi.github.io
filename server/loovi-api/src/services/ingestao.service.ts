import { fetchTodosContratos } from '../integrations/loovi/fetchContratos.js'
import { contratoSchema } from '../schemas/contrato.schema.js'
import * as contratoRepository from '../repositories/contrato.repository.js'
import { logger } from '../lib/logger.js'
import type { Contrato } from '../types/contrato.types.js'

export interface ResumoIngestao {
  inseridos: number
  atualizados: number
  falhas: number
}

export async function executarIngestaoContratos(): Promise<ResumoIngestao> {
  const brutos = await fetchTodosContratos()

  const validos: Contrato[] = []
  let falhas = 0

  for (const item of brutos) {
    const parsed = contratoSchema.safeParse(item)
    if (!parsed.success) {
      falhas += 1
      logger.warn({ err: parsed.error.flatten(), item }, 'Contrato inválido descartado na carga')
      continue
    }
    validos.push(parsed.data)
  }

  const { inseridos, atualizados } = await contratoRepository.upsertMany(validos)

  return { inseridos, atualizados, falhas }
}
