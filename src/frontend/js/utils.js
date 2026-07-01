import { BRLStringSchema, TipoVeiculoSchema } from './schemas.js';

export function autoResize(textarea) {
  if (!textarea) return;
  try {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  } catch (e) { }
}

export function parseBRLToNumber(str) {
  return BRLStringSchema.parse(str ?? null);
}

export function getCategoriaAgravo(tipoVeiculo) {
  return TipoVeiculoSchema.parse(tipoVeiculo ?? null);
}

export function getIndiceAndLooviFipe(valorFipe) {
  let indice = 0;
  let looviFipe = 0;
  if (valorFipe > 0 && valorFipe <= 10000) { indice = 0; looviFipe = 10; }
  else if (valorFipe <= 20000) { indice = 1; looviFipe = 20; }
  else if (valorFipe <= 30000) { indice = 2; looviFipe = 30; }
  else if (valorFipe <= 40000) { indice = 3; looviFipe = 40; }
  else if (valorFipe <= 50000) { indice = 4; looviFipe = 50; }
  else if (valorFipe <= 60000) { indice = 5; looviFipe = 60; }
  else if (valorFipe <= 70000) { indice = 6; looviFipe = 70; }
  else if (valorFipe <= 80000) { indice = 7; looviFipe = 80; }
  else if (valorFipe <= 90000) { indice = 8; looviFipe = 90; }
  else if (valorFipe <= 100000) { indice = 9; looviFipe = 100; }
  else if (valorFipe <= 110000) { indice = 10; looviFipe = 110; }
  else if (valorFipe <= 120000) { indice = 11; looviFipe = 120; }
  else if (valorFipe <= 130000) { indice = 12; looviFipe = 130; }
  else if (valorFipe <= 140000) { indice = 13; looviFipe = 140; }
  else { indice = 14; looviFipe = 150; }
  return { indice, looviFipe };
}
