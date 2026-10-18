/**
 * ════════════════════════════════════════════════════════════════════
 * 🔔 DISEÑO DE LOS AVISOS QUE APARECEN ARRIBA (toasts)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: dibuja cada aviso: ícono de color, título, mensaje y botón opcional.
 * Dónde se ve: en toda la app, cuando algo se guarda, falla o pasa en el hogar.
 * Si lo cambias: cambia el look de TODOS los avisos. Los colores por tipo están en STYLE.
 * Quién lo usa: notificationService.ts → notify().
 * ════════════════════════════════════════════════════════════════════
 */
import { CheckCircle2, AlertTriangle, XCircle, Info, Home, type LucideIcon } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'warning' | 'info' | 'hogar';

const STYLE: Record<ToastKind, { icon: LucideIcon; tile: string; iconCls: string; label: string }> = {
  success: { icon: CheckCircle2, tile: 'bg-brand-lime', iconCls: 'text-brand-ink', label: 'Listo' },
  error: { icon: XCircle, tile: 'bg-gradient-to-br from-rose-500 to-red-600', iconCls: 'text-white', label: 'Error' },
  warning: { icon: AlertTriangle, tile: 'bg-gradient-to-br from-amber-300 to-orange-500', iconCls: 'text-[#1a1203]', label: 'Atención' },
  info: { icon: Info, tile: 'bg-gradient-to-br from-sky-400 to-blue-600', iconCls: 'text-white', label: 'Info' },
  hogar: { icon: Home, tile: 'bg-gradient-to-br from-[#2C3560] to-[#0B1026] ring-1 ring-brand-lime/50', iconCls: 'text-brand-lime', label: 'Hogar' },
};

export default function ToastCard({ kind, title, message, action, closeToast }: {
  kind: ToastKind; title: string; message?: string;
  action?: { label: string; onClick: () => void };
  closeToast?: () => void;
}) {
  const S = STYLE[kind];
  const Icon = S.icon;
  return (
    <div className="theme-dark flex items-start gap-3 w-full" role={kind === 'error' ? 'alert' : 'status'}>
      <span className={`w-10 h-10 shrink-0 rounded-[14px] flex items-center justify-center shadow-lg ${S.tile}`}>
        <Icon size={20} className={S.iconCls} strokeWidth={2.4} />
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{S.label}</p>
        <p className="text-white text-[14px] font-bold leading-snug">{title}</p>
        {message && <p className="text-slate-300 text-[12px] leading-snug mt-0.5 whitespace-pre-line">{message}</p>}
        {action && (
          <button onClick={() => { action.onClick(); closeToast?.(); }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-brand-lime text-brand-ink text-[12px] font-bold active:scale-95">
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
