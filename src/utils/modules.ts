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
  inicio: { path: '/', label: 'Inicio', tagline: 'Tu mes de un vistazo', help: 'Resumen del mes: lo que entra, lo que sale, tus próximos pagos y cómo va tu salud financiera.', icon: Home, gradient: 'from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  mercado: { path: '/mercado', label: 'Mercado', tagline: 'Lista inteligente de compras', help: 'Arma tu lista con precios, mira cuánto llevas frente al presupuesto y al finalizar se registra solo como gasto. Te avisa si algo subió de precio.', icon: ShoppingCart, gradient: 'from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  finanzas: { path: '/finanzas', label: 'Finanzas', tagline: 'Ingresos, gastos y metas', help: 'Registra ingresos y gastos. Cada gasto se clasifica solo en obligatorios, necesarios, gustos o ahorro. También tus metas y reportes en PDF o Excel.', icon: Wallet, gradient: 'from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  pagos: { path: '/pagos', label: 'Pagos', tagline: 'Pagos fijos, deudas y calendario', help: 'Arriendo, servicios, tarjetas y créditos con su fecha de pago. Mira el calendario, marca lo que pagas y sigue el avance de tus deudas cuota a cuota.', icon: CalendarClock, gradient: 'from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  escaner: { path: '/escaner', label: 'Escáner', tagline: 'Lee tus facturas', help: 'Toma foto a una factura y la app lee los productos y el total. La foto se procesa en tu celular.', icon: ScanLine, gradient: 'from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  facturas: { path: '/historial-facturas', label: 'Facturas', tagline: 'Historial de facturas escaneadas', help: 'Las facturas que has escaneado, guardadas en tu celular.', icon: FileText, gradient: 'from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  ajustes: { path: '/ajustes', label: 'Ajustes', tagline: 'Preferencias y privacidad', help: 'Tu nombre, respaldo de datos, términos, privacidad y borrar todo.', icon: Settings, gradient: 'from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  legal: { path: '/legal', label: 'Privacidad', tagline: 'Términos y política de privacidad', help: 'Cómo funciona la app y por qué tus datos nunca salen de tu celular.', icon: ShieldCheck, gradient: 'from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
};
