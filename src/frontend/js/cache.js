import { DEFAULT_ESTADOS, BASE_META_KEY, BASE_TTL_MS } from './constants.js';
import { Calcular } from './api.js';

export function readBaseValues() {
  const raw = localStorage.getItem('baseValues');
  if (raw === null) return {};
  try {
    return JSON.parse(raw) || {};
  } catch (e) {
    console.error('Erro ao parsear baseValues do localStorage (corrompido):', e);
    return null;
  }
}

export function getBaseFromLocalStorage(estado) {
  const base = readBaseValues();
  return base[estado] || null;
}

export function readBaseMeta() {
  try {
    return JSON.parse(localStorage.getItem(BASE_META_KEY)) || { updatedAt: 0 };
  } catch (e) {
    return { updatedAt: 0 };
  }
}

export function writeBaseMeta(meta) {
  try {
    localStorage.setItem(BASE_META_KEY, JSON.stringify(meta));
  } catch (e) {}
}

export function isBaseCacheFresh() {
  const meta = readBaseMeta();
  return (Date.now() - (meta.updatedAt || 0)) < BASE_TTL_MS;
}

export async function getBaseDataForEstado(estado) {
  const key = 'baseValues';
  let baseValues = JSON.parse(localStorage.getItem(key)) || {};

  if (!baseValues[estado]) {
    const calculadora = new Calcular();
    try {
      const data = await calculadora.buscarCotacaoSAP(estado);
      baseValues[estado] = data;
      localStorage.setItem(key, JSON.stringify(baseValues));
    } catch (error) {
      return null;
    }
  }

  return baseValues[estado];
}

export async function loadBaseValues() {
  const key = 'baseValues';
  let baseValues = JSON.parse(localStorage.getItem(key)) || {};
  const calculadora = new Calcular();
  const estados = DEFAULT_ESTADOS;

  for (const estado of estados) {
    if (!baseValues[estado]) {
      try {
        const data = await calculadora.buscarCotacaoSAP(estado);
        if (data && (Array.isArray(data.planos) || Array.isArray(data.data?.planos) || Array.isArray(data))) {
          baseValues[estado] = data;
        }
      } catch (error) {}
    }
  }

  localStorage.setItem(key, JSON.stringify(baseValues));
}

export async function loadAllBaseValues(estados = DEFAULT_ESTADOS) {
  const calculadora = new Calcular();
  const results = await Promise.allSettled(estados.map(async (estado) => {
    try {
      const data = await calculadora.buscarCotacaoSAP(estado);
      return { estado, data };
    } catch (e) {
      return { estado, error: e };
    }
  }));

  const baseValues = {};
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      const value = r.value;
      if (value && value.estado && value.data) baseValues[value.estado] = value.data;
    }
  });

  try {
    const existing = readBaseValues() || {};
    const merged = Object.assign({}, existing, baseValues);
    localStorage.setItem('baseValues', JSON.stringify(merged));
    writeBaseMeta({ updatedAt: Date.now() });
    return merged;
  } catch (e) {
    return null;
  }
}

