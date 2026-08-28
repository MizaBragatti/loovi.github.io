import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useConsulta from '../hooks/useConsulta'
import HistoricoModal from '../components/HistoricoModal'
import { gerarPDF } from '../lib/pdf'
import { formatBRL } from '../lib/calculations'
import { parseJwt } from '../lib/jwt'
import { fetchVendedorInfo, getCodigoVendedorFromToken } from '../lib/contratosApi'
import { endExpiredSession, getActiveAuthToken, hasActiveSession } from '../lib/authSession'

const ESTADOS = ['SP', 'MG', 'RJ', 'SC', 'RS']

function normalizePhone(digitsOnly) {
  const digits = String(digitsOnly ?? '').replace(/\D/g, '')
  if (!digits) return { tel: '', telFormatado: '' }

  if (digits.length < 10) {
    return { tel: '', telFormatado: '' }
  }

  if (digits.length === 11) {
    return {
      tel: digits,
      telFormatado: `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`,
    }
  }

  if (digits.length === 10) {
    return {
      tel: digits,
      telFormatado: `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`,
    }
  }

  return { tel: digits, telFormatado: digits }
}

function safeDecode(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

function isReadableEmail(value) {
  const text = safeDecode(value)
  if (!text || /\*/.test(text)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
}

function isGenericExecutivoName(value) {
  return safeDecode(value).toLowerCase() === 'executivo loovi'
}

function getExecutivoProfileFromToken(token) {
  const payload = parseJwt(token)
  if (!payload) return null

  const nomeRaw = stripEmailSuffix(safeDecode(payload?.name ?? payload?.given_name ?? payload?.['custom:nome'] ?? payload?.nome ?? ''))
  const emailRaw = safeDecode(payload?.email ?? payload?.['custom:email'] ?? '')
  const phone = normalizePhone(safeDecode(payload?.telefone ?? payload?.phone_number ?? payload?.phone ?? payload?.['custom:phone_number'] ?? ''))
  // O "meu site" do executivo segue o padrão https://loovi.com.br/{codigoVendedor}
  // (codigoVendedor = claim `slp` no token novo SSO, `custom:slp` no token antigo Cognito).
  const codigoVendedor = payload?.slp ?? payload?.['custom:slp']
  const link = codigoVendedor
    ? `https://loovi.com.br/${codigoVendedor}`
    : safeDecode(
        payload?.['custom:link'] ??
        payload?.link ??
        payload?.['custom:meusite'] ??
        payload?.['custom:meuSite'] ??
        payload?.['custom:site'] ??
        payload?.['custom:linkContratacao'] ??
        payload?.website ??
        '#'
      )

  return {
    nome: isGenericExecutivoName(nomeRaw) ? '' : nomeRaw,
    email: isReadableEmail(emailRaw) ? emailRaw : '',
    tel: phone.tel,
    telFormatado: phone.telFormatado,
    link: link || '#',
  }
}

// A API/token às vezes retorna o nome já com o e-mail colado (com ou sem separador tipo "-"/"•").
function stripEmailSuffix(value) {
  return String(value ?? '')
    .replace(/[\s,;:|•-]*[^\s@]+@[^\s@]+\.[^\s@]+/g, '')
    .trim()
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') return value
  }
  return ''
}

// Busca recursiva por qualquer campo cujo nome combine com o padrão (fallback quando o shape da API é desconhecido).
function findFirstStringByKeyPattern(obj, pattern, seen = new Set()) {
  if (!obj || typeof obj !== 'object' || seen.has(obj)) return ''
  seen.add(obj)

  for (const [key, value] of Object.entries(obj)) {
    if (pattern.test(key) && typeof value === 'string' && value.trim()) return value.trim()
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const found = findFirstStringByKeyPattern(value, pattern, seen)
      if (found) return found
    }
  }
  return ''
}

