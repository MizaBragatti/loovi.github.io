export const kl = (() => {
  class PlanService {
    getPlanItem(e, i = "") {
      if (!e || !e.itensPlano) return null;
      const o = e.itensPlano.filter(a => a.codigoItem == i);
      return o.length ? o[0] : null;
    }

    getPlanSubItemFipe(e, i, r) {
      const o = `CAT_FIPE_${e}K`;
      const s = i.formularioSubItens.subItemPlano.filter(u => u.codigoItem == r);
      if (!s[0]) return;
      const l = s[0].formularioCategorias.categoriaSubItem;
      if (!l[0]) return;
      const c = l.filter(u => u.codigoItem == o);
      return c[0] ? c[0] : void 0;
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
      const r = this.getPlanItem(e, "SRV_AGRAVO");
      const s = r.formularioSubItens.subItemPlano.filter(u => "SRV_SUB_AGRAVO" == u.codigoItem);
      if (!s[0]) return;
      const l = s[0].formularioCategorias.categoriaSubItem;
      if (!l[0]) return;
      const c = l.filter(u => u.codigoItem == i);
      return c[0] ? c[0].preco : 0;
    }

    getServicoLooviPrice(e, i, r) {
      let o = 0;
      const a = this.getPlanItem(e, "SRV_SERVICO_LOOVI");
      const s = this.getPlanSubItemFipe(i, a, "SRV_FIPE_COM_COLISAO");
      const l = this.getPlanSubItemFipe(i, a, "SRV_FIPE_SEM_COLISAO");
      o = r ? (s ? s.preco : 0) : (l ? l.preco : 0);
      return o;
    }

    getSegColisaoPrice(e, i) {
      const r = this.getPlanItem(e, "SRV_SEGUROS_LTI");
      const o = `CAT_FIPE_${i}K`;
      const s = r.formularioSubItens.subItemPlano.filter(u => "SRV_SEG_COLISAO" == u.codigoItem);
      if (!s[0]) return 0;
      const l = s[0].formularioCategorias.categoriaSubItem;
      if (!l[0]) return 0;
      const c = l.filter(u => u.codigoItem == o);
      return c[0] ? c[0].preco : 0;
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
      let o = 0;
      const a = [
        { item: "SRV_ASS24",          price: this.getAss24hPrice(e) },
        { item: "SRV_CARRO_RESERVA",  price: this.getCarroReservaPrice(e) },
        { item: "SRV_ROUBO_FURTO",    price: this.getRouboFurtoPrice(e, i) },
        { item: "SRV_PT_ROUBO_FURTO", price: this.getPtRouboFurtoPrice(e, i) },
        { item: "SRV_AGRAVO",         price: this.getAgravoPrice(e, r.car) },
        { item: "SRV_SERVICO_LOOVI",  price: this.getServicoLooviPrice(e, i, r.colisao) },
      ];
      if (r.colisao) {
        a.push({ item: "SRV_SEG_COLISAO",   price: this.getSegColisaoPrice(e, i) });
        a.push({ item: "SRV_SEG_TERCEIROS",  price: this.getSegTerceirosPrice(e) });
        a.push({ item: "SRV_SEGUROS_LTI",    price: this.getSegLtiPrice(e) });
      }
      if (r.vidros) a.push({ item: "SRV_VIDROS",    price: this.getVidrosPrice(e) });
      if (r.smart)  a.push({ item: "SRV_SMART_CAR", price: this.getSmartPrice(e) });
      a.forEach(s => { o += s.price; });
      return o;
    }
  }
  return PlanService;
})();
