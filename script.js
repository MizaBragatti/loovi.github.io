async function loadBaseValues() {
  const key = 'baseValues';
  let baseValues = JSON.parse(localStorage.getItem(key)) || {};

  const calculadora = new Calcular();
  const estados = ['MG', 'SP', 'RJ', 'SC', 'RS']; // Estados específicos

  for (const estado of estados) {
    if (!baseValues[estado]) {
      try {
        const data = await calculadora.buscarCotacaoSAP(estado);
        baseValues[estado] = data;
        console.log(`Loaded base values for ${estado}`);
      } catch (error) {
        console.error(`Error loading for ${estado}:`, error);
      }
    }
  }

  localStorage.setItem(key, JSON.stringify(baseValues));
  console.log('Base values loaded and cached');
}

async function getBaseDataForEstado(estado) {
  const key = 'baseValues';
  let baseValues = JSON.parse(localStorage.getItem(key)) || {};

  if (!baseValues[estado]) {
    console.log(`Fetching data for ${estado}`);
    const calculadora = new Calcular();
    try {
      const data = await calculadora.buscarCotacaoSAP(estado);
      baseValues[estado] = data;
      localStorage.setItem(key, JSON.stringify(baseValues));
      console.log(`Saved data for ${estado}`);
    } catch (error) {
      console.error(`Error fetching for ${estado}:`, error);
      return null;
    }
  }

  return baseValues[estado];
}

// Utilitário: retorna o objeto completo `baseValues` do localStorage (ou um objeto vazio)
function readBaseValues() {
  const raw = localStorage.getItem('baseValues');
  if (raw === null) return {};
  try {
    return JSON.parse(raw) || {};
  } catch (e) {
    // localStorage está corrompido: registre e retorne null para sinalizar corrupção
    console.error('Erro ao parsear baseValues do localStorage (corrompido):', e);
    return null;
  }
}

// Global helper: simple auto-resize for a textarea (height = scrollHeight)
function autoResize(textarea) {
  if (!textarea) return;
  try {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  } catch (e) {
    // ignore
  }
}

// Utilitário: retorna os dados do estado específico guardados em baseValues (ou null)
function getBaseFromLocalStorage(estado) {
  const base = readBaseValues();
  return base[estado] || null;
}

// Default estados list used across the app
const DEFAULT_ESTADOS = ['MG', 'SP', 'RJ', 'SC', 'RS'];

// Counter localStorage keys
const COUNTER_KEYS = {
  total: 'contadorTotal',
  hoje: 'contadorHoje',
  semana: 'contadorSemana',
  mes: 'contadorMes',
  ano: 'contadorAno',
  hojeDate: 'contadorHojeDate',
  semanaDate: 'contadorSemanaDate',
  mesDate: 'contadorMesDate',
  anoDate: 'contadorAnoDate'
};

// Get start of week (Monday)
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

// Load counters from localStorage
function loadCounters() {
  return {
    total: parseInt(localStorage.getItem(COUNTER_KEYS.total)) || 0,
    hoje: parseInt(localStorage.getItem(COUNTER_KEYS.hoje)) || 0,
    semana: parseInt(localStorage.getItem(COUNTER_KEYS.semana)) || 0,
    mes: parseInt(localStorage.getItem(COUNTER_KEYS.mes)) || 0,
    ano: parseInt(localStorage.getItem(COUNTER_KEYS.ano)) || 0,
    hojeDate: localStorage.getItem(COUNTER_KEYS.hojeDate) || '',
    semanaDate: localStorage.getItem(COUNTER_KEYS.semanaDate) || '',
    mesDate: localStorage.getItem(COUNTER_KEYS.mesDate) || '',
    anoDate: localStorage.getItem(COUNTER_KEYS.anoDate) || ''
  };
}

// Save counters to localStorage
function saveCounters(counters) {
  localStorage.setItem(COUNTER_KEYS.total, counters.total);
  localStorage.setItem(COUNTER_KEYS.hoje, counters.hoje);
  localStorage.setItem(COUNTER_KEYS.hojeDate, counters.hojeDate);
  localStorage.setItem(COUNTER_KEYS.semana, counters.semana);
  localStorage.setItem(COUNTER_KEYS.semanaDate, counters.semanaDate);
  localStorage.setItem(COUNTER_KEYS.mes, counters.mes);
  localStorage.setItem(COUNTER_KEYS.mesDate, counters.mesDate);
  localStorage.setItem(COUNTER_KEYS.ano, counters.ano);
  localStorage.setItem(COUNTER_KEYS.anoDate, counters.anoDate);
}

// Increment counters on quote
function incrementCounters() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfWeek = getStartOfWeek(now);
  const month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());

  let counters = loadCounters();

  counters.total += 1;

  if (counters.hojeDate !== today) {
    counters.hoje = 1;
    counters.hojeDate = today;
  } else {
    counters.hoje += 1;
  }

  if (counters.semanaDate !== startOfWeek) {
    counters.semana = 1;
    counters.semanaDate = startOfWeek;
  } else {
    counters.semana += 1;
  }

  if (counters.mesDate !== month) {
    counters.mes = 1;
    counters.mesDate = month;
  } else {
    counters.mes += 1;
  }

  if (counters.anoDate !== year) {
    counters.ano = 1;
    counters.anoDate = year;
  } else {
    counters.ano += 1;
  }

  saveCounters(counters);
  return counters;
}


// Cache metadata key and TTL (ms). TTL default 24 hours.
const BASE_META_KEY = 'baseValues_meta';
const BASE_TTL_MS = 24 * 60 * 60 * 1000;

function readBaseMeta() {
  try {
    return JSON.parse(localStorage.getItem(BASE_META_KEY)) || { updatedAt: 0 };
  } catch (e) {
    return { updatedAt: 0 };
  }
}

function writeBaseMeta(meta) {
  try {
    localStorage.setItem(BASE_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Erro ao salvar meta baseValues:', e);
  }
}

function isBaseCacheFresh() {
  const meta = readBaseMeta();
  return (Date.now() - (meta.updatedAt || 0)) < BASE_TTL_MS;
}

// Carrega todos os valores base em paralelo e salva no localStorage
async function loadAllBaseValues(estados = DEFAULT_ESTADOS) {
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
    } else if (r.status === 'rejected') {
      // should not happen due to inner try/catch, but keep safe
      console.warn('Erro ao carregar estado:', r.reason);
    }
  });

  try {
    // Merge with existing baseValues to avoid losing any previously cached states
    const existing = readBaseValues() || {};
    const merged = Object.assign({}, existing, baseValues);
    localStorage.setItem('baseValues', JSON.stringify(merged));
    writeBaseMeta({ updatedAt: Date.now() });
    console.log('Base values carregados (paralelo):', Object.keys(baseValues));
    return merged;
  } catch (e) {
    console.error('Erro ao salvar baseValues:', e);
    return null;
  }
}

// Retorna o objeto completo do cache, carregando se ausente ou expirado
async function getOrLoadAllBaseValues(estados = DEFAULT_ESTADOS) {
  const cached = readBaseValues();
  // Se baseValues está corrompido => refazer a requisição
  if (cached === null) {
    console.warn('baseValues corrompido — forçando reload');
    return await loadAllBaseValues(estados);
  }

  // Se cache existe e tem chaves, retorna sem reconsultar (primeira vez já foi feita)
  if (Object.keys(cached).length > 0) {
    return cached;
  }

  // Caso cache vazio -> carregar uma vez e salvar
  return await loadAllBaseValues(estados);
}

// Determina índice e looviFipe a partir do valor FIPE
function getIndiceAndLooviFipe(valorFipe) {
  let indice = 0;
  let looviFipe = 0;
  if (valorFipe > 0 && valorFipe <= 10000) {
    indice = 0; looviFipe = 10;
  } else if (valorFipe > 10000 && valorFipe <= 20000) {
    indice = 1; looviFipe = 20;
  } else if (valorFipe > 20000 && valorFipe <= 30000) {
    indice = 2; looviFipe = 30;
  } else if (valorFipe > 30000 && valorFipe <= 40000) {
    indice = 3; looviFipe = 40;
  } else if (valorFipe > 40000 && valorFipe <= 50000) {
    indice = 4; looviFipe = 50;
  } else if (valorFipe > 50000 && valorFipe <= 60000) {
    indice = 5; looviFipe = 60;
  } else if (valorFipe > 60000 && valorFipe <= 70000) {
    indice = 6; looviFipe = 70;
  } else if (valorFipe > 70000 && valorFipe <= 80000) {
    indice = 7; looviFipe = 80;
  } else if (valorFipe > 80000 && valorFipe <= 90000) {
    indice = 8; looviFipe = 90;
  } else if (valorFipe > 90000 && valorFipe <= 100000) {
    indice = 9; looviFipe = 100;
  } else if (valorFipe > 100000 && valorFipe <= 110000) {
    indice = 10; looviFipe = 110;
  } else if (valorFipe > 110000 && valorFipe <= 120000) {
    indice = 11; looviFipe = 120;
  } else if (valorFipe > 120000 && valorFipe <= 130000) {
    indice = 12; looviFipe = 130;
  } else if (valorFipe > 130000 && valorFipe <= 140000) {
    indice = 13; looviFipe = 140;
  } else if (valorFipe > 140000 && valorFipe <= 150000) {
    indice = 14; looviFipe = 150;
  } else if (valorFipe > 150000) {
    indice = 14; looviFipe = 150;
  }
  return { indice, looviFipe };
}

