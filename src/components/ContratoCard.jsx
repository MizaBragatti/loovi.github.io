import { CAMPOS_NUMERO, CAMPOS_ID_CLIENTE, CAMPOS_INDICACAO, CAMPOS_AFILIADO, CHAVES_DESTACADAS, campoContrato, isEncerrado } from '../lib/contratoFields'

export default function ContratoCard({ contrato: c, index }) {
  const numero = campoContrato(c, CAMPOS_NUMERO)
  const status = isEncerrado(c) ? 'Encerrado' : 'Ativo'
  const idCliente = campoContrato(c, CAMPOS_ID_CLIENTE)
  const indicacao = campoContrato(c, CAMPOS_INDICACAO)
  const afiliado = campoContrato(c, CAMPOS_AFILIADO)

  return (
    <li className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-medium text-gray-900 dark:text-gray-100">{numero ?? `Contrato ${index + 1}`}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isEncerrado(c) ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-blue-50 dark:bg-blue-500/10 text-[#0A3D91] dark:text-blue-400'}`}>
          {status}
        </span>
      </div>

      {(idCliente != null || indicacao != null || afiliado != null) && (
        <dl className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="overflow-hidden">
            <dt className="uppercase tracking-wide text-[10px] text-gray-400 dark:text-gray-500">ID do cliente</dt>
            <dd className="text-gray-700 dark:text-gray-300 truncate">{idCliente ?? '—'}</dd>
          </div>
          <div className="overflow-hidden">
            <dt className="uppercase tracking-wide text-[10px] text-gray-400 dark:text-gray-500">Indicação</dt>
            <dd className="text-gray-700 dark:text-gray-300 truncate">{indicacao ?? '—'}</dd>
          </div>
          <div className="overflow-hidden">
            <dt className="uppercase tracking-wide text-[10px] text-gray-400 dark:text-gray-500">Afiliado</dt>
            <dd className="text-gray-700 dark:text-gray-300 truncate">{afiliado ?? '—'}</dd>
          </div>
        </dl>
      )}

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries(c).filter(([k, v]) => v != null && v !== '' && typeof v !== 'object' && !CHAVES_DESTACADAS.has(k)).map(([k, v]) => (
          <div key={k} className="overflow-hidden">
            <dt className="uppercase tracking-wide text-[10px] text-gray-400 dark:text-gray-500">{k}</dt>
            <dd className="text-gray-700 dark:text-gray-300 truncate">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </li>
  )
}
