import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, Props>((props, ref) => (
  <input
    ref={ref}
    className="w-full bg-[#0F172A] border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-violet-500 transition-all placeholder:text-slate-500"
    {...props}
  />
));

Input.displayName = 'Input';