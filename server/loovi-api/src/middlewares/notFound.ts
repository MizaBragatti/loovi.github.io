import type { Request, Response } from 'express'
import { fail } from '../lib/apiResponse.js'

export function notFound(_req: Request, res: Response) {
  res.status(404).json(fail('ROTA_NAO_ENCONTRADA', 'Rota não encontrada.'))
}
