export const theme = {
  colors: {
    bg: '#0B0F19',
    surface: '#111827',
    card: '#151D2B',
    primary: '#7C3AED',
    secondary: '#06B6D4',
    success: '#10B981',
    danger: '#EF4444',
    text: '#F8FAFC',
    muted: '#94A3B8',
    border: 'rgba(255,255,255,0.08)',
  },
  radius: { sm: '12px', md: '18px', lg: '28px' },
  shadow: { card: '0 10px 30px rgba(0,0,0,0.4)' }
} as const;

export type Theme = typeof theme;