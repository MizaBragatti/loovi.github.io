import { Ui } from './js/ui.js';
import { gerarPDF, verificarPlaca } from './js/pdf.js';
import { loadBaseValues, readBaseValues, loadAllBaseValues } from './js/cache.js';
import { computeMensalidadesFromCache, computeMensalidadesForAllStates } from './js/calculos.js';
import { kl } from './js/planService.js';
import { getIndiceAndLooviFipe } from './js/utils.js';

// Expõe globalmente para uso via HTML (onclick, etc.)
window.gerarPDF = gerarPDF;
window.verificarPlaca = verificarPlaca;

function listPlanValues() {
  const base = readBaseValues();
  Object.keys(base).forEach(estado => {
    const data = base[estado];
    const planos = data.planos || data.data?.planos || data;
    if (Array.isArray(planos)) {
      planos.forEach(plano => {
        if (plano.itensPlano) {
          plano.itensPlano.forEach(_item => {});
        }
      });
    }
  });
}

function testCalculations() {
  const testFipe = 50000;
  const results = computeMensalidadesForAllStates(testFipe);
  Object.keys(results).forEach(estado => {
    const res = results[estado];
    if (res.error) {} else {}
  });
}

async function debugCalculations() {
  const freshData = await loadAllBaseValues();
  const testFipe = 29239;
  const estados = ['SP', 'MG', 'RJ', 'SC', 'RS'];

  for (const estado of estados) {
    const data = freshData[estado];
    if (!data) continue;

    const planos = data.planos || data.data?.planos || data;
    const plano = Array.isArray(planos) ? planos.find(p => p.idPlano === "ROUBO_FURTO_PT_" + estado) : null;
    if (!plano) continue;

    const planService = new kl();
    const { looviFipe } = getIndiceAndLooviFipe(testFipe);

    planService.getCalcPlanPrice(plano, looviFipe, { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: false, smart: false, vidros: false });
    planService.getCalcPlanPrice(plano, looviFipe, { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: true,  smart: false, vidros: false });
    planService.getCalcPlanPrice(plano, looviFipe, { car: "CAT_AGRAVO_VEICULO_LEVE", colisao: true,  smart: false, vidros: true  });

    try {
      computeMensalidadesFromCache(estado, testFipe);
    } catch (e) {}
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadBaseValues();
  listPlanValues();
  testCalculations();
  await debugCalculations();

  const ui = new Ui();
  window.ui = ui;

  ui.attachInputListener();
  ui.checkboxData();
  ui.sellerCheckboxData();
  ui.tipoVeiculoCheckboxData();
  ui.planoCheckboxData();
  ui.attachFraseButtons();
  ui.modalHistoric();

  ui.estado = null;
  ui.categoriaFipe = "CAT_FIPE_100K";

  document.getElementById('btnGerarPDFEssencial')?.addEventListener('click', () => gerarPDF('PDF-Essencial'));
  document.getElementById('btnGerarPDFSemVidros')?.addEventListener('click', () => gerarPDF('PDF-SemVidros'));
  document.getElementById('btnGerarPDFCompleto')?.addEventListener('click',  () => gerarPDF('PDF-Completo'));
});
