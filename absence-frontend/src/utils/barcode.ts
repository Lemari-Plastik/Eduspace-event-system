import { AttendeePass } from '../types';

// =========================================================================
// 1. STANDARD CODE 128 (SUBSET B) GENERATOR & SCANLINE DECODER
// =========================================================================

const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112', // 100-106
];

const CODE128_PATTERN_MAP = new Map<string, number>();
CODE128_PATTERNS.forEach((p, idx) => CODE128_PATTERN_MAP.set(p, idx));

/**
 * Encodes text into standard Code-128 Subset B bars.
 * Returns array of boolean where true = black bar and false = white space.
 */
export function generateCode128Bars(text: string): boolean[] {
  const codes: number[] = [104]; // Start B
  let checkSum = 104;

  for (let i = 0; i < text.length; i++) {
    const val = text.charCodeAt(i) - 32;
    codes.push(val);
    checkSum += val * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(106); // Stop

  const modules: boolean[] = [];
  // Quiet zone: 10 false modules
  for (let i = 0; i < 10; i++) modules.push(false);

  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || '212222';
    let isBar = true;
    for (const char of pattern) {
      const width = parseInt(char, 10);
      for (let w = 0; w < width; w++) {
        modules.push(isBar);
      }
      isBar = !isBar;
    }
  }

  // Quiet zone: 10 false modules
  for (let i = 0; i < 10; i++) modules.push(false);

  return modules;
}

/**
 * Decodes Code-128 barcode from a 1D boolean array (scanline).
 */
export function decodeCode128Modules(modules: boolean[]): string | null {
  if (modules.length < 50) return null;

  const runs: { isBar: boolean; len: number }[] = [];
  let currentBar = modules[0];
  let count = 0;
  for (const m of modules) {
    if (m === currentBar) {
      count++;
    } else {
      runs.push({ isBar: currentBar, len: count });
      currentBar = m;
      count = 1;
    }
  }
  runs.push({ isBar: currentBar, len: count });

  for (let i = 0; i < runs.length - 6; i++) {
    if (!runs[i].isBar) continue;
    const totalLen =
      runs[i].len +
      runs[i + 1].len +
      runs[i + 2].len +
      runs[i + 3].len +
      runs[i + 4].len +
      runs[i + 5].len;
    const moduleUnit = totalLen / 11;
    if (moduleUnit < 0.5) continue;

    const pattern = [
      Math.round(runs[i].len / moduleUnit),
      Math.round(runs[i + 1].len / moduleUnit),
      Math.round(runs[i + 2].len / moduleUnit),
      Math.round(runs[i + 3].len / moduleUnit),
      Math.round(runs[i + 4].len / moduleUnit),
      Math.round(runs[i + 5].len / moduleUnit),
    ].join('');

    const symbol = CODE128_PATTERN_MAP.get(pattern);
    if (symbol === 104) {
      let runIdx = i + 6;
      const dataSymbols: number[] = [];
      let foundStop = false;

      while (runIdx <= runs.length - 6) {
        if (runIdx <= runs.length - 7) {
          const stopLen = runs
            .slice(runIdx, runIdx + 7)
            .reduce((acc, r) => acc + r.len, 0);
          const stopUnit = stopLen / 13;
          const stopPattern = runs
            .slice(runIdx, runIdx + 7)
            .map((r) => Math.round(r.len / stopUnit))
            .join('');
          if (stopPattern === '2331112') {
            foundStop = true;
            break;
          }
        }

        const symLen = runs
          .slice(runIdx, runIdx + 6)
          .reduce((acc, r) => acc + r.len, 0);
        const symUnit = symLen / 11;
        const symPattern = runs
          .slice(runIdx, runIdx + 6)
          .map((r) => Math.round(r.len / symUnit))
          .join('');
        const codeVal = CODE128_PATTERN_MAP.get(symPattern);
        if (codeVal === undefined) break;
        dataSymbols.push(codeVal);
        runIdx += 6;
      }

      if (foundStop && dataSymbols.length >= 2) {
        const checksum = dataSymbols.pop()!;
        let calcChecksum = 104;
        for (let d = 0; d < dataSymbols.length; d++) {
          calcChecksum += dataSymbols[d] * (d + 1);
        }
        if (calcChecksum % 103 === checksum) {
          return dataSymbols.map((c) => String.fromCharCode(c + 32)).join('');
        }
      }
    }
  }

  return null;
}

