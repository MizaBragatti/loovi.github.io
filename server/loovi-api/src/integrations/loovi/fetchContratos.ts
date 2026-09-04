import { looviClient } from './client.js'
import { looviContratosEnvelopeSchema } from './loovi.types.js'
import type { Contrato } from '../../types/contrato.types.js'
import { logger } from '../../lib/logger.js'
import { env } from '../../config/env.js'

const MAX_PAGINAS = 500

// Mesmo endpoint usado pela tela "Meus Contratos" do portal (via proxy
// /api/proxy/api/sap-contrato/ativos -> api-gateway.loovi.app.br).
const CONTRATOS_PATH = '/api/sap-contrato/ativos'

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function fetchTodosContratos(): Promise<Contrato[]> {
  const itens: Contrato[] = []
  let cursor: string | null = null
  let paginas = 0

  // Sem limite de período conhecido pra "todos os contratos": busca desde
  // uma data bem antiga até hoje, igual à tela faria variando o range.
  const startDateFrom = toDateParam(new Date('2000-01-01'))
  const startDateTo = toDateParam(new Date())

  do {
    const response = await looviClient.get(CONTRATOS_PATH, {
      params: {
        slp: env.LOOVI_SLP,
        startDateFrom,
        startDateTo,
        apenasVigentes: 'false',
        incluirItens: 'true',
        take: '100',
        ...(cursor ? { cursor } : {}),
      },
    })

    const parsed = looviContratosEnvelopeSchema.safeParse(response.data)
    if (!parsed.success) {
      logger.error({ err: parsed.error.flatten() }, 'Resposta da Loovi fora do formato esperado')
      throw new Error('Resposta inválida da API da Loovi.')
    }

    itens.push(...parsed.data.data.itens)
    cursor = parsed.data.data.nextCursor
    paginas += 1
  } while (cursor && paginas < MAX_PAGINAS)

  return itens
}