// Dados vindos de ObterVendedor/{codigo} são a fonte mais confiável (não mascarada) do executivo.
// Campo confirmado na resposta real da API: "nomeCliente" (ex: "Eliel Bragatti").
function buildProfileFromVendedorApi(data) {
  if (!data || typeof data !== 'object') return null
  const vendedor = data?.Vendedor ?? data?.vendedor ?? data?.data ?? data
  const nomeRaw = stripEmailSuffix(safeDecode(firstNonEmpty(
    vendedor?.nomeCliente, vendedor?.NomeCliente,
    vendedor?.Nome, vendedor?.nome, vendedor?.NomeCompleto, vendedor?.nomeCompleto,
    vendedor?.NomeVendedor, vendedor?.nomeVendedor, vendedor?.NomeExecutivo, vendedor?.nomeExecutivo,
    vendedor?.Name, vendedor?.name, vendedor?.RazaoSocial, vendedor?.razaoSocial,
    findFirstStringByKeyPattern(data, /nome|name/i)
  )))
  const emailRaw = safeDecode(firstNonEmpty(vendedor?.Email, vendedor?.email, findFirstStringByKeyPattern(data, /email/i)))
  const telRaw = safeDecode(firstNonEmpty(
    vendedor?.Telefone, vendedor?.telefone, vendedor?.Celular, vendedor?.celular,
    vendedor?.Whatsapp, vendedor?.whatsapp, vendedor?.Fone, vendedor?.fone
  ))
  const phone = normalizePhone(telRaw)

  return {
    nome: isGenericExecutivoName(nomeRaw) ? '' : nomeRaw,
    email: isReadableEmail(emailRaw) ? emailRaw : '',
    tel: phone.tel,
    telFormatado: phone.telFormatado,
  }
}

function mergeProfile(storageProfile, tokenProfile, apiProfile) {
  const stored = storageProfile ?? {}
  const fromToken = tokenProfile ?? {}
  const fromApi = apiProfile ?? {}

  const merged = {
    nome: stripEmailSuffix(fromApi.nome || fromToken.nome || stored.nome || ''),
    email: String(fromApi.email || fromToken.email || stored.email || '').trim(),
    tel: String(fromApi.tel || fromToken.tel || stored.tel || '').trim(),
    telFormatado: String(fromApi.telFormatado || fromToken.telFormatado || stored.telFormatado || '').trim(),
    link: String(fromToken.link || stored.link || '#').trim() || '#',
  }

  return merged
}

function getExecutivoProfileFromStorage() {
  try {
    const raw = localStorage.getItem('executivoProfile')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      nome: parsed.nome ?? '',
      email: parsed.email ?? '',
      tel: parsed.tel ?? '',
      telFormatado: parsed.telFormatado ?? '',
      link: parsed.link ?? '#',
    }
  } catch {
    return null
  }
}

function hasExecutivoProfileData(profile) {
  if (!profile) return false
  return Boolean(
    String(profile.nome ?? '').trim() ||
    String(profile.email ?? '').trim() ||
    String(profile.tel ?? '').trim() ||
    String(profile.telFormatado ?? '').trim()
  )
}

