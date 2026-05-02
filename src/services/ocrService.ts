import Tesseract from 'tesseract.js';

export interface ScannedItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ScannedReceipt {
  store: string;
  date: string;
  total: number;
  items: ScannedItem[];
}

export const scanReceipt = async (imageFile: File): Promise<ScannedReceipt> => {
  try {
    // Usamos 'spa' para español
    const { data } = await Tesseract.recognize(
      imageFile,
      'spa',
      {
        logger: (m) => console.log(m),
        // Eliminamos el whitelist problemático, Tesseract lo hará bien con el modelo spa
      }
    );

    return parseReceiptText(data.text);
  } catch (error) {
    console.error('Error scanning:', error);
    throw new Error('Error al escanear la factura');
  }
};

const parseReceiptText = (text: string): ScannedReceipt => {
  const lines = text.split('\n');
  const items: ScannedItem[] = [];
  let store = '';
  let total = 0;
  let date = '';

  const pricePattern = /[$]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:[.,]\d{1,2})?)/;
  const totalPattern = /(total|TOTAL|Total|PAGAR|pago|PAGO)/;
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;

  lines.forEach((line) => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    if (!store && cleanLine.length > 3 && cleanLine.length < 50 && !pricePattern.test(cleanLine)) {
      store = cleanLine;
      return;
    }

    const dateMatch = cleanLine.match(datePattern);
    if (dateMatch && !date) {
      date = dateMatch[0];
    }

    if (totalPattern.test(cleanLine)) {
      const totalMatch = cleanLine.match(pricePattern);
      if (totalMatch) {
        total = parsePrice(totalMatch[0]);
      }
      return;
    }

    const priceMatch = cleanLine.match(pricePattern);
    if (priceMatch && cleanLine.length > 3) {
      const price = parsePrice(priceMatch[0]);
      if (price > 100) {
        const name = cleanLine.replace(priceMatch[0], '').trim();
        if (name && name.length > 1 && !isNotProduct(name)) {
          items.push({
            name: cleanProductName(name),
            price: price,
            quantity: 1
          });
        }
      }
    }
  });

  return {
    store,
    date: date || new Date().toLocaleDateString('es-CO'),
    total,
    items
  };
};

const parsePrice = (priceStr: string): number => {
  let clean = priceStr.replace(/[$\s]/g, '');
  if (clean.includes(',')) {
    const parts = clean.split(',');
    if (parts.length === 2) {
      const integerPart = parts[0].replace(/\./g, '');
      clean = `${integerPart}.${parts[1]}`;
    }
  } else {
    clean = clean.replace(/\./g, '');
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

const isNotProduct = (text: string): boolean => {
  const notProducts = ['factura', 'invoice', 'nit', 'caja', 'cajero', 'turno', 'teléfono', 'dirección', 'gracias', 'vuelva', 'total', 'subtotal', 'iva', 'efectivo', 'cambio', 'devuelta', 'pago', 'tarjeta', 'debito', 'credito', 'valor', 'cantidad', 'precio'];
  const lower = text.toLowerCase();
  return notProducts.some(word => lower.includes(word));
};

const cleanProductName = (name: string): string => {
  return name.replace(/\d+x\d+/gi, '').replace(/kg|gr|g|ml|l|und|uds/i, '').replace(/\s+/g, ' ').trim();
};