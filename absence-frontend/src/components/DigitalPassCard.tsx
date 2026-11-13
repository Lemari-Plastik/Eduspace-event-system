import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Printer,
  Ticket,
  GraduationCap,
  UserCheck,
  Clock,
  School,
  Laptop,
  Palette,
  ChefHat,
  Gamepad2,
  Megaphone
} from 'lucide-react';
import { AttendeePass, TrialClassType } from '../types';
import { downloadPassAsPng } from '../utils/barcode';

interface DigitalPassCardProps {
  pass: AttendeePass;
  canvasBg?: 'cream' | 'slate' | 'modal';
  compact?: boolean;
}

export const DigitalPassCard: React.FC<DigitalPassCardProps> = ({
  pass,
  canvasBg = 'cream',
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const notchBgClass =
    canvasBg === 'cream'
      ? 'bg-[#FFF3E3]'
      : canvasBg === 'slate'
      ? 'bg-[#F8FAFC]'
      : 'bg-[#181b2b]/60';

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(pass.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    downloadPassAsPng(pass);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTrialClassIcon = (tc: TrialClassType) => {
    switch (tc) {
      case 'IT':
        return <Laptop className="w-4 h-4 text-[#32328a]" />;
      case 'DKV':
        return <Palette className="w-4 h-4 text-[#5354ad]" />;
      case 'KULINER':
        return <ChefHat className="w-4 h-4 text-[#655d51]" />;
      case 'MOBILE_LEGENDS':
        return <Gamepad2 className="w-4 h-4 text-[#506260]" />;
    }
  };

  const trialClassLabel =
    pass.trialClass === 'MOBILE_LEGENDS' ? 'MOBILE LEGENDS' : pass.trialClass;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Composite Perforated Ticket Card */}
      <div className="relative bg-white rounded-[20px] border border-[#E2E8F0] shadow-resting-card overflow-hidden transition-all">
        {/* Mint Header Band for Confirmed Digital Coupon */}
        <div
          className={`px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-3 border-b border-[#E2E8F0] ${
            pass.status === 'REDEEMED' ? 'bg-[#D5E8E6]' : 'bg-[#D5E8E6]/75'
          }`}
        >
          <div className="min-w-0">
            <p className="text-[11px] sm:text-[12px] font-semibold tracking-wider uppercase text-[#506260] truncate">
              SMK Metland Cibitung
            </p>
            <h3 className="font-display text-[15px] sm:text-[17px] font-bold text-[#181b2b] leading-snug truncate">
              Tiket Pas &amp; Kupon Kehadiran Resmi
            </h3>
          </div>

          {pass.status === 'REDEEMED' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/90 text-[#181b2b] text-[11px] sm:text-[13px] font-medium shrink-0 shadow-2xs">
              <Check className="w-3.5 h-3.5 text-[#506260] stroke-[2.5]" />
              Hadir · {pass.checkedInAt}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/95 text-[#181b2b] text-[11px] sm:text-[13px] font-medium shrink-0 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#5354ad]" />
              Siap Dipindai
            </span>
          )}
        </div>

        {/* Upper Section: Attendee Identity, School, Trial Class & Info Source */}
        <div className={compact ? 'p-4 sm:p-5 space-y-3.5 sm:space-y-4' : 'p-4 sm:p-6 space-y-4 sm:space-y-5'}>
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-[12px] sm:text-[13px] text-[#64748B] font-normal">Nama Peserta Terdaftar</p>
              <h4 className="font-display text-[20px] sm:text-[24px] font-bold text-[#181b2b] leading-tight mt-0.5 break-words">
                {pass.fullName}
              </h4>
              {pass.nisnOrNip && pass.nisnOrNip !== '-' && (
                <p className="font-code-sm text-[12px] sm:text-[13px] text-[#464651] mt-1 font-medium">
                  {pass.role === 'Siswa' ? 'NISN' : 'NIP'}: {pass.nisnOrNip}
                </p>
              )}
            </div>

            <div className="shrink-0">
              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium ${
                  pass.role === 'Siswa'
                    ? 'bg-[#9FA0FF]/25 text-[#181b2b] border border-[#9FA0FF]'
                    : 'bg-[#D5E8E6] text-[#181b2b] border border-[#506260]/20'
                }`}
              >
                {pass.role === 'Siswa' ? (
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#32328a]" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#506260]" />
                )}
                {pass.role}
              </span>
            </div>
          </div>

          {/* School Origin Box */}
          <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#e1dfff] text-[#32328a] flex items-center justify-center shrink-0">
                <School className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-[12px] text-[#64748B] font-medium">Asal Sekolah / Institusi</p>
                <p className="font-display text-[14px] sm:text-[16px] font-semibold text-[#181b2b] break-words">
                  {pass.schoolOrigin}
                </p>
              </div>
            </div>
            <span className="font-code-sm text-[11px] sm:text-[12px] text-[#64748B] shrink-0">
              {pass.registeredAt}
            </span>
          </div>

          {/* Trial Class & Info Source Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {pass.role === 'Guru Pendamping' ? (
              <div className="rounded-xl bg-[#D5E8E6]/40 border border-[#506260]/30 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D5E8E6] text-[#506260] flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#506260]">
                    Peran Peserta
                  </p>
                  <p className="font-display text-[13px] sm:text-[14px] font-bold text-[#181b2b] break-words">
                    Guru Pendamping
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-[#f4f2ff] border border-[#9FA0FF]/50 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#9FA0FF]/30 flex items-center justify-center shrink-0">
                  {renderTrialClassIcon(pass.trialClass)}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#32328a]">
                    Trial Class Pilihan
                  </p>
                  <p className="font-display text-[13px] sm:text-[14px] font-bold text-[#181b2b] break-words">
                    {trialClassLabel}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ececff] flex items-center justify-center shrink-0 text-[#5354ad]">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
                  Sumber Informasi
                </p>
                <p className="text-[12px] sm:text-[13px] font-semibold text-[#181b2b] break-words">
                  {pass.infoSource}
                  {pass.infoSourceDetail ? ` · ${pass.infoSourceDetail}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Dividing Axis with Dual Inward Circular Punch-Notches */}
        <div className="relative flex items-center justify-between my-1">
          <div
            aria-hidden="true"
            className={`-ml-4 w-8 h-8 rounded-full border border-[#E2E8F0] shrink-0 ${notchBgClass}`}
          />
          <div className="w-full border-t-2 border-dashed border-[#E2E8F0] mx-2" />
          <div
            aria-hidden="true"
            className={`-mr-4 w-8 h-8 rounded-full border border-[#E2E8F0] shrink-0 ${notchBgClass}`}
          />
        </div>

        {/* Lower Section: Prominent Unique Coupon Code (No Barcode / QR) */}
        <div className={compact ? 'p-4 sm:p-5 pt-2 sm:pt-3 text-center' : 'p-4 sm:p-6 pt-3 sm:pt-4 text-center'}>
          <div className="flex items-center justify-center gap-1.5 mb-2.5 text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">
            <Ticket className="w-3.5 h-3.5 text-[#5354ad]" />
            <span>KODE UNIK KUPON KEHADIRAN RESMI</span>
          </div>

          {/* Premium Voucher Code Display Box */}
          <div className="my-2 bg-[#181b2b] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#2d314d] relative overflow-hidden">
            {/* Subtle decorative glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#9FA0FF]/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-[#5354ad]/20 blur-2xl pointer-events-none" />

            <span className="inline-block px-3 py-1 rounded-full bg-[#9FA0FF]/20 text-[#9FA0FF] border border-[#9FA0FF]/30 text-[11px] font-semibold tracking-wider uppercase mb-2">
              KUPON UNIK ANDA
            </span>

            <div className="flex items-center justify-center gap-2 sm:gap-3 my-1">
              <span className="font-mono-code text-[28px] sm:text-[36px] leading-tight font-extrabold tracking-[0.1em] text-[#9FA0FF] select-all drop-shadow-sm">
                {pass.couponCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Salin kode unik"
                className="no-print inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer border border-white/10"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#D5E8E6]" />
                ) : (
                  <Copy className="w-4 h-4 text-white/80" />
                )}
              </button>
            </div>

            {copied && (
              <p className="text-[11px] sm:text-[12px] text-[#D5E8E6] font-medium mt-1">
                ✓ Kode berhasil disalin ke papan klip!
              </p>
            )}

            <p className="text-[12px] sm:text-[13px] text-[#A5ACBA] mt-2 max-w-sm mx-auto leading-relaxed">
              Tunjukkan atau sebutkan kode unik di atas kepada petugas loket untuk verifikasi kehadiran.
            </p>
          </div>

          <p className="text-[11px] sm:text-[12px] text-[#64748B] mt-3 max-w-sm mx-auto">
            Simpan atau unduh kartu tiket ini sebagai bukti pendaftaran resmi Anda di aplikasi SMK Metland School.
          </p>

          {/* Action Buttons on Ticket Footer */}
          <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 no-print">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="h-[48px] sm:h-[52px] px-4 rounded-xl bg-[#9FA0FF] hover:bg-[#7B7CE6] active:scale-[0.98] text-[#181b2b] font-semibold text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2 transition-all shadow-primary-glow cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Kartu Tiket (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="h-[48px] sm:h-[52px] px-4 rounded-xl bg-transparent hover:bg-[#9FA0FF]/15 active:scale-[0.98] text-[#181b2b] border border-[#E2E8F0] font-medium text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
