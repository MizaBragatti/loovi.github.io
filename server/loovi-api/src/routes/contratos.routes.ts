import { Router } from 'express'
import { validate } from '../middlewares/validate.js'
import { contratosQuerySchema, agreementNoParamSchema } from '../schemas/contrato.schema.js'
import * as contratoService from '../services/contrato.service.js'
import { ok } from '../lib/apiResponse.js'

export const contratosRouter = Router()

contratosRouter.get('/', validate(contratosQuerySchema, 'query'), async (req, res, next) => {
  try {
    const data = await contratoService.listarContratos(req.query as any)
    res.json(ok(data))
  } catch (err) {
    next(err)
  }
})

contratosRouter.get('/:agreementNo', validate(agreementNoParamSchema, 'params'), async (req, res, next) => {
  try {
    const { agreementNo } = req.params as unknown as { agreementNo: number }
    const data = await contratoService.buscarContratoPorAgreementNo(agreementNo)
    res.json(ok(data))
  } catch (err) {
    next(err)
  }
})
