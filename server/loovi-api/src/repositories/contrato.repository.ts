import { prisma } from '../lib/prisma.js'
import type { Contrato, ContratosQuery } from '../types/contrato.types.js'

export async function findMany(query: ContratosQuery) {
  const where = {
    ...(query.bpCode ? { bpCode: query.bpCode } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.placa ? { placa: query.placa } : {}),
    ...(query.slp ? { slp: query.slp } : {}),
    ...(query.startDateFrom || query.startDateTo
      ? {
          startDate: {
            ...(query.startDateFrom ? { gte: query.startDateFrom } : {}),
            ...(query.startDateTo ? { lte: query.startDateTo } : {}),
          },
        }
      : {}),
  }

  const itens = await prisma.contrato.findMany({
    where,
    take: query.take + 1,
    ...(query.cursor ? { cursor: { agreementNo: Number(query.cursor) }, skip: 1 } : {}),
    orderBy: { agreementNo: 'asc' },
  })

  const total = await prisma.contrato.count({ where })

  const hasNext = itens.length > query.take
  const pageItens = hasNext ? itens.slice(0, query.take) : itens
  const nextCursor = hasNext ? String(pageItens[pageItens.length - 1].agreementNo) : null

  return { itens: pageItens, total, nextCursor }
}

export async function findByAgreementNo(agreementNo: number) {
  return prisma.contrato.findUnique({ where: { agreementNo } })
}

export async function upsertMany(contratos: Contrato[]) {
  let inseridos = 0
  let atualizados = 0

  for (const contrato of contratos) {
    const existente = await prisma.contrato.findUnique({ where: { agreementNo: contrato.agreementNo } })

    await prisma.contrato.upsert({
      where: { agreementNo: contrato.agreementNo },
      create: contrato,
      update: contrato,
    })

    if (existente) atualizados += 1
    else inseridos += 1
  }

  return { inseridos, atualizados }
}
