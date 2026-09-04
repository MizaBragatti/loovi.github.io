import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../src/repositories/contrato.repository.js', () => ({
  findMany: vi.fn(),
  findByAgreementNo: vi.fn(),
}))

// Evita depender do JWKS real da Loovi (rede) nos testes: simula um usuário
// já autenticado, testando só o comportamento das rotas.
vi.mock('../src/middlewares/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.auth = { slp: '45811', sub: 'user-teste' }
    next()
  },
}))

const contratoRepository = await import('../src/repositories/contrato.repository.js')
const { createApp } = await import('../src/app.js')

const contratoMock = {
  agreementNo: 123,
  bpCode: 'BP1',
  status: 'ATIVO',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /contratos', () => {
  it('retorna a lista de contratos no envelope padrão', async () => {
    vi.mocked(contratoRepository.findMany).mockResolvedValue({
      itens: [contratoMock],
      total: 1,
      nextCursor: null,
    } as any)

    const app = createApp()
    const res = await request(app).get('/contratos')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.itens).toHaveLength(1)
    expect(res.body.data.itens[0].agreementNo).toBe(123)
  })
})

describe('GET /contratos/:agreementNo', () => {
  it('retorna 404 no envelope quando o contrato não existe', async () => {
    vi.mocked(contratoRepository.findByAgreementNo).mockResolvedValue(null as any)

    const app = createApp()
    const res = await request(app).get('/contratos/999')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.errorCode).toBe('CONTRATO_NAO_ENCONTRADO')
  })
})
