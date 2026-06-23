export class PlanService {
  _getItem(plano, codigoItem) {
    if (!plano?.itensPlano) return null;
    const found = plano.itensPlano.filter(a => a.codigoItem == codigoItem);
    return found.length ? found[0] : null;
  }

  _getSubItemFipe(looviFipe, item, codigoSubItem) {
    if (!item?.formularioSubItens) return undefined;
    const fipeKey = `CAT_FIPE_${looviFipe}K`;
    const subs = item.formularioSubItens.subItemPlano.filter(u => u.codigoItem == codigoSubItem);
    if (!subs[0]) return undefined;
    const cats = subs[0].formularioCategorias?.categoriaSubItem;
    if (!cats?.[0]) return undefined;
    const found = cats.filter(u => u.codigoItem == fipeKey);
    return found[0] ?? undefined;
  }

  getAss24hPrice(plano) {
    return this._getItem(plano, 'SRV_ASS24')?.preco ?? 0;
  }

  getCarroReservaPrice(plano) {
    return this._getItem(plano, 'SRV_CARRO_RESERVA')?.preco ?? 0;
  }

  getRouboFurtoPrice(plano, looviFipe) {
    const item = this._getItem(plano, 'SRV_ROUBO_FURTO');
    return this._getSubItemFipe(looviFipe, item, 'SRV_FIPE_ROUBO_FURTO')?.preco ?? 0;
  }

  getPtRouboFurtoPrice(plano, looviFipe) {
    const item = this._getItem(plano, 'SRV_PT_ROUBO_FURTO');
    return this._getSubItemFipe(looviFipe, item, 'SRV_FIPE_PT_ROUBO_FURTO')?.preco ?? 0;
  }

  getAgravoPrice(plano, categoriaAgravo) {
    const item = this._getItem(plano, 'SRV_AGRAVO');
    if (!item?.formularioSubItens) return 0;
    const subs = item.formularioSubItens.subItemPlano.filter(u => u.codigoItem == 'SRV_SUB_AGRAVO');
    if (!subs[0]) return 0;
    const cats = subs[0].formularioCategorias?.categoriaSubItem;
    if (!cats) return 0;
    const found = cats.filter(u => u.codigoItem == categoriaAgravo);
    return found[0]?.preco ?? 0;
  }

  getServicoLooviPrice(plano, looviFipe, comColisao) {
    const item = this._getItem(plano, 'SRV_SERVICO_LOOVI');
    const subKey = comColisao ? 'SRV_FIPE_COM_COLISAO' : 'SRV_FIPE_SEM_COLISAO';
    return this._getSubItemFipe(looviFipe, item, subKey)?.preco ?? 0;
  }

  getSegColisaoPrice(plano, looviFipe) {
    const item = this._getItem(plano, 'SRV_SEGUROS_LTI');
    if (!item?.formularioSubItens) return 0;
    const fipeKey = `CAT_FIPE_${looviFipe}K`;
    const subs = item.formularioSubItens.subItemPlano.filter(u => u.codigoItem == 'SRV_SEG_COLISAO');
    if (!subs[0]) return 0;
    const cats = subs[0].formularioCategorias?.categoriaSubItem;
    if (!cats) return 0;
    return cats.find(u => u.codigoItem == fipeKey)?.preco ?? 0;
  }

  getSegTerceirosPrice(plano) {
    const item = this._getItem(plano, 'SRV_SEGUROS_LTI');
    if (!item?.formularioSubItens) return 0;
    const sub = item.formularioSubItens.subItemPlano.find(s => s.codigoItem === 'SRV_SEG_TERCEIROS');
    if (!sub?.formularioCategorias) return 0;
    return sub.formularioCategorias.categoriaSubItem.find(c => c.itemPadrao)?.preco ?? 0;
  }

  getSegLtiPrice(plano) {
    return this._getItem(plano, 'SRV_SEGUROS_LTI')?.preco ?? 0;
  }

  getVidrosPrice(plano) {
    return this._getItem(plano, 'SRV_VIDROS')?.preco ?? 0;
  }

  getSmartPrice(plano) {
    return this._getItem(plano, 'SRV_SMART_CAR')?.preco ?? 0;
  }

  getCalcPlanPrice(plano, looviFipe, { car, colisao, smart, vidros }) {
    let total = 0;
    const add = (...vals) => vals.forEach(v => { total += v; });
    add(
      this.getAss24hPrice(plano),
      this.getCarroReservaPrice(plano),
      this.getRouboFurtoPrice(plano, looviFipe),
      this.getPtRouboFurtoPrice(plano, looviFipe),
      this.getAgravoPrice(plano, car),
      this.getServicoLooviPrice(plano, looviFipe, colisao),
    );
    if (colisao) add(this.getSegColisaoPrice(plano, looviFipe), this.getSegTerceirosPrice(plano), this.getSegLtiPrice(plano));
    if (vidros) add(this.getVidrosPrice(plano));
    if (smart) add(this.getSmartPrice(plano));
    return total;
  }
}
