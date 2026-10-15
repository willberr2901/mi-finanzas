import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, type Transaction, type Bill, type BillPayment } from '../utils/database';
import { statusFor, OWNER_LABEL, type BillStatus } from './billsService';
import { segmentOf, SEGMENT_INFO, type Segment } from '../utils/categories';
import { getMarketHistory } from '../utils/marketHistory';
import { parseLocalDate } from '../utils/format';
import { notify } from './notificationService';

// ───────────────────────── Marca ─────────────────────────
type RGB = [number, number, number];
const NAVY: RGB = [11, 16, 38];
const NAVY_2: RGB = [26, 33, 64];
const LIME: RGB = [198, 244, 50];
const LIME_DARK: RGB = [77, 124, 15];
const INK: RGB = [17, 24, 39];
const MUTED: RGB = [100, 108, 128];
const LINE: RGB = [228, 231, 238];
const SOFT: RGB = [245, 247, 250];
const RED: RGB = [220, 38, 38];
const AMBER: RGB = [217, 119, 6];
const GREEN: RGB = [22, 163, 74];

const SEG_COLOR: Record<Exclude<Segment, 'ingreso'>, RGB> = {
  obligatorio: NAVY,
  necesario: [100, 116, 139],
  gusto: [245, 158, 11],
  ahorro: [132, 204, 22],
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const KIND_LABEL: Record<Bill['kind'], string> = { fijo: 'Pago fijo', tarjeta: 'Tarjeta', deuda: 'Deuda' };

const nf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const money = (n: number) => `${n < 0 ? '-' : ''}$${nf.format(Math.round(Math.abs(n || 0)))}`;
const pct = (n: number, d = 0) => `${(Number.isFinite(n) ? n : 0).toFixed(d).replace('.', ',')}%`;
const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}`;

export const periodLabel = (period: string) => {
  const [y, m] = period.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
const prevPeriod = (period: string, back = 1) => {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 - back, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Meses con movimientos (más el actual), del más reciente al más antiguo. */
export const availablePeriods = (transactions: Transaction[]): string[] => {
  const set = new Set<string>([currentPeriod()]);
  transactions.forEach(t => t.date && set.add(t.date.slice(0, 7)));
  return [...set].sort().reverse();
};

// ───────────────────────── Dibujo ─────────────────────────
const fill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const text = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
const stroke = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

/** Logo de la app (barras que crecen) dibujado en vectores. */
const drawLogo = (doc: jsPDF, x: number, y: number, size: number, withBg = true) => {
  const s = size / 512;
  if (withBg) { fill(doc, NAVY_2); doc.roundedRect(x, y, size, size, 116 * s, 116 * s, 'F'); }
  const bar = (bx: number, by: number, h: number, c: RGB) => { fill(doc, c); doc.roundedRect(x + bx * s, y + by * s, 64 * s, h * s, 32 * s, 32 * s, 'F'); };
  bar(128, 276, 120, withBg ? [104, 107, 120] : MUTED);
  bar(224, 210, 186, withBg ? [187, 188, 194] : [150, 156, 172]);
  bar(320, 146, 250, LIME);
  fill(doc, LIME); doc.circle(x + 352 * s, y + 98 * s, 23 * s, 'F');
};

const withOpacity = (doc: jsPDF, opacity: number, draw: () => void) => {
  const anyDoc = doc as any;
  anyDoc.saveGraphicsState?.();
  try { anyDoc.setGState(new anyDoc.GState({ opacity })); } catch { /* sin soporte de transparencia */ }
  draw();
  anyDoc.restoreGraphicsState?.();
};

const W = 210, H = 297, M = 14;

const sectionTitle = (doc: jsPDF, y: number, title: string, subtitle?: string) => {
  fill(doc, LIME); doc.roundedRect(M, y - 4.2, 1.6, 5.6, 0.8, 0.8, 'F');
  text(doc, INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.text(title, M + 4, y);
  if (subtitle) { text(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text(subtitle, W - M, y, { align: 'right' }); }
  return y + 5;
};

const ensureSpace = (doc: jsPDF, y: number, needed: number) => {
  if (y + needed > H - 20) { doc.addPage(); return 28; }
  return y;
};

const tableStyle = {
  theme: 'plain' as const,
  margin: { left: M, right: M, top: 22, bottom: 18 },
  styles: { font: 'helvetica', fontSize: 8.6, textColor: INK, cellPadding: { top: 2.4, bottom: 2.4, left: 2.6, right: 2.6 }, lineColor: LINE, lineWidth: { bottom: 0.2 } as any },
  headStyles: { fillColor: NAVY, textColor: [255, 255, 255] as RGB, fontStyle: 'bold' as const, fontSize: 8.2 },
  alternateRowStyles: { fillColor: [250, 251, 253] as RGB },
};

/** autoTable con el estilo de la marca; los títulos de columnas numéricas se alinean igual que sus valores. */
const table = (doc: jsPDF, opts: any) => {
  const user = opts.didParseCell;
  autoTable(doc, {
    ...tableStyle,
    ...opts,
    didParseCell: (data: any) => {
      if (data.section === 'head') { const h = opts.columnStyles?.[data.column.index]?.halign; if (h) data.cell.styles.halign = h; }
      user?.(data);
    },
  });
};

// ───────────────────────── Datos ─────────────────────────
interface Totals { income: number; expense: number; }
const totalsOf = (txs: Transaction[]): Totals => ({
  income: txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0),
  expense: txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
});

const deltaText = (now: number, before: number, lowerIsBetter: boolean): { label: string; color: RGB } => {
  if (!before) return { label: 'Sin mes anterior para comparar', color: MUTED };
  const d = ((now - before) / before) * 100;
  if (Math.abs(d) < 0.5) return { label: 'Igual que el mes anterior', color: MUTED };
  const good = lowerIsBetter ? d < 0 : d > 0;
  return { label: `${d > 0 ? '+' : ''}${pct(d)} vs mes anterior`, color: good ? GREEN : RED };
};

// ───────────────────────── Reporte ─────────────────────────
export const generateFinancialReport = async (period: string, format: 'pdf' | 'csv') => {
  const [allTx, goals, bills, payments] = await Promise.all([
    db.transactions.toArray(), db.goals.toArray(), db.bills.toArray(), db.billPayments.toArray(),
  ]);
  const txs = allTx.filter(t => t.date?.startsWith(period)).sort((a, b) => a.date.localeCompare(b.date));
  const activeBills = bills.filter(b => b.active);

  if (txs.length === 0 && activeBills.length === 0 && goals.length === 0) {
    notify({ title: 'Sin datos', message: `No hay movimientos ni pagos registrados para ${periodLabel(period)}.`, type: 'warning' });
    return;
  }

  // Estado de pagos del mes elegido (si es un mes pasado, lo que no se pagó queda vencido)
  const [py, pm] = period.split('-').map(Number);
  const isCurrent = period === currentPeriod();
  const ref = isCurrent ? new Date() : new Date(py, pm, 0, 23, 59);
  const periodPayments = payments.filter(p => p.period === period);
  const statuses: BillStatus[] = activeBills.map(b => statusFor(b, periodPayments, ref)).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  if (format === 'csv') return exportCSV(period, txs, statuses);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const userName = (() => { try { return localStorage.getItem('miFinanzasUserName') || ''; } catch { return ''; } })();
  const t = totalsOf(txs);
  const prev = totalsOf(allTx.filter(x => x.date?.startsWith(prevPeriod(period))));
  const balance = t.income - t.expense;
  const savingsRate = t.income > 0 ? (balance / t.income) * 100 : 0;

  // ── Encabezado ──
  fill(doc, NAVY); doc.rect(0, 0, W, 44, 'F');
  withOpacity(doc, 0.1, () => { fill(doc, LIME); doc.circle(W - 10, 2, 30, 'F'); });
  drawLogo(doc, M, 11, 20);
  text(doc, [255, 255, 255]); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('Mi Finanzas', M + 25, 19.5);
  text(doc, [174, 180, 202]); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('Reporte financiero del hogar', M + 25, 25.5);
  text(doc, LIME); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(periodLabel(period), W - M, 19.5, { align: 'right' });
  text(doc, [174, 180, 202]); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  const gen = new Date();
  doc.text(`Generado el ${gen.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}${userName ? ` · ${userName}` : ''}`, W - M, 25.5, { align: 'right' });
  doc.setFontSize(8); doc.text(`${txs.length} movimientos · ${activeBills.length} pagos programados · ${goals.length} metas`, M, 38);

  // ── KPIs ──
  let y = 52;
  const cardW = (W - 2 * M - 3 * 4) / 4;
  const kpis: { label: string; value: string; sub: string; subColor: RGB; accent?: boolean }[] = [
    { label: 'Ingresos', value: money(t.income), ...(() => { const d = deltaText(t.income, prev.income, false); return { sub: d.label, subColor: d.color }; })() },
    { label: 'Gastos', value: money(t.expense), ...(() => { const d = deltaText(t.expense, prev.expense, true); return { sub: d.label, subColor: d.color }; })() },
    { label: 'Balance', value: money(balance), sub: balance >= 0 ? 'Te sobró dinero este mes' : 'Gastaste más de lo que entró', subColor: balance >= 0 ? GREEN : RED, accent: true },
    { label: 'Tasa de ahorro', value: t.income > 0 ? pct(savingsRate) : '—', sub: t.income > 0 ? (savingsRate >= 20 ? 'Muy bien, meta sana: 20%' : savingsRate >= 0 ? 'Meta sugerida: 20%' : 'Revisa tus gastos') : 'Registra tus ingresos', subColor: savingsRate >= 20 ? GREEN : savingsRate >= 0 ? AMBER : RED },
  ];
  kpis.forEach((k, i) => {
    const x = M + i * (cardW + 4);
    if (k.accent) { fill(doc, NAVY); } else { fill(doc, SOFT); }
    doc.roundedRect(x, y, cardW, 27, 3, 3, 'F');
    if (k.accent) { fill(doc, LIME); doc.roundedRect(x, y, 1.6, 27, 0.8, 0.8, 'F'); }
    text(doc, k.accent ? [174, 180, 202] : MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(k.label.toUpperCase(), x + 4, y + 6.5);
    text(doc, k.accent ? (balance >= 0 ? LIME : [252, 165, 165]) : INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(k.value, x + 4, y + 15);
    text(doc, k.accent ? [205, 210, 225] : k.subColor); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.6);
    doc.text(doc.splitTextToSize(k.sub, cardW - 7), x + 4, y + 21);
  });
  y += 36;

  // ── ¿En qué se fue la plata? (segmentos) ──
  const expenses = txs.filter(x => x.type === 'expense');
  if (t.expense > 0) {
    y = sectionTitle(doc, y, '¿En qué se fue la plata?', `Total gastado: ${money(t.expense)}`);
    const segs = (Object.keys(SEGMENT_INFO) as Exclude<Segment, 'ingreso'>[]).map(s => ({
      s, total: expenses.filter(e => segmentOf('expense', e.category) === s).reduce((a, e) => a + e.amount, 0),
    })).filter(x => x.total > 0);
    // barra apilada
    let bx = M; const bw = W - 2 * M;
    segs.forEach((sg, i) => {
      const w = (sg.total / t.expense) * bw;
      fill(doc, SEG_COLOR[sg.s]);
      doc.roundedRect(bx, y + 1, Math.max(w, 1), 6, i === 0 || i === segs.length - 1 ? 2 : 0, i === 0 || i === segs.length - 1 ? 2 : 0, 'F');
      bx += w;
    });
    y += 12;
    const colW = bw / 2;
    segs.forEach((sg, i) => {
      const cx = M + (i % 2) * colW, cy = y + Math.floor(i / 2) * 9;
      fill(doc, SEG_COLOR[sg.s]); doc.roundedRect(cx, cy - 3, 3.2, 3.2, 0.8, 0.8, 'F');
      text(doc, INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(`${SEGMENT_INFO[sg.s].short} · ${pct((sg.total / t.expense) * 100)}`, cx + 5, cy);
      text(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(money(sg.total), cx + 5, cy + 4);
    });
    y += Math.ceil(segs.length / 2) * 9 + 3;

    // top categorías
    const byCat = new Map<string, number>();
    expenses.forEach(e => byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount));
    const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
    table(doc, {
      startY: y,
      head: [['Categoría', 'Tipo de gasto', 'Movimientos', 'Total', '% del gasto', '']],
      body: cats.map(([c, v]) => {
        const seg = segmentOf('expense', c) as Exclude<Segment, 'ingreso'>;
        return [c, SEGMENT_INFO[seg]?.short || '—', String(expenses.filter(e => e.category === c).length), money(v), pct((v / t.expense) * 100, 1), ''];
      }),
      columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right', fontStyle: 'bold' }, 4: { halign: 'right' }, 5: { cellWidth: 34 } },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 5) {
          const v = cats[data.row.index][1] / cats[0][1];
          const x0 = data.cell.x + 2, yy = data.cell.y + data.cell.height / 2 - 1.3, ww = data.cell.width - 4;
          fill(doc, LINE); doc.roundedRect(x0, yy, ww, 2.6, 1.3, 1.3, 'F');
          fill(doc, LIME_DARK); doc.roundedRect(x0, yy, Math.max(ww * v, 2.6), 2.6, 1.3, 1.3, 'F');
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Pagos fijos, tarjetas y deudas del mes ──
  if (statuses.length) {
    y = ensureSpace(doc, y, 45);
    const totalDue = statuses.reduce((a, s) => a + (s.payment?.amount ?? s.bill.amount), 0);
    const paidCount = statuses.filter(s => s.paid).length;
    const paidAmount = statuses.filter(s => s.paid).reduce((a, s) => a + (s.payment?.amount ?? s.bill.amount), 0);
    y = sectionTitle(doc, y, 'Pagos del mes', `${paidCount} de ${statuses.length} pagados · ${pct(totalDue ? (paidAmount / totalDue) * 100 : 0)} del valor`);
    // barra de avance
    fill(doc, LINE); doc.roundedRect(M, y, W - 2 * M, 3, 1.5, 1.5, 'F');
    if (paidAmount > 0) { fill(doc, LIME_DARK); doc.roundedRect(M, y, Math.max((W - 2 * M) * (paidAmount / totalDue), 3), 3, 1.5, 1.5, 'F'); }
    text(doc, MUTED); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`Pagado: ${money(paidAmount)}`, M, y + 8);
    doc.text(`Pendiente: ${money(totalDue - paidAmount)}`, W - M, y + 8, { align: 'right' });
    y += 12;

    const stateLabel = (s: BillStatus) => {
      if (s.paid) return `Pagado ${s.payment ? shortDate(new Date(s.payment.paidAt)) : ''}`.trim();
      if (s.state === 'vencido') return `Vencido (${Math.abs(s.daysLeft)} d)`;
      if (s.state === 'hoy') return 'Vence hoy';
      return `Faltan ${s.daysLeft} d`;
    };
    const stateColor = (s: BillStatus): RGB => s.paid ? GREEN : s.state === 'vencido' ? RED : s.state === 'hoy' || s.state === 'pronto' ? AMBER : MUTED;
    table(doc, {
      startY: y,
      head: [['Pago', 'Tipo', 'Fecha de pago', 'Responsable', 'Valor', 'Estado']],
      body: statuses.map(s => [
        s.bill.name, KIND_LABEL[s.bill.kind], `Día ${s.bill.dueDay} · ${shortDate(s.dueDate)}`, OWNER_LABEL[s.bill.owner] || '—',
        money(s.payment?.amount ?? s.bill.amount) + (s.bill.kind === 'tarjeta' && !s.paid ? '*' : ''), stateLabel(s),
      ]),
      columnStyles: { 0: { fontStyle: 'bold' }, 4: { halign: 'right', fontStyle: 'bold' }, 5: { fontStyle: 'bold' } },
      didParseCell: (data: any) => { if (data.section === 'body' && data.column.index === 5) data.cell.styles.textColor = stateColor(statuses[data.row.index]); },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
    if (statuses.some(s => s.bill.kind === 'tarjeta' && !s.paid)) {
      text(doc, MUTED); doc.setFontSize(7.5); doc.text('* Tarjetas: valor de referencia; el valor real se registra cuando la pagas.', M, y + 2); y += 4;
    }
    y += 8;
  }

  // ── Deudas ──
  const debts = activeBills.filter(b => b.kind === 'deuda' && b.totalInstallments);
  if (debts.length) {
    y = ensureSpace(doc, y, 40);
    const totalLeft = debts.reduce((a, b) => a + b.amount * Math.max(0, (b.totalInstallments || 0) - (b.paidInstallments || 0)), 0);
    y = sectionTitle(doc, y, 'Deudas', `Saldo estimado: ${money(totalLeft)}`);
    table(doc, {
      startY: y,
      head: [['Deuda', 'Cuota', 'Cuotas', 'Avance', '', 'Saldo estimado', 'Termina']],
      body: debts.map(b => {
        const total = b.totalInstallments || 0, paid = Math.min(b.paidInstallments || 0, total), left = total - paid;
        const end = new Date(); end.setMonth(end.getMonth() + left);
        return [b.name, money(b.amount), `${paid} / ${total}`, pct(total ? (paid / total) * 100 : 0), '', money(b.amount * left), left > 0 ? `${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}` : 'Pagada'];
      }),
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { cellWidth: 28 }, 5: { halign: 'right', fontStyle: 'bold' } },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 4) {
          const b = debts[data.row.index]; const v = (b.totalInstallments ? (b.paidInstallments || 0) / b.totalInstallments : 0);
          const x0 = data.cell.x + 1.5, yy = data.cell.y + data.cell.height / 2 - 1.3, ww = data.cell.width - 3;
          fill(doc, LINE); doc.roundedRect(x0, yy, ww, 2.6, 1.3, 1.3, 'F');
          fill(doc, NAVY); doc.roundedRect(x0, yy, Math.max(ww * Math.min(v, 1), 2.6), 2.6, 1.3, 1.3, 'F');
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Metas ──
  if (goals.length) {
    y = ensureSpace(doc, y, 35);
    const saved = goals.reduce((a, g) => a + g.currentAmount, 0), target = goals.reduce((a, g) => a + g.targetAmount, 0);
    y = sectionTitle(doc, y, 'Metas de ahorro', `Ahorrado: ${money(saved)} de ${money(target)}`);
    table(doc, {
      startY: y,
      head: [['Meta', 'Ahorrado', 'Objetivo', 'Avance', '', 'Faltan', 'Ahorro/mes sugerido']],
      body: goals.map(g => {
        const left = Math.max(0, g.targetAmount - g.currentAmount);
        const days = g.deadline ? Math.ceil((parseLocalDate(g.deadline).getTime() - Date.now()) / 86400000) : 0;
        const months = Math.max(1, Math.ceil(days / 30));
        return [g.name, money(g.currentAmount), money(g.targetAmount), pct(g.targetAmount ? (g.currentAmount / g.targetAmount) * 100 : 0), '',
          days > 0 ? `${days} días` : (left > 0 ? 'Vencida' : 'Cumplida'), left > 0 ? money(left / months) : '—'];
      }),
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { cellWidth: 26 }, 6: { halign: 'right', fontStyle: 'bold' } },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 4) {
          const g = goals[data.row.index]; const v = g.targetAmount ? g.currentAmount / g.targetAmount : 0;
          const x0 = data.cell.x + 1.5, yy = data.cell.y + data.cell.height / 2 - 1.3, ww = data.cell.width - 3;
          fill(doc, LINE); doc.roundedRect(x0, yy, ww, 2.6, 1.3, 1.3, 'F');
          fill(doc, [132, 204, 22]); doc.roundedRect(x0, yy, Math.max(ww * Math.min(v, 1), 2.6), 2.6, 1.3, 1.3, 'F');
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Tendencia 6 meses ──
  const trend = Array.from({ length: 6 }, (_, i) => prevPeriod(period, 5 - i)).map(p => ({ p, ...totalsOf(allTx.filter(x => x.date?.startsWith(p))) }));
  if (trend.some(x => x.income || x.expense)) {
    y = ensureSpace(doc, y, 62);
    y = sectionTitle(doc, y, 'Últimos 6 meses', 'Ingresos vs gastos');
    const chartH = 38, chartY = y + 2, colW = (W - 2 * M) / 6;
    const max = Math.max(...trend.map(x => Math.max(x.income, x.expense)), 1);
    stroke(doc, LINE); doc.setLineWidth(0.2); doc.line(M, chartY + chartH, W - M, chartY + chartH);
    trend.forEach((x, i) => {
      const cx = M + i * colW + colW / 2;
      const hi = (x.income / max) * (chartH - 6), he = (x.expense / max) * (chartH - 6);
      fill(doc, x.p === period ? LIME_DARK : [190, 205, 160]); if (hi > 0) doc.roundedRect(cx - 7, chartY + chartH - hi, 6, hi, 1, 1, 'F');
      fill(doc, x.p === period ? NAVY : [150, 156, 172]); if (he > 0) doc.roundedRect(cx + 1, chartY + chartH - he, 6, he, 1, 1, 'F');
      text(doc, x.p === period ? INK : MUTED); doc.setFont('helvetica', x.p === period ? 'bold' : 'normal'); doc.setFontSize(7.8);
      doc.text(MONTHS[Number(x.p.slice(5)) - 1].slice(0, 3), cx, chartY + chartH + 4.5, { align: 'center' });
    });
    y = chartY + chartH + 9;
    fill(doc, LIME_DARK); doc.roundedRect(M, y - 2.6, 3, 3, 0.8, 0.8, 'F'); text(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('Ingresos', M + 4.5, y);
    fill(doc, NAVY); doc.roundedRect(M + 24, y - 2.6, 3, 3, 0.8, 0.8, 'F'); doc.text('Gastos', M + 28.5, y);
    y += 10;
  }

  // ── Mercado ──
  const market = getMarketHistory().filter(m => m.date?.startsWith(period));
  if (market.length) {
    y = ensureSpace(doc, y, 22);
    const total = market.reduce((a, m) => a + m.total, 0), items = market.reduce((a, m) => a + m.itemsCount, 0);
    y = sectionTitle(doc, y, 'Mercado', `${market.length} compra${market.length === 1 ? '' : 's'}`);
    fill(doc, SOFT); doc.roundedRect(M, y, W - 2 * M, 14, 3, 3, 'F');
    text(doc, INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(`${money(total)} en mercado`, M + 5, y + 8.8);
    text(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text(`${items} productos · promedio ${money(total / market.length)} por compra${t.expense ? ` · ${pct((total / t.expense) * 100)} del gasto` : ''}`, W - M - 5, y + 8.8, { align: 'right' });
    y += 22;
  }

  // ── Movimientos ──
  if (txs.length) {
    y = ensureSpace(doc, y, 30);
    y = sectionTitle(doc, y, 'Movimientos del mes', `${txs.length} registros`);
    table(doc, {
      startY: y,
      head: [['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Valor']],
      body: txs.map(x => [shortDate(parseLocalDate(x.date)), x.description || '—', x.category, x.type === 'income' ? 'Ingreso' : 'Gasto', `${x.type === 'income' ? '+' : '-'}${money(x.amount)}`]),
      columnStyles: { 0: { cellWidth: 18 }, 4: { halign: 'right', fontStyle: 'bold' } },
      didParseCell: (data: any) => { if (data.section === 'body' && data.column.index === 4) data.cell.styles.textColor = txs[data.row.index].type === 'income' ? GREEN : INK; },
    });
  }

  // ── Marca de agua, encabezado corto y pie en todas las páginas ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    withOpacity(doc, 0.045, () => drawLogo(doc, (W - 130) / 2, (H - 130) / 2 + 10, 130, false));
    if (i > 1) {
      drawLogo(doc, M, 7, 8);
      text(doc, INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.text('Mi Finanzas', M + 10.5, 12.4);
      text(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text(`Reporte · ${periodLabel(period)}`, W - M, 12.4, { align: 'right' });
      stroke(doc, LINE); doc.setLineWidth(0.2); doc.line(M, 17, W - M, 17);
    }
    stroke(doc, LINE); doc.setLineWidth(0.2); doc.line(M, H - 13, W - M, H - 13);
    text(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('Generado con Mi Finanzas · Tus datos se quedan en tu celular', M, H - 8);
    doc.text(`Página ${i} de ${pages}`, W - M, H - 8, { align: 'right' });
  }

  doc.save(`mi-finanzas-${period}.pdf`);
  notify({ title: 'Reporte listo', message: `PDF de ${periodLabel(period)} descargado.`, type: 'success' });
};

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

const exportCSV = (period: string, txs: Transaction[], statuses: BillStatus[]) => {
  const lines: string[] = [];
  lines.push(['Fecha', 'Tipo', 'Categoría', 'Valor', 'Descripción'].map(csvCell).join(';'));
  txs.forEach(t => lines.push([t.date, t.type === 'income' ? 'Ingreso' : 'Gasto', t.category, Math.round(t.amount), t.description || ''].map(csvCell).join(';')));
  if (statuses.length) {
    lines.push('', ['Pago', 'Tipo', 'Día de pago', 'Responsable', 'Valor', 'Estado'].map(csvCell).join(';'));
    statuses.forEach(s => lines.push([s.bill.name, KIND_LABEL[s.bill.kind], s.bill.dueDay, OWNER_LABEL[s.bill.owner] || '', Math.round(s.payment?.amount ?? s.bill.amount), s.paid ? 'Pagado' : s.state === 'vencido' ? 'Vencido' : 'Pendiente'].map(csvCell).join(';')));
  }
  // BOM para que Excel muestre bien las tildes
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `mi-finanzas-${period}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  notify({ title: 'Excel (CSV) listo', message: `Movimientos y pagos de ${periodLabel(period)}.`, type: 'success' });
};

export type { BillPayment };
