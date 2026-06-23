const BASE_KEY = 'baseValues';
const BASE_META_KEY = 'baseValues_meta';
const BASE_TTL_MS = 24 * 60 * 60 * 1000;
const SAP_URL = 'https://ticjxjby64.execute-api.us-east-1.amazonaws.com/producao/proxy/v2/SAP';
const SAP_KEY = 'RRcW9gj2tZ6pSVsnbpmKhshpXC3yR9EklCwqQyh0';
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
  const payload = JSON.stringify({
    url: `https://sapiis.loovi.com.br:60000/plano/Api/v1/obterPlanosPorEstado/${estado.toUpperCase()}/app`,
    metodo: 'GET',
    headers: { requester: 'Portal', cotacao: '' },
    body: {},
  });
  const resp = await fetch(SAP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': SAP_KEY },
    body: JSON.stringify(btoa(payload)),
  });
  const data = await resp.json();
  if (data?.mensagem) throw new Error(data.mensagem);
  const str = typeof data === 'string' ? atob(data) : '';
  return str ? JSON.parse(str) : data;
}

export async function loadAllBaseValues(estados = DEFAULT_ESTADOS) {
  const results = await Promise.allSettled(
    estados.map(async estado => ({ estado, data: await buscarCotacaoSAP(estado) }))
  );
  const fresh = {};
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value?.estado && r.value?.data) {
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
  if (cached[estado]) return cached[estado];
  const data = await buscarCotacaoSAP(estado);
  const updated = { ...cached, [estado]: data };
  try { localStorage.setItem(BASE_KEY, JSON.stringify(updated)); } catch {}
  return data;
}