// Calcula mensalidades usando dados do localStorage (cache). Retorna mesmo formato de calculateMensalidades
function computeMensalidadesFromCache(estado, valorFipe, placa = null) {
  const base = getBaseFromLocalStorage(estado);
  if (!base) throw new Error(`Dados base para estado ${estado} não encontrados no cache`);

  const planos = base.planos || base.data?.planos || base;
  const plano = Array.isArray(planos) ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado) : null;
  if (!plano) throw new Error(`Plano não encontrado para estado ${estado} no cache`);

  const planService = new kl();
  // calcula mensalidades array
  const r = { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: false, smart: false, vidros: false };
  const mensalidades = [];
  for (let i = 10; i <= 150; i += 10) {
    mensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, r).toFixed(2)));
  }

  const { indice, looviFipe } = getIndiceAndLooviFipe(valorFipe);

  const valorMensalidadeEssencial = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { ...r }).toFixed(2));
  const valorMensalidadeSemVidro = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { ...r, colisao: true }).toFixed(2));
  const valorMensalidadeCompleto = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, { ...r, colisao: true, vidros: true }).toFixed(2));

  const valorAtivacao = 299.90;

  const primeiraMensalidadeEssencial = valorMensalidadeEssencial + valorAtivacao;
  const totalAnualEssencial = (valorMensalidadeEssencial * 12) + valorAtivacao;

  const primeiraMensalidadeSemVidro = valorMensalidadeSemVidro + valorAtivacao;
  const totalAnualSemVidro = (valorMensalidadeSemVidro * 12) + valorAtivacao;

  const primeiraMensalidadeCompleto = valorMensalidadeCompleto + valorAtivacao;
  const totalAnualCompleto = (valorMensalidadeCompleto * 12) + valorAtivacao;

  return {
    essencial: { mensal: valorMensalidadeEssencial, primeira: primeiraMensalidadeEssencial, anual: totalAnualEssencial },
    semVidro: { mensal: valorMensalidadeSemVidro, primeira: primeiraMensalidadeSemVidro, anual: totalAnualSemVidro },
    completo: { mensal: valorMensalidadeCompleto, primeira: primeiraMensalidadeCompleto, anual: totalAnualCompleto },
    placa,
    estado,
    valorFipe,
    mensalidadesArray: mensalidades,
    escolhidoIndice: indice
  };
}

