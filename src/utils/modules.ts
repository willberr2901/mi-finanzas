/**
 * ════════════════════════════════════════════════════════════════════
 * 🧩 LISTA DE MÓDULOS
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Nombre, ícono, ruta y texto de ayuda de cada módulo.
 * Dónde se ve: Menú y encabezados.
 * Si lo cambias: Para renombrar un módulo, cámbialo aquí.
 * ════════════════════════════════════════════════════════════════════
 */
import { Home, ShoppingCart, Wallet, CalendarClock, HandCoins, Settings, ScanLine, FileText, ShieldCheck, BarChart3, type LucideIcon } from 'lucide-react';

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
  inicio: { path: '/', label: 'Inicio', tagline: 'Tu mes de un vistazo', help: 'Resumen del mes: lo que entra, lo que sale, tus próximos pagos y cómo va tu salud financiera.', icon: Home, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  mercado: { path: '/mercado', label: 'Mercado', tagline: 'Lista inteligente de compras', help: 'Planea la lista en casa y, en el súper, lo que echas al carrito se tacha solo. Te avisa de los antojos, compara precios (bajó, subió o igual) y se puede compartir en vivo y cifrada con tu hogar.', icon: ShoppingCart, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  finanzas: { path: '/finanzas', label: 'Finanzas', tagline: 'Ingresos, gastos y metas', help: 'Registra ingresos y gastos. Cada gasto se clasifica solo en obligatorios, necesarios, gustos o ahorro. También tus metas y reportes en PDF o Excel.', icon: Wallet, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  pagos: { path: '/pagos', label: 'Pagos', tagline: 'Pagos fijos, deudas y calendario', help: 'Arriendo, servicios, tarjetas y créditos con su fecha de pago. Mira el calendario, marca lo que pagas y sigue el avance de tus deudas cuota a cuota.', icon: CalendarClock, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  prestamos: { path: '/prestamos', label: 'Préstamos', tagline: 'Lo que debes y te deben', help: 'Las deudas pequeñas con personas: lo que te prestaron para el pasaje o lo que le prestaste a un amigo. Anota abonos hasta quedar a paz y salvo y recuérdale por WhatsApp. Todo queda solo en tu celular.', icon: HandCoins, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  escaner: { path: '/escaner', label: 'Escáner', tagline: 'Lee tus facturas', help: 'Toma foto a una factura y la app lee los productos y el total. La foto se procesa en tu celular.', icon: ScanLine, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  facturas: { path: '/historial-facturas', label: 'Facturas', tagline: 'Historial de facturas escaneadas', help: 'Las facturas que has escaneado, guardadas en tu celular.', icon: FileText, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  ajustes: { path: '/ajustes', label: 'Ajustes', tagline: 'Preferencias y privacidad', help: 'Tu nombre, respaldo de datos, términos, privacidad y borrar todo.', icon: Settings, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  reportes: { path: '/reportes', label: 'Reportes', tagline: 'Cuántas personas usan la app', help: 'Solo para la administradora: personas que abrieron e instalaron la app, activas por día y enlaces compartidos. Son sumas anónimas.', icon: BarChart3, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
  legal: { path: '/legal', label: 'Privacidad', tagline: 'Términos y política de privacidad', help: 'Cómo funciona la app, por qué tus finanzas nunca salen de tu celular y cómo se cifra el hogar sincronizado.', icon: ShieldCheck, gradient: 'theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10', accent: 'text-brand-lime', glow: 'shadow-black/40' },
};
