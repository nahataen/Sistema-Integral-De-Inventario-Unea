import jsPDF from 'jspdf';

// ================= INTERFACES =================
export interface RecordItem {
  id: string | number;
  data: Record<string, any>;
}

interface ColumnTypes {
  [key: string]: string;
}

interface LogoData {
  base64: string;
  width: number;
  height: number;
}

// ================= CONFIGURACIÓN VISUAL =================
const PALETTE = {
  DARK_BLUE: [0, 51, 102],
  LIGHT_BLUE: [74, 160, 209],
  ORANGE: [230, 126, 34],
  RED_ACCENT: [231, 76, 60],
  TEXT_DARK: [44, 62, 80],
  TEXT_LIGHT: [127, 140, 141],
  BG_LIGHT: [248, 250, 252],
  WHITE: [255, 255, 255]
};

// Ajustamos márgenes más pequeños para que quepan bien las 4 columnas
const MARGIN_X = 10;
const COL_GAP = 6;

// ================= HELPERS =================
const getLogoData = (url: string): Promise<LogoData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0), resolve({ base64: canvas.toDataURL('image/png'), width: img.width, height: img.height });
      else reject(new Error('Canvas error'));
    };
    img.onerror = (e) => reject(e);
  });
};

// ================= FUNCIÓN PRINCIPAL =================
export const generateBulkPDF = async (
  tableName: string,
  records: RecordItem[],
  columnTypes: ColumnTypes
): Promise<void> => {

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // === CÁLCULO PARA 4 COLUMNAS ===
  const contentWidth = pageWidth - (MARGIN_X * 2);
  // Restamos 3 espacios (gaps) entre las 4 columnas
  const colWidth = (contentWidth - (COL_GAP * 3)) / 4;

  const setFill = (c: number[]) => doc.setFillColor(c[0], c[1], c[2]);
  const setTextCol = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);
  const setDrawCol = (c: number[]) => doc.setDrawColor(c[0], c[1], c[2]);

  let logoData: LogoData | null = null;
  try { logoData = await getLogoData('/unealogo.svg'); } catch (e) { console.warn(e); }

  // --- HEADER Y FOOTER ---
  const drawHeaderAndFooter = (pageIndex: number, totalPages: number) => {
    // Franjas superiores
    const stripeH = 3;
    setFill(PALETTE.DARK_BLUE);  doc.rect(0, 0, pageWidth / 4, stripeH, 'F');
    setFill(PALETTE.RED_ACCENT); doc.rect(pageWidth / 4, 0, pageWidth / 4, stripeH, 'F');
    setFill(PALETTE.ORANGE);     doc.rect((pageWidth / 4) * 2, 0, pageWidth / 4, stripeH, 'F');
    setFill(PALETTE.LIGHT_BLUE); doc.rect((pageWidth / 4) * 3, 0, pageWidth / 4, stripeH, 'F');

    // Logo
    if (logoData) {
      const scale = Math.min(60 / logoData.width, 20 / logoData.height);
      doc.addImage(logoData.base64, 'PNG', MARGIN_X, 10, logoData.width * scale, logoData.height * scale);
    }

    // Títulos
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); setTextCol(PALETTE.DARK_BLUE);
    doc.text('Sistema de Almacén', pageWidth - MARGIN_X, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); setTextCol(PALETTE.TEXT_DARK);
    doc.text(`Tabla: ${tableName.toUpperCase()}`, pageWidth - MARGIN_X, 25, { align: 'right' });

    // Footer sólido
    const footerH = 15;
    const footerY = pageHeight - footerH;
    setFill(PALETTE.DARK_BLUE); doc.rect(0, footerY, pageWidth, footerH, 'F');
    doc.setFontSize(9); setTextCol(PALETTE.WHITE);
    doc.text('Aliat Universidades | UNEA - Documento Oficial', pageWidth / 2, footerY + 9, { align: 'center' });
  };

  // --- BUCLE DE REGISTROS ---
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    if (i > 0) doc.addPage();
    drawHeaderAndFooter(i + 1, records.length);

    let yPos = 40;

    // 1. TARJETA ID (Igual que antes)
    const cardH = 20;
    setDrawCol(PALETTE.ORANGE); doc.setLineWidth(0.5); setFill(PALETTE.BG_LIGHT);
    doc.roundedRect(MARGIN_X, yPos, contentWidth, cardH, 3, 3, 'FD');

    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTextCol(PALETTE.ORANGE);
    doc.text('ID REGISTRO:', MARGIN_X + 10, yPos + 13);
    const idW = doc.getTextWidth('ID REGISTRO:');
    doc.setFontSize(16); setTextCol(PALETTE.DARK_BLUE);
    doc.text(String(rec.id), MARGIN_X + 15 + idW, yPos + 13);

    setDrawCol(PALETTE.TEXT_LIGHT); doc.setLineWidth(0.2);
    doc.line(pageWidth / 2, yPos + 4, pageWidth / 2, yPos + cardH - 4);

    const now = new Date();
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setTextCol(PALETTE.LIGHT_BLUE);
    doc.text('EMITIDO:', (pageWidth / 2) + 10, yPos + 13);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal'); setTextCol(PALETTE.TEXT_DARK);
    doc.text(`${now.toLocaleDateString()} | ${now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`, (pageWidth / 2) + 35, yPos + 13);

    yPos += 35;

    // === 2. LÓGICA DE 4 COLUMNAS ===

    // --- FILTRO ACTUALIZADO: Quita 'id', 'no.' y 'no' ---
    const fields = Object.entries(rec.data).filter(([k, v]) => {
      const key = k.toLowerCase();
      return v != null && key !== 'id' && key !== 'no.' && key !== 'no';
    });

    // Buffer para acumular hasta 4 campos
    let rowBuffer: { key: string, value: any }[] = [];

    // Función para imprimir la fila actual
    const flushBuffer = () => {
      if (rowBuffer.length === 0) return;

      // Calcular la altura máxima necesaria para esta fila
      const fieldHeights = rowBuffer.map(item => {
         doc.setFontSize(9); // Letra un poco más chica para que quepa en col estrecha
         const lines = doc.splitTextToSize(String(item.value), colWidth);
         return (lines.length * 5) + 15;
      });
      const maxH = Math.max(...fieldHeights);

      // Salto de página
      if (yPos + maxH > pageHeight - 40) {
         doc.addPage();
         drawHeaderAndFooter(i + 1, records.length);
         yPos = 40;
      }

      // Imprimir columnas
      rowBuffer.forEach((item, idx) => {
        const xPos = MARGIN_X + (colWidth * idx) + (COL_GAP * idx);

        // Etiqueta
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setTextCol(PALETTE.LIGHT_BLUE);
        doc.text(item.key.toUpperCase().replace(/_/g, ' '), xPos, yPos);

        // Línea
        setDrawCol(PALETTE.TEXT_LIGHT); doc.setLineWidth(0.1);
        doc.line(xPos, yPos + 2, xPos + colWidth, yPos + 2);

        // Valor
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTextCol(PALETTE.TEXT_DARK);
        const lines = doc.splitTextToSize(String(item.value), colWidth);
        doc.text(lines, xPos, yPos + 8);
      });

      yPos += maxH + 5;
      rowBuffer = [];
    };

    // Procesar campos
    for (const [key, value] of fields) {
      const isImage = columnTypes[key]?.toUpperCase() === 'BLOB';

      if (isImage) {
        flushBuffer(); // Vaciar texto pendiente

        // Checar espacio imagen
        if (yPos + 120 > pageHeight - 40) {
          doc.addPage();
          drawHeaderAndFooter(i + 1, records.length);
          yPos = 40;
        }

        // Imprimir imagen
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setTextCol(PALETTE.LIGHT_BLUE);
        doc.text(key.toUpperCase().replace(/_/g, ' '), MARGIN_X, yPos);
        yPos += 5;
        setDrawCol(PALETTE.TEXT_LIGHT); doc.setLineWidth(0.1);
        doc.line(MARGIN_X, yPos, pageWidth - MARGIN_X, yPos);
        yPos += 5;

        try {
          const imgBase64 = String(value).startsWith('data:image') ? value : `data:image/png;base64,${value}`;
          const imgH = 100; const imgW = 140; const imgX = (pageWidth - imgW) / 2;
          doc.addImage(String(imgBase64), 'PNG', imgX, yPos, imgW, imgH);
          yPos += imgH + 15;
        } catch {
          doc.text('[Error Imagen]', MARGIN_X, yPos); yPos += 15;
        }

      } else {
        // Es texto, añadir al buffer
        rowBuffer.push({ key, value });

        // Si llegamos a 4 columnas, imprimir fila
        if (rowBuffer.length === 4) {
          flushBuffer();
        }
      }
    }
    // Vaciar remanentes
    flushBuffer();
  }

  const fileName = `Reporte_${tableName}_${records.length}_Registros.pdf`;
  doc.save(fileName);
};