// =========================================================================
// 2. STANDARD QR CODE GENERATOR (ISO/IEC 18004 SPECIFICATION)
// =========================================================================

const EXP: number[] = new Array(512);
const LOG: number[] = new Array(256);
let x = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = x;
  EXP[i + 255] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[(LOG[a] + LOG[b]) % 255];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsComputeEcc(data: number[], eccCount: number): number[] {
  const gen = rsGeneratorPoly(eccCount);
  const result = new Array(eccCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.shift();
    result.push(0);
    if (factor !== 0) {
      for (let j = 0; j < eccCount; j++) {
        result[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return result;
}

interface QrVersionSpec {
  version: number;
  size: number;
  dataCodewords: number;
  eccCodewords: number;
  alignments: number[];
}

const QR_SPECS: QrVersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 16, eccCodewords: 10, alignments: [] },
  { version: 2, size: 25, dataCodewords: 28, eccCodewords: 16, alignments: [6, 18] },
  { version: 3, size: 29, dataCodewords: 44, eccCodewords: 26, alignments: [6, 22] },
];

/**
 * Generates an ISO/IEC 18004 compliant standard QR-code matrix.
 * Supports standard Error Correction Level M and dynamic version selection.
 */
export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  let spec = QR_SPECS[0];
  for (const s of QR_SPECS) {
    if (bytes.length + 2 <= s.dataCodewords) {
      spec = s;
      break;
    }
  }

  // 1. Bit buffer with 8-bit byte mode (0100)
  let bits = '0100' + bytes.length.toString(2).padStart(8, '0');
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, '0');
  }

  const maxDataBits = spec.dataCodewords * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  bits += '0'.repeat(termLen);

  if (bits.length % 8 !== 0) {
    bits += '0'.repeat(8 - (bits.length % 8));
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxDataBits) {
    bits += padBytes[padIdx % 2].toString(2).padStart(8, '0');
    padIdx++;
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    dataCodewords.push(parseInt(bits.slice(i, i + 8), 2));
  }

  // 2. RS ECC
  const eccCodewords = rsComputeEcc(dataCodewords, spec.eccCodewords);
  const allCodewords = [...dataCodewords, ...eccCodewords];

  // 3. Matrix & function masks
  const size = spec.size;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunc = (r: number, c: number, val: boolean) => {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  };

  // Place Finder Pattern & 1-module white separator
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setFunc(nr, nc, isBorder || isCenter);
        } else {
          setFunc(nr, nc, false);
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setFunc(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setFunc(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  if (spec.alignments.length > 0) {
    for (const ar of spec.alignments) {
      for (const ac of spec.alignments) {
        if (isFunction[ar][ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
            const isDot = r === 0 && c === 0;
            setFunc(ar + r, ac + c, isBorder || isDot);
          }
        }
      }
    }
  }

  // Dark module
  setFunc(4 * spec.version + 9, 8, true);

  // Reserve format info area
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
    if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
  }

  // 4. Place Codewords in Zigzag pattern
  const codewordBits: number[] = [];
  for (const cw of allCodewords) {
    for (let b = 7; b >= 0; b--) {
      codewordBits.push((cw >> b) & 1);
    }
  }

  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const colList = [right, right - 1];
    const rowList = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rowList) {
      for (const c of colList) {
        if (!isFunction[r][c]) {
          let bit = bitIdx < codewordBits.length ? codewordBits[bitIdx++] : 0;
          // Mask 0: (row + col) % 2 === 0
          if ((r + c) % 2 === 0) {
            bit ^= 1;
          }
          matrix[r][c] = bit === 1;
        }
      }
    }
    upwards = !upwards;
  }

  // 5. Format info: ECC M (00) + Mask 0 (000) = 00000 -> XOR with 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  const formatPosTL: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatPosTL[i];
    matrix[r][c] = formatBits[i] === 1;
  }

  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i] === 1;
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatBits[7 + i] === 1;
  }

  return matrix;
}

