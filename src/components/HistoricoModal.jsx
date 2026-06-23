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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Histórico de Cotações</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-5 gap-2 px-6 py-3 bg-gray-50 border-b text-center text-xs text-gray-600">
          {[['Total', counters.total], ['Hoje', counters.hoje], ['Semana', counters.semana], ['Mês', counters.mes], ['Ano', counters.ano]].map(([label, val]) => (
            <div key={label}>
              <div className="text-2xl font-bold text-[#0A3D91]">{val}</div>
              <div>{label}</div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-b">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D91]"
            placeholder="Buscar por placa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-3 space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma cotação encontrada.</p>
          ) : filtered.map((q, i) => (
            <div key={q.timestamp} className="border rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-gray-800">{q.placa || 'Valor direto'}</span>
                  {q.modelo && <span className="ml-2 text-gray-500">{q.modelo}</span>}
                </div>
                <span className="text-xs text-gray-400">{new Date(q.timestamp).toLocaleString('pt-BR')}</span>
              </div>
              {q.estado && <div className="text-gray-600">Estado: <span className="font-medium">{q.estado}</span></div>}
              {q.valorFipe > 0 && (
                <div className="text-gray-600">
                  FIPE: <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(q.valorFipe)}</span>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { handleDelete(quotes.indexOf(q)); }}
                  className="px-3 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 text-xs"
                >
                  Deletar
                </button>
                <button
                  onClick={() => onConsultar(q)}
                  className="px-3 py-1 rounded-lg bg-[#0A3D91] text-white hover:bg-[#3E7CB1] text-xs"
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
