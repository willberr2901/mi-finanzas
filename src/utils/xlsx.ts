/**
 * ════════════════════════════════════════════════════════════════════
 * 📗 GENERADOR DE ARCHIVOS EXCEL (.xlsx) DE VERDAD
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: arma un archivo de Excel con varias hojas, encabezados con los
 *           colores de la marca, columnas de dinero con formato $, fechas,
 *           filtros y la primera fila fija. Todo dentro del celular.
 * Antes: se descargaba un .csv que en el celular se veía como texto plano
 *        y a veces Excel mezclaba las columnas.
 * Dónde se usa: Finanzas → Reportes (Excel) y Reportes → Opiniones (Excel).
 * Si lo cambias: prueba abriendo el archivo en Excel y en Google Sheets.
 * ════════════════════════════════════════════════════════════════════
 */
import { zipSync, strToU8 } from 'fflate';

export type ColType = 'text' | 'money' | 'number' | 'date' | 'percent' | 'longtext' | 'moneySigned' | 'bar';
/** Formato condicional: 'level' pinta verde/ámbar/rojo según el % (0,8 y 1); 'bar' dibuja una barra de avance de 0 a 1. */
export interface CondFormat { col: number; kind: 'level' | 'bar' }
export interface Column { header: string; width?: number; type?: ColType }
/** Fórmula de Excel: {r} se cambia por el número de la fila. `v` es el valor ya calculado (para que se vea sin recalcular). */
export interface Formula { f: string; v: number }
export type CellValue = string | number | null | undefined | Formula;
export interface Sheet { name: string; title?: string; note?: string; columns: Column[]; rows: CellValue[][]; totals?: (string | number | null)[]; cond?: CondFormat[] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // caracteres que Excel no acepta
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const colName = (i: number) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
/** Fecha ISO (AAAA-MM-DD) → número de fecha de Excel. */
const excelDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;
};

// Estilos: 0 normal · 1 encabezado · 2 dinero · 3 fecha · 4 texto largo · 5 título · 6 total texto · 7 total dinero · 8 número · 9 porcentaje
// 10 dinero con negativos en rojo · 11 barra (número oculto) · 12 nota · 13 total porcentaje
const STYLE: Record<ColType, number> = { text: 0, money: 2, date: 3, longtext: 4, number: 8, percent: 9, moneySigned: 10, bar: 11 };
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="5"><numFmt numFmtId="164" formatCode="&quot;$&quot;\\ #,##0"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="0.0%"/><numFmt numFmtId="167" formatCode="&quot;$&quot;\\ #,##0;[Red]\\-&quot;$&quot;\\ #,##0"/><numFmt numFmtId="168" formatCode=";;;"/></numFmts>
<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF0B1026"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF646C80"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B1026"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEFCC6"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFC6F432"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="14">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="164" fontId="3" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="167" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="168" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="166" fontId="3" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="3">
<dxf><font><b/><color rgb="FF3F6212"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFD9F99D"/></patternFill></fill></dxf>
<dxf><font><b/><color rgb="FF92400E"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFFEF3C7"/></patternFill></fill></dxf>
<dxf><font><b/><color rgb="FFBE123C"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFFFE4E6"/></patternFill></fill></dxf>
</dxfs>
</styleSheet>`;

const cell = (ref: string, v: CellValue, style: number, type: ColType | 'text' = 'text') => {
  if (v && typeof v === 'object') {
    // Solo fórmulas armadas por la app (nunca texto escrito por la persona)
    const row = ref.replace(/^[A-Z]+/, '');
    return `<c r="${ref}" s="${style}"><f>${esc(v.f.replace(/\{r\}/g, row))}</f><v>${Number.isFinite(v.v) ? v.v : 0}</v></c>`;
  }
  if (v === null || v === undefined || v === '') return style ? `<c r="${ref}" s="${style}"/>` : '';
  if (type === 'date' && typeof v === 'string') { const n = excelDate(v); if (n !== null) return `<c r="${ref}" s="${style}"><v>${n}</v></c>`; }
  if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}" s="${style}"><v>${v}</v></c>`;
  // Texto: nunca se interpreta como fórmula (protección contra "inyección de fórmulas").
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
};

const sheetXml = (s: Sheet) => {
  const rows: string[] = [];
  let r = 1;
  if (s.title) { rows.push(`<row r="${r}" ht="24" customHeight="1">${cell(`A${r}`, s.title, 5)}</row>`); r += s.note ? 1 : 2; }
  if (s.note) { rows.push(`<row r="${r}">${cell(`A${r}`, s.note, 12)}</row>`); r += 2; }
  const headerRow = r;
  rows.push(`<row r="${r}" ht="22" customHeight="1">${s.columns.map((c, i) => cell(`${colName(i)}${r}`, c.header, 1)).join('')}</row>`); r++;
  for (const row of s.rows) {
    rows.push(`<row r="${r}">${s.columns.map((c, i) => cell(`${colName(i)}${r}`, row[i], STYLE[c.type ?? 'text'], c.type)).join('')}</row>`);
    r++;
  }
  if (s.totals) {
    rows.push(`<row r="${r}">${s.columns.map((c, i) => cell(`${colName(i)}${r}`, s.totals![i], c.type === 'money' || c.type === 'moneySigned' ? 7 : c.type === 'percent' ? 13 : 6, c.type)).join('')}</row>`);
  }
  const last = colName(s.columns.length - 1);
  // Formato condicional (colores por nivel y barras de avance): Excel lo recalcula si cambias un valor
  const first = headerRow + 1, end = headerRow + s.rows.length;
  let prio = 1;
  const cond = s.rows.length ? (s.cond ?? []).map(c => {
    const ref = `${colName(c.col)}${first}:${colName(c.col)}${end}`, a = `${colName(c.col)}${first}`;
    if (c.kind === 'bar') return `<conditionalFormatting sqref="${ref}"><cfRule type="dataBar" priority="${prio++}"><dataBar><cfvo type="num" val="0"/><cfvo type="num" val="1"/><color rgb="FF84CC16"/></dataBar></cfRule></conditionalFormatting>`;
    return `<conditionalFormatting sqref="${ref}"><cfRule type="expression" dxfId="2" priority="${prio++}" stopIfTrue="1"><formula>AND(ISNUMBER(${a}),${a}&gt;=1)</formula></cfRule><cfRule type="expression" dxfId="1" priority="${prio++}" stopIfTrue="1"><formula>AND(ISNUMBER(${a}),${a}&gt;=0.8)</formula></cfRule><cfRule type="expression" dxfId="0" priority="${prio++}"><formula>ISNUMBER(${a})</formula></cfRule></conditionalFormatting>`;
  }).join('') : '';
  const cols = s.columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width ?? (c.type === 'longtext' ? 50 : 16)}" customWidth="1"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols>
<sheetData>${rows.join('')}</sheetData>
${s.rows.length ? `<autoFilter ref="A${headerRow}:${last}${headerRow + s.rows.length}"/>` : ''}
${cond}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
</worksheet>`;
};

/** Crea el archivo .xlsx y lo descarga. */
export const downloadXlsx = (fileName: string, sheets: Sheet[]) => {
  const safeName = (n: string, i: number) => (n.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `Hoja${i + 1}`);
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${esc(safeName(s.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    'xl/styles.xml': strToU8(stylesXml),
  };
  sheets.forEach((s, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s)); });
  const data = zipSync(files, { level: 6 });
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
