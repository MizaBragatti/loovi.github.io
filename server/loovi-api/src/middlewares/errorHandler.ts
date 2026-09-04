import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/httpError.js'
import { fail } from '../lib/apiResponse.js'
import { logger } from '../lib/logger.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(fail(err.errorCode, err.message))
  }

  logger.error({ err }, 'Erro não tratado')
  return res.status(500).json(fail('ERRO_INTERNO', 'Erro interno do servidor.'))
}
