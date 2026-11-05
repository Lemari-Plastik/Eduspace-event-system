import { AttendeePass } from '../types';

/**
 * Generates a 21x21 QR-style matrix with standard finder patterns and deterministic data cells.
 */
export function generateQrMatrix(code: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rowOffset + r][colOffset + c] = isBorder || isInner;
        reserved[rowOffset + r][colOffset + c] = true;
      }
    }
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size && !reserved[rr][cc]) {
          reserved[rr][cc] = true;
          matrix[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    reserved[6][i] = true;
    matrix[i][6] = i % 2 === 0;
    reserved[i][6] = true;
  }

  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        matrix[r][c] = (Math.abs(hash) % 10) < 5;
      }
    }
  }

  return matrix;
}

/**
 * Renders the perforated digital pass credential with QR Code onto a high-DPI HTML5 Canvas
 * and triggers a PNG download (`Tiket-OpenHouse-ABSC-XXXX.png`).
 */
export function downloadPassAsPng(pass: AttendeePass): void {
  const scale = 2;
  const width = 460;
  const height = 620;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);

  // Background Warm Cream
  ctx.fillStyle = '#FFF3E3';
  ctx.fillRect(0, 0, width, height);

  // Main Card Container
  const cardX = 24;
  const cardY = 24;
  const cardW = width - 48;
  const cardH = height - 48;
  const radius = 20;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(26, 29, 46, 0.14)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fill();
  ctx.restore();

  // Card Outline
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top Header Band (Mint #D5E8E6)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, 74, [radius, radius, 0, 0]);
  ctx.fillStyle = '#D5E8E6';
  ctx.fill();
  ctx.restore();

  // Header Text
  ctx.fillStyle = '#181b2b';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('EDUPASS OPEN HOUSE 2026', cardX + 24, cardY + 32);

  ctx.fillStyle = '#506260';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.fillText('TIKET PAS RESMI & KUPON KEHADIRAN QR', cardX + 24, cardY + 53);

  // Attendee Name & Role
  ctx.fillStyle = '#64748B';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.fillText('NAMA PESERTA & PERAN', cardX + 24, cardY + 108);

  ctx.fillStyle = '#181b2b';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(pass.fullName.slice(0, 26), cardX + 24, cardY + 134);

  // Role Badge Pill
  const roleLabel = pass.role.toUpperCase();
  ctx.fillStyle = '#9FA0FF';
  ctx.beginPath();
  ctx.roundRect(cardX + cardW - 154, cardY + 110, 130, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#181b2b';
  ctx.font = '600 11px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(roleLabel, cardX + cardW - 89, cardY + 128);
  ctx.textAlign = 'left';

  // School Origin & NISN/NIP
  ctx.fillStyle = '#464651';
  ctx.font = '500 14px "Inter", sans-serif';
  ctx.fillText(pass.schoolOrigin, cardX + 24, cardY + 160);

  ctx.fillStyle = '#64748B';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.fillText(`NISN/NIP: ${pass.nisnOrNip}`, cardX + 24, cardY + 182);

  // Trial Class & Info Source Box
  ctx.fillStyle = '#F4F2FF';
  ctx.beginPath();
  ctx.roundRect(cardX + 24, cardY + 200, cardW - 48, 64, 12);
  ctx.fill();

  const trialLabel =
    pass.trialClass === 'MOBILE_LEGENDS' ? 'MOBILE LEGENDS' : pass.trialClass;
  ctx.fillStyle = '#32328A';
  ctx.font = '700 12px "Inter", sans-serif';
  ctx.fillText(`TRIAL CLASS: ${trialLabel}`, cardX + 38, cardY + 224);

  const sourceText = pass.infoSourceDetail
    ? `${pass.infoSource} (${pass.infoSourceDetail})`
    : pass.infoSource;
  ctx.fillStyle = '#181b2b';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.fillText(`Sumber Info: ${sourceText.slice(0, 38)}`, cardX + 38, cardY + 246);

  // Perforated Joint Axis
  const perfY = cardY + 292;
  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 18, perfY);
  ctx.lineTo(cardX + cardW - 18, perfY);
  ctx.stroke();
  ctx.restore();

  // Left & Right Concave Punch Notches
  ctx.fillStyle = '#FFF3E3';
  ctx.beginPath();
  ctx.arc(cardX, perfY, 16, 0, Math.PI * 2);
  ctx.arc(cardX + cardW, perfY, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cardX, perfY, 16, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cardX + cardW, perfY, 16, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.stroke();

  // Lower Section: Monospace Coupon Code + QR Code Exclusively
  ctx.fillStyle = '#64748B';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KODE KUPON & QR VERIFIKASI LOKET', width / 2, perfY + 30);

  ctx.fillStyle = '#181b2b';
  ctx.font = '800 28px "JetBrains Mono", monospace';
  ctx.fillText(pass.couponCode, width / 2, perfY + 64);

  const matrix = generateQrMatrix(pass.couponCode);
  const qrSize = 126;
  const cellSize = qrSize / matrix.length;
  const startX = (width - qrSize) / 2;
  const startY = perfY + 78;

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) {
        ctx.fillStyle = '#181b2b';
        ctx.fillRect(
          startX + c * cellSize,
          startY + r * cellSize,
          cellSize + 0.4,
          cellSize + 0.4
        );
      }
    }
  }

  ctx.fillStyle = '#64748B';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.fillText(
    'Tunjukkan QR Code ini kepada petugas di Loket Masuk',
    width / 2,
    cardY + cardH - 18
  );

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `Tiket-OpenHouse-${pass.couponCode}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
