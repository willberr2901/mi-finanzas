// Clasificación automática de gastos del hogar.
//
// Se basa en la forma usual de ordenar un presupuesto familiar:
//  · Obligatorios y recurrentes: llegan cada mes y hay que pagarlos sí o sí
//    (arriendo, servicios, deudas). El mercado también va aquí, como pidió el hogar.
//  · Necesarios variables: hacen falta, pero el monto cambia y se puede ajustar
//    (transporte, salud, aseo del hogar, educación).
//  · Gustos: se pueden recortar si el mes viene apretado (salidas, plataformas,
//    comida por fuera).
//  · Ahorro e inversión.

export type Segment = 'obligatorio' | 'necesario' | 'gusto' | 'ahorro' | 'ingreso';

export const SEGMENT_INFO: Record<Exclude<Segment, 'ingreso'>, { label: string; short: string; color: string; bar: string; help: string }> = {
  obligatorio: { label: 'Obligatorios y recurrentes', short: 'Obligatorios', color: 'text-violet-300', bar: 'bg-violet-500', help: 'Arriendo, mercado, servicios y deudas: llegan cada mes y no se pueden dejar de pagar.' },
  necesario: { label: 'Necesarios variables', short: 'Necesarios', color: 'text-cyan-300', bar: 'bg-cyan-400', help: 'Transporte, salud, hogar y educación: hacen falta, pero el valor cambia y se puede ajustar.' },
  gusto: { label: 'Gustos', short: 'Gustos', color: 'text-pink-300', bar: 'bg-pink-400', help: 'Salidas, plataformas, comida por fuera y antojos: lo primero que se recorta si el mes está apretado.' },
  ahorro: { label: 'Ahorro e inversión', short: 'Ahorro', color: 'text-emerald-300', bar: 'bg-emerald-400', help: 'Lo que guardas o inviertes para tus metas.' },
};

const SEGMENT_OF: Record<string, Segment> = {
  Arriendo: 'obligatorio', Mercado: 'obligatorio', Servicios: 'obligatorio', Deudas: 'obligatorio',
  Transporte: 'necesario', Salud: 'necesario', Hogar: 'necesario', 'Educación': 'necesario',
  'Alimentación': 'gusto', Entretenimiento: 'gusto', Otros: 'gusto',
  Inversiones: 'ahorro', Ahorro: 'ahorro',
};

export const EXPENSE_CATEGORIES = [
  'Arriendo', 'Mercado', 'Servicios', 'Deudas',
  'Transporte', 'Salud', 'Hogar', 'Educación',
  'Alimentación', 'Entretenimiento', 'Otros',
  'Ahorro', 'Inversiones',
] as const;

export const INCOME_CATEGORIES = ['Sueldo', 'Recargos', 'Ventas', 'Otros ingresos'] as const;

export const OBLIGATORY = new Set<string>(['Arriendo', 'Mercado', 'Servicios', 'Deudas']);

export const segmentOf = (type: 'income' | 'expense', category: string): Segment =>
  type === 'income' ? 'ingreso' : SEGMENT_OF[category] ?? 'gusto';

// Palabras que delatan la categoría al escribir la descripción.
// Límite de palabra que entiende tildes y ñ (\b de JavaScript no las reconoce).
const w = (alts: string) => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${alts})(?=$|[^\\p{L}\\p{N}])`, 'iu');
const RULES: [string, RegExp][] = [
  ['Arriendo', w('arriendo|arrendo|renta|alquiler|administraci[oó]n|hipoteca')],
  ['Mercado', w('mercado|d1|ara|[eé]xito|ol[ií]mpica|carulla|jumbo|metro|makro|surtimax|tienda|supermercado|plaza|fruver')],
  ['Servicios', w('luz|agua|gas|enel|codensa|vanti|acueducto|internet|claro|movistar|tigo|etb|wom|celular|servicios?|energ[ií]a|televisi[oó]n|directv|aseo p[uú]blico')],
  ['Deudas', w('cuota|tarjeta|cr[eé]dito|pr[eé]stamo|deuda|banco|libranza|fincomercio|addi|sistecr[eé]dito|nu|bancolombia|davivienda')],
  ['Transporte', w('uber|didi|indriver|cabify|taxi|transmilenio|sitp|bus|buseta|gasolina|tanqueo|peaje|parqueadero|moto|soat|tecnomec[aá]nica')],
  ['Salud', w('farmacia|droguer[ií]a|medicamentos?|m[eé]dico|eps|cita|odont[oó]logo|examen|cl[ií]nica|lentes|gafas')],
  ['Educación', w('universidad|colegio|curso|matr[ií]cula|semestre|libros?|unigermana|pensi[oó]n escolar|[uú]tiles')],
  ['Hogar', w('aseo|detergente|muebles|electrodom[eé]stico|reparaci[oó]n|ferreter[ií]a|plomero')],
  ['Entretenimiento', w('netflix|spotify|disney|cine|youtube|prime|hbo|max|salida|rumba|concierto|juego|viaje|paseo')],
  ['Alimentación', w('almuerzo|restaurante|domicilio|rappi|comida|desayuno|cena|pan|caf[eé]|helado|pizza|hamburguesa|corrientazo')],
  ['Ahorro', w('ahorro|ahorr[eé]|alcanc[ií]a|cdt|bolsillo|lemon|dale')],
];

const INCOME_RULES: [string, RegExp][] = [
  ['Sueldo', w('sueldo|salario|n[oó]mina|quincena|pago')],
  ['Recargos', w('recargos?|nocturnos?|dominicales?|extras?')],
  ['Ventas', w('venta|ventas|vend[ií]|pedido|cliente')],
];

/** Devuelve la categoría sugerida para una descripción, o null si no se reconoce. */
export const guessCategory = (description: string, type: 'income' | 'expense' = 'expense'): string | null => {
  const rules = type === 'income' ? INCOME_RULES : RULES;
  for (const [cat, re] of rules) if (re.test(description)) return cat;
  return null;
};
