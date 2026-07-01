import { useState, useRef, useEffect } from 'react'
import useConsulta from '../hooks/useConsulta'
import HistoricoModal from '../components/HistoricoModal'
import { gerarPDF, VENDEDORES } from '../lib/pdfGenerator'
import { formatBRL } from '../lib/calculations'

const ESTADOS = ['SP', 'MG', 'RJ', 'SC', 'RS']
const VENDEDOR_KEYS = Object.keys(VENDEDORES)

export default function Consulta() {
  const hook = useConsulta()

  useEffect(() => {
    if (!localStorage.getItem('idToken')) {
      window.location.replace('/loovi-login')
    }
  }, [])
  const [historico, setHistorico] = useState(false)
  const [selectedVendedor, setSelectedVendedor] = useState(null)
  const [selectedPlano, setSelectedPlano] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const fraseRef = useRef(null)
  const fipeRef = useRef(null)

  const vendedorObj = selectedVendedor ? VENDEDORES[selectedVendedor] : null

  function handleVendedor(key) {
    setSelectedVendedor(prev => prev === key ? null : key)
  }

  function handleEstado(e) {
    hook.setEstado(prev => prev === e ? null : e)
  }

  function handleConsultarHistorico(quote) {
    if (quote.placa) hook.handleInput(quote.placa)
    if (quote.estado) hook.setEstado(quote.estado)
    setHistorico(false)
  }

  async function handleGerarPDF(tipo) {
    if (!hook.resultado || !hook.frases) return
    const planos = { essencial: hook.resultado.essencial, semVidro: hook.resultado.semVidro, completo: hook.resultado.completo }
    const planosNomes = { essencial: 'PDF-Essencial', semVidro: 'PDF-SemVidros', completo: 'PDF-Completo' }
    const plano = planos[tipo]
    const frase = hook.frases[tipo] ?? ''
    setPdfLoading(true)
    try {
      await gerarPDF(planosNomes[tipo], {
        placaOrValue: hook.input || hook.vehicleRef.current.placa || hook.vehicleRef.current.valorFipe,
        frase,
        valores: {
          primeiraEntry: formatBRL(plano.primeira),
          mensalEntry: formatBRL(plano.mensal),
          anualEntry: formatBRL(plano.anual),
        },
        vendedor: vendedorObj,
      })
    } catch (e) {
      alert('Erro ao gerar PDF: ' + (e.message ?? e))
    } finally {
      setPdfLoading(false)
    }
  }

  function copyText(ref) {
    if (!ref.current) return
    ref.current.select()
    navigator.clipboard.writeText(ref.current.value).catch(() => {})
  }

  const fraseAtual = selectedPlano && hook.frases ? hook.frases[selectedPlano] : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e3ecf7] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#0A3D91]">Loovi Seguros</h1>
          <p className="text-xs text-gray-500">Consulta FIPE</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setHistorico(true)}
            className="px-3 py-1.5 rounded-lg border border-[#0A3D91] text-[#0A3D91] text-sm hover:bg-[#0A3D91] hover:text-white transition-colors"
          >
            Histórico
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('idToken')
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              window.location.replace('/loovi-login')
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4">

        {/* Input placa/valor */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <label className="text-sm font-medium text-gray-700">Placa ou Valor FIPE</label>
          <div className="flex gap-2">
            <input
              className={`flex-1 border rounded-lg px-3 py-2.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0A3D91] transition-colors ${
                hook.status === 'error' ? 'border-red-400 ring-red-200' :
                hook.status === 'success' ? 'border-green-400' :
                hook.status === 'loading' ? 'border-yellow-400' : 'border-gray-300'
              }`}
              placeholder="Ex: ABC1234 ou 50000"
              value={hook.input}
              onChange={e => hook.handleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && hook.handleEnter()}
            />
          </div>

          {/* Dados FIPE */}
          {hook.fipeText && (
            <div className="relative">
              <textarea
                ref={fipeRef}
                readOnly
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 resize-none min-h-[80px]"
                value={hook.fipeText}
                rows={hook.fipeText.split('\n').length}
              />
              <button
                onClick={() => copyText(fipeRef)}
                className="absolute top-2 right-2 text-xs text-[#0A3D91] hover:underline"
              >
                Copiar
              </button>
            </div>
          )}
          {hook.status === 'loading' && <p className="text-xs text-yellow-600">Carregando...</p>}
          {hook.error && <p className="text-xs text-red-500">{hook.error}</p>}
        </div>

        {/* Checkboxes estados */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Estado</p>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map(e => (
              <button
                key={e}
                onClick={() => handleEstado(e)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  hook.estado === e
                    ? 'bg-[#0A3D91] text-white border-[#0A3D91]'
                    : 'border-gray-300 text-gray-600 hover:border-[#0A3D91]'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo veículo */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Tipo de Veículo</p>
          <div className="flex gap-2">
            {[['suv', 'SUV / Pickup', hook.isSUV, hook.toggleSUV], ['util', 'Utilitário / Van', hook.isUtil, hook.toggleUtil]].map(([id, label, checked, toggle]) => (
              <button
                key={id}
                onClick={toggle}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  checked ? 'bg-[#0A3D91] text-white border-[#0A3D91]' : 'border-gray-300 text-gray-600 hover:border-[#0A3D91]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de resultados */}
        {hook.resultado && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Valores dos Planos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[#0A3D91] text-white">
                    <th className="text-left px-4 py-2">Plano</th>
                    <th className="text-right px-4 py-2">Colisão</th>
                    <th className="text-right px-4 py-2">1ª Mensalidade</th>
                    <th className="text-right px-4 py-2">Mensal</th>
                    <th className="text-right px-4 py-2">Total Anual</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Essencial', 'essencial', 'bg-white'],
                    ['Sem Vidros', 'semVidro', 'bg-blue-50'],
                    ['Completo', 'completo', 'bg-white'],
                  ].map(([nome, key, bg]) => {
                    const r = hook.resultado[key]
                    return (
                      <tr key={key} className={`${bg} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="px-4 py-3 font-medium text-gray-800">{nome}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{r.colisao > 0 ? formatBRL(r.colisao) : '—'}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatBRL(r.primeira)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatBRL(r.mensal)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatBRL(r.anual)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Frases */}
        {hook.frases && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Frase para o cliente</p>
            <div className="flex gap-2 flex-wrap">
              {[['essencial', 'Essencial'], ['semVidro', 'Sem Vidros'], ['completo', 'Completo']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlano(prev => prev === key ? null : key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedPlano === key
                      ? 'bg-[#0A3D91] text-white border-[#0A3D91]'
                      : 'border-gray-300 text-gray-600 hover:border-[#0A3D91]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {fraseAtual && (
              <div className="relative">
                <textarea
                  ref={fraseRef}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 resize-none"
                  value={fraseAtual}
                  rows={Math.ceil(fraseAtual.length / 80) + 1}
                />
                <button
                  onClick={() => copyText(fraseRef)}
                  className="absolute top-2 right-2 text-xs text-[#0A3D91] hover:underline"
                >
                  Copiar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Vendedor */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Vendedor</p>
          <div className="flex flex-wrap gap-2">
            {VENDEDOR_KEYS.map(k => (
              <button
                key={k}
                onClick={() => handleVendedor(k)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition-colors ${
                  selectedVendedor === k
                    ? 'bg-[#0A3D91] text-white border-[#0A3D91]'
                    : 'border-gray-300 text-gray-600 hover:border-[#0A3D91]'
                }`}
              >
                {VENDEDORES[k].nome.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* PDF buttons */}
        {hook.resultado && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Gerar PDF</p>
            <div className="flex flex-wrap gap-2">
              {[['essencial', 'Essencial'], ['semVidro', 'Sem Vidros'], ['completo', 'Completo']].map(([key, label]) => (
                <button
                  key={key}
                  disabled={pdfLoading}
                  onClick={() => handleGerarPDF(key)}
                  className="px-4 py-2 rounded-lg bg-[#0A3D91] text-white text-sm font-medium hover:bg-[#3E7CB1] disabled:opacity-60 transition-colors"
                >
                  {pdfLoading ? 'Gerando...' : `PDF ${label}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <HistoricoModal
        open={historico}
        onClose={() => setHistorico(false)}
        onConsultar={handleConsultarHistorico}
      />
    </div>
  )
}
