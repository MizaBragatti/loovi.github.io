import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/repositories/contrato.repository.js', () => ({
  findMany: vi.fn(),
  findByAgreementNo: vi.fn(),
}))

const { createApp } = await import('../src/app.js')

describe('requireAuth', () => {
  it('rejeita requisição sem Authorization', async () => {
    const app = createApp()
    const res = await request(app).get('/contratos')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(res.body.errorCode).toBe('NAO_AUTENTICADO')
  })

  it('rejeita token que não é um JWT válido', async () => {
    const app = createApp()
    const res = await request(app).get('/contratos').set('Authorization', 'Bearer token-invalido')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(res.body.errorCode).toBe('TOKEN_INVALIDO')
  })
})
