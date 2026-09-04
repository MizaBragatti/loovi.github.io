import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/integrations/loovi/fetchContratos.js', () => ({
  fetchTodosContratos: vi.fn(),
}))

vi.mock('../src/repositories/contrato.repository.js', () => ({
  upsertMany: vi.fn(),
}))

const { fetchTodosContratos } = await import('../src/integrations/loovi/fetchContratos.js')
const contratoRepository = await import('../src/repositories/contrato.repository.js')
const { executarIngestaoContratos } = await import('../src/services/ingestao.service.js')

const contratoValido = {
  agreementNo: 1,
  contratoNatural: 'C1',
  bpCode: 'BP1',
  bpName: 'Cliente 1',
  startDate: '2026-01-01',
  endDate: '2027-01-01',
  status: 'ATIVO',
  slp: 'SLP1',
  dataInicioVigencia: '2026-01-01',
  dataFimVigencia: '2027-01-01',
  inDebito: false,
  garantiaAtiva: true,
  valorRecorrencia: 100,
  tipoPagamento: 'BOLETO',
}

const contratoInvalido = { agreementNo: 'não-é-numero' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('executarIngestaoContratos', () => {
  it('descarta itens inválidos e faz upsert apenas dos válidos', async () => {
    vi.mocked(fetchTodosContratos).mockResolvedValue([contratoValido, contratoInvalido] as any)
    vi.mocked(contratoRepository.upsertMany).mockResolvedValue({ inseridos: 1, atualizados: 0 })

    const resumo = await executarIngestaoContratos()

    expect(contratoRepository.upsertMany).toHaveBeenCalledTimes(1)
    expect((contratoRepository.upsertMany as any).mock.calls[0][0]).toHaveLength(1)
    expect(resumo).toEqual({ inseridos: 1, atualizados: 0, falhas: 1 })
  })
})
