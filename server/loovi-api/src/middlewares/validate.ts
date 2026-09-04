import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'
import { AppError } from '../lib/httpError.js'

type Fonte = 'query' | 'body' | 'params'

export function validate(schema: ZodTypeAny, fonte: Fonte = 'query') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[fonte])
    if (!parsed.success) {
      return next(new AppError(400, 'VALIDACAO_FALHOU', parsed.error.issues.map((i) => i.message).join('; ')))
    }
    req[fonte] = parsed.data
    next()
  }
}
