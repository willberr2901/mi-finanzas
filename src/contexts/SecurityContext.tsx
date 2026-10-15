import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { hashSecret, randomBytes, toB64, fromB64, safeEqual } from '../utils/crypto';

// Seguridad de acceso, todo dentro del celular:
//  · PIN guardado como hash PBKDF2-SHA256 con sal (nunca el PIN en texto)
//  · bloqueo al abrir la app y al volver de segundo plano tras unos minutos
//  · límite de intentos con espera creciente
//  · desbloqueo con huella/rostro del celular (WebAuthn), opcional

interface StoredPin { salt: string; hash: string; v: 1 }
interface Attempts { count: number; until: number }

interface SecurityContextType {
  isLocked: boolean;
  isSetup: boolean;
  biometricEnabled: boolean;
  autoLockMinutes: number;
  lockNow: () => void;
  unlockWithPin: (pin: string) => Promise<{ ok: boolean; waitSeconds?: number; left?: number }>;
  unlockWithBiometric: () => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  removePin: () => void;
  setAutoLockMinutes: (m: number) => void;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => void;
  lockoutRemaining: () => number;
}

const PIN_KEY = 'mf_pin';
const ATT_KEY = 'mf_pin_attempts';
const BIO_KEY = 'mf_bio_cred';
const AUTO_KEY = 'mf_autolock_min';

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const readPin = (): StoredPin | null => { try { return JSON.parse(localStorage.getItem(PIN_KEY) || 'null'); } catch { return null; } };
const readAttempts = (): Attempts => { try { return JSON.parse(localStorage.getItem(ATT_KEY) || '{"count":0,"until":0}'); } catch { return { count: 0, until: 0 }; } };

export const biometricSupported = () => typeof window !== 'undefined' && !!window.PublicKeyCredential && window.isSecureContext;

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  const [isSetup, setIsSetup] = useState(() => !!readPin() || !!localStorage.getItem('miFinanzasPin'));
  const [isLocked, setIsLocked] = useState(isSetup); // con PIN, la app arranca bloqueada
  const [biometricEnabled, setBio] = useState(() => !!localStorage.getItem(BIO_KEY));
  const [autoLockMinutes, setAuto] = useState(() => Number(localStorage.getItem(AUTO_KEY) ?? 1));
  const hiddenAt = useRef<number | null>(null);

  // Migra el PIN antiguo (guardado en texto) a hash seguro.
  useEffect(() => {
    const legacy = localStorage.getItem('miFinanzasPin');
    if (legacy && !readPin()) {
      const salt = randomBytes(16);
      hashSecret(legacy, salt).then(hash => {
        localStorage.setItem(PIN_KEY, JSON.stringify({ salt: toB64(salt), hash, v: 1 }));
        localStorage.removeItem('miFinanzasPin');
      });
    } else if (legacy) localStorage.removeItem('miFinanzasPin');
  }, []);

  // Bloqueo automático al volver a la app después de X minutos.
  useEffect(() => {
    const onVis = () => {
      if (!isSetup) return;
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current >= autoLockMinutes * 60_000) setIsLocked(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [isSetup, autoLockMinutes]);

  const verifyPin = useCallback(async (pin: string) => {
    const stored = readPin();
    if (!stored) return false;
    return safeEqual(await hashSecret(pin, fromB64(stored.salt)), stored.hash);
  }, []);

  const lockoutRemaining = () => Math.max(0, Math.ceil((readAttempts().until - Date.now()) / 1000));

  const unlockWithPin = useCallback(async (pin: string) => {
    const wait = lockoutRemaining();
    if (wait > 0) return { ok: false, waitSeconds: wait };
    if (await verifyPin(pin)) {
      localStorage.setItem(ATT_KEY, JSON.stringify({ count: 0, until: 0 }));
      setIsLocked(false);
      return { ok: true };
    }
    const a = readAttempts();
    const count = a.count + 1;
    // 5 intentos libres; luego espera de 30 s, 60 s, 120 s… (máx. 15 min)
    const until = count >= 5 ? Date.now() + Math.min(30_000 * 2 ** (count - 5), 15 * 60_000) : 0;
    localStorage.setItem(ATT_KEY, JSON.stringify({ count, until }));
    return { ok: false, waitSeconds: until ? Math.ceil((until - Date.now()) / 1000) : undefined, left: Math.max(0, 5 - count) };
  }, [verifyPin]);

  const setupPin = useCallback(async (pin: string) => {
    const salt = randomBytes(16);
    const hash = await hashSecret(pin, salt);
    localStorage.setItem(PIN_KEY, JSON.stringify({ salt: toB64(salt), hash, v: 1 }));
    localStorage.setItem(ATT_KEY, JSON.stringify({ count: 0, until: 0 }));
    setIsSetup(true);
    setIsLocked(false);
  }, []);

  const removePin = useCallback(() => {
    localStorage.removeItem(PIN_KEY); localStorage.removeItem(ATT_KEY); localStorage.removeItem(BIO_KEY);
    setIsSetup(false); setBio(false); setIsLocked(false);
  }, []);

  const enableBiometric = useCallback(async () => {
    if (!biometricSupported()) return false;
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          rp: { name: 'Mi Finanzas' },
          user: { id: randomBytes(16), name: 'mi-finanzas', displayName: 'Mi Finanzas' },
          challenge: randomBytes(32),
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
          timeout: 60_000,
        },
      }) as PublicKeyCredential | null;
      if (!cred) return false;
      localStorage.setItem(BIO_KEY, toB64(cred.rawId));
      setBio(true);
      return true;
    } catch { return false; }
  }, []);

  const unlockWithBiometric = useCallback(async () => {
    const id = localStorage.getItem(BIO_KEY);
    if (!id || !biometricSupported()) return false;
    try {
      const res = await navigator.credentials.get({
        publicKey: { challenge: randomBytes(32), allowCredentials: [{ type: 'public-key', id: fromB64(id) }], userVerification: 'required', timeout: 60_000 },
      });
      if (res) { setIsLocked(false); localStorage.setItem(ATT_KEY, JSON.stringify({ count: 0, until: 0 })); return true; }
    } catch { /* cancelado */ }
    return false;
  }, []);

  const disableBiometric = useCallback(() => { localStorage.removeItem(BIO_KEY); setBio(false); }, []);
  const setAutoLockMinutes = useCallback((m: number) => { localStorage.setItem(AUTO_KEY, String(m)); setAuto(m); }, []);
  const lockNow = useCallback(() => { if (readPin()) setIsLocked(true); }, []);

  return (
    <SecurityContext.Provider value={{ isLocked, isSetup, biometricEnabled, autoLockMinutes, lockNow, unlockWithPin, unlockWithBiometric, setupPin, verifyPin, removePin, setAutoLockMinutes, enableBiometric, disableBiometric, lockoutRemaining }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within a SecurityProvider');
  return context;
};
