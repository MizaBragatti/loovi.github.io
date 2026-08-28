import { parseJwt } from './jwt'
import { endExpiredSession, SESSION_EXPIRED_MESSAGE } from './authSession'

const CONTRATOS_BASE_URL = 'http://localhost:8787/api/proxy/api/sap-contrato/ativos'
const VENDEDOR_BASE_URL = 'https://pag45vto72.execute-api.us-east-1.amazonaws.com/producao/v1/saphana/crm/Api/v1/ObterVendedor'

function toDateParam(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10)
}

export function getCodigoVendedorFromToken(token) {
  const payload = parseJwt(token)
  // `slp` no token novo (SSO), `custom:slp` no token antigo (Cognito).
  return payload?.slp ?? payload?.['custom:slp'] ?? null
}

// Busca os dados cadastrais do vendedor (nome/email/telefone reais) pelo código (custom:slp).
// Usado para preencher o PDF com dados confiáveis quando o idToken traz apenas placeholders/mascarados.
export async function fetchVendedorInfo(codigoVendedor, token) {
  const headers = {
    Accept: 'application/json',
    'content-type': 'application/json',
    requester: 'Portal',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${VENDEDOR_BASE_URL}/${codigoVendedor}`, { headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      // Dados cadastrais são complementares ao perfil do token. Esta rota
      // pode ter autorização própria; não devemos derrubar uma sessão que
      // acabou de ser validada pelo SSO por causa dela.
      throw new Error(`Não foi possível carregar os dados do vendedor (${res.status}).`)
    }
    console.error(`[vendedor] falha ao buscar dados do vendedor (${res.status}):`, body)
    throw new Error(`Não foi possível carregar os dados do vendedor (${res.status}).`)
  }
  return res.json()
}

async function fetchContratosPage(codigoVendedor, token, { dataInicio, dataFim, cursor } = {}) {
  const fim = dataFim ?? Math.floor(Date.now() / 1000)
  const inicio = dataInicio ?? fim - 30 * 24 * 60 * 60
  const params = new URLSearchParams({
    slp: String(codigoVendedor).trim(),
    startDateFrom: toDateParam(inicio),
    startDateTo: toDateParam(fim),
    apenasVigentes: 'false',
    incluirItens: 'true',
    take: '100',
  })
  if (cursor) params.set('cursor', cursor)
  const url = `${CONTRATOS_BASE_URL}?${params.toString()}&_ts=${Date.now()}`
  const headers = {
    requester: 'Portal',
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[contratos] falha ao buscar contratos (${res.status}):`, body)

    if (res.status === 401 || res.status === 403) {
      endExpiredSession()
      throw new Error(SESSION_EXPIRED_MESSAGE)
    }

    if (res.status === 400) {
      throw new Error('Período inválido para consulta. Ajuste as datas e tente novamente.')
    }

    if (res.status >= 500) {
      throw new Error('Serviço de contratos indisponível no momento. Tente novamente em instantes.')
    }

    throw new Error('Não foi possível carregar seus contratos no período selecionado. Tente novamente em instantes.')
  }

  const body = await res.json()
  if (body?.success === false) {
    throw new Error(body.message || 'Não foi possível carregar seus contratos no período selecionado.')
  }
  return body
}

// A API pagina por cursor (data.nextCursor); segue as páginas até esgotar
// para não perder contratos quando um período tem mais de 100 itens.
export async function fetchContratos(codigoVendedor, token, { dataInicio, dataFim } = {}) {
  let cursor = null
  const itens = []

  do {
    const page = await fetchContratosPage(codigoVendedor, token, { dataInicio, dataFim, cursor })
    itens.push(...extractListaContratos(page))
    cursor = page?.data?.nextCursor ?? null
  } while (cursor)

  return itens
}

export function extractListaContratos(data) {
  if (Array.isArray(data)) return data
  return data?.data?.itens ?? data?.data ?? data?.contratos ?? data?.Contratos ?? []
}
