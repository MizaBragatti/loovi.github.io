import { z } from 'zod'

export const contratoSchema = z.object({
  agreementNo: z.number().int(),
  contratoNatural: z.string(),
  bpCode: z.string(),
  bpName: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.string(),
  slp: z.string(),
  dataInicioVigencia: z.coerce.date(),
  dataFimVigencia: z.coerce.date(),
  idIndicacao: z.string().nullable().optional(),
  idIndicacaoAfiliado: z.string().nullable().optional(),
  placa: z.string().nullable().optional(),
  dataCancelamento: z.coerce.date().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  linkApolice: z.string().nullable().optional(),
  inDebito: z.boolean(),
  garantiaAtiva: z.boolean(),
  valorRecorrencia: z.coerce.number(),
  tipoPagamento: z.string(),
})

export const listaContratosDataSchema = z.object({
  itens: z.array(contratoSchema),
  total: z.number().int(),
  nextCursor: z.string().nullable(),
})

export const contratosQuerySchema = z.object({
  bpCode: z.string().optional(),
  status: z.string().optional(),
  placa: z.string().optional(),
  slp: z.string().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  cursor: z.string().optional(),
  take: z.coerce.number().int().positive().max(200).default(50),
})

export const agreementNoParamSchema = z.object({
  agreementNo: z.coerce.number().int(),
})
