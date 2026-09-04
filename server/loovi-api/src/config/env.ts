import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOOVI_BASE_URL: z.string().url(),
  LOOVI_API_KEY: z.string().min(1, 'LOOVI_API_KEY é obrigatório'),
  LOOVI_SLP: z.string().min(1, 'LOOVI_SLP é obrigatório'),
  // Emissor do SSO da Loovi - usado para validar (via JWKS) o mesmo token
  // de sessão que o portal/proxy já usam, sem precisar de login próprio.
  LOOVI_SSO_ISSUER: z.string().url().default('https://sso.loovi.app.br'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors)
  throw new Error('Configuração de ambiente inválida.')
}

export const env = parsed.data
