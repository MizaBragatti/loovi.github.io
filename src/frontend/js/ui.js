import { Calcular } from './api.js';
import { kl } from './planService.js';
import { autoResize, parseBRLToNumber, getCategoriaAgravo, getIndiceAndLooviFipe } from './utils.js';
import { loadCounters, incrementCounters } from './counters.js';
import { getBaseDataForEstado } from './cache.js';

export class Ui extends Calcular {
  constructor() {
    super();
    this.inputField = document.querySelector("#placaOrValue") || document.createElement('input');
    this.dadosFipeField = document.querySelector("#dadosFipe") || document.createElement('textarea');
    this.valorFipe = 0;
    this.checkboxes = document.querySelectorAll('input[type="checkbox"]');
    this.estado = null;
    this.sellerCheckboxes = document.querySelectorAll('#miza, #sofia, #nicolas');
    this.buttonHistoric = document.querySelector(".img-historico") || document.createElement('img');
    this.historic = document.querySelector(".modalHistorico") || document.createElement('div');
    this.fecharHistoric = document.querySelector(".fecharHistorico") || document.createElement('button');
    this.inputBuscar = document.querySelector(".input-buscar") || document.createElement('input');
    this.planoCheckboxes = document.querySelectorAll('.checkbox-plano');
    this.frases = {};
    this.selectedPlano = null;
    this.attachResizeListener();
  }

  autoResizeTextarea(el) {
    if (!el) return;
    try {
      el.style.height = 'auto';
      const maxPx = window.innerHeight * 0.4;
      const newHeight = Math.min(el.scrollHeight, maxPx);
      el.style.height = newHeight + 'px';
      el.style.overflow = el.scrollHeight > maxPx ? 'auto' : 'hidden';
    } catch (e) {}
  }

  attachResizeListener() {
    if (!this.dadosFipeField) return;
    if (this.dadosFipeField.tagName && this.dadosFipeField.tagName.toLowerCase() !== 'textarea') return;
    this.dadosFipeField.addEventListener('input', () => this.autoResizeTextarea(this.dadosFipeField));
    setTimeout(() => this.autoResizeTextarea(this.dadosFipeField), 0);
  }

  getCategoriaFipe(fipeValue) {
    let k = Math.round(fipeValue / 10000);
    k = Math.max(1, Math.min(15, k));
    return "CAT_FIPE_" + (k * 10) + "K";
  }

