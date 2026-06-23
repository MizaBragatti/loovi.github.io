import { useState, useEffect, useRef, useCallback } from 'react';
import { getBaseDataForEstado } from '../lib/sapApi';
import { findPlano, computeMensalidades, buildFrases, getCategoriaAgravo, parseBRLToNumber } from '../lib/calculations';
import { saveQuote } from '../lib/history';

const PLATE_URL = 'https://tsrujo7p82.execute-api.us-east-1.amazonaws.com/producao/placas/v2/dados-atualizados/';
const PLATE_RE = /^[A-Z]{3}[-\s]?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i;

function normPlate(v) { return v.toUpperCase().replace(/[^A-Z0-9]/g, ''); }

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

  const calcular = useCallback(async (valorFipe, tipoVeiculo, estadoTarget, suvOverride, utilOverride) => {
    if (!valorFipe || valorFipe <= 0 || !estadoTarget) return;
    setStatus('loading');
    setError('');
    try {
      const data = await getBaseDataForEstado(estadoTarget);
      const plano = findPlano(data, estadoTarget);
      if (!plano) throw new Error(`Plano não encontrado para ${estadoTarget}`);

      let cat = getCategoriaAgravo(tipoVeiculo);
      if (suvOverride) cat = 'CAT_AGRAVO_PICKUP_CAM';
      else if (utilOverride) cat = 'CAT_AGRAVO_OUTROS';
      const isSUVFinal = cat === 'CAT_AGRAVO_PICKUP_CAM';

      const res = computeMensalidades(plano, valorFipe, cat, isSUVFinal);
      setResultado(res);
      setFrases(buildFrases(res));
      setStatus('success');
    } catch (e) {
      setError('Erro ao calcular: ' + (e.message ?? 'Erro desconhecido'));
      setStatus('error');
    }
  }, []);

  const processar = useCallback(async (rawInput, estadoTarget, suvOverride, utilOverride) => {
    const v = rawInput.trim();
    if (!v) { setFipeText(''); setResultado(null); setFrases(null); setStatus('idle'); return; }

    if (PLATE_RE.test(v)) {
      const placa = normPlate(v);
      setStatus('loading');
      setFipeText('Buscando dados da placa...');
      try {
        const resp = await fetch(PLATE_URL + placa);
        if (!resp.ok) throw new Error('Placa não encontrada');
        const data = await resp.json();
        if (!data?.Fipe) throw new Error('Dados FIPE não disponíveis');
        const valorFipe = parseBRLToNumber(data.Fipe.Valor);
        const tipoVeiculo = data.CategoriaLoovi ?? data.TipoVeiculo ?? data.TipoVeculo;
        const modelo = data.Modelo;
        vehicleRef.current = { valorFipe, tipoVeiculo, modelo, placa };
        setFipeText([
          `Ano: ${data.Ano}`,
          `Modelo: ${modelo}`,
          `Fabricante: ${data.Fabricante}`,
          `Tipo Veículo: ${tipoVeiculo ?? '—'}`,
          `Valor FIPE: R$ ${valorFipe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        ].join('\n'));
        setInput('');
        if (!estadoTarget) {
          setStatus('success');
        } else {
          await calcular(valorFipe, tipoVeiculo, estadoTarget, suvOverride, utilOverride);
          saveQuote({ estado: estadoTarget, tipoVeiculo, modelo, valorFipe, vendedor }, placa);
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
      processar(val.toUpperCase(), estado, isSUV, isUtil);
    }, 500);
  }, [processar, estado, isSUV, isUtil]);

  const handleEnter = useCallback(() => {
    clearTimeout(debounceRef.current);
    processar(input, estado, isSUV, isUtil);
  }, [processar, input, estado, isSUV, isUtil]);

  useEffect(() => {
    if (vehicleRef.current.valorFipe > 0 && estado) {
      calcular(vehicleRef.current.valorFipe, vehicleRef.current.tipoVeiculo, estado, isSUV, isUtil);
    }
  }, [estado, isSUV, isUtil, calcular]);

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
