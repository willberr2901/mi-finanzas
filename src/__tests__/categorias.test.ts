import { describe, it, expect } from 'vitest';
import { guessCategory } from '../services/market/categories';

const casos: [string, string][] = [
  ['Tomates', 'frutas'], ['Aguacates', 'frutas'], ['Cebolla cabezona', 'frutas'], ['Plátanos maduros', 'frutas'], ['Limones', 'frutas'], ['Papas criollas', 'frutas'],
  ['Huevos rojos', 'lacteos'], ['Huevos AA x30', 'lacteos'], ['Leche deslactosada', 'lacteos'], ['Queso doble crema', 'lacteos'], ['Yogures', 'lacteos'],
  ['Pechuga', 'carnes'], ['Salchichas', 'carnes'], ['Carne molida', 'carnes'], ['Alitas de pollo', 'carnes'], ['Huevos de codorniz', 'lacteos'],
  ['Pan tajado Bimbo', 'panaderia'], ['Arepas', 'panaderia'], ['Tostadas', 'panaderia'], ['Panes', 'panaderia'],
  ['Arroz Diana', 'despensa'], ['Aceite', 'despensa'], ['Fríjoles', 'despensa'], ['Lentejas', 'despensa'], ['Chocolate Corona', 'despensa'], ['Café Sello Rojo', 'despensa'],
  ['Azúcar', 'despensa'], ['Spaghetti', 'despensa'], ['Atún en lata', 'despensa'], ['Harina PAN', 'despensa'], ['Salsa de tomate', 'despensa'], ['Sal', 'despensa'],
  ['Coca Cola', 'bebidas'], ['Gaseosas', 'bebidas'], ['Jugos Hit', 'bebidas'], ['Agua Cristal', 'bebidas'], ['Cervezas', 'bebidas'],
  ['Galletas', 'mecato'], ['Papas fritas', 'mecato'], ['Chocolatinas Jet', 'mecato'], ['Gomitas', 'mecato'],
  ['Detergente Ariel', 'aseo'], ['Jabón de loza', 'aseo'], ['Papel higiénico', 'aseo'], ['Bolsas de basura', 'aseo'], ['Límpido', 'aseo'], ['Suavizante', 'aseo'], ['Esponjas', 'aseo'],
  ['Crema dental', 'personal'], ['Shampoo', 'personal'], ['Desodorante', 'personal'], ['Pañales', 'personal'], ['Toallas higiénicas', 'personal'], ['Jabón de baño', 'personal'],
  ['Concentrado de perro', 'mascotas'], ['Arena para gato', 'mascotas'], ['Comida de gato', 'mascotas'],
];
describe('categorías automáticas del mercado', () => {
  for (const [n, c] of casos) it(`${n} → ${c}`, () => expect(guessCategory(n)).toBe(c));
});
describe('plurales y casos nuevos', () => {
  for (const [n, c] of [['Pasta dental', 'personal'], ['Tocineta', 'carnes'], ['Chocolates', 'despensa'], ['Duraznos', 'frutas'], ['Detergentes', 'aseo'], ['Lavaplatos', 'aseo']] as const)
    it(`${n} → ${c}`, () => expect(guessCategory(n)).toBe(c));
});
