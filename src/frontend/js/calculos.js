import { kl } from './planService.js';
import { getCategoriaAgravo, getIndiceAndLooviFipe } from './utils.js';
import { getBaseFromLocalStorage, readBaseValues, getBaseDataForEstado } from './cache.js';

export function computeMensalidadesFromCache(estado, valorFipe, placa = null, tipoVeiculo = null) {
  const base = getBaseFromLocalStorage(estado);
  if (!base) throw new Error(`Dados base para estado ${estado} não encontrados no cache`);

  const planos = base.planos || base.data?.planos || base;
  const plano = Array.isArray(planos) ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado) : null;
  if (!plano) throw new Error(`Plano não encontrado para estado ${estado} no cache`);

  const planService = new kl();
  const categoriaAgravo = getCategoriaAgravo(tipoVeiculo);
  const isSUV = categoriaAgravo === "CAT_AGRAVO_PICKUP_CAM";
  const r = { car: categoriaAgravo, colisao: false, smart: isSUV, vidros: false };

  const mensalidades = [];
  for (let i = 10; i <= 150; i += 10) {
    mensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, r).toFixed(2)));
  }

  const { indice, looviFipe } = getIndiceAndLooviFipe(valorFipe);

  const valorMensalidadeEssencial  = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { ...r }).toFixed(2));
  const valorMensalidadeSemVidro   = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { ...r, colisao: true }).toFixed(2));
  const valorMensalidadeCompleto   = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { ...r, colisao: true, vidros: true }).toFixed(2));

  const valorAtivacao = 299.90;

  return {
    essencial: {
      mensal: valorMensalidadeEssencial,
      primeira: valorMensalidadeEssencial + valorAtivacao,
      anual: (valorMensalidadeEssencial * 12) + valorAtivacao
    },
    semVidro: {
      mensal: valorMensalidadeSemVidro,
      primeira: valorMensalidadeSemVidro + valorAtivacao,
      anual: (valorMensalidadeSemVidro * 12) + valorAtivacao
    },
    completo: {
      mensal: valorMensalidadeCompleto,
      primeira: valorMensalidadeCompleto + valorAtivacao,
      anual: (valorMensalidadeCompleto * 12) + valorAtivacao
    },
    placa,
    estado,
    valorFipe,
    mensalidadesArray: mensalidades,
    escolhidoIndice: indice
  };
}

export function computeMensalidadesForAllStates(valorFipe, placa = null) {
  const base = readBaseValues();
  const results = {};
  Object.keys(base).forEach(estado => {
    try {
      results[estado] = computeMensalidadesFromCache(estado, valorFipe, placa);
    } catch (e) {
      results[estado] = { error: e.message };
    }
  });
  return results;
}

export async function calculateMensalidades(estado, valorFipe, placa = null, tipoVeiculo = null) {
  const resultado = await getBaseDataForEstado(estado);
  if (!resultado) throw new Error(`Failed to get base data for estado: ${estado}`);

  const planos = resultado.planos || resultado.data?.planos || resultado;
  const plano = Array.isArray(planos) ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado) : null;
  if (!plano) throw new Error(`Plano not found for estado: ${estado}`);

  const planService = new kl();
  const categoriaAgravo = getCategoriaAgravo(tipoVeiculo);
  const isSUV = categoriaAgravo === "CAT_AGRAVO_PICKUP_CAM";
  const r = { car: categoriaAgravo, colisao: false, smart: isSUV, vidros: false };

  const mensalidades = [];
  for (let i = 10; i <= 150; i += 10) {
    mensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, r).toFixed(2)));
  }

  const { indice, looviFipe } = getIndiceAndLooviFipe(valorFipe);

  const valorMensalidadeEssencial = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { car: categoriaAgravo, colisao: false,  smart: isSUV, vidros: false }).toFixed(2));
  const valorMensalidadeSemVidro  = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { car: categoriaAgravo, colisao: true,   smart: isSUV, vidros: false }).toFixed(2));
  const valorMensalidadeCompleto  = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { car: categoriaAgravo, colisao: true,   smart: isSUV, vidros: true  }).toFixed(2));

  const valorAtivacao = 299.90;

  return {
    essencial: {
      mensal: valorMensalidadeEssencial,
      primeira: valorMensalidadeEssencial + valorAtivacao,
      anual: (valorMensalidadeEssencial * 12) + valorAtivacao
    },
    semVidro: {
      mensal: valorMensalidadeSemVidro,
      primeira: valorMensalidadeSemVidro + valorAtivacao,
      anual: (valorMensalidadeSemVidro * 12) + valorAtivacao
    },
    completo: {
      mensal: valorMensalidadeCompleto,
      primeira: valorMensalidadeCompleto + valorAtivacao,
      anual: (valorMensalidadeCompleto * 12) + valorAtivacao
    },
    placa,
    estado,
    valorFipe
  };
}

export async function calcularMensalidadeComAcrescimos(valorFipe, tipoVeiculo, estado, dadosPlanoAPI = null, colisaoSelecionado = false, vidrosSelecionado = false) {
  if (!dadosPlanoAPI) {
    dadosPlanoAPI = await getBaseDataForEstado(estado);
  }

  const planos = dadosPlanoAPI.planos || dadosPlanoAPI.data?.planos || dadosPlanoAPI;
  if (!Array.isArray(planos)) throw new Error(`Dados de planos inválidos para estado ${estado}`);

  const possiveisPlanos = [
    "ROUBO_FURTO_PT_" + estado,
    "ROUBO_FURTO_PT_RAST_" + estado,
    "ROUBO_FURTO_PT_" + estado.toUpperCase(),
    "ROUBO_FURTO_PT_RAST_" + estado.toUpperCase(),
    "LICIT_ROUBO_FURTO_PT_" + estado,
    "LICIT_ROUBO_FURTO_PT_RAST_" + estado,
    "LICIT_ROUBO_FURTO_PT_ANUAL_" + estado,
    "LICIT_ROUBO_FURTO_PT_RAST_ANUAL_" + estado,
    "TESTE_" + estado,
    "ROUBO_FURTO_PT_ANUAL_" + estado,
    "ROUBO_FURTO_PT_RAST_ANUAL_" + estado
  ];

  let plano = null;
  for (const nomePlano of possiveisPlanos) {
    plano = planos.find(p => p.idPlano === nomePlano);
    if (plano) break;
  }

  if (!plano) {
    throw new Error(`Plano não encontrado para estado ${estado}. Planos disponíveis: ${planos.map(p => p.idPlano).join(', ')}`);
  }

  const planService = new kl();
  const { looviFipe } = getIndiceAndLooviFipe(valorFipe);

  let categoriaAgravo = "CAT_AGRAVO_VEICULO_LEVE";
  const suvElement = document.getElementById('suv');
  const utilElement = document.getElementById('util');
  if (suvElement && suvElement.checked) {
    categoriaAgravo = "CAT_AGRAVO_PICKUP_CAM";
  } else if (utilElement && utilElement.checked) {
    categoriaAgravo = "CAT_AGRAVO_OUTROS";
  } else if (tipoVeiculo) {
    categoriaAgravo = getCategoriaAgravo(tipoVeiculo);
  }

  const isSUVBase = categoriaAgravo === "CAT_AGRAVO_PICKUP_CAM";
  let valorBase = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { car: categoriaAgravo, colisao: colisaoSelecionado, smart: isSUVBase, vidros: false }).toFixed(2));

  if (vidrosSelecionado) {
    valorBase += planService.getVidrosPrice(plano);
  }

  return parseFloat(valorBase.toFixed(2));
}
