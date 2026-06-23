import { kl } from './planService.js';
import { getCategoriaAgravo } from './utils.js';

export class Calcular {
  async buscarCotacaoSAP(estado) {
    const url = "https://ticjxjby64.execute-api.us-east-1.amazonaws.com/producao/proxy/v2/SAP";
    const apiKey = "RRcW9gj2tZ6pSVsnbpmKhshpXC3yR9EklCwqQyh0";
    const payload = '{"url":"https://sapiis.loovi.com.br:60000/plano/Api/v1/obterPlanosPorEstado/' + estado.toUpperCase() + '/app","metodo":"GET","headers":{"requester":"Portal","cotacao":""},"body":{}}';

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
      const jsonStr = typeof data === "string" ? atob(data) : "";
      const resultado = jsonStr ? JSON.parse(jsonStr) : data;
      return resultado;
    } catch (error) {}
  }

  arrayMensalidades(resultado, estado, tipoVeiculo = null) {
    let planos = resultado.planos || resultado.data?.planos || resultado;
    if (!Array.isArray(planos) && planos && typeof planos === 'object') {
      planos = Object.values(planos);
    }
    const plano = Array.isArray(planos)
      ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado)
      : null;

    if (plano) {
      const categoriaAgravo = getCategoriaAgravo(tipoVeiculo);
      const isSUV = categoriaAgravo === "CAT_AGRAVO_PICKUP_CAM";
      const r = { car: categoriaAgravo, colisao: false, smart: isSUV, vidros: false };
      const planService = new kl();
      const mensalidades = [];
      for (let i = 10; i <= 150; i += 10) {
        mensalidades.push(parseFloat(planService.getCalcPlanPrice(plano, i, r).toFixed(2)));
      }
      return mensalidades;
    }
  }

  calcularCotacaoFaixa(json, estado, faixaFipe) {
    const planos = json.planos || json.data?.planos || json;
    const plano = Array.isArray(planos)
      ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado)
      : null;

    const itemSegColisao = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
    let SRV_SEG_COLISAO = 0;
    if (itemSegColisao && itemSegColisao.formularioSubItens) {
      const subColisao = itemSegColisao.formularioSubItens.subItemPlano.find(s => s.codigoItem === "SRV_SEG_COLISAO");
      if (subColisao && subColisao.formularioCategorias) {
        const cat = subColisao.formularioCategorias.categoriaSubItem.find(c => c.codigoItem === faixaFipe);
        if (cat) SRV_SEG_COLISAO = cat.preco;
      }
    }

    const itemTerceiros = plano.itensPlano.find(i => i.codigoItem === "SRV_SEGUROS_LTI");
    let SRV_SEG_TERCEIROS = 0;
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

    let r = SRV_SEG_COLISAO + SRV_SEG_TERCEIROS + SRV_SEG_TERCEIROS_CORP + CAT_SEG_APP;

    let c = 0;
    const itemServicoLoovi = plano.itensPlano.find(i => i.codigoItem === "SRV_SERVICO_LOOVI");
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

    r += c > u ? (c - u) : -(u - c);
    return Number(r.toFixed(2));
  }

  async main(estado) {
    const resultado = await this.buscarCotacaoSAP(estado);
    this.arrayMensalidades(resultado, estado);
    return resultado;
  }
}
