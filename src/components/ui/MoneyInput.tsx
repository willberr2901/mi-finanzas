/**
 * ════════════════════════════════════════════════════════════════════
 * 💲 CAMPO DE DINERO
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Pone los puntos de miles mientras escribes y abre el teclado numérico.
 * Dónde se ve: Todos los campos de precio o valor.
 * Si lo cambias: Afecta cómo se escriben todos los valores de la app.
 * ════════════════════════════════════════════════════════════════════
 */
import { formatThousands, parseMoney } from '../../utils/format';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  /** Muestra el signo $ a la izquierda */
  prefix?: boolean;
}

/**
 * Campo de dinero: abre el teclado numérico, pone los puntos de miles mientras
 * se escribe y nunca deja ceros a la izquierda (adiós al "0500000").
 */
export default function MoneyInput({ value, onChange, placeholder, className = '', ariaLabel, prefix = false }: MoneyInputProps) {
  const shown = value > 0 ? `${prefix ? '$ ' : ''}${formatThousands(value)}` : '';
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={ariaLabel || placeholder}
      placeholder={placeholder}
      value={shown}
      onChange={(e) => onChange(Math.min(parseMoney(e.target.value), 999_999_999_999))}
      onFocus={(e) => requestAnimationFrame(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length))}
      className={className}
    />
  );
}
