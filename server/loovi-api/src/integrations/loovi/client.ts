import axios from 'axios'
import { env } from '../../config/env.js'

export const looviClient = axios.create({
  baseURL: env.LOOVI_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.LOOVI_API_KEY}`,
    Accept: 'application/json',
    // Exigido pelo api-gateway da Loovi (mesmo header usado pelo portal escritoriovirtual.loovi.com.br).
    requester: 'Portal',
  },
  timeout: 15_000,
})
