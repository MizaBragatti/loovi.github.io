import { endExpiredSession, getActiveContractsToken, SESSION_EXPIRED_MESSAGE } from './authSession';
import { parseJwt } from './jwt';

const BASE_KEY = 'baseValues';
const BASE_META_KEY = 'baseValues_meta';
const BASE_TTL_MS = 24 * 60 * 60 * 1000;
const SAP_URL = 'http://localhost:8787/api/proxy/api/sap-cotacao/planos/catalogo';
export const DEFAULT_ESTADOS = ['SP', 'MG', 'RJ', 'SC', 'RS'];

function readCache() {
  try { return JSON.parse(localStorage.getItem(BASE_KEY)) || {}; } catch { return {}; }
}

function isCacheFresh() {
  try {
    const meta = JSON.parse(localStorage.getItem(BASE_META_KEY)) || {};
    return (Date.now() - (meta.updatedAt || 0)) < BASE_TTL_MS;
  } catch { return false; }
}

export async function buscarCotacaoSAP(estado) {
  // O catálogo de planos é autorizado pelo access token do SSO, que contém
  // o escopo cotacao_api usado pelo API Gateway.
  const token = getActiveContractsToken();
  if (!token) {
    endExpiredSession();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }
  console.log('[sap-cotacao] token enviado como Bearer:', parseJwt(token));
  const resp = await fetch(`${SAP_URL}/${encodeURIComponent(estado.toUpperCase())}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const data = await resp.json();
  if (resp.status === 401 || resp.status === 403) {
    endExpiredSession();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }
  if (data?.Erro) throw new Error(data.Erro);
  if (data?.mensagem) throw new Error(data.mensagem);
  if (data?.message) throw new Error(data.message);
  if (!resp.ok) throw new Error(`Falha ao consultar SAP (${resp.status})`);
  return data;
}

function temPlanosValidos(data) {
  const planos = data?.planos ?? data?.data?.planos ?? data;
  return Array.isArray(planos) && planos.length > 0;
}

export async function loadAllBaseValues(estados = DEFAULT_ESTADOS) {
  const results = await Promise.allSettled(
    estados.map(async estado => ({ estado, data: await buscarCotacaoSAP(estado) }))
  );
  const fresh = {};
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value?.estado && temPlanosValidos(r.value?.data)) {
      fresh[r.value.estado] = r.value.data;
    }
  });
  const merged = { ...readCache(), ...fresh };
  try {
    localStorage.setItem(BASE_KEY, JSON.stringify(merged));
    localStorage.setItem(BASE_META_KEY, JSON.stringify({ updatedAt: Date.now() }));
  } catch {}
  return merged;
}

export async function getOrLoadBaseValues(estados = DEFAULT_ESTADOS) {
  const cached = readCache();
  if (isCacheFresh() && Object.keys(cached).length > 0) return cached;
  return loadAllBaseValues(estados);
}

export async function getBaseDataForEstado(estado) {
  const cached = readCache();
  if (cached[estado] && temPlanosValidos(cached[estado])) return cached[estado];
  const data = await buscarCotacaoSAP(estado);
  if (temPlanosValidos(data)) {
    const updated = { ...cached, [estado]: data };
    try { localStorage.setItem(BASE_KEY, JSON.stringify(updated)); } catch {}
  }
  return data;
}
