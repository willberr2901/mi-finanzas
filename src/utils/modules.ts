import { Home, ShoppingCart, Wallet, CalendarClock, Settings, ScanLine, FileText, ShieldCheck, type LucideIcon } from 'lucide-react';

export interface ModuleInfo {
  path: string;
  label: string;
  tagline: string;
  help: string;
  icon: LucideIcon;
  gradient: string;   // fondo del ícono
  accent: string;     // color del texto activo
  glow: string;       // sombra de color
}

// Cada módulo con su etiqueta, su ícono y su color propio.
export const MODULES: Record<string, ModuleInfo> = {
  inicio: { path: '/', label: 'Inicio', tagline: 'Tu mes de un vistazo', help: 'Resumen del mes: lo que entra, lo que sale, tus próximos pagos y cómo va tu salud financiera.', icon: Home, gradient: 'from-violet-600 to-cyan-500', accent: 'text-violet-300', glow: 'shadow-violet-500/40' },
  mercado: { path: '/mercado', label: 'Mercado', tagline: 'Lista inteligente de compras', help: 'Arma tu lista con precios, mira cuánto llevas frente al presupuesto y al finalizar se registra solo como gasto. Te avisa si algo subió de precio.', icon: ShoppingCart, gradient: 'from-emerald-500 to-lime-400', accent: 'text-emerald-300', glow: 'shadow-emerald-500/40' },
  finanzas: { path: '/finanzas', label: 'Finanzas', tagline: 'Ingresos, gastos y metas', help: 'Registra ingresos y gastos. Cada gasto se clasifica solo en obligatorios, necesarios, gustos o ahorro. También tus metas y reportes en PDF o Excel.', icon: Wallet, gradient: 'from-blue-600 to-indigo-500', accent: 'text-blue-300', glow: 'shadow-blue-500/40' },
  pagos: { path: '/pagos', label: 'Pagos', tagline: 'Pagos fijos, deudas y calendario', help: 'Arriendo, servicios, tarjetas y créditos con su fecha de pago. Mira el calendario, marca lo que pagas y sigue el avance de tus deudas cuota a cuota.', icon: CalendarClock, gradient: 'from-amber-500 to-orange-500', accent: 'text-amber-300', glow: 'shadow-amber-500/40' },
  escaner: { path: '/escaner', label: 'Escáner', tagline: 'Lee tus facturas', help: 'Toma foto a una factura y la app lee los productos y el total. La foto se procesa en tu celular.', icon: ScanLine, gradient: 'from-cyan-500 to-sky-500', accent: 'text-cyan-300', glow: 'shadow-cyan-500/40' },
  facturas: { path: '/historial-facturas', label: 'Facturas', tagline: 'Historial de facturas escaneadas', help: 'Las facturas que has escaneado, guardadas en tu celular.', icon: FileText, gradient: 'from-pink-500 to-rose-500', accent: 'text-pink-300', glow: 'shadow-pink-500/40' },
  ajustes: { path: '/ajustes', label: 'Ajustes', tagline: 'Preferencias y privacidad', help: 'Tu nombre, respaldo de datos, términos, privacidad y borrar todo.', icon: Settings, gradient: 'from-slate-500 to-slate-700', accent: 'text-slate-200', glow: 'shadow-slate-500/40' },
  legal: { path: '/legal', label: 'Privacidad', tagline: 'Términos y política de privacidad', help: 'Cómo funciona la app y por qué tus datos nunca salen de tu celular.', icon: ShieldCheck, gradient: 'from-emerald-600 to-teal-500', accent: 'text-emerald-300', glow: 'shadow-emerald-500/40' },
};
