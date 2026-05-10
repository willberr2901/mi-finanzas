import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-[#151D2B] border border-white/5 rounded-3xl p-4 shadow-2xl backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}