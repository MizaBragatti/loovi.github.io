const KEYS = {
  total: 'contadorTotal', hoje: 'contadorHoje', semana: 'contadorSemana',
  mes: 'contadorMes', ano: 'contadorAno',
  hojeDate: 'contadorHojeDate', semanaDate: 'contadorSemanaDate',
  mesDate: 'contadorMesDate', anoDate: 'contadorAnoDate',
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split('T')[0];
}

export function loadCounters() {
  const g = (k) => parseInt(localStorage.getItem(KEYS[k])) || 0;
  const s = (k) => localStorage.getItem(KEYS[k]) || '';
  return {
    total: g('total'), hoje: g('hoje'), semana: g('semana'), mes: g('mes'), ano: g('ano'),
    hojeDate: s('hojeDate'), semanaDate: s('semanaDate'), mesDate: s('mesDate'), anoDate: s('anoDate'),
  };
}

function saveCounters(c) {
  Object.entries({
    total: c.total, hoje: c.hoje, hojeDate: c.hojeDate,
    semana: c.semana, semanaDate: c.semanaDate,
    mes: c.mes, mesDate: c.mesDate, ano: c.ano, anoDate: c.anoDate,
  }).forEach(([k, v]) => localStorage.setItem(KEYS[k], v));
}

export function incrementCounters() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekStart = getWeekStart(now);
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const year = String(now.getFullYear());

  const c = loadCounters();
  c.total += 1;
  c.hoje = c.hojeDate === today ? c.hoje + 1 : 1; c.hojeDate = today;
  c.semana = c.semanaDate === weekStart ? c.semana + 1 : 1; c.semanaDate = weekStart;
  c.mes = c.mesDate === month ? c.mes + 1 : 1; c.mesDate = month;
  c.ano = c.anoDate === year ? c.ano + 1 : 1; c.anoDate = year;
  saveCounters(c);
  return c;
}

export function loadQuotes() {
  try { return JSON.parse(localStorage.getItem('quotes')) || []; } catch { return []; }
}

export function saveQuote(quote, placa) {
  const quotes = loadQuotes();
  const idx = quotes.findIndex(q => q.placa === placa);
  const entry = { ...quote, placa, timestamp: Date.now() };
  if (idx !== -1) {
    quotes[idx] = { ...quotes[idx], ...entry };
  } else {
    quotes.push(entry);
    incrementCounters();
  }
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

export function deleteQuote(index) {
  const quotes = loadQuotes();
  quotes.splice(index, 1);
  localStorage.setItem('quotes', JSON.stringify(quotes));
}