  async calculaMensalidade() {
    try {
      if (!this.estado || this.estado === 'undefined') {
        this.inputField.classList.add('error');
        setTimeout(() => this.inputField.classList.remove('error'), 3000);
        return;
      }

      const resultado = await getBaseDataForEstado(this.estado);
      if (!resultado) return;

      let planos = resultado.planos || resultado.data?.planos || resultado;
      if (!Array.isArray(planos) && planos && typeof planos === 'object') {
        planos = Object.values(planos);
      }
      if (!Array.isArray(planos)) return;

      const possiveisPlanos = [
        "ROUBO_FURTO_PT_" + this.estado,
        "ROUBO_FURTO_PT_RAST_" + this.estado,
        "ROUBO_FURTO_PT_" + this.estado.toUpperCase(),
        "ROUBO_FURTO_PT_RAST_" + this.estado.toUpperCase(),
        "LICIT_ROUBO_FURTO_PT_" + this.estado,
        "LICIT_ROUBO_FURTO_PT_RAST_" + this.estado,
        "LICIT_ROUBO_FURTO_PT_ANUAL_" + this.estado,
        "LICIT_ROUBO_FURTO_PT_RAST_ANUAL_" + this.estado,
        "TESTE_" + this.estado,
        "ROUBO_FURTO_PT_ANUAL_" + this.estado,
        "ROUBO_FURTO_PT_RAST_ANUAL_" + this.estado
      ];

      let plano = null;
      for (const nomePlano of possiveisPlanos) {
        plano = planos.find(p => p.idPlano === nomePlano);
        if (plano) break;
      }

      if (!plano) return;

      const planService = new kl();

      let categoriaAgravoUI = "CAT_AGRAVO_VEICULO_LEVE";
      let isSUVUI = false;
      const suvElementUI = document.getElementById('suv');
      const utilElementUI = document.getElementById('util');
      if (suvElementUI && suvElementUI.checked) {
        categoriaAgravoUI = "CAT_AGRAVO_PICKUP_CAM";
        isSUVUI = true;
      } else if (utilElementUI && utilElementUI.checked) {
        categoriaAgravoUI = "CAT_AGRAVO_OUTROS";
        isSUVUI = true;
      } else if (this.tipoVeiculo) {
        categoriaAgravoUI = getCategoriaAgravo(this.tipoVeiculo);
        isSUVUI = categoriaAgravoUI === "CAT_AGRAVO_PICKUP_CAM";
      }

      const r = { car: categoriaAgravoUI, colisao: false, smart: isSUVUI, vidros: false };

      let mensalidades = [];
      for (let i = 10; i <= 150; i += 10) {
        mensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, r).toFixed(2)));
      }

      const { indice } = getIndiceAndLooviFipe(this.valorFipe);
      const faixaFipe = "CAT_FIPE_" + (indice + 1) * 10 + "K";

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

      valorColisao += c > u ? (c - u) : -(u - c);

      const itemSegLti = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
      if (itemSegLti) valorColisao += itemSegLti.preco;

      const essencialMensalidades = [];
      for (let i = 10; i <= 150; i += 10) {
        essencialMensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, { car: categoriaAgravoUI, colisao: false, smart: isSUVUI, vidros: false }).toFixed(2)));
      }
      let valorMensalidade = essencialMensalidades[indice];

      const valorBaseAPI = essencialMensalidades[indice];
      const usarDadosHardcoded = valorBaseAPI <= 0 || isNaN(valorBaseAPI);
      if (usarDadosHardcoded) {
        valorMensalidade = this.calcularComDadosHardcoded(indice, categoriaAgravoUI);
      }

      const valorMensalidadeEssencial = valorMensalidade;
      const valorVidros = planService.getVidrosPrice(plano);
      const valorMensalidadeCompleto = valorMensalidade + valorColisao + valorVidros;
      const valorAtivacao = 299.90;

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

      document.getElementById('colisaoEssencial').textContent = '0';
      document.getElementById('primeiraMensalidadeEssencial').textContent = this.formatBRL(primeiraMensalidadeEssencial);
      document.getElementById('totalEssencial').textContent = this.formatBRL(totalEssencial);
      document.getElementById('totalAnualEssencial').textContent = this.formatBRL(totalAnualEssencial);

      document.getElementById('colisaoCompleto').textContent = this.formatBRL(valorColisao);
      document.getElementById('primeiraMensalidadeCompleto').textContent = this.formatBRL(primeiraMensalidadeCompleto);
      document.getElementById('totalCompleto').textContent = this.formatBRL(totalCompleto);
      document.getElementById('totalAnualCompleto').textContent = this.formatBRL(totalAnualCompleto);

      const parcelaAnualEssencial = parseFloat((totalAnualEssencial / 12).toFixed(2));
      const parcelaAnualSemVidro  = parseFloat((totalAnualSemVidro  / 12).toFixed(2));
      const parcelaAnualCompleto  = parseFloat((totalAnualCompleto  / 12).toFixed(2));

      this.frases = {
        essencial: "Seguro Essencial no Plano Anual é de " +
          this.formatBRL(totalAnualEssencial) + " em até 12x sem juros de " + this.formatBRL(parcelaAnualEssencial) + " no cartão de crédito. " +
          "Já no Plano Recorrente Mensal o Valor da entrada é de " + this.formatBRL(primeiraMensalidadeEssencial) +
          " no cartão de crédito + mensais sem juros de " + this.formatBRL(totalEssencial) +
          " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.",

        semVidro: "Seguro Completo sem Vidros no Plano Anual é de " +
          this.formatBRL(totalAnualSemVidro) + " em até 12x sem juros de " + this.formatBRL(parcelaAnualSemVidro) + " no cartão de crédito. " +
          "Já no Plano Recorrente Mensal o Valor da entrada é de " + this.formatBRL(primeiraMensalidadeSemVidro) +
          " no cartão de crédito + mensais sem juros de " + this.formatBRL(totalSemVidro) +
          " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.",

        completo: "Seguro Completo com Colisão e Opcional Vidros " +
          "(faróis, lanternas e retrovisores) no Plano Anual é de " + this.formatBRL(totalAnualCompleto) + " em até 12x sem juros de " +
          this.formatBRL(parcelaAnualCompleto) + " no cartão de crédito. " +
          "Já no Plano Recorrente Mensal o Valor da entrada é de " + this.formatBRL(primeiraMensalidadeCompleto) +
          " no cartão de crédito + mensais sem juros de " + this.formatBRL(totalCompleto) +
          " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão."
      };

      this.updateFraseUnificada();
    } catch (error) {
      this.inputField.classList.add('error');
      setTimeout(() => this.inputField.classList.remove('error'), 3000);
    }
  }

  calcularComDadosHardcoded(indice, categoriaAgravo) {
    // Fallback com dados hardcoded quando a API retorna valores zerados.
    // valoresMG / valoresRJ / valoresSul / valoresOutrosEstados devem ser definidos externamente.
    let valorMensalidade = 0;
    let valorColisao = 0;
    let valorVidros = 35.00;
    const estadoAtual = this.estado || 'SP';

    if (estadoAtual === 'MG') {
      valorMensalidade = valoresMG[0][indice];
      valorColisao = valoresMG[1][indice];
      valorVidros = valoresMG[4];
    } else if (estadoAtual === 'RJ') {
      valorMensalidade = valoresRJ[0][indice];
      valorColisao = valoresRJ[1][indice];
      valorVidros = valoresRJ[4];
    } else if (['SC', 'RS'].includes(estadoAtual)) {
      valorMensalidade = valoresSul[0][indice];
      valorColisao = valoresSul[1][indice];
      valorVidros = valoresSul[4];
    } else {
      valorMensalidade = valoresOutrosEstados[0][indice];
      valorColisao = valoresOutrosEstados[1][indice];
    }

    if (categoriaAgravo === "CAT_AGRAVO_VEICULO_PESADO") {
      if (estadoAtual === 'MG')              valorMensalidade += valoresMG[2];
      else if (estadoAtual === 'RJ')         valorMensalidade += valoresRJ[2];
      else if (['SC', 'RS'].includes(estadoAtual)) valorMensalidade += valoresSul[2];
      else                                   valorMensalidade += valoresOutrosEstados[2];
    }

    return valorMensalidade;
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

  updateCheckboxStates() {
    const enabled = !!this.estado;
    if (this.sellerCheckboxes && this.sellerCheckboxes.length) {
      this.sellerCheckboxes.forEach(cb => cb.disabled = !enabled);
    }
    if (this.planoCheckboxes && this.planoCheckboxes.length) {
      this.planoCheckboxes.forEach(cb => cb.disabled = !enabled);
    }
    const suv = document.getElementById('suv');
    const util = document.getElementById('util');
    if (suv) suv.disabled = !enabled;
    if (util) util.disabled = !enabled;
  }

  tipoVeiculoCheckboxData() {
    const suvCheckbox = document.getElementById('suv');
    const utilCheckbox = document.getElementById('util');

    if (suvCheckbox) {
      suvCheckbox.addEventListener('change', async () => {
        if (suvCheckbox.checked) utilCheckbox.checked = false;
        if (!this.estado || this.estado === 'undefined') {
          this.estado = 'SP';
          const sp = document.getElementById('sp');
          if (sp) sp.checked = true;
        }
        this.updateCheckboxStates();
        if (this.estado && this.valorFipe > 0) await this.calculaMensalidade();
      });
    }

    if (utilCheckbox) {
      utilCheckbox.addEventListener('change', async () => {
        if (utilCheckbox.checked) suvCheckbox.checked = false;
        if (!this.estado || this.estado === 'undefined') {
          this.estado = 'SP';
          const sp = document.getElementById('sp');
          if (sp) sp.checked = true;
        }
        this.updateCheckboxStates();
        if (this.estado && this.valorFipe > 0) await this.calculaMensalidade();
      });
    }
  }

  modalHistoric() {
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
      if (e.key === "Enter") e.preventDefault();
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
      lista.innerHTML = '<p>Ainda não foi buscada nenhuma placa.</p>';
      return;
    }

    filteredQuotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    filteredQuotes.forEach((quote) => {
      const item = document.createElement('div');
      item.className = 'cotacao-item';
      const date = new Date(quote.timestamp).toLocaleString('pt-BR');
      item.innerHTML = `
        <p><strong>Placa:</strong> ${quote.placa || 'N/A'}</p>
        ${quote.modelo ? `<p><strong>Modelo:</strong> ${quote.modelo}</p>` : ''}
        <p><strong>Data:</strong> ${date}</p>
        <p><strong>Estado:</strong> ${quote.estado || 'N/A'}</p>
        ${quote.valorFipe ? `<p><strong>Valor FIPE:</strong> ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(quote.valorFipe)}</p>` : ''}
        ${quote.vendedor ? `<p><strong>Vendedor:</strong> ${quote.vendedor.nome}</p>` : ''}
        <div class="buttons-container">
          <button class="btn-delete" data-index="${quotes.indexOf(quote)}">Deletar</button>
          <button class="btn-consultar" data-index="${quotes.indexOf(quote)}">Consultar</button>
        </div>
      `;
      lista.appendChild(item);
    });

    document.querySelectorAll('.btn-consultar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.consultarQuote(e.target.getAttribute('data-index'));
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.deleteQuote(e.target.getAttribute('data-index'));
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

  consultarQuote(index) {
    const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
    const quote = quotes[index];
    if (quote) {
      this.inputField.value = quote.placa || '';
      if (quote.estado) {
        const estadoCheckbox = document.getElementById(quote.estado.toLowerCase());
        if (estadoCheckbox) {
          this.checkboxes.forEach(cb => cb.checked = false);
          estadoCheckbox.checked = true;
          this.estado = quote.estado;
        }
      }
      this.historic.classList.remove("hidden");
      setTimeout(() => this.init(), 100);
    }
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

    return {
      total: quotes.length,
      today: quotes.filter(q => new Date(q.timestamp) >= startOfDay).length,
      week:  quotes.filter(q => new Date(q.timestamp) >= startOfWeek).length,
      month: quotes.filter(q => new Date(q.timestamp) >= startOfMonth).length,
      year:  quotes.filter(q => new Date(q.timestamp) >= startOfYear).length
    };
  }

  checkboxData() {
    this.checkboxes.forEach(checkboxNow => {
      checkboxNow.addEventListener('change', async () => {
        try {
          const checkedBoxes = Array.from(this.checkboxes).filter(cb => cb.checked);
          if (checkboxNow.checked && checkedBoxes.length > 2) {
            checkboxNow.checked = false;
            return;
          }

          const estado = checkboxNow.dataset.estado;
          if (checkboxNow.checked) {
            this.estado = estado;
            if (this.valorFipe > 0) await this.calculaMensalidade();
          } else {
            const remainingChecked = Array.from(this.checkboxes).filter(cb => cb.checked);
            this.estado = remainingChecked.length > 0 ? remainingChecked[0].dataset.estado : null;
          }
        } catch (error) {}

        if (this.estado && this.valorFipe > 0) await this.calculaMensalidade();

        const suvCheckbox = document.getElementById('suv');
        const utilCheckbox = document.getElementById('util');
        if (this.estado && (suvCheckbox?.checked || utilCheckbox?.checked)) {
          await this.calculaMensalidade();
        }
      });
    });
  }

  normalizePlate(value) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  regexInput(inputValue) {
    return /^[A-Z]{3}[-\s]?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i.test(inputValue);
  }

  checkValue() {
    const inputValue = this.inputField.value.trim();
    if (inputValue === "") {
      this.clearTableValues();
      return { type: "vazio", value: "" };
    }
    if (this.regexInput(inputValue)) {
      return { type: "placa", value: this.normalizePlate(inputValue) };
    }
    const numericValue = parseInt(inputValue.replace(/\D/g, ""), 10);
    if (!isNaN(numericValue)) {
      return { type: "fipe", value: this.formatBRL(numericValue) };
    }
    return { type: "inválido", value: inputValue };
  }

  async checkPlate() {
    if (!this.estado) {
      this.estado = 'SP';
      const spElement = document.getElementById('sp');
      if (spElement) spElement.checked = true;
    }

    this.inputField.classList.remove('processing', 'error', 'success');
    const result = this.checkValue();

    switch (result.type) {
      case "vazio":
        this.dadosFipeField.value = "Ainda não tem placa adicionada.";
        this.autoResizeTextarea(this.dadosFipeField);
        break;

      case "placa":
        this.inputField.classList.add('processing');
        this.dadosFipeField.value = "Buscando dados da placa...";
        this.autoResizeTextarea(this.dadosFipeField);
        try {
          await this.buscaPlaca(result.value);
          this.inputField.classList.remove('processing');
          this.inputField.classList.add('success');
          setTimeout(() => this.inputField.classList.remove('success'), 2000);
        } catch (error) {
          this.inputField.classList.remove('processing');
          this.inputField.classList.add('error');
          setTimeout(() => this.inputField.classList.remove('error'), 3000);
        }
        break;

      case "fipe":
        this.inputField.classList.add('processing');
        this.valorFipe = parseFloat(result.value.replace(/[^\d,]/g, "").replace(",", "."));
        this.dadosFipeField.value = `Valor FIPE: R$ ${this.valorFipe.toFixed(2).replace('.', ',')}`;
        this.autoResizeTextarea(this.dadosFipeField);
        try {
          await this.calculaMensalidade();
          this.inputField.classList.remove('processing');
          this.inputField.classList.add('success');
          setTimeout(() => this.inputField.classList.remove('success'), 2000);
        } catch (error) {
          this.inputField.classList.remove('processing');
          this.inputField.classList.add('error');
          setTimeout(() => this.inputField.classList.remove('error'), 3000);
        }
        break;

      case "inválido":
        this.inputField.classList.add('error');
        this.dadosFipeField.value = "Entrada inválida. Digite uma placa válida ou valor numérico.";
        this.autoResizeTextarea(this.dadosFipeField);
        setTimeout(() => this.inputField.classList.remove('error'), 3000);
        break;

      default:
        this.inputField.classList.add('error');
        this.dadosFipeField.value = "Erro inesperado.";
        this.autoResizeTextarea(this.dadosFipeField);
        setTimeout(() => this.inputField.classList.remove('error'), 3000);
    }
  }

  async buscaPlaca(placa) {
    try {
      const URL = `https://tsrujo7p82.execute-api.us-east-1.amazonaws.com/producao/placas/v2/dados-atualizados/${placa}`;
      const response = await fetch(URL);
      if (!response.ok) throw new Error("Erro na API principal");
      const data = await response.json();
      if (!data || !data.Fipe) throw new Error("Placa não encontrada na API principal");
      this.showData(data, placa);
    } catch (error) {
      this.dadosFipeField.value = "Erro ao buscar dados da placa. Verifique se a placa está correta.";
      this.autoResizeTextarea(this.dadosFipeField);
      throw error;
    }
  }

  async showData(data, placa) {
    const valorRaw = data.Fipe && data.Fipe.Valor ? String(data.Fipe.Valor) : '';
    const valorNumero = parseBRLToNumber(valorRaw);
    this.valorFipe = valorNumero;
    const formattedFipe = this.formatBRL(this.valorFipe);

    const lines = [
      `Ano: ${data.Ano}`,
      `Modelo: ${data.Modelo}`,
      `Fabricante: ${data.Fabricante}`,
      `Tipo Veículo: ${data.TipoVeiculo ?? data.TipoVeculo}`,
      `Valor FIPE: ${formattedFipe}`
    ];
    this.dadosFipeField.value = lines.join('\n');
    try { autoResize(this.dadosFipeField); } catch (e) { this.autoResizeTextarea(this.dadosFipeField); }

    this.categoriaFipe = this.getCategoriaFipe(this.valorFipe);
    this.tipoVeiculo = data.TipoVeiculo ?? data.TipoVeculo;
    this.modelo = data.Modelo;

    await this.calculaMensalidade();
    this.saveQuote(placa);
    this.inputField.value = "";
  }

  formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  saveQuote(placa) {
    const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
    const placaValue = placa || this.inputField.value;
    const existingIndex = quotes.findIndex(quote => quote.placa === placaValue);

    const primeiraEssencial = document.getElementById('primeiraMensalidadeEssencial')?.textContent || null;
    const totalEssencial    = document.getElementById('totalEssencial')?.textContent || null;
    const primeiraCompleto  = document.getElementById('primeiraMensalidadeCompleto')?.textContent || null;
    const totalCompleto     = document.getElementById('totalCompleto')?.textContent || null;

    const newQuote = {
      timestamp: Date.now(),
      placa: placaValue,
      estado: this.estado,
      categoria: this.categoriaFipe || null,
      tipoVeiculo: this.tipoVeiculo || null,
      modelo: this.modelo || null,
      valorFipe: this.valorFipe || null,
      planos: {
        essencial: { primeira: primeiraEssencial, mensal: totalEssencial },
        completo:  { primeira: primeiraCompleto,  mensal: totalCompleto }
      },
      vendedor: this.vendedor || null
    };

    if (existingIndex !== -1) {
      quotes[existingIndex] = Object.assign({}, quotes[existingIndex], newQuote);
    } else {
      quotes.push(newQuote);
      incrementCounters();
    }
    localStorage.setItem('quotes', JSON.stringify(quotes));
  }

  async init() {
    await this.checkPlate();
    this.attachCopyListeners();
  }

  attachInputListener() {
    let timeout;
    this.inputField.addEventListener("input", () => {
      this.inputField.value = this.inputField.value.toUpperCase();
      clearTimeout(timeout);
      timeout = setTimeout(() => this.init(), 500);
    });
    this.inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(timeout);
        this.init();
      }
    });
    if (this.dadosFipeField) {
      this.dadosFipeField.addEventListener("focus", () => {
        if (this.inputField.value.trim()) this.init();
      });
    }
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

  attachFraseButtons() {
    document.getElementById('btnFraseEssencial').addEventListener('click', () => {
      this.selectedPlano = 'essencial';
      this.updateFraseUnificada();
    });
    document.getElementById('btnFraseSemVidro').addEventListener('click', () => {
      this.selectedPlano = 'semVidro';
      this.updateFraseUnificada();
    });
    document.getElementById('btnFraseCompleto').addEventListener('click', () => {
      this.selectedPlano = 'completo';
      this.updateFraseUnificada();
    });
  }

  updateFraseUnificada() {
    const textarea = document.getElementById('fraseUnificada');
    textarea.value = (this.selectedPlano && this.frases[this.selectedPlano])
      ? this.frases[this.selectedPlano]
      : '';
    this.autoResizeTextarea(textarea);

    document.querySelectorAll('.btn-frase').forEach(btn => btn.classList.remove('active'));
    if (this.selectedPlano) {
      const btnId = `btnFrase${this.selectedPlano.charAt(0).toUpperCase() + this.selectedPlano.slice(1)}`;
      document.getElementById(btnId)?.classList.add('active');
    }
  }

  clearTableValues() {
    ['colisaoEssencial', 'primeiraMensalidadeEssencial', 'totalEssencial', 'totalAnualEssencial',
     'colisaoCompleto', 'primeiraMensalidadeCompleto', 'totalCompleto', 'totalAnualCompleto']
      .forEach(id => { document.getElementById(id).textContent = ''; });
    this.frases = {};
    this.updateFraseUnificada();
    this.valorFipe = 0;
  }

  planoCheckboxData() {
    this.planoCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.planoCheckboxes.forEach(box => { if (box !== checkbox) box.checked = false; });
        this.selectedPlano = checkbox.checked ? checkbox.dataset.plano : null;
        this.updateFraseUnificada();
      });
    });
  }
}
