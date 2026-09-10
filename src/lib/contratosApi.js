import { parseJwt } from './jwt'
import { endExpiredSession, SESSION_EXPIRED_MESSAGE } from './authSession'

// Contratos agora vêm do nosso próprio backend (server/loovi-api), que persiste
// os dados ingeridos da Loovi - em vez de bater direto na Loovi a cada busca
// via proxy. A API exige o mesmo Bearer token de sessão (validado via JWKS).
const CONTRATOS_BASE_URL = `${import.meta.env.VITE_LOOVI_API_URL || 'http://localhost:3000'}/contratos`
// Endpoint real usado pelo portal (escritoriovirtual.loovi.com.br) para os dados
// cadastrais do executivo - devolve o nome real (ex: "nomeCliente"), diferente
// do endpoint antigo ObterVendedor (pag45vto72...) que não trazia o nome.
const VENDEDOR_BASE_URL = `${import.meta.env.VITE_PROXY_URL || 'http://localhost:8787'}/api/proxy/api/sap-parceiro/executivo/portal`
// Endpoint antigo (proxy -> api-gateway.loovi.app.br direto). O backend novo
// (loovi-api) só tem em base os contratos do slp ingerido via carga (LOOVI_SLP);
// para a busca manual por código de vendedor arbitrário usamos este proxy, que
// aceita qualquer slp e não depende do que já foi ingerido no banco novo.
const CONTRATOS_LEGADO_BASE_URL = `${import.meta.env.VITE_PROXY_URL || 'http://localhost:8787'}/api/proxy/api/sap-contrato/ativos`
// Endpoint antigo "ObterVendedor" (o mesmo usado antes em src/frontend/meuscontratos/script.js).
// Chamado via proxy local (chamada direta do navegador é bloqueada por CORS) - devolve
// a lista completa de clientes/contratos do vendedor de uma vez, sem paginação nem
// filtro de período. Usado pela busca manual.
const CONTRATOS_VENDEDOR_LEGADO_BASE_URL = `${import.meta.env.VITE_PROXY_URL || 'http://localhost:8787'}/api/proxy/api/saphana-executivo`

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
    take: '100',
  })
  if (cursor) params.set('cursor', cursor)
  const url = `${CONTRATOS_BASE_URL}?${params.toString()}&_ts=${Date.now()}`
  const headers = {
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
const MAX_PAGINAS_CONTRATOS = 200 // 200 páginas x take=100 = até 20.000 contratos; além disso é sinal de loop/bug da API.

export async function fetchContratos(codigoVendedor, token, { dataInicio, dataFim } = {}) {
  let cursor = null
  const cursoresVistos = new Set()
  const itens = []
  let paginas = 0

  do {
    const page = await fetchContratosPage(codigoVendedor, token, { dataInicio, dataFim, cursor })
    itens.push(...extractListaContratos(page))
    paginas += 1

    const nextCursor = page?.data?.nextCursor ?? null
    if (!nextCursor) break

    // Cobre tanto a API repetindo o mesmo cursor quanto um ciclo (A -> B -> A).
    if (cursoresVistos.has(nextCursor) || paginas >= MAX_PAGINAS_CONTRATOS) {
      console.warn('[contratos] cursor não avança (repetido ou ciclo detectado), interrompendo paginação.')
      break
    }

    cursoresVistos.add(nextCursor)
    cursor = nextCursor
  } while (cursor)

  return itens
}

async function fetchContratosPageLegado(codigoVendedor, token, { dataInicio, dataFim, cursor } = {}) {
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
  const url = `${CONTRATOS_LEGADO_BASE_URL}?${params.toString()}&_ts=${Date.now()}`
  const headers = {
    requester: 'Portal',
    Accept: 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[contratos-legado] falha ao buscar contratos (${res.status}):`, body)

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

    throw new Error('Não foi possível carregar os contratos no período selecionado. Tente novamente em instantes.')
  }

  const body = await res.json()
  if (body?.success === false) {
    throw new Error(body.message || 'Não foi possível carregar os contratos no período selecionado.')
  }
  return body
}

// Busca contratos direto na Loovi (via proxy), aceitando qualquer código de
// vendedor - usada pela busca manual em "Meus Contratos", já que o backend
// novo (loovi-api) só tem os dados do vendedor configurado na ingestão.
export async function fetchContratosLegado(codigoVendedor, token, { dataInicio, dataFim } = {}) {
  let cursor = null
  const cursoresVistos = new Set()
  const itens = []
  let paginas = 0

  do {
    const page = await fetchContratosPageLegado(codigoVendedor, token, { dataInicio, dataFim, cursor })
    itens.push(...extractListaContratos(page))
    paginas += 1

    const nextCursor = page?.data?.nextCursor ?? null
    if (!nextCursor) break

    if (cursoresVistos.has(nextCursor) || paginas >= MAX_PAGINAS_CONTRATOS) {
      console.warn('[contratos-legado] cursor não avança (repetido ou ciclo detectado), interrompendo paginação.')
      break
    }

    cursoresVistos.add(nextCursor)
    cursor = nextCursor
  } while (cursor)

  return itens
}

// Busca contratos no endpoint antigo "ObterVendedor" (via proxy), sem token/período
// (a API não os aceita) - retorna a lista completa de clientes do vendedor.
export async function fetchContratosVendedorLegado(codigoVendedor) {
  const res = await fetch(`${CONTRATOS_VENDEDOR_LEGADO_BASE_URL}/${String(codigoVendedor).trim()}`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ',
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[contratos-vendedor-legado] falha ao buscar contratos (${res.status}):`, body)
    throw new Error('Não foi possível carregar os contratos no período selecionado. Tente novamente em instantes.')
  }
  return res.json()
}

export function extractListaContratos(data) {
  if (Array.isArray(data)) return data
  return data?.data?.itens ?? data?.data ?? data?.contratos ?? data?.Contratos ?? []
}
