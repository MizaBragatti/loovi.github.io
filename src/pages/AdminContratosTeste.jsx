import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchContratos, extractListaContratos } from '../lib/contratosApi'
import { isEncerrado } from '../lib/contratoFields'
import ContratoCard from '../components/ContratoCard'

export default function AdminContratosTeste() {
  const navigate = useNavigate()

  const [codigoVendedor, setCodigoVendedor] = useState('')
  const [token, setToken] = useState(localStorage.getItem('idToken') ?? '')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [search, setSearch] = useState('')
  const [showEncerrados, setShowEncerrados] = useState(true)

  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [buscou, setBuscou] = useState(false)

  async function handleBuscar() {
    if (!codigoVendedor.trim()) {
      setErro('Informe o código do vendedor')
      return
    }
    setLoading(true)
    setErro('')
    setBuscou(true)
    try {
      const dataInicioTs = dataInicial ? Math.floor(new Date(`${dataInicial}T00:00:00`).getTime() / 1000) : undefined
      const dataFimTs = dataFinal ? Math.floor(new Date(`${dataFinal}T23:59:59`).getTime() / 1000) : undefined
      const resposta = await fetchContratos(codigoVendedor.trim(), token.trim(), { dataInicio: dataInicioTs, dataFim: dataFimTs })
      setContratos(extractListaContratos(resposta))
    } catch (err) {
      setContratos([])
      setErro(err.message ?? 'Erro ao carregar contratos')
    } finally {
      setLoading(false)
    }
  }

  const filtrados = contratos.filter(c => {
    if (!showEncerrados && isEncerrado(c)) return false
    if (search && !JSON.stringify(c).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e3ecf7] dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-none dark:border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#0A3D91] dark:text-blue-400">Loovi Seguros</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin — contratos (teste, sem login)</p>
        </div>
        <button
          onClick={() => navigate('/consulta')}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Voltar
        </button>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-none dark:border dark:border-gray-700 p-6 flex flex-col gap-6 min-h-[560px]">
          <header className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 m-0">Buscar contratos por ID (sem login)</h2>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Página só para testes internos de dev — não use em produção com dados reais.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
              <div className="w-full md:w-40">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Código do vendedor</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A3D91] dark:focus:ring-blue-400 transition-colors"
                  placeholder="Ex: 27140"
                  value={codigoVendedor}
                  onChange={e => setCodigoVendedor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                />
              </div>

              <div className="w-full md:flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Token (idToken, opcional)</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A3D91] dark:focus:ring-blue-400 transition-colors font-mono"
                  placeholder="Cole aqui um idToken válido, se necessário"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                />
              </div>

              <div className="w-full md:w-auto">
                <label htmlFor="admin-data-inicial" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data inicial</label>
                <input
                  id="admin-data-inicial"
                  type="date"
                  value={dataInicial}
                  max={dataFinal || undefined}
                  onChange={e => setDataInicial(e.target.value)}
                  className="w-full px-4 py-[11px] border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3D91] dark:focus:ring-blue-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div className="w-full md:w-auto">
                <label htmlFor="admin-data-final" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data final</label>
                <input
                  id="admin-data-final"
                  type="date"
                  value={dataFinal}
                  min={dataInicial || undefined}
                  onChange={e => setDataFinal(e.target.value)}
                  className="w-full px-4 py-[11px] border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3D91] dark:focus:ring-blue-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <button
                onClick={handleBuscar}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-[#0A3D91] text-white text-sm font-medium hover:bg-[#0A3D91]/90 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {loading ? 'Buscando...' : 'Buscar contratos'}
              </button>
            </div>

            {buscou && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full sm:w-1/2">
                  <input
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A3D91] dark:focus:ring-blue-400 transition-colors"
                    placeholder="Pesquisar nos resultados"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showEncerrados}
                    onChange={e => setShowEncerrados(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-400 dark:border-gray-500 text-[#0A3D91] focus:ring-[#0A3D91] dark:focus:ring-blue-400"
                  />
                  Mostrar contratos encerrados
                </label>
              </div>
            )}
          </header>

          <div className="flex flex-col gap-4 flex-1">
            {buscou && !loading && !erro && (
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Mostrando {filtrados.length} contratos</span>
            )}

            {!buscou ? (
              <div className="flex-1 flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                Informe o código do vendedor e clique em "Buscar contratos".
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
                Carregando contratos...
              </div>
            ) : erro ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-16">
                <p className="text-sm text-red-500 dark:text-red-400">{erro}</p>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-2">Nada por aqui... por enquanto!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">Não encontramos nenhum contrato para esse vendedor no período padrão.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {filtrados.map((c, i) => (
                  <ContratoCard key={i} contrato={c} index={i} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