// Retorna um objeto com mensalidades para todos os estados (usando cache)
function computeMensalidadesForAllStates(valorFipe, placa = null) {
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

async function calculateMensalidades(estado, valorFipe, placa = null) {
  const resultado = await getBaseDataForEstado(estado);
  if (!resultado) {
    throw new Error(`Failed to get base data for estado: ${estado}`);
  }
  const planos = resultado.planos || resultado.data?.planos || resultado;
  const plano = Array.isArray(planos) ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado) : null;

  if (!plano) {
    throw new Error(`Plano not found for estado: ${estado}`);
  }

  // Instancia o serviço de planos
  const planService = new kl();

  // Parâmetros para cálculo
  const r = {
    car: "CAT_AGRAVO_VEICULO_LEVE",
    colisao: false,
    smart: false,
    vidros: false
  };

  // Calcula mensalidades
  const mensalidades = [];
  for (let i = 10; i <= 150; i += 10) {
    mensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, r).toFixed(2)));
  }

  // Determina índice baseado no valorFipe
  let indice = 0;
  let looviFipe = 0;
  if (valorFipe > 0 && valorFipe <= 10000) {
    indice = 0;
    looviFipe = 10;
  } else if (valorFipe > 10000 && valorFipe <= 20000) {
    indice = 1;
    looviFipe = 20;
  } else if (valorFipe > 20000 && valorFipe <= 30000) {
    indice = 2;
    looviFipe = 30;
  } else if (valorFipe > 30000 && valorFipe <= 40000) {
    indice = 3;
    looviFipe = 40;
  } else if (valorFipe > 40000 && valorFipe <= 50000) {
    indice = 4;
    looviFipe = 50;
  } else if (valorFipe > 50000 && valorFipe <= 60000) {
    indice = 5;
    looviFipe = 60;
  } else if (valorFipe > 60000 && valorFipe <= 70000) {
    indice = 6;
    looviFipe = 70;
  } else if (valorFipe > 70000 && valorFipe <= 80000) {
    indice = 7;
    looviFipe = 80;
    } else if (valorFipe > 80000 && valorFipe <= 90000) {
      indice = 8;
      looviFipe = 90;
    } else if (valorFipe > 90000 && valorFipe <= 100000) {
      indice = 9;
      looviFipe = 100;
    } else if (valorFipe > 100000 && valorFipe <= 110000) {
      indice = 10;
      looviFipe = 110;
    } else if (valorFipe > 110000 && valorFipe <= 120000) {
      indice = 11;
      looviFipe = 120;
    } else if (valorFipe > 120000 && valorFipe <= 130000) {
      indice = 12;
      looviFipe = 130;
    } else if (valorFipe > 130000 && valorFipe <= 140000) {
      indice = 13;
      looviFipe = 140;
    } else if (valorFipe > 140000 && valorFipe <= 150000) {
      indice = 14;
      looviFipe = 150;
    } else if (valorFipe > 150000) {
      indice = 14;
      looviFipe = 150;
    }
  
    const price = mensalidades[indice];
  
    // Calcula para Essencial
    const rEssencial = { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: false, smart: false, vidros: false };
    const valorMensalidadeEssencial = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, rEssencial).toFixed(2));
  
    // Calcula para Sem Vidro
    const rSemVidro = { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: true, smart: false, vidros: false };
    const valorMensalidadeSemVidro = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, rSemVidro).toFixed(2));
  
    // Calcula para Completo
    const rCompleto = { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: true, smart: false, vidros: true };
    const valorMensalidadeCompleto = parseFloat(planService.getCalcPlanPrice(plano, looviFipe, rCompleto).toFixed(2));
  
    const valorAtivacao = 299.90;
  
    // Totais
    const primeiraMensalidadeEssencial = valorMensalidadeEssencial + valorAtivacao;
    const totalAnualEssencial = (valorMensalidadeEssencial * 12) + valorAtivacao;
 
    const primeiraMensalidadeSemVidro = valorMensalidadeSemVidro + valorAtivacao;
    const totalAnualSemVidro = (valorMensalidadeSemVidro * 12) + valorAtivacao;
 
    const primeiraMensalidadeCompleto = valorMensalidadeCompleto + valorAtivacao;
    const totalAnualCompleto = (valorMensalidadeCompleto * 12) + valorAtivacao;
 
    // Debug logging
    console.log('computeMensalidadesFromCache - essencial:', valorMensalidadeEssencial);
    console.log('computeMensalidadesFromCache - semVidro:', valorMensalidadeSemVidro);
    console.log('computeMensalidadesFromCache - completo:', valorMensalidadeCompleto);

    // Debug logging
    console.log('calculateMensalidades - essencial:', valorMensalidadeEssencial);
    console.log('calculateMensalidades - semVidro:', valorMensalidadeSemVidro);
    console.log('calculateMensalidades - completo:', valorMensalidadeCompleto);
  
    return {
      essencial: {
        mensal: valorMensalidadeEssencial,
        primeira: primeiraMensalidadeEssencial,
        anual: totalAnualEssencial
      },
      semVidro: {
        mensal: valorMensalidadeSemVidro,
        primeira: primeiraMensalidadeSemVidro,
        anual: totalAnualSemVidro
      },
      completo: {
        mensal: valorMensalidadeCompleto,
        primeira: primeiraMensalidadeCompleto,
        anual: totalAnualCompleto
      },
      placa: placa,
      estado: estado,
      valorFipe: valorFipe
    };
  }

    let kl = (() => {
        class n {
            getPlanItem(e, i = "") {
                if (!e || !e.itensPlano)
                    return null;
                const o = e.itensPlano.filter(a => a.codigoItem == i);
                return o.length ? o[0] : null
            }
            getPlanSubItemFipe(e, i, r) {
                const o = `CAT_FIPE_${e}K`
                    , s = i.formularioSubItens.subItemPlano.filter(u => u.codigoItem == r);
                if (!s[0])
                    return;
                const l = s[0].formularioCategorias.categoriaSubItem;
                if (!l[0])
                    return;
                const c = l.filter(u => u.codigoItem == o);
                return c[0] ? c[0] : void 0
            }
            getAss24hPrice(e) {
                const item = this.getPlanItem(e, "SRV_ASS24");
                return item ? item.preco : 0;
            }
            getCarroReservaPrice(e) {
                const item = this.getPlanItem(e, "SRV_CARRO_RESERVA");
                return item ? item.preco : 0;
            }
            getRouboFurtoPrice(e, i) {
                const r = this.getPlanItem(e, "SRV_ROUBO_FURTO");
                const sub = this.getPlanSubItemFipe(i, r, "SRV_FIPE_ROUBO_FURTO");
                return sub ? sub.preco : 0;
            }
            getPtRouboFurtoPrice(e, i) {
                const r = this.getPlanItem(e, "SRV_PT_ROUBO_FURTO");
                const sub = this.getPlanSubItemFipe(i, r, "SRV_FIPE_PT_ROUBO_FURTO");
                return sub ? sub.preco : 0;
            }
            getAgravoPrice(e, i) {
                const r = this.getPlanItem(e, "SRV_AGRAVO")
                    , o = i
                    , s = r.formularioSubItens.subItemPlano.filter(u => "SRV_SUB_AGRAVO" == u.codigoItem);
                if (!s[0])
                    return;
                const l = s[0].formularioCategorias.categoriaSubItem;
                if (!l[0])
                    return;
                const c = l.filter(u => u.codigoItem == o);
                return c[0] ? c[0].preco : 0
            }
            getServicoLooviPrice(e, i, r) {
                let o = 0;
                const a = this.getPlanItem(e, "SRV_SERVICO_LOOVI")
                    , s = this.getPlanSubItemFipe(i, a, "SRV_FIPE_COM_COLISAO")
                    , l = this.getPlanSubItemFipe(i, a, "SRV_FIPE_SEM_COLISAO");
                o = r ? (s ? s.preco : 0) : (l ? l.preco : 0);
                return o;
            }
            getSegColisaoPrice(e, i) {
                const r = this.getPlanItem(e, "SRV_SEGUROS_LTI")
                    , o = `CAT_FIPE_${i}K`
                    , s = r.formularioSubItens.subItemPlano.filter(u => "SRV_SEG_COLISAO" == u.codigoItem);
                if (!s[0])
                    return 0;
                const l = s[0].formularioCategorias.categoriaSubItem;
                if (!l[0])
                    return 0;
                const c = l.filter(u => u.codigoItem == o);
                return c[0] ? c[0].preco : 0
            }
            getSegTerceirosPrice(e) {
                const item = this.getPlanItem(e, "SRV_SEGUROS_LTI");
                if (!item || !item.formularioSubItens) return 0;
                const sub = item.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEG_TERCEIROS");
                if (!sub || !sub.formularioCategorias) return 0;
                const cat = sub.formularioCategorias.categoriaSubItem.find(c => c.itemPadrao);
                return cat ? cat.preco : 0;
            }
            getSegLtiPrice(e) {
                return this.getPlanItem(e, "SRV_SEGUROS_LTI").preco || 0;
            }
            getVidrosPrice(e) {
                return this.getPlanItem(e, "SRV_VIDROS").preco || 0;
            }
            getSmartPrice(e) {
                const item = this.getPlanItem(e, "SRV_SMART_CAR");
                return item ? item.preco : 0;
            }
            getCalcPlanPrice(e, i, r) {
                let o = 0
                    , a = [{
                        item: "SRV_ASS24",
                        price: this.getAss24hPrice(e)
                    }, {
                        item: "SRV_CARRO_RESERVA",
                        price: this.getCarroReservaPrice(e)
                    }, {
                        item: "SRV_ROUBO_FURTO",
                        price: this.getRouboFurtoPrice(e, i)
                    }, {
                        item: "SRV_PT_ROUBO_FURTO",
                        price: this.getPtRouboFurtoPrice(e, i)
                    }, {
                        item: "SRV_AGRAVO",
                        price: this.getAgravoPrice(e, r.car)
                    }, {
                        item: "SRV_SERVICO_LOOVI",
                        price: this.getServicoLooviPrice(e, i, r.colisao)
                    }];
                return r.colisao && (a.push({
                    item: "SRV_SEG_COLISAO",
                    price: this.getSegColisaoPrice(e, i)
                }),
                    a.push({
                        item: "SRV_SEG_TERCEIROS",
                        price: this.getSegTerceirosPrice(e)
                    }),
                    a.push({
                        item: "SRV_SEGUROS_LTI",
                        price: this.getSegLtiPrice(e)
                    })),
                    r.vidros && a.push({
                        item: "SRV_VIDROS",
                        price: this.getVidrosPrice(e)
                    }),
                    r.smart && a.push({
                        item: "SRV_SMART_CAR",
                        price: this.getSmartPrice(e)
                    }),
                    a.forEach(s => {
                        o += s.price
                    }
                    ),
                    o
            }
        }
        return n
    })()

    class Calcular {

  
      async  buscarCotacaoSAP(estado) {
        const url = "https://ticjxjby64.execute-api.us-east-1.amazonaws.com/producao/proxy/v2/SAP";
        const apiKey = "RRcW9gj2tZ6pSVsnbpmKhshpXC3yR9EklCwqQyh0";
        //const payload = "eyJ1cmwiOiJodHRwczovL3NhcGlpcy5sb292aS5jb20uYnI6NjAwMDAvcGxhbm8vQXBpL3YxL29idGVyUGxhbm9zUG9yRXN0YWRvL1NQL2FwcCIsIm1ldG9kbyI6IkdFVCIsImhlYWRlcnMiOnsicmVxdWVzdGVyIjoiUG9ydGFsIiwiY290YWNhbyI6IiJ9LCJib2R5Ijp7fX0==";
        let payload = '{"url":"https://sapiis.loovi.com.br:60000/plano/Api/v1/obterPlanosPorEstado/' + estado + '/app","metodo":"GET","headers":{"requester":"Portal","cotacao":""},"body":{}}'
    
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-api-key": apiKey
            },
            body: JSON.stringify(btoa(payload))
          });
          const data = await response.json();
          let jsonStr = typeof data === "string" ? atob(data) : "";
            let resultado = jsonStr ? JSON.parse(jsonStr) : data;
            console.log(resultado)
            return resultado;
          } catch (error) {
            console.error("Erro ao buscar cotação SAP:", error);
          }
        }
    
    
       arrayMensalidades(resultado, estado) {
         // Supondo que resultado seja um array de planos ou tenha um campo com os planos
         // Exemplo: resultado.planos ou resultado.data.planos
         let planos = resultado.planos || resultado.data?.planos || resultado; // ajuste conforme estrutura real

         // Busca o plano pelo idPlano desejado
         let plano = Array.isArray(planos)
         ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado)
         : null;

         if (plano) {
           // Parâmetros para cálculo
           let r = {
             car: "CAT_AGRAVO_VEICULO_LEVE",
             colisao: false,
             smart: false,
             vidros: false
           };

           // Instancia o serviço de planos
           let planService = new kl;

           // Calcula o preço
           let mensalidades = [];
           for (let i = 10; i <= 150; i += 10) {
             mensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, r).toFixed(2)));
           }

           console.log(estado + " mensalidades:", mensalidades);
         } else {
           console.warn("Plano não encontrado!");
         }
       };

       calcularCotacaoFaixa(json, estado, faixaFipe) {

         let planos = json.planos || json.data?.planos || json; // ajuste conforme estrutura real

         // Busca o plano pelo idPlano desejado
         let plano = Array.isArray(planos)
         ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado)
         : null;

         // Busca SRV_SEG_COLISAO para a faixa
         const itemSegColisao = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
         let SRV_SEG_COLISAO = 0;
         if (itemSegColisao && itemSegColisao.formularioSubItens) {
           const subColisao = itemSegColisao.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEG_COLISAO");
           if (subColisao && subColisao.formularioCategorias) {
             const cat = subColisao.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === faixaFipe);
             if (cat) SRV_SEG_COLISAO = cat.preco;
           }
         }

         // Busca SRV_SEG_TERCEIROS (itemPadrao = true)
         const itemTerceiros = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
         let SRV_SEG_TERCEIROS = 0;
         if (itemTerceiros && itemTerceiros.formularioSubItens) {
           const subTerceiros = itemTerceiros.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEG_TERCEIROS");
           if (subTerceiros && subTerceiros.formularioCategorias) {
             const cat = subTerceiros.formularioCategorias.categoriaSubItem.find(c => c.itemPadrao);
             if (cat) SRV_SEG_TERCEIROS = cat.preco;
           }
         }

         // Busca SRV_SEG_TERCEIROS_CORP (itemPadrao = true)
         let SRV_SEG_TERCEIROS_CORP = 0;
         if (itemTerceiros && itemTerceiros.formularioSubItens) {
           const subTerceirosCorp = itemTerceiros.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEG_TERCEIROS_CORP");
           if (subTerceirosCorp && subTerceirosCorp.formularioCategorias) {
             const cat = subTerceirosCorp.formularioCategorias.categoriaSubItem.find(c => c.itemPadrao);
             if (cat) SRV_SEG_TERCEIROS_CORP = cat.preco;
           }
         }

         // Busca CAT_SEG_APP
         let CAT_SEG_APP = 0;
         const itemApp = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
         if (itemApp && itemApp.formularioSubItens) {
           const subApp = itemApp.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEGURO_APP");
           if (subApp && subApp.formularioCategorias) {
             const cat = subApp.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === "CAT_SEG_APP");
             if (cat) CAT_SEG_APP = cat.preco;
           }
         }

         // r = soma dos itens
         let r = SRV_SEG_COLISAO + SRV_SEG_TERCEIROS + SRV_SEG_TERCEIROS_CORP + CAT_SEG_APP;

         // Busca SRV_FIPE_COM_COLISAO para a faixa
         let c = 0;
         const itemServicoLoovi = plano.itensPlano.find(i => i.codigoItem === "SRV_SERVICO_LOOVI");
         if (itemServicoLoovi && itemServicoLoovi.formularioSubItens) {
           const subComColisao = itemServicoLoovi.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_FIPE_COM_COLISAO");
           if (subComColisao && subComColisao.formularioCategorias) {
             const cat = subComColisao.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === faixaFipe);
             if (cat) c = cat.preco;
           }
         }

         // Busca SRV_FIPE_SEM_COLISAO para a faixa
         let u = 0;
         if (itemServicoLoovi && itemServicoLoovi.formularioSubItens) {
           const subSemColisao = itemServicoLoovi.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_FIPE_SEM_COLISAO");
           if (subSemColisao && subSemColisao.formularioCategorias) {
             const cat = subSemColisao.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === faixaFipe);
             if (cat) u = cat.preco;
           }
         }

         // Ajuste conforme regra
         if (c > u) {
           r += (c - u);
         } else {
           r -= (u - c);
         }

         return Number(r.toFixed(2));
       }

     async    main(estado) {

         let resultado = await this.buscarCotacaoSAP(estado);
         this.arrayMensalidades(resultado, estado);

       }
    
    
    

    
      }
        class Ui extends Calcular{
      
      
      
      
      
      
      
        constructor() {
          super();
          this.inputField = document.querySelector("#placaOrValue") || document.createElement('input');
          this.dadosFipeField = document.querySelector("#dadosFipe") || document.createElement('textarea');
          this.valorFipe = 0;
          this.checkboxes = document.querySelectorAll('input[type="checkbox"]');
          this.estado = "SP";
          this.sellerCheckboxes = document.querySelectorAll('#miza, #sofia, #nicolas');
          this.buttonHistoric = document.querySelector(".img-historico") || document.createElement('img');
          this.historic = document.querySelector(".modalHistorico") || document.createElement('div');
          this.fecharHistoric = document.querySelector(".fecharHistorico") || document.createElement('button');
          this.inputBuscar = document.querySelector(".input-buscar") || document.createElement('input');
          this.planoCheckboxes = document.querySelectorAll('.checkbox-plano');
          this.frases = {};
          this.selectedPlano = null;
          // attach auto-resize listener for dadosFipe textarea
          // (call after DOMContentLoaded when Ui is instantiated)
          this.attachResizeListener();

        }
        
        // Auto-resize helper: set height based on content up to 40vh
        autoResizeTextarea(el) {
          if (!el) return;
          try {
            el.style.height = 'auto';
            const maxPx = window.innerHeight * 0.4; // match CSS max-height: 40vh
            const newHeight = Math.min(el.scrollHeight, maxPx);
            el.style.height = newHeight + 'px';
            if (el.scrollHeight > maxPx) {
              el.style.overflow = 'auto';
            } else {
              el.style.overflow = 'hidden';
            }
          } catch (e) {
            // ignore in case element not ready
          }
        }

        attachResizeListener() {
          if (!this.dadosFipeField) return;
          // ensure it's a textarea
          if (this.dadosFipeField.tagName && this.dadosFipeField.tagName.toLowerCase() !== 'textarea') return;
          this.dadosFipeField.addEventListener('input', () => this.autoResizeTextarea(this.dadosFipeField));
          // Initialize size based on current content
          setTimeout(() => this.autoResizeTextarea(this.dadosFipeField), 0);
        }
         getCategoriaFipe(fipeValue) {
           let k = Math.round(fipeValue / 10000);
           k = Math.max(1, Math.min(15, k));
           return "CAT_FIPE_" + (k * 10) + "K";
         }

          async calculaMensalidade() {
              try {
                // Verificar se dados estão em cache, senão buscar da API e salvar
                const resultado = await getBaseDataForEstado(this.estado);
              const planos = resultado.planos || resultado.data?.planos || resultado;
              const plano = Array.isArray(planos) ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + this.estado) : null;
              if (!plano) {
                console.warn("Plano não encontrado");
                return;
              }
   
              // Log plano data for debugging
              console.log('Plano data from API:', {
                idPlano: plano.idPlano,
                itensPlano: plano.itensPlano?.length || 0,
                estado: this.estado,
                valorFipe: this.valorFipe
              });
              const planService = new kl();
              let r = {
                car: "CAT_AGRAVO_VEICULO_LEVE",
                colisao: false,
                smart: false,
                vidros: false
              };
              // Calculate mensalidades array
              let mensalidades = [];
              for (let i = 10; i <= 150; i += 10) {
                mensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, r).toFixed(2)));
              }

              // Calculate indice based on ranges
              let indice = 0;
              if (this.valorFipe > 0 && this.valorFipe <= 10000) {
                indice = 0;
              } else if (this.valorFipe > 10000 && this.valorFipe <= 20000) {
                indice = 1;
              } else if (this.valorFipe > 20000 && this.valorFipe <= 30000) {
                indice = 2;
              } else if (this.valorFipe > 30000 && this.valorFipe <= 40000) {
                indice = 3;
              } else if (this.valorFipe > 40000 && this.valorFipe <= 50000) {
                indice = 4;
              } else if (this.valorFipe > 50000 && this.valorFipe <= 60000) {
                indice = 5;
              } else if (this.valorFipe > 60000 && this.valorFipe <= 70000) {
                indice = 6;
              } else if (this.valorFipe > 70000 && this.valorFipe <= 80000) {
                indice = 7;
              } else if (this.valorFipe > 80000 && this.valorFipe <= 90000) {
                indice = 8;
              } else if (this.valorFipe > 90000 && this.valorFipe <= 100000) {
                indice = 9;
              } else if (this.valorFipe > 100000 && this.valorFipe <= 110000) {
                indice = 10;
              } else if (this.valorFipe > 110000 && this.valorFipe <= 120000) {
                indice = 11;
              } else if (this.valorFipe > 120000 && this.valorFipe <= 130000) {
                indice = 12;
              } else if (this.valorFipe > 130000 && this.valorFipe <= 140000) {
                indice = 13;
              } else if (this.valorFipe > 140000 && this.valorFipe <= 150000) {
                indice = 14;
              } else if (this.valorFipe > 150000) {
                indice = 14;
              }

              // Calculate values using the exact logic from the provided code
              const faixaFipe = "CAT_FIPE_" + (indice + 1) * 10 + "K"; // e.g., CAT_FIPE_30K for indice 2

              // Calculate colisao using calcularCotacaoFaixa logic
              let SRV_SEG_COLISAO = 0;
              const itemSegColisao = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
              if (itemSegColisao && itemSegColisao.formularioSubItens) {
                const subColisao = itemSegColisao.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEG_COLISAO");
                if (subColisao && subColisao.formularioCategorias) {
                  const cat = subColisao.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === faixaFipe);
                  if (cat) SRV_SEG_COLISAO = cat.preco;
                }
              }

              let SRV_SEG_TERCEIROS = 0;
              const itemTerceiros = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
              if (itemTerceiros && itemTerceiros.formularioSubItens) {
                const subTerceiros = itemTerceiros.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEG_TERCEIROS");
                if (subTerceiros && subTerceiros.formularioCategorias) {
                  const cat = subTerceiros.formularioCategorias.categoriaSubItem.find(c => c.itemPadrao);
                  if (cat) SRV_SEG_TERCEIROS = cat.preco;
                }
              }

              let SRV_SEG_TERCEIROS_CORP = 0;
              if (itemTerceiros && itemTerceiros.formularioSubItens) {
                const subTerceirosCorp = itemTerceiros.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEG_TERCEIROS_CORP");
                if (subTerceirosCorp && subTerceirosCorp.formularioCategorias) {
                  const cat = subTerceirosCorp.formularioCategorias.categoriaSubItem.find(c => c.itemPadrao);
                  if (cat) SRV_SEG_TERCEIROS_CORP = cat.preco;
                }
              }

              let CAT_SEG_APP = 0;
              const itemApp = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
              if (itemApp && itemApp.formularioSubItens) {
                const subApp = itemApp.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEGURO_APP");
                if (subApp && subApp.formularioCategorias) {
                  const cat = subApp.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === "CAT_SEG_APP");
                  if (cat) CAT_SEG_APP = cat.preco;
                }
              }

              let valorColisao = SRV_SEG_COLISAO + SRV_SEG_TERCEIROS + SRV_SEG_TERCEIROS_CORP + CAT_SEG_APP;

              const itemServicoLoovi = plano.itensPlano.find(i => i.codigoItem === "SRV_SERVICO_LOOVI");
              let c = 0;
              if (itemServicoLoovi && itemServicoLoovi.formularioSubItens) {
                const subComColisao = itemServicoLoovi.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_FIPE_COM_COLISAO");
                if (subComColisao && subComColisao.formularioCategorias) {
                  const cat = subComColisao.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === faixaFipe);
                  if (cat) c = cat.preco;
                }
              }

              let u = 0;
              if (itemServicoLoovi && itemServicoLoovi.formularioSubItens) {
                const subSemColisao = itemServicoLoovi.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_FIPE_SEM_COLISAO");
                if (subSemColisao && subSemColisao.formularioCategorias) {
                  const cat = subSemColisao.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === faixaFipe);
                  if (cat) u = cat.preco;
                }
              }

              if (c > u) {
                valorColisao += (c - u);
              } else {
                valorColisao -= (u - c);
              }

              // Add SRV_SEGUROS_LTI preco for completo
              const itemSegLti = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
              if (itemSegLti) {
                valorColisao += itemSegLti.preco;
              }

              // Get base mensalidade from essencial array
              const essencialMensalidades = [];
              for (let i = 10; i <= 150; i += 10) {
                essencialMensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: false, smart: false, vidros: false }).toFixed(2)));
              }
              let valorMensalidade = essencialMensalidades[indice];

              // Adjustments for vehicle type
              const suvElement = document.getElementById('suv');
              const utilElement = document.getElementById('util');
              if (suvElement && suvElement.checked) {
                valorMensalidade += 50;
              }
              if (utilElement && utilElement.checked) {
                valorMensalidade += 50;
              }

              // Calculate final values
              const valorMensalidadeEssencial = valorMensalidade;
              const valorVidros = planService.getVidrosPrice(plano); // Get vidros price from API
              const valorMensalidadeCompleto = valorMensalidade + valorColisao + valorVidros;

              // No specific case adjustments - use API values as-is

              console.log('Completo components:', {
                total: valorMensalidadeCompleto
              });

              // Constants
              const valorAtivacao = 299.90;

              // Calculate totals according to correct logic - use planService values directly
              const primeiraMensalidadeEssencial = valorMensalidadeEssencial + valorAtivacao;
              const totalAnualEssencial = (valorMensalidadeEssencial * 12) + valorAtivacao;
              const totalEssencial = valorMensalidadeEssencial;

              const valorMensalidadeSemVidro = valorMensalidadeEssencial + valorColisao;
              const primeiraMensalidadeSemVidro = valorMensalidadeSemVidro + valorAtivacao;
              const totalAnualSemVidro = (valorMensalidadeSemVidro * 12) + valorAtivacao;
              const totalSemVidro = valorMensalidadeSemVidro;

              const primeiraMensalidadeCompleto = valorMensalidadeCompleto + valorAtivacao;
              const totalAnualCompleto = (valorMensalidadeCompleto * 12) + valorAtivacao;
              const totalCompleto = valorMensalidadeCompleto;

              // Debug logging
              console.log('essencial', valorMensalidadeEssencial);
              console.log('semVidro', valorMensalidadeSemVidro);
              console.log('completo', valorMensalidadeCompleto);

              // Set table values - match official site format
              document.getElementById('colisaoEssencial').textContent = '0';
              document.getElementById('primeiraMensalidadeEssencial').textContent = this.formatBRL(primeiraMensalidadeEssencial);
              document.getElementById('totalEssencial').textContent = this.formatBRL(totalEssencial);
              document.getElementById('totalAnualEssencial').textContent = this.formatBRL(totalAnualEssencial);


              // Completo: Roubo, furto, colisão e vidros
              const colisaoCompleto = valorColisao;
              document.getElementById('colisaoCompleto').textContent = this.formatBRL(colisaoCompleto);
              document.getElementById('primeiraMensalidadeCompleto').textContent = this.formatBRL(primeiraMensalidadeCompleto);
              document.getElementById('totalCompleto').textContent = this.formatBRL(totalCompleto);
              document.getElementById('totalAnualCompleto').textContent = this.formatBRL(totalAnualCompleto);

              // Debug final values
              console.log('Final table values:', {
                essencial: {
                  primeira: primeiraMensalidadeEssencial,
                  mensal: totalEssencial,
                  anual: totalAnualEssencial
                },
                completo: {
                  colisao: colisaoCompleto,
                  primeira: primeiraMensalidadeCompleto,
                  mensal: totalCompleto,
                  anual: totalAnualCompleto
                }
              });

              // Store phrases in object for unified textarea
              this.frases = {
                essencial: "Seguro Essencial no Plano Anual é de " +
                  this.formatBRL(totalAnualEssencial) + " em até 12x sem juros de " + this.formatBRL(valorMensalidadeEssencial) + " no cartão de crédito. " +
                  "Já no Plano Recorrente Mensal o Valor da entrada é de " + this.formatBRL(primeiraMensalidadeEssencial) +
                  " no cartão de crédito + mensais sem juros de " + this.formatBRL(totalEssencial) +
                  " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.",

                semVidro: "Seguro Completo sem Vidros no Plano Anual é de " +
                  this.formatBRL(totalAnualSemVidro) + " em até 12x sem juros de " + this.formatBRL(valorMensalidadeSemVidro) + " no cartão de crédito. " +
                  "Já no Plano Recorrente Mensal o Valor da entrada é de " + this.formatBRL(primeiraMensalidadeSemVidro) +
                  " no cartão de crédito + mensais sem juros de " + this.formatBRL(totalSemVidro) +
                  " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.",

                completo: "Seguro Completo com Colisão e Opcional Vidros " +
                  "(faróis, lanternas e retrovisores) no Plano Anual é de " + this.formatBRL(totalAnualCompleto) + " em até 12x sem juros de " +
                  this.formatBRL(valorMensalidadeCompleto) + " no cartão de crédito. " +
                  "Já no Plano Recorrente Mensal o Valor da entrada é de " + this.formatBRL(primeiraMensalidadeCompleto) +
                  " no cartão de crédito + mensais sem juros de " + this.formatBRL(totalCompleto) +
                  " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão."
              };

              // Update unified textarea based on selected checkbox
              this.updateFraseUnificada();
            } catch (error) {
              console.error("Erro ao calcular mensalidade:", error);
            }
          }




         verificarVendedor() {
           this.vendedor = {
             nome: 'Eliel Bragatti',
             email: 'eliel.ligea@gmail.com',
             telFormatado: '(11) 933.899.459',
             tel: '11933899459',
             link: 'https://loovi.com.br/27140'
           };

           if (document.getElementById('miza').checked) {
             this.vendedor = {
               nome: 'Mizael Bragatti',
               email: 'mizabgt@gmail.com',
               telFormatado: '(11) 980.449.766',
               tel: '11980449766',
               link: 'https://loovi.com.br/45811'
             };
           } else if (document.getElementById('sofia').checked) {
             this.vendedor = {
               nome: 'Sofia Almeida',
               email: 'sofia.ar37@gmail.com',
               telFormatado: '(11) 990.229.186',
               tel: '11990229186',
               link: 'https://loovi.com.br/25075'
             };
           } else if (document.getElementById('nicolas').checked) {
             this.vendedor = {
               nome: 'Nicolas [Sobrenome]',
               email: 'nicolas@exemplo.com',
               telFormatado: '(11) 999.999.999',
               tel: '11999999999',
               link: 'https://loovi.com.br/xxxxx'
             };
           }
         }

         sellerCheckboxData() {
           this.sellerCheckboxes.forEach(checkbox => {
             checkbox.addEventListener('change', () => {
               this.sellerCheckboxes.forEach(box => {
                 if (box !== checkbox) box.checked = false;
               });
               this.verificarVendedor();
             });
           });
         }

      modalHistoric(){
        this.buttonHistoric.addEventListener("click", () => {
          this.historic.classList.add("hidden");
          this.updateStats();
          this.displayHistory();
        });

        this.fecharHistoric.addEventListener("click", () => {
          this.historic.classList.remove("hidden");
        });

        this.inputBuscar.addEventListener("input", () => {
          this.filterHistory();
        });

        this.inputBuscar.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        });
      }

      filterHistory() {
        const searchTerm = this.inputBuscar.value.toLowerCase();
        this.displayHistory(searchTerm);
      }

      displayHistory(filter = '') {
        const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
        const lista = document.getElementById('listaCotacoes');
        lista.innerHTML = '';

        let filteredQuotes = quotes;
        if (filter) {
          filteredQuotes = quotes.filter(quote => quote.placa && quote.placa.toLowerCase().includes(filter));
        }

        if (filteredQuotes.length === 0) {
          lista.innerHTML = '';
          return;
        }

        filteredQuotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        filteredQuotes.forEach((quote, index) => {
          const item = document.createElement('div');
          item.className = 'cotacao-item';
          const date = new Date(quote.timestamp).toLocaleString('pt-BR');
          item.innerHTML = `
            <p><strong>Placa:</strong> ${quote.placa || 'N/A'}</p>
            <p><strong>Data:</strong> ${date}</p>
            <p><strong>Estado:</strong> ${quote.estado || 'N/A'}</p>
            ${quote.valorFipe ? `<p><strong>Valor FIPE:</strong> ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(quote.valorFipe)}</p>` : ''}
            ${quote.vendedor ? `<p><strong>Vendedor:</strong> ${quote.vendedor.nome}</p>` : ''}
            <button class="btn-delete" data-index="${quotes.indexOf(quote)}">Deletar</button>
          `;
          lista.appendChild(item);
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            this.deleteQuote(index);
          });
        });
      }

      deleteQuote(index) {
        const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
        quotes.splice(index, 1);
        localStorage.setItem('quotes', JSON.stringify(quotes));
        this.displayHistory(this.inputBuscar.value.toLowerCase());
        this.updateStats();
      }

      updateStats() {
        const counters = loadCounters();
        document.getElementById('totalCotacoes').textContent = counters.total;
        document.getElementById('cotacoesHoje').textContent = counters.hoje;
        document.getElementById('cotacoesSemana').textContent = counters.semana;
        document.getElementById('cotacoesMes').textContent = counters.mes;
        document.getElementById('cotacoesAno').textContent = counters.ano;
      }

      getStats() {
        const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const total = quotes.length;
        const today = quotes.filter(q => new Date(q.timestamp) >= startOfDay).length;
        const week = quotes.filter(q => new Date(q.timestamp) >= startOfWeek).length;
        const month = quotes.filter(q => new Date(q.timestamp) >= startOfMonth).length;
        const year = quotes.filter(q => new Date(q.timestamp) >= startOfYear).length;

        return { total, today, week, month, year };
      }

      checkboxData() {
        this.checkboxes.forEach(checkboxNow => {
          checkboxNow.addEventListener('change', async () => {
            try {
              let estado = checkboxNow.dataset.estado;
              this.checkboxes.forEach(box => {
                if (box !== checkboxNow) box.checked = false;
              });

              if (checkboxNow.checked) {
                this.estado = estado;
                localStorage.setItem('selectedEstado', estado);
                console.log(estado);
                if (this.valorFipe > 0) {
                  await this.calculaMensalidade();
                }
              } else {
                this.estado = null;
                localStorage.removeItem('selectedEstado');
                console.clear();
              }
            } catch (error) {
              console.error("Erro ao processar checkbox:", error);
            }
          });
        });
      }


      normalizePlate(value) {
        return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      }

      regexInput(inputValue) {
        const placaRegex = /^[A-Z]{3}[-\s]?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i;
        return placaRegex.test(inputValue);
      }

      checkValue() {
        const inputValue = this.inputField.value.trim();

        if (inputValue === "") {
          return { type: "vazio", value: "" };
        }

        if (this.regexInput(inputValue)) {
          return { type: "placa", value: this.normalizePlate(inputValue) };
        }

        let numericValue = parseInt(inputValue.replace(/\D/g, ""), 10);
        if (!isNaN(numericValue)) {
          return { type: "fipe", value: this.formatBRL(numericValue) };
        }

        return { type: "inválido", value: inputValue };
      }



      async checkPlate() {
        if (!this.estado) {
          this.estado = "MG";
          document.getElementById('sp').checked = true;
        }

        const result = this.checkValue();

        switch (result.type) {
          case "vazio":
            this.dadosFipeField.value = "Digite uma placa ou valor FIPE.";
            this.autoResizeTextarea(this.dadosFipeField);
            break;

          case "placa":
            this.dadosFipeField.value = "Buscando dados da placa...";
            this.autoResizeTextarea(this.dadosFipeField);
            await this.buscaPlaca(result.value);
            break;

          case "fipe":
            this.valorFipe = parseFloat(result.value.replace(/[^\d,]/g, "").replace(",", "."));
            this.dadosFipeField.value = `Valor FIPE: R$ ${this.valorFipe.toFixed(2).replace('.', ',')}`;
            this.autoResizeTextarea(this.dadosFipeField);
            await this.calculaMensalidade();
            break;

          case "inválido":
            this.dadosFipeField.value =
              "Entrada inválida. Digite uma placa válida ou valor numérico.";
            this.autoResizeTextarea(this.dadosFipeField);
            break;

          default:
            this.dadosFipeField.value = "Erro inesperado.";
            this.autoResizeTextarea(this.dadosFipeField);
        }
      }

      async buscaPlaca(placa) {
        // api principal
        try {
          const URL = `https://tsrujo7p82.execute-api.us-east-1.amazonaws.com/producao/placas/v2/dados-atualizados/${placa}`;
          let response = await fetch(URL);

          if (!response.ok) throw new Error("Erro na API principal");
          let data = await response.json();

          if (!data || !data.Fipe) {
            throw new Error("Placa não encontrada na API principal");
          }

          this.showData(data, placa);
        } catch (error) {
          console.warn("Erro ao buscar placa:", error);
          // Do not save quote if failed
        }
      }

      async showData(data, placa) {
  this.dadosFipeField.value = `Ano: ${data.Ano}
       Modelo: ${data.Modelo}
       Fabricante: ${data.Fabricante}
       Tipo Veículo: ${data.TipoVeiculo ?? data.TipoVeculo}
       Valor FIPE: ${data.Fipe.Valor}`;
  this.autoResizeTextarea(this.dadosFipeField);

        const valorRaw = data.Fipe && data.Fipe.Valor ? String(data.Fipe.Valor) : '';
        // Normaliza string BRL (ex: "R$ 23.500,00" ou "23.500,00") para number 23500
        function parseBRLToNumber(str) {
          if (!str) return 0;
          // remove currency symbols and spaces but keep digits, dot, comma and minus
          const cleaned = String(str).replace(/[^(\d|\.|\,|\-)]/g, '').trim();
          if (!cleaned) return 0;
          // If both '.' and ',' are present, assume '.' is thousand separator and ',' is decimal
          if (cleaned.indexOf('.') > -1 && cleaned.indexOf(',') > -1) {
            return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
          }
          // If only ',' present, assume it's the decimal separator
          if (cleaned.indexOf(',') > -1) {
            return parseFloat(cleaned.replace(',', '.')) || 0;
          }
          // Otherwise parse directly (no thousand separators)
          return parseFloat(cleaned) || 0;
        }

        const valorNumero = parseBRLToNumber(valorRaw);
        // Armazena valor em reais (ex: 23500)
        this.valorFipe = valorNumero;
        const formattedFipe = this.formatBRL(this.valorFipe);

  // Formatar texto do textarea sem espaços de indentação extras
  const lines = [
    `Ano: ${data.Ano}`,
    `Modelo: ${data.Modelo}`,
    `Fabricante: ${data.Fabricante}`,
    `Tipo Veículo: ${data.TipoVeiculo ?? data.TipoVeculo}`,
    `Valor FIPE: ${formattedFipe}`
  ];
  this.dadosFipeField.value = lines.join('\n');
  // Ajusta altura com a função simples de auto-resize
  try { autoResize(this.dadosFipeField); } catch (e) { this.autoResizeTextarea(this.dadosFipeField); }
        this.categoriaFipe = this.getCategoriaFipe(this.valorFipe)
        this.tipoVeiculo = data.TipoVeiculo ?? data.TipoVeculo;

        await this.calculaMensalidade();

        // Save quote after successful calculation
        this.saveQuote(placa);

        this.inputField.value = "";
    }

      formatBRL(value) {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value);
      }




      saveQuote(placa) {
        const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
        const placaValue = placa || this.inputField.value;
        const exists = quotes.some(quote => quote.placa === placaValue);
        if (exists) {
          console.log('Placa already exists:', placaValue);
          return;
        }

        // Try to collect plan values from DOM if available
        const primeiraEssencial = document.getElementById('primeiraMensalidadeEssencial')?.textContent || null;
        const totalEssencial = document.getElementById('totalEssencial')?.textContent || null;
        const primeiraCompleto = document.getElementById('primeiraMensalidadeCompleto')?.textContent || null;
        const totalCompleto = document.getElementById('totalCompleto')?.textContent || null;

        const newQuote = {
          timestamp: Date.now(),
          placa: placaValue,
          estado: this.estado,
          categoria: this.categoriaFipe || null,
          tipoVeiculo: this.tipoVeiculo || null,
          valorFipe: this.valorFipe || null,
          planos: {
            essencial: {
              primeira: primeiraEssencial,
              mensal: totalEssencial
            },
            completo: {
              primeira: primeiraCompleto,
              mensal: totalCompleto
            }
          },
          vendedor: this.vendedor || null
        };
        quotes.push(newQuote);
        localStorage.setItem('quotes', JSON.stringify(quotes));
        incrementCounters();
        console.log('Quote saved:', newQuote);
      }




      async init() {
        await this.checkPlate();
        this.attachCopyListeners();
      }
  
      attachInputListener() {
        let timeout;
        this.inputField.addEventListener("input", () => {
          if (!this.estado) {
            this.estado = "SP";
            document.getElementById('sp').checked = true;
          }
          clearTimeout(timeout);
          timeout = setTimeout(() => this.init(), 500);
        });
        this.inputField.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (!this.estado) {
              this.estado = "SP";
              document.getElementById('sp').checked = true;
            }
            clearTimeout(timeout);
            this.init();
          }
        });
      }

      attachCopyListeners() {
        document.getElementById('btnCopiarDadosFipe').addEventListener('click', () => {
          const textarea = document.getElementById('dadosFipe');
          textarea.focus();
          textarea.select();
        });

        document.getElementById('btnCopiarFrase').addEventListener('click', () => {
          const textarea = document.getElementById('fraseUnificada');
          textarea.focus();
          textarea.select();
        });
      }

      updateFraseUnificada() {
        const textarea = document.getElementById('fraseUnificada');
        if (this.selectedPlano && this.frases[this.selectedPlano]) {
          textarea.value = this.frases[this.selectedPlano];
        } else {
          textarea.value = '';
        }
        this.autoResizeTextarea(textarea);
      }

      planoCheckboxData() {
        this.planoCheckboxes.forEach(checkbox => {
          checkbox.addEventListener('change', () => {
            this.planoCheckboxes.forEach(box => {
              if (box !== checkbox) box.checked = false;
            });

            if (checkbox.checked) {
              this.selectedPlano = checkbox.dataset.plano;
            } else {
              this.selectedPlano = null;
            }
            this.updateFraseUnificada();
          });
        });
      }
    }

    function listPlanValues() {
      const base = readBaseValues();
      console.log('Valores dos Planos:');
      Object.keys(base).forEach(estado => {
        const data = base[estado];
        const planos = data.planos || data.data?.planos || data;
        if (Array.isArray(planos)) {
          planos.forEach(plano => {
            console.log(`Estado: ${estado}, Plano: ${plano.idPlano}`);
            if (plano.itensPlano) {
              plano.itensPlano.forEach(item => {
                console.log(`  Item: ${item.codigoItem}, Preço: ${item.preco}`);
              });
            }
          });
        }
      });
    }
    
    // Função para testar cálculos de mensalidades com valor FIPE de exemplo
    function testCalculations() {
      const testFipe = 50000; // Exemplo de valor FIPE
      console.log(`Testando cálculos para FIPE: R$ ${testFipe}`);
      const results = computeMensalidadesForAllStates(testFipe);
      Object.keys(results).forEach(estado => {
        const res = results[estado];
        if (res.error) {
          console.log(`Erro em ${estado}: ${res.error}`);
        } else {
          console.log(`Estado: ${estado}`);
          console.log(`  Essencial: Mensal R$ ${res.essencial.mensal}, Primeira R$ ${res.essencial.primeira}, Anual R$ ${res.essencial.anual}`);
          console.log(`  Sem Vidro: Mensal R$ ${res.semVidro.mensal}, Primeira R$ ${res.semVidro.primeira}, Anual R$ ${res.semVidro.anual}`);
          console.log(`  Completo: Mensal R$ ${res.completo.mensal}, Primeira R$ ${res.completo.primeira}, Anual R$ ${res.completo.anual}`);
        }
      });
    }
    
    // Função para debug: força reload dos dados base e compara cálculos
    async function debugCalculations() {
      console.log('Forçando reload dos dados base...');
      const freshData = await loadAllBaseValues();
      console.log('Dados base recarregados.');

      const testFipe = 29239; // Changed to match your actual test case (Kombi FIPE)
      console.log(`Comparando cálculos para FIPE: R$ ${testFipe} com dados frescos:`);

      const estados = ['MG', 'SP', 'RJ', 'SC', 'RS'];
      for (const estado of estados) {
        console.log(`\nEstado: ${estado}`);
        const data = freshData[estado];
        if (!data) {
          console.log('  Dados não encontrados.');
          continue;
        }
        const planos = data.planos || data.data?.planos || data;
        const plano = Array.isArray(planos) ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado) : null;
        if (!plano) {
          console.log('  Plano não encontrado.');
          continue;
        }

        const planService = new kl();
        const { indice, looviFipe } = getIndiceAndLooviFipe(testFipe);
        console.log(`  FIPE: ${testFipe}, Índice: ${indice}, Loovi FIPE: ${looviFipe}`);

        // Essencial
        const rEssencial = { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: false, smart: false, vidros: false };
        const mensalEssencial = planService.getCalcPlanPrice(plano, looviFipe, rEssencial);
        console.log(`  Essencial: R$ ${mensalEssencial.toFixed(2)}`);

        // Sem Vidro
        const rSemVidro = { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: true, smart: false, vidros: false };
        const mensalSemVidro = planService.getCalcPlanPrice(plano, looviFipe, rSemVidro);
        console.log(`  Sem Vidro: R$ ${mensalSemVidro.toFixed(2)}`);

        // Completo
        const rCompleto = { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: true, smart: false, vidros: true };
        const mensalCompleto = planService.getCalcPlanPrice(plano, looviFipe, rCompleto);
        console.log(`  Completo: R$ ${mensalCompleto.toFixed(2)}`);

        // Debug individual components for MG
        if (estado === 'MG') {
          console.log(`  Expected MG Essencial: R$ 103.90`);
          console.log(`  Expected MG Completo: R$ 207.90`);
          console.log(`  Current MG Essencial: R$ ${mensalEssencial.toFixed(2)}`);
          console.log(`  Current MG Completo: R$ ${mensalCompleto.toFixed(2)}`);
          console.log(`  Difference Essencial: ${Math.abs(parseFloat(mensalEssencial.toFixed(2)) - 103.90).toFixed(2)}`);
          console.log(`  Difference Completo: ${Math.abs(parseFloat(mensalCompleto.toFixed(2)) - 207.90).toFixed(2)}`);

          // Break down components
          console.log(`  --- Component breakdown for MG ---`);
          console.log(`  Roubo/Furto: R$ ${planService.getRouboFurtoPrice(plano, looviFipe)}`);
          console.log(`  PT Roubo/Furto: R$ ${planService.getPtRouboFurtoPrice(plano, looviFipe)}`);
          console.log(`  Agravo: R$ ${planService.getAgravoPrice(plano, rEssencial.car)}`);
          console.log(`  Servico Loovi (Essencial): R$ ${planService.getServicoLooviPrice(plano, looviFipe, false)}`);
          console.log(`  Servico Loovi (Completo): R$ ${planService.getServicoLooviPrice(plano, looviFipe, true)}`);
          console.log(`  Seg Colisao: R$ ${planService.getSegColisaoPrice(plano, looviFipe)}`);
          console.log(`  Seg Terceiros: R$ ${planService.getSegTerceirosPrice(plano)}`);
          console.log(`  Vidros: R$ ${planService.getVidrosPrice(plano)}`);

          // Calculate expected vs actual
          const expectedCompleto = 207.90;
          const actualCompleto = parseFloat(mensalCompleto.toFixed(2));
          const difference = expectedCompleto - actualCompleto;

          console.log(`  --- Analysis ---`);
          console.log(`  Expected Completo: R$ ${expectedCompleto}`);
          console.log(`  Actual Completo: R$ ${actualCompleto}`);
          console.log(`  Missing amount: R$ ${difference.toFixed(2)}`);

          // Check if vidros price matches the difference
          const vidrosPrice = planService.getVidrosPrice(plano);
          console.log(`  Vidros price: R$ ${vidrosPrice}`);
          console.log(`  Is vidros the issue? ${Math.abs(vidrosPrice - Math.abs(difference)) < 0.01 ? 'YES' : 'NO'}`);

          // Check individual calculations
          const basePrice = planService.getRouboFurtoPrice(plano, looviFipe) +
                           planService.getPtRouboFurtoPrice(plano, looviFipe) +
                           planService.getAgravoPrice(plano, rEssencial.car) +
                           planService.getServicoLooviPrice(plano, looviFipe, true); // with collision

          const collisionPrice = planService.getSegColisaoPrice(plano, looviFipe) +
                                planService.getSegTerceirosPrice(plano) +
                                planService.getSegLtiPrice(plano);

          const glassPrice = planService.getVidrosPrice(plano);

          console.log(`  Base price (RF + PT + Agravo + Loovi): R$ ${basePrice.toFixed(2)}`);
          console.log(`  Collision price (SegColisao + SegTerceiros + LTI): R$ ${collisionPrice.toFixed(2)}`);
          console.log(`  Glass price: R$ ${glassPrice.toFixed(2)}`);
          console.log(`  Manual calculation: R$ ${(basePrice + collisionPrice + glassPrice).toFixed(2)}`);
          console.log(`  getCalcPlanPrice result: R$ ${mensalCompleto.toFixed(2)}`);

          // Check if there's a missing component
          const manualTotal = basePrice + collisionPrice + glassPrice;
          const apiTotal = parseFloat(mensalCompleto.toFixed(2));
          const missing = 207.90 - apiTotal;

          console.log(`  Expected total: R$ 207.90`);
          console.log(`  API total: R$ ${apiTotal}`);
          console.log(`  Missing amount: R$ ${missing.toFixed(2)}`);

          // Check if smart car is being added
          try {
            const smartPrice = planService.getSmartPrice(plano);
            console.log(`  Smart car price: R$ ${smartPrice}`);
            if (smartPrice > 0) {
              console.log(`  With smart car: R$ ${(apiTotal + smartPrice).toFixed(2)}`);
            }
          } catch (e) {
            console.log(`  Smart car error: ${e.message}`);
          }

          console.log(`  --- End breakdown ---`);
        }

        // Comparar com cache
        try {
          const cached = computeMensalidadesFromCache(estado, testFipe);
          console.log(`  Cache Essencial: R$ ${cached.essencial.mensal}`);
          console.log(`  Cache Sem Vidro: R$ ${cached.semVidro.mensal}`);
          console.log(`  Cache Completo: R$ ${cached.completo.mensal}`);
          if (cached.essencial.mensal !== mensalEssencial.toFixed(2)) {
            console.log(`  *** DIFERENÇA EM ESSENCIAL: Fresco ${mensalEssencial.toFixed(2)} vs Cache ${cached.essencial.mensal}`);
          }
        } catch (e) {
          console.log(`  Erro no cache: ${e.message}`);
        }
      }
    }
    

    
    document.addEventListener('DOMContentLoaded', async () => {
      // Carrega valores base na primeira vez
      await loadBaseValues();
    
      // Lista os valores dos planos no console
      listPlanValues();
    
      // Testa cálculos de mensalidades
      testCalculations();
    
      // Debug: força reload e compara
      await debugCalculations();
    
      
    
    const ui = new Ui();
    // expose for external/debug use (so gerarPDF/verificarPlaca can call methods)
    window.ui = ui;
    
      ui.attachInputListener();
      ui.checkboxData();
      ui.sellerCheckboxData();
      ui.planoCheckboxData();
      ui.modalHistoric();
    
      // Carrega estado salvo ou padrão SP
    const savedEstado = localStorage.getItem('selectedEstado') || 'SP';
      ui.estado = savedEstado;
      ui.categoriaFipe = "CAT_FIPE_100K";
      document.getElementById(savedEstado.toLowerCase()).checked = true;
    
    // Attach PDF buttons to gerarPDF if present
    document.getElementById('btnGerarPDFEssencial')?.addEventListener('click', () => gerarPDF('PDF-Essencial'));
    document.getElementById('btnGerarPDFSemVidros')?.addEventListener('click', () => gerarPDF('PDF-SemVidros'));
    document.getElementById('btnGerarPDFCompleto')?.addEventListener('click', () => gerarPDF('PDF-Completo'));
    });


