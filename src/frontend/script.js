import { Ui } from './js/ui.js';
import { gerarPDF, verificarPlaca } from './js/pdf.js';
import { loadBaseValues } from './js/cache.js';

// Expõe globalmente para uso via HTML (onclick, etc.)
window.gerarPDF = gerarPDF;
window.verificarPlaca = verificarPlaca;

function setThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  setThemeIcon(saved);

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setThemeIcon(next);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadBaseValues();

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
