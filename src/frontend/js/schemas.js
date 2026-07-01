import { z } from 'zod';

const PLACA_REGEX = /^[A-Z]{3}[-\s]?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i;

export const PlacaSchema = z
  .string()
  .trim()
  .regex(PLACA_REGEX, 'Formato de placa inválido')
  .transform(v => v.toUpperCase().replace(/[^A-Z0-9]/g, ''));

export const BRLStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform(str => {
    if (!str) return 0;
    const cleaned = String(str).replace(/[^(\d|\.|\,|\-)]/g, '').trim();
    if (!cleaned) return 0;
    if (cleaned.indexOf('.') > -1 && cleaned.indexOf(',') > -1) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    if (cleaned.indexOf(',') > -1) {
      return parseFloat(cleaned.replace(',', '.')) || 0;
    }
    return parseFloat(cleaned) || 0;
  });

export const TipoVeiculoSchema = z
  .string()
  .nullable()
  .optional()
  .transform(tipo => {
    if (!tipo) return 'CAT_AGRAVO_VEICULO_LEVE';
    const t = String(tipo).toLowerCase();
    if (t.includes('suv') || t.includes('pickup') || t.includes('camionete')) {
      return 'CAT_AGRAVO_PICKUP_CAM';
    }
    if (
      t.includes('util') || t.includes('utilitário') || t.includes('utilitario') ||
      t.includes('van') || t.includes('furgão') || t.includes('furgon')
    ) {
      return 'CAT_AGRAVO_OUTROS';
    }
    return 'CAT_AGRAVO_VEICULO_LEVE';
  });

export const UserInputSchema = z.string().transform(raw => {
  const trimmed = raw.trim();

  const plateResult = PlacaSchema.safeParse(trimmed);
  if (plateResult.success) return { type: 'placa', value: plateResult.data };

  const num = parseInt(trimmed.replace(/\D/g, ''), 10);
  if (!isNaN(num) && num > 0) return { type: 'fipe', value: num };

  return { type: 'inválido', value: trimmed };
});
