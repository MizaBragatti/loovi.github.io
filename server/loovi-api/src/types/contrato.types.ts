import { z } from 'zod'
import { contratoSchema, listaContratosDataSchema, contratosQuerySchema } from '../schemas/contrato.schema.js'

export type Contrato = z.infer<typeof contratoSchema>
export type ListaContratosData = z.infer<typeof listaContratosDataSchema>
export type ContratosQuery = z.infer<typeof contratosQuerySchema>
