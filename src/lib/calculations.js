import { PlanService } from './planService';

export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function getIndiceAndLooviFipe(valorFipe) {
  const breaks = [10000,20000,30000,40000,50000,60000,70000,80000,90000,100000,110000,120000,130000,140000,150000];
  for (let i = 0; i < breaks.length; i++) {
    if (valorFipe <= breaks[i]) return { indice: i, looviFipe: (i + 1) * 10 };
  }
  return { indice: 14, looviFipe: 150 };
}

export function getCategoriaAgravo(tipoVeiculo) {
  if (!tipoVeiculo) return 'CAT_AGRAVO_VEICULO_LEVE';
  const t = String(tipoVeiculo).toLowerCase();
  if (t.includes('suv') || t.includes('pickup') || t.includes('camionete')) return 'CAT_AGRAVO_PICKUP_CAM';
  if (t.includes('util') || t.includes('utilitário') || t.includes('utilitario') || t.includes('van') || t.includes('furgão') || t.includes('furgon')) return 'CAT_AGRAVO_OUTROS';
  return 'CAT_AGRAVO_VEICULO_LEVE';
}

const PLANO_PREFIXES = [
  'ROUBO_FURTO_PT_', 'ROUBO_FURTO_PT_RAST_',
  'LICIT_ROUBO_FURTO_PT_', 'LICIT_ROUBO_FURTO_PT_RAST_',
  'ROUBO_FURTO_PT_ANUAL_', 'ROUBO_FURTO_PT_RAST_ANUAL_',
  'LICIT_ROUBO_FURTO_PT_ANUAL_', 'LICIT_ROUBO_FURTO_PT_RAST_ANUAL_',
  'TESTE_',
];

export function findPlano(data, estado) {
  const planos = data?.planos ?? data?.data?.planos ?? data;
  if (!Array.isArray(planos)) return null;
  for (const prefix of PLANO_PREFIXES) {
    const found = planos.find(p => p.idPlano === prefix + estado);
    if (found) return found;
  }
  return null;
}

function calcularValorColisao(plano, indice) {
  const faixaFipe = `CAT_FIPE_${(indice + 1) * 10}K`;
  const lti = plano.itensPlano?.find(i => i.codigoItem === 'SRV_SEGUROS_LTI');

  const fromSub = (subCode, catCode, usePadrao = false) => {
    if (!lti?.formularioSubItens) return 0;
    const sub = lti.formularioSubItens.subItemPlano.find(s => s.codigoItem === subCode);
    if (!sub?.formularioCategorias) return 0;
    const cats = sub.formularioCategorias.categoriaSubItem;
    const cat = usePadrao ? cats.find(c => c.itemPadrao) : cats.find(c => c.codigoItem === catCode);
    return cat?.preco ?? 0;
  };

  const srvLoovi = plano.itensPlano?.find(i => i.codigoItem === 'SRV_SERVICO_LOOVI');
  const fromLoovi = (subCode) => {
    if (!srvLoovi?.formularioSubItens) return 0;
    const sub = srvLoovi.formularioSubItens.subItemPlano.find(s => s.codigoItem === subCode);
    if (!sub?.formularioCategorias) return 0;
    return sub.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === faixaFipe)?.preco ?? 0;
  };

  const appItem = plano.itensPlano?.find(i => i.codigoItem === 'SRV_SEGUROS_LTI');
  const catSegApp = (() => {
    if (!appItem?.formularioSubItens) return 0;
    const sub = appItem.formularioSubItens.subItemPlano.find(s => s.codigoItem === 'SRV_SEGURO_APP');
    if (!sub?.formularioCategorias) return 0;
    return sub.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === 'CAT_SEG_APP')?.preco ?? 0;
  })();

  let colisao = fromSub('SRV_SEG_COLISAO', faixaFipe)
    + fromSub('SRV_SEG_TERCEIROS', null, true)
    + fromSub('SRV_SEG_TERCEIROS_CORP', null, true)
    + catSegApp;

  const comColisao = fromLoovi('SRV_FIPE_COM_COLISAO');
  const semColisao = fromLoovi('SRV_FIPE_SEM_COLISAO');
  colisao += comColisao > semColisao ? (comColisao - semColisao) : -(semColisao - comColisao);
  colisao += lti?.preco ?? 0;

  return parseFloat(colisao.toFixed(2));
}

export function computeMensalidades(plano, valorFipe, categoriaAgravo, isSUV) {
  const ps = new PlanService();
  const { indice, looviFipe } = getIndiceAndLooviFipe(valorFipe);
  const r = { car: categoriaAgravo, colisao: false, smart: isSUV, vidros: false };

  const mensal = parseFloat(ps.getCalcPlanPrice(plano, looviFipe, r).toFixed(2));
  const vidros = ps.getVidrosPrice(plano);
  const colisao = calcularValorColisao(plano, indice);
  const ativacao = 299.90;

  const mk = (base) => ({
    mensal: parseFloat(base.toFixed(2)),
    primeira: parseFloat((base + ativacao).toFixed(2)),
    anual: parseFloat(((base * 12) + ativacao).toFixed(2)),
  });

  return {
    essencial: { ...mk(mensal), colisao: 0 },
    semVidro: { ...mk(mensal + colisao), colisao },
    completo: { ...mk(mensal + colisao + vidros), colisao },
  };
}

export function buildFrases(res) {
  const f = formatBRL;
  const { essencial, semVidro, completo } = res;
  return {
    essencial: `Seguro Essencial no Plano Anual é de ${f(essencial.anual)} em até 12x sem juros de ${f(essencial.mensal)} no cartão de crédito. Já no Plano Recorrente Mensal o Valor da entrada é de ${f(essencial.primeira)} no cartão de crédito + mensais sem juros de ${f(essencial.mensal)} debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.`,
    semVidro: `Seguro Completo sem Vidros no Plano Anual é de ${f(semVidro.anual)} em até 12x sem juros de ${f(semVidro.mensal)} no cartão de crédito. Já no Plano Recorrente Mensal o Valor da entrada é de ${f(semVidro.primeira)} no cartão de crédito + mensais sem juros de ${f(semVidro.mensal)} debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.`,
    completo: `Seguro Completo com Colisão e Opcional Vidros (faróis, lanternas e retrovisores) no Plano Anual é de ${f(completo.anual)} em até 12x sem juros de ${f(completo.mensal)} no cartão de crédito. Já no Plano Recorrente Mensal o Valor da entrada é de ${f(completo.primeira)} no cartão de crédito + mensais sem juros de ${f(completo.mensal)} debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.`,
  };
}

export function parseBRLToNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.,-]/g, '').trim();
  if (!cleaned) return 0;
  if (cleaned.includes('.') && cleaned.includes(',')) return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  if (cleaned.includes(',')) return parseFloat(cleaned.replace(',', '.')) || 0;
  return parseFloat(cleaned) || 0;
}
