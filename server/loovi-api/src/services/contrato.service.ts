import * as contratoRepository from '../repositories/contrato.repository.js'
import type { ContratosQuery } from '../types/contrato.types.js'
import { AppError } from '../lib/httpError.js'

export async function listarContratos(query: ContratosQuery) {
  return contratoRepository.findMany(query)
}

export async function buscarContratoPorAgreementNo(agreementNo: number) {
  const contrato = await contratoRepository.findByAgreementNo(agreementNo)
  if (!contrato) {
    throw new AppError(404, 'CONTRATO_NAO_ENCONTRADO', `Contrato ${agreementNo} não encontrado.`)
  }
  return contrato
}
