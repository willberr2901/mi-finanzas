import { db } from '../utils/database';
import { encryptWithPassword, decryptWithPassword } from '../utils/crypto';

// Respaldo completo y cifrado (AES-256-GCM) que la persona guarda donde quiera.
// Sin la contraseña, el archivo no se puede leer.

const TABLES = ['transactions', 'goals', 'settings', 'bills', 'billPayments'] as const;
const KEEP_KEYS = (k: string) => k.startsWith('miFinanzas') || (k.startsWith('mf_') && !['mf_pin', 'mf_pin_attempts', 'mf_bio_cred'].includes(k));

export const exportBackup = async (password: string) => {
  const tables: Record<string, unknown[]> = {};
  for (const t of TABLES) tables[t] = await (db as any)[t].toArray();
  const storage: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (KEEP_KEYS(k)) storage[k] = localStorage.getItem(k)!;
  }
  const payload = await encryptWithPassword(JSON.stringify({ createdAt: new Date().toISOString(), tables, storage }), password);
  const blob = new Blob([payload], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mi-finanzas-respaldo-${new Date().toISOString().slice(0, 10)}.mfbackup`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

export const importBackup = async (file: File, password: string) => {
  const text = await file.text();
  let data: any;
  try { data = JSON.parse(await decryptWithPassword(text, password)); }
  catch { throw new Error('Contraseña incorrecta o archivo dañado'); }
  await db.transaction('rw', TABLES.map(t => (db as any)[t]), async () => {
    for (const t of TABLES) {
      await (db as any)[t].clear();
      if (Array.isArray(data.tables?.[t]) && data.tables[t].length) await (db as any)[t].bulkAdd(data.tables[t]);
    }
  });
  for (const [k, v] of Object.entries<string>(data.storage || {})) if (KEEP_KEYS(k)) localStorage.setItem(k, v);
  return data.createdAt as string;
};
