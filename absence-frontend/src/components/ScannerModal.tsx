import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X, Clock } from 'lucide-react';
import { ScanFeedback } from '../types';

interface ScannerModalProps {
  feedback: ScanFeedback | null;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  feedback,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!feedback) return;
    setProgress(100);

    const startTime = Date.now();
    const duration = 3000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onClose();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [feedback, onClose]);

  if (!feedback) return null;

  const isSuccess = feedback.type === 'success';
  const isDuplicate = feedback.type === 'duplicate';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#181b2b]/50 backdrop-blur-[8px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-[24px] border border-[#E2E8F0] shadow-floating-pass overflow-hidden my-auto max-h-[95vh] overflow-y-auto">
        {/* Top Status Header Band */}
        <div
          className={`px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-2.5 sm:gap-3 ${
            isSuccess
              ? 'bg-[#D5E8E6] text-[#181b2b]'
              : 'bg-[#FF7171]/20 text-[#E05353] border-b border-[#FF7171]/30'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {isSuccess ? (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center text-[#506260] shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
            ) : isDuplicate ? (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FF7171] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E05353] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
            )}

            <div className="min-w-0">
              <span className="font-mono-code text-[12px] sm:text-[13px] font-bold tracking-[0.05em] uppercase">
                {feedback.codeScanned}
              </span>
              <h3
                id="scan-modal-title"
                className="font-display text-[17px] sm:text-[20px] font-bold text-[#181b2b] leading-tight"
              >
                {feedback.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#181b2b]/70 hover:text-[#181b2b] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          <p className="text-[14px] sm:text-[15px] leading-[20px] sm:leading-[22px] text-[#464651]">{feedback.message}</p>

          {feedback.pass && (
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-[15px] sm:text-[17px] font-bold text-[#181b2b] break-words">
                  {feedback.pass.fullName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-[12px] font-medium bg-[#9FA0FF]/25 text-[#181b2b] shrink-0">
                  {feedback.pass.role}
                </span>
              </div>

              <p className="text-[12px] sm:text-[13px] text-[#64748B] break-words">
                {feedback.pass.schoolOrigin}
                {feedback.pass.nisnOrNip && feedback.pass.nisnOrNip !== '-'
                  ? ` · NISN/NIP: ${feedback.pass.nisnOrNip}`
                  : ''}
              </p>

              <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-1.5 text-[11px] sm:text-[12px]">
                <span className="font-semibold text-[#32328a]">
                  Trial Class:{' '}
                  {feedback.pass.trialClass === 'MOBILE_LEGENDS'
                    ? 'MOBILE LEGENDS'
                    : feedback.pass.trialClass}
                </span>
                <span className="text-[#64748B]">
                  Info: {feedback.pass.infoSource}
                  {feedback.pass.infoSourceDetail
                    ? ` (${feedback.pass.infoSourceDetail})`
                    : ''}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-[46px] sm:h-[48px] px-4 rounded-xl border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#181b2b] font-medium text-[13px] sm:text-[14px] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#64748B]" />
              <span>Tutup Otomatis (3 dtk)</span>
            </button>
          </div>
        </div>

        {/* 3000ms Auto-Dismiss Countdown Bar */}
        <div className="h-1.5 w-full bg-[#F1F5F9] overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${
              isSuccess ? 'bg-[#9FA0FF]' : 'bg-[#FF7171]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
