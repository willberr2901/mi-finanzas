import { db } from '../utils/database';
import { getPrefs } from '../utils/prefs';
import { todayISO } from '../utils/format';
import { notify } from './notificationService';
import { enableReminders, remindersSupported } from './alertsService';

// Recordatorio diario para anotar los gastos del día.
// Tres capas, de la más confiable a la de mejor esfuerzo:
//  1. Evento diario en el calendario del celular (suena aunque la app esté cerrada).
//  2. Aviso dentro de la app al abrirla después de la hora elegida.
//  3. Notificación del celular en segundo plano (Chrome Android con la app instalada).

const LAST_KEY = 'mf_daily_last';
const pad = (n: number) => String(n).padStart(2, '0');

const hhmm = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return { h: Number.isFinite(h) ? h : 20, m: Number.isFinite(m) ? m : 0 };
};

/** Activa el recordatorio: pide permiso de notificaciones y programa la revisión en segundo plano. */
export const activateDailyReminder = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!remindersSupported()) return 'unsupported';
  return enableReminders();
};

/** Al abrir la app: si ya pasó la hora y hoy no has anotado nada, te lo recuerda (una vez al día). */
export const checkDailyReminderInApp = async () => {
  const { reminder } = getPrefs();
  if (!reminder.enabled) return;
  const now = new Date();
  const { h, m } = hhmm(reminder.time);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
  const today = todayISO();
  if (localStorage.getItem(LAST_KEY) === today) return;
  const count = await db.transactions.where('date').equals(today).count().catch(() => 1);
  localStorage.setItem(LAST_KEY, today);
  if (count > 0) return;
  notify({ title: '¿Ya anotaste los gastos de hoy?', message: 'Tómate un minuto: toca el botón + y registra lo que gastaste.', type: 'info', duration: 7000 });
};

/** Evento diario en Google Calendar a la hora elegida. */
export const dailyGoogleCalendarLink = (time: string) => {
  const { h, m } = hhmm(time);
  const d = new Date(); d.setHours(h, m, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  const e = new Date(d.getTime() + 10 * 60000);
  const f = (x: Date) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Anotar gastos del día · Mi Finanzas',
    dates: `${f(d)}/${f(e)}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota',
    details: `Abre Mi Finanzas y registra lo que gastaste hoy: ${window.location.origin}`,
    recur: 'RRULE:FREQ=DAILY',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

/** Archivo .ics con un recordatorio diario (sirve en iPhone, Samsung y cualquier calendario). */
export const dailyICS = (time: string) => {
  const { h, m } = hhmm(time);
  const d = new Date(); d.setHours(h, m, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  const f = (x: Date) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const end = new Date(d.getTime() + 10 * 60000);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mi Finanzas//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:recordatorio-diario@mi-finanzas', `DTSTAMP:${stamp}`,
    `DTSTART:${f(d)}`, `DTEND:${f(end)}`, 'RRULE:FREQ=DAILY',
    'SUMMARY:Anotar gastos del día · Mi Finanzas',
    `DESCRIPTION:Abre Mi Finanzas y registra lo que gastaste hoy: ${window.location.origin}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:¿Ya anotaste los gastos de hoy?', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
};

export const downloadDailyICS = (time: string) => {
  const blob = new Blob([dailyICS(time)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'recordatorio-diario-mi-finanzas.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