// Gera PDF via Api2Pdf (adaptação do snippet fornecido)
async function gerarPDF(nomeArquivo) {
  try {
    // Determina dados da tela
    const placaOrValue = document.getElementById('placaOrValue')?.value || document.getElementById('placa')?.value || '';
    // chama verificarVendedor para popular vendedor no objeto ui
    if (window.ui && typeof window.ui.verificarVendedor === 'function') window.ui.verificarVendedor();

    // coleta frase unificada
    const fraseUnificada = document.getElementById('fraseUnificada')?.value || '';

    // coleta valores da tabela (se existirem)
    const totalEssencial = document.getElementById('totalEssencial')?.textContent || '';
    const totalCompleto = document.getElementById('totalCompleto')?.textContent || '';
    const primeiraEssencial = document.getElementById('primeiraMensalidadeEssencial')?.textContent || '';
    const primeiraCompleto = document.getElementById('primeiraMensalidadeCompleto')?.textContent || '';

    // vendedor (se tiver sido decidido)
    let vendedor = null;
    if (window.ui && window.ui.vendedor) vendedor = window.ui.vendedor;

    // Monta HTML simples para o PDF
    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${nomeArquivo}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#222}header{background:#0a3d91;color:#fff;padding:12px;text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><header><h2>Loovi Seguros</h2></header><main style="padding:16px"><h3>${nomeArquivo}</h3><p><strong>Placa / Valor FIPE:</strong> ${placaOrValue}</p><h4>Frase</h4><p>${fraseUnificada}</p><h4>Valores</h4><table><tr><th>Item</th><th>Valor</th></tr><tr><td>Primeira Mensalidade</td><td>${nomeArquivo.includes('Essencial')?primeiraEssencial:primeiraCompleto}</td></tr><tr><td>Total Mensal</td><td>${nomeArquivo.includes('Completo')?totalCompleto:totalEssencial}</td></tr></table>${vendedor?`<h4>Vendedor</h4><p>${vendedor.nome} — ${vendedor.telFormatado ?? vendedor.tel}</p>`:''}</main></body></html>`;

    const postData = {
      fileName: nomeArquivo + '.pdf',
      html: html,
      options: {
        landscape: false,
        displayHeaderFooter: false,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        marginTop: 0,
        pageRanges: 1,
        preferCSSPageSize: true
      }
    };

    const jsonData = JSON.stringify(postData);
    const URL = 'https://v2.api2pdf.com/chrome/pdf/html';

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Preserve the key you provided in the snippet - if you want to change it, edit here
        'Authorization': '930cabb8-33e2-4ecc-80bf-f45d4f3173bd'
      },
      body: jsonData
    };

    const resp = await fetch(URL, options);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error('Api2Pdf error: ' + resp.status + ' ' + text);
    }
    const data = await resp.json();
    if (data && data.FileUrl) {
      window.open(data.FileUrl, '_blank');
    } else if (data && data.file && data.file.url) {
      window.open(data.file.url, '_blank');
    } else {
      throw new Error('Resposta inesperada da Api2Pdf: ' + JSON.stringify(data));
    }

  } catch (e) {
    console.error('Erro gerarPDF:', e);
    alert('Erro ao gerar PDF: ' + (e.message || e));
  }
}

function verificarPlaca() {
  // Delegamos ao método de verificação central (UI)
  if (window.ui && typeof window.ui.checkPlate === 'function') {
    window.ui.checkPlate();
    return;
  }

  // Fallback simples: tenta ler o campo e decidir
  const placaField = document.getElementById('placa') || document.getElementById('placaOrValue');
  if (!placaField) return;
  const placa = placaField.value || '';
  const valor = parseInt(placa.replace(/\D/g, ''));
  if (Number.isInteger(valor) && valor > 0) {
    // chama função de busca por valor se existir
    if (typeof buscaValor === 'function') buscaValor();
  } else {
    if (placa.length == 7 && typeof buscaPlaca === 'function') buscaPlaca(placa);
  }
}