// =========================================================================
// 3. AUDIO FEEDBACK HELPER (WEB AUDIO API)
// =========================================================================

export function playScanSound(type: 'success' | 'duplicate' | 'error' = 'success'): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Ignore audio context autoplay restriction errors
  }
}

// =========================================================================
// 4. SCANNER DECODER ENGINE (BROWSER BARCODEDETECTOR + SCANLINE FALLBACK)
// =========================================================================

let cachedDetector: any = null;

export function getNativeBarcodeDetector(): any {
  if (typeof window === 'undefined') return null;
  if (cachedDetector) return cachedDetector;

  const DetectorClass = (window as any).BarcodeDetector;
  if (DetectorClass) {
    try {
      cachedDetector = new DetectorClass({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a'],
      });
      return cachedDetector;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Scans a canvas or image source for barcodes and QR codes.
 * Uses native BarcodeDetector if available, falling back to 1D scanline decoding.
 */
export async function decodeBarcodeFromCanvas(
  source: HTMLCanvasElement | HTMLVideoElement | ImageBitmap
): Promise<string | null> {
  const detector = getNativeBarcodeDetector();
  if (detector) {
    try {
      const results = await detector.detect(source);
      if (results && results.length > 0) {
        for (const item of results) {
          if (item.rawValue) {
            return item.rawValue.trim();
          }
        }
      }
    } catch {
      // Fallback to pixel scanline below if native detector throws
    }
  }

  // Scanline Fallback for Code 128
  try {
    let canvas: HTMLCanvasElement;
    if (source instanceof HTMLCanvasElement) {
      canvas = source;
    } else {
      canvas = document.createElement('canvas');
      const w = ('videoWidth' in source ? (source as HTMLVideoElement).videoWidth : (source as any).width) || 480;
      const h = ('videoHeight' in source ? (source as HTMLVideoElement).videoHeight : (source as any).height) || 360;
      canvas.width = Math.min(w, 640);
      canvas.height = Math.min(h, 480);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(source as any, 0, 0, canvas.width, canvas.height);
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const width = canvas.width;
    const height = canvas.height;
    if (width < 20 || height < 20) return null;

    // Scan horizontal lines across vertical positions: 40%, 45%, 50%, 55%, 60%
    const sampleYPositions = [
      Math.floor(height * 0.5),
      Math.floor(height * 0.4),
      Math.floor(height * 0.6),
      Math.floor(height * 0.45),
      Math.floor(height * 0.55),
    ];

    for (const y of sampleYPositions) {
      const imgData = ctx.getImageData(0, y, width, 1).data;
      let sum = 0;
      for (let x = 0; x < width; x++) {
        const idx = x * 4;
        sum += imgData[idx] * 0.299 + imgData[idx + 1] * 0.587 + imgData[idx + 2] * 0.114;
      }
      const avgThresh = sum / width;

      const modules: boolean[] = [];
      for (let x = 0; x < width; x++) {
        const idx = x * 4;
        const lum = imgData[idx] * 0.299 + imgData[idx + 1] * 0.587 + imgData[idx + 2] * 0.114;
        modules.push(lum < avgThresh);
      }

      const decoded = decodeCode128Modules(modules);
      if (decoded && decoded.trim().length > 0) {
        return decoded.trim();
      }
    }
  } catch {
    // Ignore decoding errors
  }

  return null;
}

// =========================================================================
// 5. DOWNLOAD PASS TICKET AS HIGH-DPI PNG
// =========================================================================

/**
 * Renders the perforated digital pass credential with both CODE 128 Barcode
 * and QR Code onto a high-DPI HTML5 Canvas and triggers a PNG download.
 */
export function downloadPassAsPng(pass: AttendeePass): void {
  const scale = 2;
  const width = 460;
  const height = 690;

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
  ctx.fillText('TIKET PAS RESMI & KUPON KEHADIRAN', cardX + 24, cardY + 53);

  // Attendee Name & Role
  ctx.fillStyle = '#64748B';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.fillText('NAMA PESERTA & PERAN', cardX + 24, cardY + 108);

  ctx.fillStyle = '#181b2b';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(pass.fullName.slice(0, 26), cardX + 24, cardY + 134);

  // Role Badge Pill
  const roleLabel = pass.role.toUpperCase();
  ctx.fillStyle = pass.role === 'Siswa' ? '#9FA0FF' : '#D5E8E6';
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
  ctx.fillText(
    `${pass.role === 'Siswa' ? 'NISN' : 'NIP'}: ${pass.nisnOrNip}`,
    cardX + 24,
    cardY + 182
  );

  // Trial Class / Role Status Box
  ctx.fillStyle = '#F4F2FF';
  ctx.beginPath();
  ctx.roundRect(cardX + 24, cardY + 200, cardW - 48, 64, 12);
  ctx.fill();

  if (pass.role === 'Guru Pendamping') {
    ctx.fillStyle = '#32328A';
    ctx.font = '700 12px "Inter", sans-serif';
    ctx.fillText('PERAN: GURU PENDAMPING (KHUSUS PENDAMPINGAN)', cardX + 38, cardY + 224);
  } else {
    const trialLabel =
      pass.trialClass === 'MOBILE_LEGENDS' ? 'MOBILE LEGENDS' : pass.trialClass;
    ctx.fillStyle = '#32328A';
    ctx.font = '700 12px "Inter", sans-serif';
    ctx.fillText(`TRIAL CLASS: ${trialLabel}`, cardX + 38, cardY + 224);
  }

  const sourceText = pass.infoSourceDetail
    ? `${pass.infoSource} (${pass.infoSourceDetail})`
    : pass.infoSource;
  ctx.fillStyle = '#181b2b';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.fillText(`Sumber Info: ${sourceText.slice(0, 38)}`, cardX + 38, cardY + 246);

  // Perforated Joint Axis
  const perfY = cardY + 284;
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

  // Lower Section: Monospace Coupon Code + Code-128 Barcode + Standard QR Code
  ctx.fillStyle = '#64748B';
  ctx.font = '500 12px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KODE KUPON & BARCODE LOKET', width / 2, perfY + 26);

  ctx.fillStyle = '#181b2b';
  ctx.font = '800 24px "JetBrains Mono", monospace';
  ctx.fillText(pass.couponCode, width / 2, perfY + 54);

  // Render CODE-128 Barcode onto Canvas
  const barcodeBars = generateCode128Bars(pass.couponCode);
  const barHeight = 36;
  const barModuleWidth = (cardW - 80) / barcodeBars.length;
  const barStartX = cardX + 40;
  const barStartY = perfY + 68;

  ctx.fillStyle = '#181b2b';
  for (let i = 0; i < barcodeBars.length; i++) {
    if (barcodeBars[i]) {
      ctx.fillRect(barStartX + i * barModuleWidth, barStartY, barModuleWidth + 0.2, barHeight);
    }
  }

  // Render Standard Scannable QR Code onto Canvas
  const matrix = generateQrMatrix(pass.couponCode);
  const qrSize = 120;
  const cellSize = qrSize / matrix.length;
  const qrStartX = (width - qrSize) / 2;
  const qrStartY = barStartY + barHeight + 16;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrStartX - 6, qrStartY - 6, qrSize + 12, qrSize + 12);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(qrStartX - 6, qrStartY - 6, qrSize + 12, qrSize + 12);

  ctx.fillStyle = '#181b2b';
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(
          qrStartX + c * cellSize,
          qrStartY + r * cellSize,
          cellSize + 0.3,
          cellSize + 0.3
        );
      }
    }
  }

  ctx.fillStyle = '#64748B';
  ctx.font = '500 11px "Inter", sans-serif';
  ctx.fillText(
    'Tunjukkan QR Code / Barcode ini kepada petugas loket',
    width / 2,
    cardY + cardH - 16
  );

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `Tiket-OpenHouse-${pass.couponCode}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
