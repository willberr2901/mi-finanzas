/**
 * ════════════════════════════════════════════════════════════════════
 * 🎤 GANCHO DE DICTADO (estado del micrófono para cualquier pantalla)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: maneja "escuchando / detenido", el texto en vivo y los errores
 *           del micrófono, para que cada pantalla solo pinte botones.
 * Usado por: VoiceSheet.tsx (Mercado y registro rápido de gastos).
 * ════════════════════════════════════════════════════════════════════
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { isVoiceSupported, listen, VOICE_ERROR_TEXT, type VoiceError } from '../../services/voice/speech';
import { notify } from '../../services/notificationService';

export function useDictation() {
  const [supported] = useState(isVoiceSupported);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<VoiceError | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const baseRef = useRef('');

  const stop = useCallback(() => { stopRef.current?.(); stopRef.current = null; }, []);

  /** Empieza a escuchar. Lo nuevo se suma a lo que ya estaba escrito. */
  const start = useCallback(() => {
    if (!supported) { setError('no-soportado'); return; }
    stop();
    setError(null);
    baseRef.current = text.trim() ? text.trim().replace(/[,.]?$/, ',') + ' ' : '';
    setListening(true);
    try { navigator.vibrate?.(15); } catch { /* sin vibración */ }
    stopRef.current = listen({
      onText: t => setText(baseRef.current + t),
      onEnd: err => {
        setListening(false);
        stopRef.current = null;
        if (err) {
          setError(err);
          if (err !== 'sin-voz') notify({ ...VOICE_ERROR_TEXT[err], type: err === 'permiso' ? 'warning' : 'info', log: false });
        }
      },
    });
  }, [supported, stop, text]);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  // Al cerrar la pantalla, apagamos el micrófono.
  useEffect(() => () => stopRef.current?.(), []);

  const reset = useCallback(() => { stop(); setText(''); setError(null); }, [stop]);

  return { supported, listening, text, setText, start, stop, toggle, error, reset };
}
