import { z } from 'zod'
import { envelopeSchema } from '../../schemas/envelope.schema.js'
import { listaContratosDataSchema } from '../../schemas/contrato.schema.js'

export const looviContratosEnvelopeSchema = envelopeSchema(listaContratosDataSchema)
export type LooviContratosEnvelope = z.infer<typeof looviContratosEnvelopeSchema>
