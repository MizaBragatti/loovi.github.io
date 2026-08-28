import { useState, useEffect } from 'react'
import { loadCounters, loadQuotes, deleteQuote } from '../lib/history'

export default function HistoricoModal({ open, onClose, onConsultar }) {
  const [search, setSearch] = useState('')
  const [quotes, setQuotes] = useState([])
  const [counters, setCounters] = useState({ total: 0, hoje: 0, semana: 0, mes: 0, ano: 0 })

  useEffect(() => {
    if (open) {
      setQuotes(loadQuotes())
      setCounters(loadCounters())
    }
  }, [open])

  function handleDelete(idx) {
    deleteQuote(idx)
    const updated = loadQuotes()
    setQuotes(updated)
    setCounters(loadCounters())
  }

  const filtered = [...quotes]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter(q => !search || (q.placa ?? '').toLowerCase().includes(search.toLowerCase()))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Histórico de Cotações</h2>
          <button onClick={onClose} aria-label="Fechar histórico" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-5 gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-center text-xs text-gray-600 dark:text-gray-400">
          {[['Total', counters.total], ['Hoje', counters.hoje], ['Semana', counters.semana], ['Mês', counters.mes], ['Ano', counters.ano]].map(([label, val]) => (
            <div key={label}>
              <div className="text-2xl font-bold text-[#0A3D91] dark:text-blue-400">{val}</div>
              <div>{label}</div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A3D91] dark:focus:ring-blue-400"
            placeholder="Buscar por placa..."
            aria-label="Buscar por placa"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-3 space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Nenhuma cotação encontrada.</p>
          ) : filtered.map((q, i) => (
            <div key={q.timestamp} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{q.placa || 'Valor direto'}</span>
                  {q.modelo && <span className="ml-2 text-gray-500 dark:text-gray-400">{q.modelo}</span>}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(q.timestamp).toLocaleString('pt-BR')}</span>
              </div>
              {q.estado && <div className="text-gray-600 dark:text-gray-400">Estado: <span className="font-medium dark:text-gray-200">{q.estado}</span></div>}
              {q.valorFipe > 0 && (
                <div className="text-gray-600 dark:text-gray-400">
                  FIPE: <span className="font-medium dark:text-gray-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(q.valorFipe)}</span>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { handleDelete(quotes.indexOf(q)); }}
                  className="px-3 py-1 rounded-lg border border-red-300 dark:border-red-500/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs"
                >
                  Deletar
                </button>
                <button
                  onClick={() => onConsultar(q)}
                  className="px-3 py-1 rounded-lg bg-[#0A3D91] dark:bg-blue-600 text-white hover:bg-[#3E7CB1] dark:hover:bg-blue-500 text-xs"
                >
                  Consultar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
