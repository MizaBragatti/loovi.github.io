const BASE_KEY = 'baseValues';
const BASE_META_KEY = 'baseValues_meta';
const BASE_TTL_MS = 24 * 60 * 60 * 1000;
const SAP_URL = 'https://pag45vto72.execute-api.us-east-1.amazonaws.com/producao/v1/saphana/plano/Api/v1/obterPlanosPorEstado';
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
  const token = localStorage.getItem('idToken');
  const resp = await fetch(`${SAP_URL}/${estado.toUpperCase()}/app?_ts=${Date.now()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      requester: 'Portal',
      Accept: 'application/json',
    },
  });
  const data = await resp.json();
  if (data?.Erro) throw new Error(data.Erro);
  if (data?.mensagem) throw new Error(data.mensagem);
  if (data?.message) throw new Error(data.message);
  if (!resp.ok) throw new Error(`Falha ao consultar SAP (${resp.status})`);
  return data;
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
