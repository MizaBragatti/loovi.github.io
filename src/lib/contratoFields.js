export const CAMPOS_NUMERO = ['numeroInterno', 'contratoSap', 'contratoNatural', 'numeroContrato', 'NumeroContrato', 'numero', 'Numero', 'id', 'Id']
export const CAMPOS_STATUS = ['status', 'Status', 'situacao', 'Situacao', 'situacaoContrato']
export const CAMPOS_ID_CLIENTE = ['codCliente', 'idCliente', 'IdCliente', 'clienteId', 'codigoCliente', 'CodigoCliente']
export const CAMPOS_INDICACAO = ['idIndicacao', 'indicacao', 'Indicacao', 'IdIndicacao', 'codigoIndicacao']
export const CAMPOS_AFILIADO = ['idIndicacaoAfiliado', 'afiliado', 'Afiliado', 'codigoAfiliado', 'CodigoAfiliado', 'nomeAfiliado']
const REGEX_ENCERRADO = /encerr|cancel|inativ|finaliz/i

export function campoContrato(c, chaves) {
  for (const k of chaves) if (c[k] != null && c[k] !== '') return c[k]
  return null
}

export const CHAVES_DESTACADAS = new Set([
  ...CAMPOS_NUMERO, ...CAMPOS_STATUS, ...CAMPOS_ID_CLIENTE, ...CAMPOS_INDICACAO, ...CAMPOS_AFILIADO, 'cancelado',
])

export function isEncerrado(c) {
  if (typeof c.cancelado === 'boolean') return c.cancelado
  const status = campoContrato(c, CAMPOS_STATUS)
  return typeof status === 'string' && REGEX_ENCERRADO.test(status)
}
