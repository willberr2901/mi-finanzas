/**
 * 🔳 Código QR bajo demanda: la librería (≈70 KB) solo se descarga cuando una ventana
 * realmente muestra un QR. Así la app abre más rápido.
 */
type QROpts = { margin?: number; width?: number; errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; color?: { dark?: string; light?: string } };
export const qrDataURL = async (text: string, opts: QROpts): Promise<string> => {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(text, opts);
};
