import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// ✅ FIX: Importación de solo tipo para evitar ts(1484)
import type { Transaction, SavingsGoal } from '../utils/database';
import { notify } from './notificationService';

export const generateFinancialReport = (transactions: Transaction[], goals: SavingsGoal[], format: 'pdf' | 'csv') => {
  if (transactions.length === 0 && goals.length === 0) {
    notify({ title: '⚠️ Sin datos', message: 'Registra movimientos o metas primero.', type: 'warning' });
    return;
  }

  if (format === 'csv') {
    const headers = ['Fecha,Tipo,Categoría,Monto,Descripción'];
    const rows = transactions.map(t => `${t.date},${t.type},${t.category},${t.amount},"${t.description}"`);
    const blob = new Blob([headers.join('\n') + '\n' + rows.join('\n')], { type: 'text/csv' });
    downloadFile(blob, 'finanzas.csv');
    notify({ title: '✅ CSV generado', type: 'success' });
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Reporte Financiero - Mi Finanzas', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 28);

  // ✅ FIX: Uso correcto de autoTable (evita errores de prototipado en TS)
  autoTable(doc, {
    startY: 35,
    head: [['Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción']],
    body: transactions.map(t => [
      t.date,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.category,
      `$${t.amount.toLocaleString('es-CO')}`,
      t.description
    ]),
    theme: 'grid'
  });

  if (goals.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 35;
    doc.text('Metas de Ahorro', 14, finalY + 10);
    autoTable(doc, {
      startY: finalY + 15,
      head: [['Meta', 'Objetivo', 'Progreso', 'Días Restantes']],
      body: goals.map(g => {
        const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
        const progress = g.targetAmount > 0 ? `${((g.currentAmount / g.targetAmount) * 100).toFixed(1)}%` : '0%';
        return [g.name, `$${g.targetAmount.toLocaleString('es-CO')}`, progress, daysLeft.toString()];
      }),
      theme: 'grid'
    });
  }

  doc.save('reporte-finanzas.pdf');
  notify({ title: '✅ PDF generado', type: 'success' });
};

const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};