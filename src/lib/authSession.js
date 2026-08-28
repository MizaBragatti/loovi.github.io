import { parseJwt } from './jwt'

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Faça login novamente.'

// Acesso temporariamente aberto para validação do portal. Reverter para false
// quando o login voltar a ser obrigatório.
export const TEMPORARY_PUBLIC_ACCESS = true

const SESSION_KEYS = ['idToken', 'accessToken', 'refreshToken', 'executivoProfile']

export function clearSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
}

function isExplicitlyExpired(token) {
  const payload = parseJwt(token)
  // O SSO pode entregar tokens que não expõem o claim `exp`. Nesse caso a
  // validade é confirmada pela própria API; só bloqueamos localmente quando
  // existe uma data de expiração e ela já passou.
  return typeof payload?.exp === 'number' && Date.now() >= payload.exp * 1000
}

// As APIs Loovi autenticam o usuário pelo idToken. Alguns fluxos antigos
// retornam somente accessToken, que permanece como fallback.
export function getActiveAuthToken() {
  const tokens = [localStorage.getItem('idToken'), localStorage.getItem('accessToken')]
  const token = tokens.find((candidate) => candidate && !isExplicitlyExpired(candidate))
  if (token) return token

  clearSession()
  return null
}

// A API de contratos autoriza pelo access token, que carrega os escopos da
// aplicação. Mantemos o id token apenas como fallback de compatibilidade.
export function getActiveContractsToken() {
  const tokens = [localStorage.getItem('accessToken'), localStorage.getItem('idToken')]
  const token = tokens.find((candidate) => candidate && !isExplicitlyExpired(candidate))
  return token ?? null
}

export function hasActiveSession() {
  if (TEMPORARY_PUBLIC_ACCESS) return true
  return Boolean(getActiveAuthToken())
}

export function endExpiredSession() {
  if (TEMPORARY_PUBLIC_ACCESS) return

  clearSession()
  if (window.location.pathname !== '/loovi-login') {
    window.location.replace('/loovi-login')
  }
}
