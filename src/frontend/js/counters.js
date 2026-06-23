import { COUNTER_KEYS } from './constants.js';

export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

export function loadCounters() {
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

export function saveCounters(counters) {
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

export function incrementCounters() {
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