export default function Consulta() {
  const hook = useConsulta()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasActiveSession()) endExpiredSession()
  }, [])
  const [historico, setHistorico] = useState(false)
  const [executivoProfile, setExecutivoProfile] = useState(() => {
    const storageProfile = getExecutivoProfileFromStorage()
    const tokenProfile = getExecutivoProfileFromToken(localStorage.getItem('idToken'))
    return mergeProfile(storageProfile, tokenProfile)
  })
  const [selectedPlano, setSelectedPlano] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const fraseRef = useRef(null)
  const fipeRef = useRef(null)

  const vendedorObj = hasExecutivoProfileData(executivoProfile) ? executivoProfile : null

  useEffect(() => {
    const idToken = localStorage.getItem('idToken')
    const apiToken = getActiveAuthToken()
    if (!apiToken) {
      endExpiredSession()
      return
    }
    const storageProfile = getExecutivoProfileFromStorage()
    const tokenProfile = getExecutivoProfileFromToken(idToken)
    const merged = mergeProfile(storageProfile, tokenProfile)
    setExecutivoProfile(merged)
    localStorage.setItem('executivoProfile', JSON.stringify(merged))

    const codigoVendedor = getCodigoVendedorFromToken(apiToken) ?? getCodigoVendedorFromToken(idToken)
    if (!codigoVendedor) return

    fetchVendedorInfo(codigoVendedor, apiToken)
      .then(data => {
        const apiProfile = buildProfileFromVendedorApi(data)
        const withApi = mergeProfile(storageProfile, tokenProfile, apiProfile)
        setExecutivoProfile(withApi)
        localStorage.setItem('executivoProfile', JSON.stringify(withApi))
      })
      .catch(err => {
        // O perfil já possui fallback no token/localStorage. A API de vendedor
        // é opcional e pode exigir permissão adicional para alguns executivos.
        if (!/\(401\)|\(403\)/.test(err?.message ?? '')) {
          console.error('[consulta] erro ao buscar dados do vendedor:', err?.message)
        }
      })
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  function handleEstado(e) {
    hook.setEstado(prev => prev === e ? null : e)
  }

  function handleConsultarHistorico(quote) {
    if (quote.placa) hook.handleInput(quote.placa)
    else if (quote.valorFipe) hook.handleInput(String(quote.valorFipe))
    if (quote.estado) hook.setEstado(quote.estado)
    setHistorico(false)
  }

  async function handleGerarPDF(tipo) {
    if (!hook.resultado || !hook.frases) return
    if (!vendedorObj) {
      alert('Dados do executivo não encontrados. Faça login novamente para gerar o PDF.')
      return
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e3ecf7] dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-none dark:border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#0A3D91] dark:text-blue-400">Loovi Seguros</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Consulta FIPE</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {dark ? '☀️ Claro' : '🌙 Escuro'}
          </button>
          <button
            onClick={() => navigate('/meus-contratos')}
            className="px-3 py-1.5 rounded-lg border border-[#0A3D91] dark:border-blue-400 text-[#0A3D91] dark:text-blue-400 text-sm hover:bg-[#0A3D91] dark:hover:bg-blue-500 hover:text-white dark:hover:text-white transition-colors"
          >
            Meus contratos
          </button>
          <button
            onClick={() => setHistorico(true)}
            className="px-3 py-1.5 rounded-lg border border-[#0A3D91] dark:border-blue-400 text-[#0A3D91] dark:text-blue-400 text-sm hover:bg-[#0A3D91] dark:hover:bg-blue-500 hover:text-white dark:hover:text-white transition-colors"
          >
            Histórico
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('idToken')
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('executivoProfile')
              window.location.replace('/loovi-login')
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4">

        {/* Input placa/valor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Placa ou Valor FIPE</label>
          <div className="flex gap-2">
            <input
              className={`flex-1 border rounded-lg px-3 py-2.5 text-sm font-mono uppercase tracking-widest bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A3D91] dark:focus:ring-blue-400 transition-colors ${
                hook.status === 'error' ? 'border-red-400 ring-red-200' :
                hook.status === 'success' ? 'border-green-400' :
                hook.status === 'loading' ? 'border-yellow-400' : 'border-gray-300 dark:border-gray-600'
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
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 resize-none min-h-[80px]"
                value={hook.fipeText}
                rows={hook.fipeText.split('\n').length}
              />
              <button
                onClick={() => copyText(fipeRef)}
                className="absolute top-2 right-2 text-xs text-[#0A3D91] dark:text-blue-400 hover:underline"
              >
                Copiar
              </button>
            </div>
          )}
          {hook.status === 'loading' && <p className="text-xs text-yellow-600 dark:text-yellow-400">Carregando...</p>}
          {hook.error && <p className="text-xs text-red-500 dark:text-red-400">{hook.error}</p>}
        </div>

        {/* Checkboxes estados */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</p>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map(e => (
              <button
                key={e}
                onClick={() => handleEstado(e)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  hook.estado === e
                    ? 'bg-[#0A3D91] text-white border-[#0A3D91] dark:bg-blue-500 dark:border-blue-500'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#0A3D91] dark:hover:border-blue-400'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo veículo */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Veículo</p>
          <div className="flex gap-2">
            {[['suv', 'SUV / Pickup', hook.isSUV, hook.toggleSUV], ['util', 'Utilitário / Van', hook.isUtil, hook.toggleUtil]].map(([id, label, checked, toggle]) => (
              <button
                key={id}
                onClick={toggle}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  checked
                    ? 'bg-[#0A3D91] text-white border-[#0A3D91] dark:bg-blue-500 dark:border-blue-500'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#0A3D91] dark:hover:border-blue-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de resultados */}
        {hook.resultado && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valores dos Planos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-[#0A3D91] dark:bg-blue-700 text-white">
                    <th className="text-left px-4 py-2">Plano</th>
                    <th className="text-right px-4 py-2">Colisão</th>
                    <th className="text-right px-4 py-2">1ª Mensalidade</th>
                    <th className="text-right px-4 py-2">Mensal</th>
                    <th className="text-right px-4 py-2">Total Anual</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Essencial', 'essencial', 'bg-white dark:bg-gray-800'],
                    ['Sem Vidros', 'semVidro', 'bg-blue-50 dark:bg-gray-900/60'],
                    ['Completo', 'completo', 'bg-white dark:bg-gray-800'],
                  ].map(([nome, key, bg]) => {
                    const r = hook.resultado[key]
                    return (
                      <tr key={key} className={`${bg} border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors`}>
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{nome}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{r.colisao > 0 ? formatBRL(r.colisao) : '—'}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-100">{formatBRL(r.primeira)}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatBRL(r.mensal)}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatBRL(r.anual)}</td>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Frase para o cliente</p>
            <div className="flex gap-2 flex-wrap">
              {[['essencial', 'Essencial'], ['semVidro', 'Sem Vidros'], ['completo', 'Completo']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlano(prev => prev === key ? null : key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedPlano === key
                      ? 'bg-[#0A3D91] text-white border-[#0A3D91] dark:bg-blue-500 dark:border-blue-500'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#0A3D91] dark:hover:border-blue-400'
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
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 resize-none"
                  value={fraseAtual}
                  rows={Math.ceil(fraseAtual.length / 80) + 1}
                />
                <button
                  onClick={() => copyText(fraseRef)}
                  className="absolute top-2 right-2 text-xs text-[#0A3D91] dark:text-blue-400 hover:underline"
                >
                  Copiar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Executivo logado */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Executivo para PDF</p>
          {hasExecutivoProfileData(executivoProfile) ? (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-3 py-2 text-sm text-green-900 dark:text-green-200">
              {executivoProfile.nome || 'Executivo Loovi'}
              {executivoProfile.email ? ` • ${executivoProfile.email}` : ''}
              {executivoProfile.telFormatado ? ` • ${executivoProfile.telFormatado}` : ''}
            </div>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Não foi possível carregar os dados do executivo logado. Faça login novamente para gerar o PDF.
            </p>
          )}
        </div>

        {/* PDF buttons */}
        {hook.resultado && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gerar PDF</p>
            <div className="flex flex-wrap gap-2">
              {[['essencial', 'Essencial'], ['semVidro', 'Sem Vidros'], ['completo', 'Completo']].map(([key, label]) => (
                <button
                  key={key}
                  disabled={pdfLoading || !vendedorObj}
                  onClick={() => handleGerarPDF(key)}
                  className="px-4 py-2 rounded-lg bg-[#0A3D91] dark:bg-blue-600 text-white text-sm font-medium hover:bg-[#3E7CB1] dark:hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
