/**
 * ════════════════════════════════════════════════════════════════════
 * ⚙️ DIRECCIÓN DEL SERVIDOR DE CAJAS CIFRADAS
 * ────────────────────────────────────────────────────────────────────
 * Proyecto Supabase: "mi-finanzas-sync" (São Paulo).
 * La llave de abajo es PÚBLICA a propósito (es la "publishable key"):
 * solo permite llamar a sync_push / sync_pull / sync_delete_room, que
 * guardan y entregan texto cifrado. No da acceso a ninguna tabla.
 * Si cambias de servidor: actualiza también connect-src en vercel.json y render.yaml.
 * ════════════════════════════════════════════════════════════════════
 */
export const SYNC_URL = 'https://jiczriqbpnigqlhsmxey.supabase.co';
export const SYNC_KEY = 'sb_publishable_eZm_hV3h-vpil0mo6CR3Bw_VRo5BdL6';
/** Llave pública (formato antiguo) para el aviso en vivo; el canal en vivo solo transmite "hay cambios". */
export const SYNC_REALTIME_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY3pyaXFicG5pZ3FsaHNteGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNTAwMjYsImV4cCI6MjEwNzkyNjAyNn0.7wkhf5JTnyd4QafE2yb_7tGT5SlkQ8q3o5rJHCQ3GfE';
