/**
 * ════════════════════════════════════════════════════════════════════
 * 🎤 MICRÓFONO (dictado por voz del celular)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: escucha y devuelve el texto de lo que dices, usando el
 *           reconocimiento de voz que ya trae el navegador del celular
 *           (el mismo del teclado). La app NO graba ni guarda el audio.
 * Ojo privacidad: en Android/Chrome el audio lo procesa el servicio de voz
 *           de Google y en iPhone el de Apple (está explicado en Privacidad,
 *           punto 3.1). A nosotros solo nos llega el texto, y no sale del celular.
 * Si el navegador no lo soporta (por ejemplo Firefox): isVoiceSupported()
 *           devuelve false y la pantalla ofrece escribir o usar el micrófono del teclado.
 * ════════════════════════════════════════════════════════════════════
 */

/* Tipos mínimos del reconocimiento de voz (no vienen en TypeScript). */
interface RecResult { isFinal: boolean; 0: { transcript: string } }
interface RecEvent { resultIndex: number; results: ArrayLike<RecResult> }
interface Recognizer {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type RecognizerCtor = new () => Recognizer;

const getCtor = (): RecognizerCtor | null => {
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** ¿Este navegador puede dictar? */
export const isVoiceSupported = () => typeof window !== 'undefined' && !!getCtor();

export type VoiceError = 'permiso' | 'sin-voz' | 'sin-internet' | 'no-soportado' | 'otro';

/** Mensajes claros para cada problema del micrófono. */
export const VOICE_ERROR_TEXT: Record<VoiceError, { title: string; message: string }> = {
  permiso: { title: 'Necesitamos el micrófono', message: 'Permite el micrófono para esta app en el candado de la barra de direcciones o en Ajustes del celular → Apps → Chrome → Permisos.' },
  'sin-voz': { title: 'No te escuchamos', message: 'Habla un poco más cerca del celular e inténtalo de nuevo.' },
  'sin-internet': { title: 'El dictado necesita internet', message: 'El reconocimiento de voz del celular funciona con conexión. Mientras tanto, puedes escribir.' },
  'no-soportado': { title: 'Este navegador no dicta', message: 'Usa Chrome o Safari, o el micrófono de tu teclado.' },
  otro: { title: 'Se cortó el dictado', message: 'Inténtalo de nuevo.' },
};

export interface ListenOptions {
  /** Texto mientras vas hablando (se actualiza en vivo). */
  onText: (text: string, isFinal: boolean) => void;
  /** Se llama una vez al terminar (con o sin error). */
  onEnd: (error?: VoiceError) => void;
}

/**
 * Empieza a escuchar en español de Colombia. Devuelve una función para parar.
 * Se detiene solo cuando dejas de hablar unos segundos.
 */
/**
 * Quita repeticiones seguidas que mete el dictado de Android:
 * "gasté gasté gasté 25 mil" → "gasté 25 mil";
 * "cinco paquetes cinco paquetes de cinco paquetes de ramen" → "cinco paquetes de ramen".
 */
export function cleanRepeats(text: string): string {
  let words = text.trim().split(/\s+/).filter(Boolean);
  const same = (a: string, b: string) => a.toLowerCase().replace(/[.,;:!?¿¡]/g, '') === b.toLowerCase().replace(/[.,;:!?¿¡]/g, '');
  let changed = true;
  while (changed) {
    changed = false;
    // Frase repetida seguida (de 1 a 8 palabras): "A B A B" → "A B"
    for (let n = 1; n <= 8 && !changed; n++) {
      for (let i = 0; i + 2 * n <= words.length; i++) {
        let eq = true;
        for (let k = 0; k < n; k++) if (!same(words[i + k], words[i + n + k])) { eq = false; break; }
        if (eq) { words = [...words.slice(0, i), ...words.slice(i + n)]; changed = true; break; }
      }
    }
  }
  return words.join(' ');
}

/**
 * Une los pedazos que entrega el reconocimiento. Android a veces manda la misma frase
 * varias veces mientras "crece" ("cinco", "cinco paquetes", "cinco paquetes de ramen"):
 * si un pedazo empieza igual que el anterior, lo reemplaza en vez de sumarlo.
 */
const joinPieces = (pieces: string[]) => {
  const out: string[] = [];
  const low = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const raw of pieces) {
    const t = raw.trim();
    if (!t) continue;
    const last = out[out.length - 1];
    if (last && low(t).startsWith(low(last))) out[out.length - 1] = t;     // creció: reemplaza
    else if (last && low(last).startsWith(low(t))) continue;               // repetido más corto: ignora
    else out.push(t);
  }
  return cleanRepeats(out.join(' '));
};

const isAndroid = () => /android/i.test(navigator.userAgent);

export function listen({ onText, onEnd }: ListenOptions): () => void {
  const Ctor = getCtor();
  if (!Ctor) { onEnd('no-soportado'); return () => {}; }
  const rec = new Ctor();
  rec.lang = 'es-CO';
  // En Android el modo continuo repite palabras: escuchamos una frase a la vez
  // (para seguir, se toca otra vez el micrófono).
  rec.continuous = !isAndroid();
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let finalText = '';
  let error: VoiceError | undefined;
  let ended = false;
  let silence: ReturnType<typeof setTimeout> | undefined;
  // Si pasan 2,5 s sin palabras nuevas, terminamos (algunos celulares no paran solos).
  const armSilence = () => { clearTimeout(silence); silence = setTimeout(() => { try { rec.stop(); } catch { /* ya paró */ } }, 2500); };

  rec.onresult = (e) => {
    // Se reconstruye todo desde el principio en cada evento (no se va sumando),
    // así nunca se duplica lo que ya estaba.
    const finals: string[] = [];
    let interim = '';
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finals.push(r[0].transcript);
      else interim = r[0].transcript;
    }
    finalText = joinPieces(finals);
    onText(joinPieces([...finals, interim]), !interim);
    armSilence();
  };
  rec.onerror = (e) => {
    error = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'permiso'
      : e.error === 'no-speech' ? 'sin-voz'
      : e.error === 'network' ? 'sin-internet'
      : e.error === 'aborted' ? undefined : 'otro';
  };
  rec.onend = () => {
    if (ended) return;
    ended = true;
    clearTimeout(silence);
    onEnd(error ?? (finalText ? undefined : error));
  };

  try { rec.start(); armSilence(); } catch { ended = true; onEnd('otro'); }
  return () => { clearTimeout(silence); try { rec.stop(); } catch { /* ya paró */ } };
}
