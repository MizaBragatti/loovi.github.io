import { useState, useEffect, useRef, useCallback } from 'react';
import { getBaseDataForEstado } from '../lib/sapApi';
import { findPlano, computeMensalidades, buildFrases, getCategoriaAgravo, parseBRLToNumber } from '../lib/calculations';
import { saveQuote } from '../lib/history';
import { endExpiredSession, getActiveAuthToken, SESSION_EXPIRED_MESSAGE } from '../lib/authSession';

const PLATE_URL = 'http://localhost:8787/api/veiculos/placas/';

const PLATE_RE = /^[A-Z]{3}[-\s]?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i;

function normPlate(v) { return v.toUpperCase().replace(/[^A-Z0-9]/g, ''); }

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') return value;
  }
  return undefined;
}

// Normaliza a resposta de /api/veiculos/placas/{placa}, tolerando variações de shape/caixa.
function extractPlacaData(raw) {
  const data = raw?.data ?? raw?.Data ?? raw?.veiculo ?? raw?.Veiculo ?? raw ?? {};
  const fipe = data?.Fipe ?? data?.fipe ?? data;
  const valorFipe = firstNonEmpty(fipe?.Valor, fipe?.valor, data?.ValorFipe, data?.valorFipe);
  return {
    valor: valorFipe,
    ano: firstNonEmpty(data?.Ano, data?.ano),
    modelo: firstNonEmpty(data?.Modelo, data?.modelo),
    fabricante: firstNonEmpty(data?.Fabricante, data?.fabricante, data?.Marca, data?.marca),
    tipoVeiculo: firstNonEmpty(data?.CategoriaLoovi, data?.categoriaLoovi, data?.TipoVeiculo, data?.tipoVeiculo, data?.TipoVeculo),
  };
}

export default function useConsulta() {
  const [input, setInput] = useState('');
  const [fipeText, setFipeText] = useState('');
  const [estado, setEstado] = useState(null);
  const [isSUV, setIsSUV] = useState(false);
  const [isUtil, setIsUtil] = useState(false);
  const [vendedor, setVendedor] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [frases, setFrases] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const vehicleRef = useRef({ valorFipe: 0, tipoVeiculo: null, modelo: null, placa: null });
  const debounceRef = useRef(null);
  const latestRef = useRef({ estado, isSUV, isUtil });
  latestRef.current = { estado, isSUV, isUtil };

  const calcular = useCallback(async (valorFipe, tipoVeiculo, estadoTarget, suvOverride, utilOverride) => {
    if (!valorFipe || valorFipe <= 0 || !estadoTarget) return;
    setStatus('loading');
    setError('');
    try {
      const data = await getBaseDataForEstado(estadoTarget);
      const plano = findPlano(data, estadoTarget);
      if (!plano) throw new Error(`Plano não encontrado para ${estadoTarget}`);

      let cat = getCategoriaAgravo(tipoVeiculo);
      let isSUVFinal = cat === 'CAT_AGRAVO_PICKUP_CAM';
      if (suvOverride) { cat = 'CAT_AGRAVO_PICKUP_CAM'; isSUVFinal = true; }
      else if (utilOverride) { cat = 'CAT_AGRAVO_OUTROS'; isSUVFinal = true; }

      const res = computeMensalidades(plano, valorFipe, cat, isSUVFinal);
      setResultado(res);
      setFrases(buildFrases(res));
      setStatus('success');
      const { placa, modelo } = vehicleRef.current;
      saveQuote({ estado: estadoTarget, tipoVeiculo, modelo, valorFipe, vendedor }, placa);
    } catch (e) {
      setError('Erro ao calcular: ' + (e.message ?? 'Erro desconhecido'));
      setStatus('error');
    }
  }, [vendedor]);

  const processar = useCallback(async (rawInput, estadoTarget, suvOverride, utilOverride) => {
    const v = rawInput.trim();
    if (!v) { setFipeText(''); setResultado(null); setFrases(null); setStatus('idle'); return; }

    if (PLATE_RE.test(v)) {
      const placa = normPlate(v);
      setStatus('loading');
      setFipeText('Buscando dados da placa...');
      try {
       const token = getActiveAuthToken();
       if (!token) {
         endExpiredSession();
         throw new Error(SESSION_EXPIRED_MESSAGE);
       }
const resp = await fetch(PLATE_URL + placa, {
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
});

if (resp.status === 401 || resp.status === 403) {
  endExpiredSession();
  throw new Error(SESSION_EXPIRED_MESSAGE);
}
if (resp.status === 404) throw new Error('Placa não encontrada.');
if (!resp.ok) throw new Error('Erro na consulta.');

        const raw = await resp.json();
        const parsed = extractPlacaData(raw);
        if (!parsed.valor) throw new Error('Dados FIPE não disponíveis');
        const valorFipe = parseBRLToNumber(parsed.valor);
        const tipoVeiculo = parsed.tipoVeiculo;
        const modelo = parsed.modelo;
        vehicleRef.current = { valorFipe, tipoVeiculo, modelo, placa };
        setFipeText([
          `Ano: ${parsed.ano}`,
          `Modelo: ${modelo}`,
          `Fabricante: ${parsed.fabricante}`,
          `Tipo Veículo: ${tipoVeiculo ?? '—'}`,
          `Valor FIPE: R$ ${valorFipe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        ].join('\n'));
        setInput('');
        if (!estadoTarget) {
          setStatus('success');
        } else {
          await calcular(valorFipe, tipoVeiculo, estadoTarget, suvOverride, utilOverride);
        }
      } catch (e) {
        setFipeText('Erro ao buscar placa. Verifique se está correta.');
        setStatus('error');
        setError(e.message);
      }
      return;
    }

    const num = parseFloat(v.replace(/[^\d]/g, ''));
    if (!isNaN(num) && num > 0) {
      vehicleRef.current = { valorFipe: num, tipoVeiculo: null, modelo: null, placa: null };
      setFipeText(`Valor FIPE: R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      await calcular(num, null, estadoTarget, suvOverride, utilOverride);
      return;
    }

    setFipeText('Entrada inválida. Digite placa ou valor numérico.');
    setStatus('error');
  }, [calcular]);

  const handleInput = useCallback((val) => {
    setInput(val.toUpperCase());
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { estado: estadoAtual, isSUV: suvAtual, isUtil: utilAtual } = latestRef.current;
      processar(val.toUpperCase(), estadoAtual, suvAtual, utilAtual);
    }, 500);
  }, [processar]);

  const handleEnter = useCallback(() => {
    clearTimeout(debounceRef.current);
    processar(input, estado, isSUV, isUtil);
  }, [processar, input, estado, isSUV, isUtil]);

  useEffect(() => {
    if (!estado) {
      setResultado(null);
      setFrases(null);
      return;
    }
    if (vehicleRef.current.valorFipe > 0) {
      calcular(vehicleRef.current.valorFipe, vehicleRef.current.tipoVeiculo, estado, isSUV, isUtil);
    }
  }, [estado, isSUV, isUtil, calcular]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const toggleSUV = () => { setIsSUV(p => !p); if (!isSUV) setIsUtil(false); };
  const toggleUtil = () => { setIsUtil(p => !p); if (!isUtil) setIsSUV(false); };

  return {
    input, handleInput, handleEnter,
    fipeText,
    estado, setEstado,
    isSUV, toggleSUV,
    isUtil, toggleUtil,
    vendedor, setVendedor,
    resultado, frases,
    status, error,
    vehicleRef,
  };
}
