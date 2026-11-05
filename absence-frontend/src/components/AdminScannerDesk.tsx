import React, { useEffect, useRef, useState } from 'react';
import {
  AttendeePass,
  AttendeeRole,
  EDUPASS_LOGO_URL,
  INFO_SOURCE_OPTIONS,
  InfoSourceType,
  PassStatus,
  ScanFeedback,
  ScanLogEntry,
  School,
  TRIAL_CLASS_OPTIONS,
  TrialClassType
} from '../types';

export type AdminPageId = 'admin-scanner' | 'activity-history' | 'admin-participants';

interface AdminScannerDeskProps {
  attendees: AttendeePass[];
  scanLogs: ScanLogEntry[];
  activePage: AdminPageId;
  onChangePage: (page: AdminPageId) => void;
  onProcessScanCode: (code: string, method: 'auto' | 'manual') => Promise<ScanFeedback> | ScanFeedback;
  onQuickRedeem: (passId: string) => Promise<void> | void;
  onDeleteAttendee: (passId: string) => Promise<void> | void;
  onLogout: () => void;
  schools?: School[];
  onAdminRegister?: (newPassData: {
    fullName: string;
    nisnOrNip: string;
    schoolId: number;
    schoolOrigin: string;
    role: AttendeeRole;
    trialClass: TrialClassType;
    infoSource: InfoSourceType;
    infoSourceDetail?: string;
  }) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  isRefreshing?: boolean;
}

export const AdminScannerDesk: React.FC<AdminScannerDeskProps> = ({
  attendees,
  scanLogs,
  activePage,
  onChangePage,
  onProcessScanCode,
  onQuickRedeem,
  onDeleteAttendee,
  onLogout,
  schools = [],
  onAdminRegister,
  onRefreshData,
  isRefreshing = false,
}) => {
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Scanner page states
  const [couponInput, setCouponInput] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [camFlipped, setCamFlipped] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Participants page states
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantStatusFilter, setParticipantStatusFilter] = useState<
    'ALL' | PassStatus
  >('ALL');
  const [participantClassFilter, setParticipantClassFilter] = useState<
    'ALL' | TrialClassType
  >('ALL');
  const [participantViewMode, setParticipantViewMode] = useState<'auto' | 'cards' | 'table'>('auto');
  const [logViewMode, setLogViewMode] = useState<'auto' | 'cards' | 'table'>('auto');
  const [pendingDeletePass, setPendingDeletePass] = useState<AttendeePass | null>(
    null
  );
  const [participantPage, setParticipantPage] = useState(1);

  // Walk-in registration modal states
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInRole, setWalkInRole] = useState<AttendeeRole>('Siswa');
  const [walkInFullName, setWalkInFullName] = useState('');
  const [walkInNisn, setWalkInNisn] = useState('');
  const [walkInSchoolId, setWalkInSchoolId] = useState<number | ''>('');
  const [walkInTrialClass, setWalkInTrialClass] = useState<TrialClassType>('IT');
  const [walkInInfoSource, setWalkInInfoSource] = useState<InfoSourceType>('Website');
  const [walkInInfoSourceDetail, setWalkInInfoSourceDetail] = useState('');
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [isWalkInSubmitting, setIsWalkInSubmitting] = useState(false);

  // Activity Log page states
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<
    'all' | 'success' | 'rejected' | 'manual'
  >('all');
  const [isExportingLog, setIsExportingLog] = useState(false);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const toggleLiveCamera = async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: camFlipped ? 'user' : 'environment' },
          audio: false,
        });
        streamRef.current = stream;
        setCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 50);
      } else {
        showToast('Kamera perangkat tidak tersedia di peramban ini.');
      }
    } catch {
      showToast('Izin kamera belum diberikan. Gunakan input manual kupon.');
    }
  };

  // KPI calculations
  const totalCount = attendees.length;
  const redeemedCount = attendees.filter((a) => a.status === 'REDEEMED').length;
  const unredeemedCount = attendees.filter((a) => a.status === 'UNREDEEMED').length;
  const rejectedLogsCount = scanLogs.filter((l) => l.status === 'rejected').length;
  const hadPercentage =
    totalCount > 0 ? ((redeemedCount / totalCount) * 100).toFixed(1) : '0.0';

  // Filtered participants
  const filteredParticipants = attendees.filter((p) => {
    const matchesStatus =
      participantStatusFilter === 'ALL' || p.status === participantStatusFilter;
    const matchesClass =
      participantClassFilter === 'ALL' || p.trialClass === participantClassFilter;
    const q = participantSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.couponCode.toLowerCase().includes(q) ||
      p.nisnOrNip.toLowerCase().includes(q) ||
      p.schoolOrigin.toLowerCase().includes(q) ||
      p.infoSource.toLowerCase().includes(q) ||
      (p.infoSourceDetail && p.infoSourceDetail.toLowerCase().includes(q));
    return matchesStatus && matchesClass && matchesSearch;
  });

  // Filtered activity logs
  const filteredLogs = scanLogs.filter((log) => {
    const matchesTab =
      logStatusFilter === 'all' || log.status === logStatusFilter;
    const q = logSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      log.fullName.toLowerCase().includes(q) ||
      log.couponCode.toLowerCase().includes(q) ||
      log.schoolOrigin.toLowerCase().includes(q) ||
      log.deskName.toLowerCase().includes(q) ||
      log.verifierNote.toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    showToast(`Kupon ${code} disalin ke clipboard!`);
  };

  const renderTrialClassBadge = (tc: TrialClassType) => {
    switch (tc) {
      case 'IT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-container text-label-badge font-semibold">
            <span className="material-symbols-outlined text-[14px]">laptop_mac</span>
            IT
          </span>
        );
      case 'DKV':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-primary text-label-badge font-semibold">
            <span className="material-symbols-outlined text-[14px]">palette</span>
            DKV
          </span>
        );
      case 'KULINER':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-badge font-semibold">
            <span className="material-symbols-outlined text-[14px]">
              restaurant_menu
            </span>
            KULINER
          </span>
        );
      case 'MOBILE_LEGENDS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-badge font-semibold">
            <span className="material-symbols-outlined text-[14px]">
              sports_esports
            </span>
            MOBILE LEGENDS
          </span>
        );
    }
  };

  const handleExportParticipantsCsv = () => {
    const headers = [
      'No',
      'Kode Kupon',
      'Nama Peserta',
      'Peran',
      'NISN / NIP',
      'Asal Sekolah',
      'Trial Class',
      'Sumber Informasi',
      'Detail Sumber',
      'Status Kehadiran',
      'Waktu Hadir',
    ];
    const rows = attendees.map((p, idx) =>
      [
        idx + 1,
        p.couponCode,
        `"${p.fullName.replace(/"/g, '""')}"`,
        p.role,
        p.nisnOrNip,
        `"${p.schoolOrigin.replace(/"/g, '""')}"`,
        p.trialClass,
        p.infoSource,
        `"${(p.infoSourceDetail || '-').replace(/"/g, '""')}"`,
        p.status === 'REDEEMED' ? 'Sudah Hadir' : 'Belum Hadir',
        p.checkedInAt || '-',
      ].join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data_peserta_openhouse_2026.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('File data_peserta_openhouse_2026.csv berhasil diunduh!');
  };

  const handleExportLogsCsv = () => {
    setIsExportingLog(true);
    setTimeout(() => {
      const headers = [
        'Timestamp',
        'Kode Kupon',
        'Nama Peserta',
        'Asal Sekolah',
        'Peran',
        'Trial Class',
        'Sumber Informasi',
        'Metode Pemindaian',
        'Status & Respons',
      ];
      const rows = scanLogs.map((l) =>
        [
          l.timestamp,
          l.couponCode,
          `"${l.fullName.replace(/"/g, '""')}"`,
          `"${l.schoolOrigin.replace(/"/g, '""')}"`,
          l.role,
          l.trialClass,
          `"${l.infoSource}${l.infoSourceDetail ? ' - ' + l.infoSourceDetail : ''}"`,
          l.scanMethod === 'auto' ? 'Kamera Scanner Auto' : 'Input Manual Loket',
          `"${l.statusText}"`,
        ].join(',')
      );

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'riwayat_aktivitas_scan_2026.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsExportingLog(false);
      showToast('File riwayat_aktivitas_scan_2026.csv berhasil diunduh!');
    }, 600);
  };

  const handleVerifyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;
    try {
      const fb = await onProcessScanCode(clean, 'manual');
      if (fb.type === 'success') {
        showToast(`Berhasil: Kupon ${clean} valid dan status kehadiran tersimpan!`);
        setCouponInput('');
      } else {
        showToast(fb.title + ' — ' + clean);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memverifikasi kupon.');
    }
  };

  return (
    <div className="bg-canvas-admin font-sans text-body-regular text-on-surface min-h-screen">
      {/* Left Fixed Sidebar on Large Screens (lg+) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-40 hidden lg:flex flex-col pt-space-lg pb-space-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="px-space-md mb-space-lg flex items-center gap-space-xs">
          <img
            alt="OpenHouse Pass Logo"
            referrerPolicy="no-referrer"
            className="h-7 w-auto object-contain"
            src={EDUPASS_LOGO_URL}
          />
          <div className="flex flex-col">
            <span className="font-display text-headline-md text-primary leading-tight">
              EduPass Admin
            </span>
            <span className="text-label-badge text-text-muted">
              Desk &amp; Scan Console
            </span>
          </div>
        </div>

        <nav className="flex-1 px-space-sm flex flex-col gap-space-xs">
          <button
            type="button"
            onClick={() => onChangePage('admin-scanner')}
            className={`w-full flex items-center px-space-md py-space-sm rounded-lg transition-all cursor-pointer text-left ${
              activePage === 'admin-scanner'
                ? 'bg-primary-container text-on-primary-container font-medium'
                : 'text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined mr-space-sm text-[20px]">
              qr_code_scanner
            </span>
            Barcode Scanner
          </button>

          <button
            type="button"
            onClick={() => onChangePage('activity-history')}
            className={`w-full flex items-center px-space-md py-space-sm rounded-lg transition-all cursor-pointer text-left ${
              activePage === 'activity-history'
                ? 'bg-primary-container text-on-primary-container font-medium'
                : 'text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined mr-space-sm text-[20px]">
              history
            </span>
            Riwayat Aktivitas
          </button>

          <button
            type="button"
            onClick={() => onChangePage('admin-participants')}
            className={`w-full flex items-center px-space-md py-space-sm rounded-lg transition-all cursor-pointer text-left ${
              activePage === 'admin-participants'
                ? 'bg-primary-container text-on-primary-container font-medium'
                : 'text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined mr-space-sm text-[20px]">
              group
            </span>
            Daftar Peserta
          </button>
        </nav>

        {/* Logout Button on Desktop Sidebar */}
        <div className="px-space-sm">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center px-space-md py-space-sm rounded-lg text-coral-dark hover:bg-error-container/50 font-medium text-body-medium transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined mr-space-sm text-[20px]">
              logout
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper with Left Sidebar Offset on lg+ */}
      <div className="lg:pl-64">
        {/* Desktop Fixed Header (lg+) */}
        <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="font-display text-[18px] font-bold text-on-surface">
              Admissions Desk Control
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-body-sm text-[#464651] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Petugas: Loket 01
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-2xs">
              <span className="material-symbols-outlined text-[18px]">
                person
              </span>
            </div>
          </div>
        </header>

        {/* Mobile/Tablet Fixed Header (< lg) */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface/95 backdrop-blur-xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] z-30 flex items-center justify-between px-3 sm:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <img
              alt="OpenHouse Pass Logo"
              referrerPolicy="no-referrer"
              className="h-6 w-auto object-contain shrink-0"
              src={EDUPASS_LOGO_URL}
            />
            <span className="font-display text-[15px] font-bold text-primary truncate">
              EduPass Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[16px]">
                person
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1 rounded-lg text-[12px] font-semibold text-coral-dark hover:bg-error-container/40 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile/Tablet Navigation Sub-Bar (< lg) */}
        <div className="lg:hidden fixed top-14 left-0 right-0 h-12 bg-surface/95 backdrop-blur-md border-b border-border-subtle z-20 flex items-center px-2 sm:px-4">
          <nav className="grid grid-cols-3 gap-1.5 w-full">
            <button
              type="button"
              onClick={() => onChangePage('admin-scanner')}
              className={`h-9 px-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activePage === 'admin-scanner'
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                qr_code_scanner
              </span>
              <span>Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePage('activity-history')}
              className={`h-9 px-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activePage === 'activity-history'
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                history
              </span>
              <span>Riwayat</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePage('admin-participants')}
              className={`h-9 px-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activePage === 'admin-participants'
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                group
              </span>
              <span>Peserta</span>
            </button>
          </nav>
        </div>

        {/* Main Workspace Container */}
        <main className="relative pt-28 lg:pt-22 bg-canvas-admin min-h-screen px-3 sm:px-6 lg:px-8 pb-12 sm:pb-16 max-w-[1600px] mx-auto w-full">
          {/* Toast Notification */}
          <div
            className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none flex items-center gap-space-sm bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-xl shadow-xl ${
              toastMessage
                ? 'translate-y-0 opacity-100'
                : 'translate-y-24 opacity-0'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-primary-container">
              check_circle
            </span>
            <span className="font-medium text-body-medium">{toastMessage}</span>
          </div>

          {/* Delete Confirmation Modal */}
          {pendingDeletePass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
              <div className="bg-surface rounded-2xl max-w-md w-full p-space-lg shadow-2xl flex flex-col gap-space-md">
                <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">
                    warning
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-headline-md text-on-surface mb-1">
                    Hapus Data Peserta?
                  </h3>
                  <p className="text-body-regular text-text-muted">
                    Anda yakin ingin menghapus data &ldquo;
                    {pendingDeletePass.fullName} ({pendingDeletePass.couponCode})
                    &rdquo;? Peserta yang dihapus tidak akan dapat menggunakan kupon mereka lagi untuk verifikasi kehadiran.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-space-sm pt-2">
                  <button
                    type="button"
                    onClick={() => setPendingDeletePass(null)}
                    className="h-12 px-space-md rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-body-medium transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!pendingDeletePass) return;
                      try {
                        await onDeleteAttendee(pendingDeletePass.id);
                        showToast(`Peserta ${pendingDeletePass.fullName} berhasil dihapus.`);
                      } catch (err: any) {
                        showToast(err.message || 'Gagal menghapus data peserta.');
                      } finally {
                        setPendingDeletePass(null);
                      }
                    }}
                    className="h-12 px-space-md rounded-xl bg-coral-alert hover:bg-coral-dark text-on-primary font-medium text-body-medium shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete_forever
                    </span>
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Walk-In Registration Modal */}
          {isWalkInModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 my-8">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">person_add</span>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-on-surface">
                        Registrasi Peserta Walk-in
                      </h3>
                      <p className="text-xs text-text-muted">
                        Pendaftaran langsung di tempat oleh panitia acara
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWalkInModalOpen(false);
                      setWalkInError(null);
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-muted cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {walkInError && (
                  <div className="p-3 rounded-xl bg-error-container/40 border border-error text-error text-xs font-medium">
                    {walkInError}
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setWalkInError(null);
                    if (!walkInFullName.trim()) {
                      setWalkInError('Nama lengkap peserta wajib diisi.');
                      return;
                    }
                    if (!walkInNisn.trim()) {
                      setWalkInError('NISN / NIP wajib diisi.');
                      return;
                    }
                    if (!walkInSchoolId) {
                      setWalkInError('Asal sekolah wajib dipilih.');
                      return;
                    }
                    if (
                      (walkInInfoSource === 'Medsos' ||
                        walkInInfoSource === 'Banner' ||
                        walkInInfoSource === 'Event') &&
                      !walkInInfoSourceDetail.trim()
                    ) {
                      setWalkInError(`Detail sumber untuk ${walkInInfoSource} wajib diisi.`);
                      return;
                    }

                    if (!onAdminRegister) return;

                    try {
                      setIsWalkInSubmitting(true);
                      const sch = schools.find((s) => s.id === Number(walkInSchoolId));
                      await onAdminRegister({
                        fullName: walkInFullName.trim(),
                        nisnOrNip: walkInNisn.trim(),
                        schoolId: Number(walkInSchoolId),
                        schoolOrigin: sch ? sch.name : '',
                        role: walkInRole,
                        trialClass: walkInTrialClass,
                        infoSource: walkInInfoSource,
                        infoSourceDetail: walkInInfoSourceDetail.trim() || undefined,
                      });
                      showToast(`Pendaftaran walk-in untuk ${walkInFullName} berhasil disimpan!`);
                      setIsWalkInModalOpen(false);
                      setWalkInFullName('');
                      setWalkInNisn('');
                      setWalkInSchoolId('');
                      setWalkInInfoSourceDetail('');
                    } catch (err: any) {
                      setWalkInError(err.message || 'Gagal mendaftarkan peserta.');
                    } finally {
                      setIsWalkInSubmitting(false);
                    }
                  }}
                  className="space-y-4 text-left"
                >
                  {/* Peran */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Peran</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Siswa', 'Guru Pendamping'] as AttendeeRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setWalkInRole(r)}
                          className={`h-10 rounded-xl font-medium text-xs border transition-all cursor-pointer ${
                            walkInRole === r
                              ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-2xs'
                              : 'bg-surface border-border-subtle text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nama */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={walkInFullName}
                      onChange={(e) => setWalkInFullName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full h-11 px-3.5 rounded-xl border border-border-subtle bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* NISN / NIP */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      {walkInRole === 'Siswa' ? 'NISN (10 Digit)' : 'NIP / Identitas'}
                    </label>
                    <input
                      type="text"
                      required
                      value={walkInNisn}
                      onChange={(e) => setWalkInNisn(e.target.value)}
                      placeholder={walkInRole === 'Siswa' ? '0089123456' : '19800101...'}
                      className="w-full h-11 px-3.5 rounded-xl border border-border-subtle bg-surface text-on-surface text-sm font-mono focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Asal Sekolah */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Asal Sekolah</label>
                    <select
                      required
                      value={walkInSchoolId}
                      onChange={(e) => setWalkInSchoolId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full h-11 px-3 rounded-xl border border-border-subtle bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="">-- Pilih Asal Sekolah --</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trial Class */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Trial Class</label>
                    <select
                      value={walkInTrialClass}
                      onChange={(e) => setWalkInTrialClass(e.target.value as TrialClassType)}
                      className="w-full h-11 px-3 rounded-xl border border-border-subtle bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                    >
                      {TRIAL_CLASS_OPTIONS.map((tc) => (
                        <option key={tc.id} value={tc.id}>
                          {tc.label} ({tc.subtitle})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sumber Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Sumber Info</label>
                      <select
                        value={walkInInfoSource}
                        onChange={(e) => setWalkInInfoSource(e.target.value as InfoSourceType)}
                        className="w-full h-11 px-3 rounded-xl border border-border-subtle bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                      >
                        {INFO_SOURCE_OPTIONS.map((src) => (
                          <option key={src} value={src}>
                            {src}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(walkInInfoSource === 'Medsos' ||
                      walkInInfoSource === 'Banner' ||
                      walkInInfoSource === 'Event') && (
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Detail Sumber</label>
                        <input
                          type="text"
                          required
                          value={walkInInfoSourceDetail}
                          onChange={(e) => setWalkInInfoSourceDetail(e.target.value)}
                          placeholder="Instagram, Brosur, dll"
                          className="w-full h-11 px-3.5 rounded-xl border border-border-subtle bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
                    <button
                      type="button"
                      onClick={() => setIsWalkInModalOpen(false)}
                      className="h-11 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isWalkInSubmitting}
                      className="h-11 px-5 rounded-xl bg-primary hover:bg-primary-dark text-on-primary text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                    >
                      {isWalkInSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mendaftarkan...</span>
                        </>
                      ) : (
                        <span>Simpan &amp; Terbitkan Kupon</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* PAGE 1: BARCODE SCANNER (Admin Fast Coupon Scanner)                 */}
          {/* =================================================================== */}
          {activePage === 'admin-scanner' && (
            <div className="flex flex-col w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div>
                  <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] font-bold text-on-surface tracking-tight">
                    Verifikasi &amp; Scan Kehadiran
                  </h1>
                  <p className="text-[13px] sm:text-[14px] text-text-muted mt-0.5">
                    Arahkan kamera ke QR Code peserta atau input kode kupon manual untuk pencatatan presensi real-time.
                  </p>
                </div>
              </div>

              {/* Operational Metrics Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-2xs border border-border-subtle flex items-center justify-between">
                  <div>
                    <p className="text-[12px] sm:text-[13px] text-text-muted">Total Registrasi</p>
                    <p className="font-display text-[22px] sm:text-[28px] font-bold text-on-surface mt-0.5">
                      {totalCount}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">
                      badge
                    </span>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-2xs border border-border-subtle flex items-center justify-between">
                  <div>
                    <p className="text-[12px] sm:text-[13px] text-text-muted">Tervalidasi Hadir</p>
                    <p className="font-display text-[22px] sm:text-[28px] font-bold text-on-surface mt-0.5">
                      {redeemedCount}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-fixed shrink-0">
                    <span className="material-symbols-outlined text-[22px]">
                      verified
                    </span>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-2xs border border-border-subtle flex items-center justify-between">
                  <div>
                    <p className="text-[12px] sm:text-[13px] text-text-muted">Belum Hadir</p>
                    <p className="font-display text-[22px] sm:text-[28px] font-bold text-on-surface mt-0.5">
                      {unredeemedCount}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-neutral-badge-bg flex items-center justify-center text-text-muted shrink-0">
                    <span className="material-symbols-outlined text-[22px]">
                      schedule
                    </span>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-2xs border border-border-subtle flex items-center justify-between">
                  <div>
                    <p className="text-[12px] sm:text-[13px] text-text-muted">Duplikat Tercegah</p>
                    <p className="font-display text-[22px] sm:text-[28px] font-bold text-coral-dark mt-0.5">
                      {rejectedLogsCount}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center text-coral-dark shrink-0">
                    <span className="material-symbols-outlined text-[22px]">
                      flip_camera_ios
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Workspace Grid: Viewfinder & Manual Input Side-by-Side on Desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 w-full items-start">
                {/* Camera Viewfinder Card (7 cols on lg, 8 on xl) */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                  <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-2xs border border-border-subtle flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                        </span>
                        <span className="font-display text-[16px] sm:text-[18px] font-bold text-on-surface">
                          Kamera Pemindai Aktif
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={toggleLiveCamera}
                          className={`h-9 sm:h-10 px-3 rounded-xl text-[12px] sm:text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                            cameraActive
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            {cameraActive ? 'videocam_off' : 'videocam'}
                          </span>
                          <span>{cameraActive ? 'Matikan' : 'Buka Kamera'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFlashOn((v) => !v)}
                          title="Flashlight"
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            flashOn
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            flashlight_on
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCamFlipped((v) => !v)}
                          title="Ganti Kamera Depan/Belakang"
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-all cursor-pointer ${
                            camFlipped ? 'rotate-180' : ''
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            flip_camera_ios
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="relative w-full aspect-video sm:h-[380px] lg:h-[440px] rounded-2xl overflow-hidden bg-on-surface flex items-center justify-center shadow-inner">
                      {cameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="absolute inset-0 w-full h-full object-cover opacity-90"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-inverse-surface/90 via-on-surface to-inverse-surface flex items-center justify-center">
                          <div className="w-full h-full opacity-10 bg-[radial-gradient(#9FA0FF_1px,transparent_1px)] [background-size:16px_16px]" />
                        </div>
                      )}

                      <div className="relative z-10 w-64 h-48 sm:w-80 sm:h-56 lg:w-96 lg:h-64 flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-8 sm:w-10 h-8 sm:h-10 rounded-tl-xl border-t-4 border-l-4 border-primary-container" />
                        <div className="absolute top-0 right-0 w-8 sm:w-10 h-8 sm:h-10 rounded-tr-xl border-t-4 border-r-4 border-primary-container" />
                        <div className="absolute bottom-0 left-0 w-8 sm:w-10 h-8 sm:h-10 rounded-bl-xl border-b-4 border-l-4 border-primary-container" />
                        <div className="absolute bottom-0 right-0 w-8 sm:w-10 h-8 sm:h-10 rounded-br-xl border-b-4 border-r-4 border-primary-container" />
                        <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent shadow-[0_0_16px_#9FA0FF] animate-pulse" />
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary-container/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary-container/70 text-[28px] sm:text-[32px]">
                            filter_center_focus
                          </span>
                        </div>
                      </div>

                      <div className="absolute bottom-3 inset-x-3 z-20 flex justify-center">
                        <span className="px-3.5 py-1.5 rounded-full bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface text-[11px] sm:text-[13px] flex items-center gap-1.5 text-center">
                          <span className="material-symbols-outlined text-primary-container text-[16px] shrink-0">
                            qr_code_scanner
                          </span>
                          <span>Arahkan QR kupon peserta ke dalam kotak pemindai</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Input Card (5 cols on lg, 4 on xl) */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
                  <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-2xs border border-border-subtle flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          keyboard
                        </span>
                        <h3 className="font-display text-[16px] sm:text-[18px] font-bold text-on-surface">
                          Input Manual Kupon
                        </h3>
                      </div>
                      <p className="text-[12px] sm:text-[13px] text-text-muted mb-4">
                        Ketik kode kupon jika barcode kotor, terlipat, atau layar redup.
                      </p>

                      <form
                        onSubmit={handleVerifyFormSubmit}
                        className="space-y-3"
                      >
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                            <span className="material-symbols-outlined text-[20px]">
                              pin
                            </span>
                          </div>
                          <input
                            type="text"
                            maxLength={12}
                            value={couponInput}
                            onChange={(e) =>
                              setCouponInput(e.target.value.toUpperCase())
                            }
                            placeholder="ABSC-0001"
                            className="w-full h-[50px] pl-11 pr-4 rounded-xl bg-surface-container-lowest border border-border-subtle text-on-surface font-mono-code text-[18px] sm:text-[20px] font-bold uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-container/40 transition-all"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full h-[50px] px-4 rounded-xl bg-primary-container hover:bg-primary-dark text-on-primary-container font-display text-[15px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[19px]">
                            verified
                          </span>
                          <span>Verifikasi Kupon</span>
                        </button>
                      </form>
                    </div>

                    {/* Desk Guide Tips */}
                    <div className="mt-5 pt-4 border-t border-border-subtle space-y-2.5">
                      <p className="text-[12px] font-bold uppercase tracking-wider text-text-muted">
                        Panduan Cepat Loket
                      </p>
                      <div className="space-y-2 text-[12px] text-on-surface-variant">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-primary text-[11px] font-bold shrink-0 mt-0.5">1</span>
                          <span>Kupon valid otomatis menandai peserta hadir dengan stempel WIB.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-primary text-[11px] font-bold shrink-0 mt-0.5">2</span>
                          <span>Kupon yang sudah terpakai otomatis ditolak sebagai duplikat (422).</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-primary text-[11px] font-bold shrink-0 mt-0.5">3</span>
                          <span>Buka menu &ldquo;Daftar Peserta&rdquo; untuk pencarian manual nama sekolah.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* PAGE 2: RIWAYAT AKTIVITAS (3-Card KPI Row per Req #5)               */}
          {/* =================================================================== */}
          {activePage === 'activity-history' && (
            <div className="flex flex-col w-full">
              {/* Dynamic Top Bar & Metric Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div>
                  <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] font-bold text-on-surface tracking-tight">
                    Riwayat Aktivitas &amp; Log Pemindaian
                  </h1>
                  <p className="text-[13px] sm:text-[14px] text-text-muted mt-0.5">
                    Catatan kronologis menyeluruh pemindaian kupon masuk, verifikasi kehadiran, dan deteksi duplikat tiket secara real-time.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handleExportLogsCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-surface-container-lowest border border-border-subtle text-on-surface font-semibold text-[13px] sm:text-[14px] hover:bg-surface-container transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] text-primary ${
                        isExportingLog ? 'animate-spin' : ''
                      }`}
                    >
                      {isExportingLog ? 'progress_activity' : 'download'}
                    </span>
                    <span>
                      {isExportingLog ? 'Mengekspor...' : 'Export CSV / Excel'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Key Metrics 3-Card Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
                {/* Card 1: Total Scans */}
                <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-2xs border border-border-subtle flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[12px] sm:text-[13px] text-text-muted block font-medium">
                        Total Log Scan Hari Ini
                      </span>
                      <span className="font-display text-[24px] sm:text-[32px] font-bold text-on-surface mt-0.5 block leading-tight">
                        {scanLogs.length}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        document_scanner
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-[12px] text-secondary font-semibold">
                      <span className="material-symbols-outlined text-[15px]">
                        sync
                      </span>
                      <span>{scanLogs.length > 0 ? '100% Tersinkronisasi' : 'Menunggu Pemindaian'}</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: scanLogs.length > 0 ? '100%' : '0%' }}
                    />
                  </div>
                </div>

                {/* Card 2: Successful Check-ins */}
                <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-2xs border border-border-subtle flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[12px] sm:text-[13px] text-text-muted block font-medium">
                        Scan Berhasil / Hadir
                      </span>
                      <span className="font-display text-[24px] sm:text-[32px] font-bold text-on-surface mt-0.5 block leading-tight">
                        {
                          scanLogs.filter(
                            (l) => l.status === 'success' || l.status === 'manual'
                          ).length
                        }
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-fixed shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        check_circle
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] sm:text-[12px] font-semibold">
                      <span className="material-symbols-outlined text-[14px]">
                        done_all
                      </span>{' '}
                      {hadPercentage}% Hadir
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-secondary h-full rounded-full transition-all duration-300"
                      style={{ width: `${hadPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Card 3: Duplicates & Rejected */}
                <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-2xs border border-border-subtle flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[12px] sm:text-[13px] text-text-muted block font-medium">
                        Gagal Verifikasi
                      </span>
                      <span className="font-display text-[24px] sm:text-[32px] font-bold text-coral-dark mt-0.5 block leading-tight">
                        {rejectedLogsCount}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center text-error shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        gpp_bad
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-error text-[11px] sm:text-[12px] font-semibold">
                      <span className="material-symbols-outlined text-[14px]">
                        warning
                      </span>{' '}
                      {rejectedLogsCount} Terdeteksi &amp; Ditolak
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-coral-alert h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          scanLogs.length > 0
                            ? Math.round((rejectedLogsCount / scanLogs.length) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Operational Filter Toolbar */}
              <div className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-border-subtle mb-4 sm:mb-6">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
                  <div className="relative flex-1 min-w-[240px]">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[19px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      placeholder="Cari nama peserta, kode kupon, atau petugas..."
                      className="w-full h-11 pl-10 pr-4 bg-surface-container-lowest text-on-surface text-[14px] rounded-xl outline-none transition-all placeholder:text-text-muted shadow-2xs focus:ring-2 focus:ring-primary-container/40 border border-border-subtle"
                    />
                    {logSearch && (
                      <button
                        type="button"
                        onClick={() => setLogSearch('')}
                        aria-label="Bersihkan pencarian"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-2 overflow-x-auto no-scrollbar">
                    <div className="inline-flex p-1 bg-surface-container rounded-xl overflow-x-auto no-scrollbar shrink-0">
                      {(
                        [
                          { id: 'all', label: 'Semua Log' },
                          { id: 'success', label: 'Valid (200)' },
                          { id: 'rejected', label: 'Ditolak (422)' },
                          { id: 'manual', label: 'Manual' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setLogStatusFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] sm:text-[13px] transition-all cursor-pointer whitespace-nowrap ${
                            logStatusFilter === tab.id
                              ? 'bg-surface-container-lowest text-on-surface shadow-2xs font-semibold'
                              : 'text-text-muted hover:text-on-surface font-medium'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* View Mode Toggle (Card vs Table) */}
                    <button
                      type="button"
                      onClick={() =>
                        setLogViewMode((prev) =>
                          prev === 'cards' ? 'table' : 'cards'
                        )
                      }
                      title="Ganti Tampilan Tabel/Kartu"
                      className="h-10 px-2.5 sm:px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {logViewMode === 'cards' ? 'table_chart' : 'view_agenda'}
                      </span>
                      <span className="hidden sm:inline">
                        {logViewMode === 'cards' ? 'Tabel' : 'Kartu'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-Time Activity Timeline / Ledger Display */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-2xs border border-border-subtle overflow-hidden flex flex-col">
                <div className="px-4 sm:px-6 py-3 bg-surface-container/40 flex flex-wrap items-center justify-between gap-2 text-text-muted text-[13px] border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-on-surface font-semibold text-[13px] sm:text-[14px]">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        format_list_bulleted
                      </span>
                      <span>Aliran Data Pemindaian Terkini</span>
                    </span>
                  </div>
                  <span className="text-[12px] text-text-muted">
                    {filteredLogs.length} riwayat tercatat
                  </span>
                </div>

                {/* Mobile / Card Stream View */}
                <div
                  className={`p-3 sm:p-4 space-y-3 ${
                    logViewMode === 'table'
                      ? 'hidden'
                      : logViewMode === 'cards'
                      ? 'block'
                      : 'block md:hidden'
                  }`}
                >
                  {filteredLogs.map((log) => {
                    const isRejected = log.status === 'rejected';
                    return (
                      <div
                        key={log.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isRejected
                            ? 'bg-error-container/10 border-error/25'
                            : 'bg-white border-border-subtle hover:border-primary-container'
                        } shadow-2xs space-y-2.5`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded font-mono-code text-[13px] font-bold ${
                              isRejected
                                ? 'bg-error-container text-coral-dark'
                                : 'bg-surface-container-high text-primary'
                            }`}
                          >
                            {log.couponCode}
                          </span>

                          {isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-error-container text-error text-[11px] font-semibold leading-tight">
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              <span>{log.statusText}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-fixed text-[11px] font-semibold leading-tight">
                              <span className="material-symbols-outlined text-[13px]">verified</span>
                              <span>{log.statusText}</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-[15px] text-on-surface leading-snug">
                            {log.fullName}
                          </h4>
                          <p className="text-[12px] text-text-muted mt-0.5 leading-snug">
                            {log.schoolOrigin} · Info: {log.infoSource}
                          </p>
                          {log.subStatusText && (
                            <p className="text-[11px] text-coral-dark font-medium mt-1">
                              {log.subStatusText}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle/70 text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                log.role === 'Guru Pendamping'
                                  ? 'bg-secondary-container text-on-secondary-fixed'
                                  : 'bg-primary-fixed text-on-primary-fixed'
                              } font-medium`}
                            >
                              {log.role}
                            </span>
                            {renderTrialClassBadge(log.trialClass)}
                          </div>
                          <div className="flex items-center gap-1 text-text-muted font-mono-code text-[11px]">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span>{log.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop / Full Table View */}
                <div
                  className={`overflow-x-auto w-full custom-scrollbar ${
                    logViewMode === 'cards'
                      ? 'hidden'
                      : logViewMode === 'table'
                      ? 'block'
                      : 'hidden md:block'
                  }`}
                >
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-[12px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4 sm:px-6">Timestamp</th>
                        <th className="py-3 px-3 sm:px-4">Kode Kupon</th>
                        <th className="py-3 px-3 sm:px-4">
                          Nama Peserta &amp; Asal Sekolah
                        </th>
                        <th className="py-3 px-3 sm:px-4">
                          Peran &amp; Trial Class
                        </th>
                        <th className="py-3 px-3 sm:px-4">Metode Pemindaian</th>
                        <th className="py-3 px-4 sm:px-6 text-right">
                          Status &amp; Respons
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-on-surface divide-y divide-border-subtle/50">
                      {filteredLogs.map((log) => {
                        const isRejected = log.status === 'rejected';
                        return (
                          <tr
                            key={log.id}
                            className={`transition-colors group ${
                              isRejected
                                ? 'bg-error-container/10 hover:bg-error-container/20'
                                : 'hover:bg-surface-container/40'
                            }`}
                          >
                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span
                                  className={`font-code-sm text-[12px] font-bold ${
                                    isRejected
                                      ? 'text-coral-dark'
                                      : 'text-on-surface'
                                  }`}
                                >
                                  {log.timestamp}
                                </span>
                                <span className="text-[11px] text-text-muted">
                                  {log.relativeTime}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-1 rounded font-code-coupon-md text-[13px] leading-tight font-bold ${
                                  isRejected
                                    ? 'bg-error-container text-coral-dark'
                                    : 'bg-surface-container-high text-primary'
                                }`}
                              >
                                {log.couponCode}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 sm:px-4 min-w-[200px]">
                              <div className="flex flex-col">
                                <span
                                  className={`font-semibold text-on-surface transition-colors ${
                                    isRejected
                                      ? 'group-hover:text-coral-dark'
                                      : 'group-hover:text-primary'
                                  }`}
                                >
                                  {log.fullName}
                                </span>
                                <span className="text-[12px] text-text-muted">
                                  {log.schoolOrigin} • Info: {log.infoSource}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    log.role === 'Guru Pendamping'
                                      ? 'bg-secondary-container text-on-secondary-fixed'
                                      : 'bg-primary-fixed text-on-primary-fixed'
                                  }`}
                                >
                                  {log.role}
                                </span>
                                {renderTrialClassBadge(log.trialClass)}
                              </div>
                            </td>

                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                              {log.scanMethod === 'auto' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container text-[12px] text-on-surface">
                                  <span className="material-symbols-outlined text-[15px] text-secondary">
                                    photo_camera
                                  </span>
                                  <span>Kamera Auto</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-[12px] text-on-surface">
                                  <span className="material-symbols-outlined text-[15px] text-primary">
                                    keyboard
                                  </span>
                                  <span>Input Manual</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                              {isRejected ? (
                                <div className="inline-flex flex-col items-end">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-error-container text-error text-[11px] font-semibold leading-tight">
                                    <span className="material-symbols-outlined text-[13px]">
                                      cancel
                                    </span>
                                    <span>{log.statusText}</span>
                                  </span>
                                  {log.subStatusText && (
                                    <span className="text-[10px] text-coral-dark leading-tight mt-0.5">
                                      {log.subStatusText}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-fixed text-[11px] font-semibold leading-tight">
                                  <span className="material-symbols-outlined text-[13px]">
                                    verified
                                  </span>
                                  <span>{log.statusText}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {filteredLogs.length === 0 && (
                  <div className="py-12 px-4 text-center">
                    <span className="material-symbols-outlined text-[36px] text-text-muted mb-2">
                      {scanLogs.length === 0 ? 'history_toggle_off' : 'search_off'}
                    </span>
                    <p className="font-semibold text-on-surface">
                      {scanLogs.length === 0
                        ? 'Belum ada riwayat aktivitas pemindaian'
                        : 'Tidak ada log pemindaian yang cocok'}
                    </p>
                    <p className="text-[13px] text-text-muted mt-0.5">
                      {scanLogs.length === 0
                        ? 'Aktivitas pemindaian kupon peserta akan otomatis tercatat di sini secara real-time.'
                        : 'Coba ganti filter status atau kata kunci pencarian.'}
                    </p>
                  </div>
                )}

                {/* Pagination Footer */}
                <div className="p-3.5 sm:p-4 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-subtle">
                  <div className="flex items-center gap-2 text-text-muted text-[12px] sm:text-[13px]">
                    <span>
                      Menampilkan{' '}
                      <strong className="text-on-surface font-semibold">
                        {filteredLogs.length > 0 ? `1-${filteredLogs.length}` : '0'}
                      </strong>{' '}
                      dari{' '}
                      <strong className="text-on-surface font-semibold">
                        {scanLogs.length}
                      </strong>{' '}
                      total log riwayat
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest text-text-muted flex items-center justify-center disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-primary text-on-primary text-[12px] font-bold flex items-center justify-center shadow-xs"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest text-text-muted flex items-center justify-center disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* PAGE 3: DAFTAR PESERTA (3-Card KPI Row without Kupon Walk-In)       */}
          {/* =================================================================== */}
          {activePage === 'admin-participants' && (
            <div className="flex flex-col w-full">
              {/* Quick Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6">
                <div>
                  <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] font-bold text-on-surface tracking-tight">
                    Data Peserta &amp; Presensi
                  </h1>
                  <p className="text-[13px] sm:text-[14px] text-text-muted mt-0.5">
                    Kelola kupon pendaftaran, status scan kehadiran loket, dan riwayat trial class.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onRefreshData && (
                    <button
                      type="button"
                      onClick={onRefreshData}
                      disabled={isRefreshing}
                      className="h-10 px-3.5 rounded-xl bg-surface hover:bg-surface-container text-on-surface font-medium text-[13px] flex items-center gap-1.5 border border-border-subtle cursor-pointer disabled:opacity-60 shadow-2xs transition-colors"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
                        refresh
                      </span>
                      <span>Segarkan Data</span>
                    </button>
                  )}
                  {onAdminRegister && (
                    <button
                      type="button"
                      onClick={() => setIsWalkInModalOpen(true)}
                      className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-dark text-on-primary font-semibold text-[13px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Tambah Walk-in</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 1: KPI Top Summary Cards (3 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {/* Card 1: Total Terdaftar */}
                <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-2xs border border-border-subtle relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[12px] sm:text-[13px] text-text-muted">
                      Total Terdaftar
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-primary-container/30 text-on-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        group
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[26px] sm:text-[32px] font-bold text-on-surface tracking-tight leading-tight">
                      {totalCount}
                    </span>
                    <span className="text-[12px] text-text-muted">
                      Peserta
                    </span>
                  </div>
                  <div className="mt-3 pt-2 flex items-center justify-between text-[12px] text-text-muted">
                    <span>Kapasitas Target: 250</span>
                    <span className="font-semibold text-primary">
                      {totalCount > 0 ? 'Aktif' : 'Menunggu Pendaftar'}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((totalCount / 250) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Card 2: Sudah Hadir / Di-scan */}
                <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-2xs border border-border-subtle relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[12px] sm:text-[13px] text-text-muted">
                      Sudah Hadir / Di-scan
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        check_circle
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[26px] sm:text-[32px] font-bold text-on-surface tracking-tight leading-tight">
                      {redeemedCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] sm:text-[12px] font-semibold">
                      {hadPercentage}%
                    </span>
                  </div>
                  <div className="mt-3 pt-2 flex items-center justify-between text-[12px] text-text-muted">
                    <span>Verifikasi Scanner</span>
                    <span className="text-secondary font-semibold">
                      {redeemedCount} Berhasil
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-secondary h-full rounded-full"
                      style={{ width: `${hadPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Card 3: Belum Hadir */}
                <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-2xs border border-border-subtle relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[12px] sm:text-[13px] text-text-muted">
                      Belum Hadir
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-neutral-badge-bg text-text-muted flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        pending_actions
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[26px] sm:text-[32px] font-bold text-on-surface tracking-tight leading-tight">
                      {unredeemedCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-badge-bg text-text-muted text-[11px] sm:text-[12px] font-semibold">
                      Menunggu
                    </span>
                  </div>
                  <div className="mt-3 pt-2 flex items-center justify-between text-[12px] text-text-muted">
                    <span>Estimasi Hadir</span>
                    <span className="text-text-muted font-medium">
                      Sesi Berjalan
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-outline-variant h-full rounded-full"
                      style={{
                        width: `${
                          totalCount > 0
                            ? ((unredeemedCount / totalCount) * 100).toFixed(1)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Filter & Action Toolbar */}
              <div className="bg-surface rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-border-subtle mb-4 sm:mb-6 flex flex-col xl:flex-row gap-3 sm:gap-4 items-stretch xl:items-center justify-between">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center flex-1">
                  {/* Search Input */}
                  <div className="relative min-w-[240px] lg:max-w-md w-full">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[19px] pointer-events-none">
                      search
                    </span>
                    <input
                      type="text"
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      placeholder="Cari nama peserta atau kode kupon..."
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-canvas-admin text-on-surface placeholder:text-text-muted text-[14px] focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary-container/40 border border-border-subtle transition-all"
                    />
                    {participantSearch && (
                      <button
                        type="button"
                        aria-label="Bersihkan pencarian"
                        onClick={() => setParticipantSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          cancel
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Segmented Status Filter */}
                  <div className="inline-flex p-1 rounded-xl bg-canvas-admin self-start lg:self-auto overflow-x-auto no-scrollbar max-w-full">
                    <button
                      type="button"
                      onClick={() => setParticipantStatusFilter('ALL')}
                      className={`px-3 sm:px-4 h-9 sm:h-10 rounded-lg font-medium text-[12px] sm:text-[13px] transition-all whitespace-nowrap cursor-pointer ${
                        participantStatusFilter === 'ALL'
                          ? 'bg-primary-container text-on-primary-container shadow-2xs font-semibold'
                          : 'text-text-muted hover:text-on-surface'
                      }`}
                    >
                      <span>Semua</span>{' '}
                      <span className="hidden sm:inline">Peserta</span> ({totalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantStatusFilter('UNREDEEMED')}
                      className={`px-3 sm:px-4 h-9 sm:h-10 rounded-lg font-medium text-[12px] sm:text-[13px] transition-all whitespace-nowrap cursor-pointer ${
                        participantStatusFilter === 'UNREDEEMED'
                          ? 'bg-primary-container text-on-primary-container shadow-2xs font-semibold'
                          : 'text-text-muted hover:text-on-surface'
                      }`}
                    >
                      <span>Belum</span>{' '}
                      <span className="hidden sm:inline">Di-scan</span> ({unredeemedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantStatusFilter('REDEEMED')}
                      className={`px-3 sm:px-4 h-9 sm:h-10 rounded-lg font-medium text-[12px] sm:text-[13px] transition-all whitespace-nowrap cursor-pointer ${
                        participantStatusFilter === 'REDEEMED'
                          ? 'bg-primary-container text-on-primary-container shadow-2xs font-semibold'
                          : 'text-text-muted hover:text-on-surface'
                      }`}
                    >
                      <span>Sudah</span>{' '}
                      <span className="hidden sm:inline">Hadir</span> ({redeemedCount})
                    </button>
                  </div>
                </div>

                {/* Right Part: Trial Class Dropdown, Export Action & View Mode Toggle */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap xl:flex-nowrap shrink-0">
                  <div className="relative flex-1 sm:flex-initial min-w-[170px]">
                    <select
                      value={participantClassFilter}
                      onChange={(e) =>
                        setParticipantClassFilter(
                          e.target.value as 'ALL' | TrialClassType
                        )
                      }
                      className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-canvas-admin text-on-surface font-medium text-[12px] sm:text-[13px] appearance-none focus:outline-none focus:ring-2 focus:ring-primary-container/40 border border-border-subtle cursor-pointer"
                    >
                      <option value="ALL">Semua Trial Class</option>
                      <option value="IT">IT (Web &amp; App)</option>
                      <option value="DKV">DKV (Desain Grafis)</option>
                      <option value="KULINER">KULINER (Tata Boga)</option>
                      <option value="MOBILE_LEGENDS">MOBILE LEGENDS</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportParticipantsCsv}
                    className="h-10 px-3 sm:px-4 rounded-xl bg-canvas-admin hover:bg-surface-container text-on-surface font-medium text-[12px] sm:text-[13px] transition-all flex items-center gap-1.5 whitespace-nowrap shadow-2xs border border-border-subtle cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary">
                      sim_card_download
                    </span>
                    <span className="hidden sm:inline">Export CSV/Excel</span>
                    <span className="sm:hidden">Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setParticipantViewMode((prev) =>
                        prev === 'cards' ? 'table' : 'cards'
                      )
                    }
                    title="Ganti Tampilan Tabel/Kartu"
                    className="h-10 px-2.5 sm:px-3 rounded-xl bg-canvas-admin hover:bg-surface-container text-on-surface text-[12px] font-medium flex items-center gap-1 transition-all border border-border-subtle cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {participantViewMode === 'cards' ? 'table_chart' : 'view_agenda'}
                    </span>
                    <span className="hidden sm:inline">
                      {participantViewMode === 'cards' ? 'Tabel' : 'Kartu'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Section 3: Dual View (Mobile Cards & High-Fidelity Data Table) */}
              <div className="bg-surface rounded-2xl shadow-2xs border border-border-subtle overflow-hidden flex flex-col">
                {/* Mobile / Card List View */}
                <div
                  className={`p-3 sm:p-4 space-y-3 ${
                    participantViewMode === 'table'
                      ? 'hidden'
                      : participantViewMode === 'cards'
                      ? 'block'
                      : 'block lg:hidden'
                  }`}
                >
                  {filteredParticipants.map((p, index) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl sm:rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-3 transition-all hover:border-primary-container"
                    >
                      {/* Top Header of Card: Index, Coupon with copy button, and Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-code-sm text-[12px] font-bold text-text-muted">
                            #{String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-surface-container-low font-code-sm text-[13px] text-on-surface font-bold">
                            <span>{p.couponCode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(p.couponCode)}
                              title="Salin kode kupon"
                              className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                content_copy
                              </span>
                            </button>
                          </div>
                        </div>

                        {p.status === 'REDEEMED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[14px] text-secondary">
                              check_circle
                            </span>
                            <span>Hadir · {p.checkedInAt || '-'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-badge-bg text-text-muted text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                            <span>Belum Hadir</span>
                          </span>
                        )}
                      </div>

                      {/* Attendee Name, Role & NISN */}
                      <div>
                        <h4 className="font-display text-[16px] sm:text-[17px] font-bold text-on-surface leading-tight">
                          {p.fullName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[12px] text-text-muted mt-1">
                          <span className="font-medium text-on-surface">
                            {p.role}
                          </span>
                          <span>·</span>
                          <span className="font-mono-code font-medium">
                            {p.nisnOrNip}
                          </span>
                        </div>
                        <p className="text-[13px] text-on-surface-variant mt-1 leading-snug">
                          {p.schoolOrigin}
                          <span className="text-text-muted"> · Info: {p.infoSource}{p.infoSourceDetail ? ` (${p.infoSourceDetail})` : ''}</span>
                        </p>
                      </div>

                      {/* Bottom Footer: Badges & Action Buttons */}
                      <div className="pt-2.5 border-t border-border-subtle/70 flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          {renderTrialClassBadge(p.trialClass)}
                        </div>

                        <div className="flex items-center gap-2">
                          {p.status !== 'REDEEMED' && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await onQuickRedeem(p.id);
                                  showToast(
                                    `Presensi berhasil diverifikasi untuk ${p.fullName}!`
                                  );
                                } catch (err: any) {
                                  showToast(err.message || 'Gagal memverifikasi kupon.');
                                }
                              }}
                              className="h-9 px-3 rounded-xl bg-primary-container hover:bg-primary-dark text-on-primary-container font-semibold text-[12px] flex items-center gap-1 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                done
                              </span>
                              <span>Presensikan</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setPendingDeletePass(p)}
                            title="Hapus data peserta"
                            className="w-9 h-9 rounded-xl hover:bg-coral-alert/15 text-coral-alert hover:text-coral-dark flex items-center justify-center transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop / Full High-Fidelity Data Table */}
                <div
                  className={`overflow-x-auto w-full custom-scrollbar ${
                    participantViewMode === 'cards'
                      ? 'hidden'
                      : participantViewMode === 'table'
                      ? 'block'
                      : 'hidden lg:block'
                  }`}
                >
                  <table className="w-full text-left align-middle border-collapse">
                    <thead>
                      <tr className="bg-tertiary-fixed/30 text-on-surface font-display text-[12px] uppercase tracking-wider select-none">
                        <th className="py-3.5 px-3 w-12 text-center">
                          No
                        </th>
                        <th className="py-3.5 px-3 min-w-[130px]">
                          Kode Kupon
                        </th>
                        <th className="py-3.5 px-3 min-w-[200px]">
                          Nama Peserta &amp; Peran
                        </th>
                        <th className="py-3.5 px-3 min-w-[130px]">
                          NISN / NIP
                        </th>
                        <th className="py-3.5 px-3 min-w-[180px]">
                          Asal Sekolah &amp; Info
                        </th>
                        <th className="py-3.5 px-3 min-w-[140px]">
                          Trial Class
                        </th>
                        <th className="py-3.5 px-3 min-w-[180px]">
                          Status Kehadiran
                        </th>
                        <th className="py-3.5 px-3 w-28 text-center">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border-subtle/50 text-[13px]">
                      {filteredParticipants.map((p, index) => (
                        <tr
                          key={p.id}
                          className="hover:bg-primary-container/10 transition-colors duration-150"
                        >
                          <td className="py-3 px-3 text-center font-code-sm text-text-muted">
                            {String(index + 1).padStart(2, '0')}
                          </td>

                          <td className="py-3 px-3">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low font-code-sm text-[13px] text-on-surface">
                              <span className="font-bold tracking-wide">{p.couponCode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(p.couponCode)}
                                title="Salin kode kupon"
                                className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  content_copy
                                </span>
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-display font-semibold text-on-surface">
                                {p.fullName}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                {p.role === 'Guru Pendamping' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-medium">
                                    Guru Pendamping
                                  </span>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] text-text-muted font-medium">
                                      Siswa
                                    </span>
                                    <span className="text-[11px] text-text-muted">
                                      • {p.registrationSource}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-code-sm text-[12px] text-on-surface">
                              {p.nisnOrNip}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="text-on-surface font-medium">
                                {p.schoolOrigin}
                              </span>
                              <span className="text-[11px] text-text-muted">
                                Sumber: {p.infoSource}
                                {p.infoSourceDetail
                                  ? ` (${p.infoSourceDetail})`
                                  : ''}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {renderTrialClassBadge(p.trialClass)}
                          </td>

                          <td className="py-3 px-3">
                            {p.status === 'REDEEMED' ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] font-semibold">
                                <span className="material-symbols-outlined text-[15px] text-secondary">
                                  check_circle
                                </span>
                                <span>Hadir - {p.checkedInAt || '-'}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-badge-bg text-text-muted text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                                <span>Belum Hadir</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {p.status === 'REDEEMED' ? (
                                <button
                                  type="button"
                                  disabled
                                  title="Sudah divalidasi"
                                  className="w-8 h-8 rounded-lg bg-surface-container text-text-muted/40 cursor-not-allowed flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    verified
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await onQuickRedeem(p.id);
                                      showToast(
                                        `Presensi berhasil diverifikasi untuk ${p.fullName}!`
                                      );
                                    } catch (err: any) {
                                      showToast(err.message || 'Gagal memverifikasi kupon.');
                                    }
                                  }}
                                  title="Quick Redeem / Presensikan Sekarang"
                                  className="w-8 h-8 rounded-lg bg-primary-container hover:bg-primary-dark text-on-primary-container hover:text-on-primary flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    done
                                  </span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setPendingDeletePass(p)}
                                title="Hapus data"
                                className="w-8 h-8 rounded-lg hover:bg-coral-alert/15 text-coral-alert hover:text-coral-dark flex items-center justify-center transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State Display */}
                {filteredParticipants.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-text-muted mb-3">
                      <span className="material-symbols-outlined text-[28px]">
                        {totalCount === 0 ? 'group_off' : 'search_off'}
                      </span>
                    </div>
                    <h4 className="font-display text-[16px] font-bold text-on-surface">
                      {totalCount === 0
                        ? 'Belum Ada Peserta Terdaftar'
                        : 'Data Peserta Tidak Ditemukan'}
                    </h4>
                    <p className="text-[13px] text-text-muted max-w-sm mt-1">
                      {totalCount === 0
                        ? 'Data pendaftaran peserta Open House akan muncul di sini setelah pengunjung mendaftar.'
                        : 'Coba sesuaikan kata kunci pencarian, filter kehadiran, atau opsi trial class.'}
                    </p>
                    {totalCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setParticipantSearch('');
                          setParticipantStatusFilter('ALL');
                          setParticipantClassFilter('ALL');
                        }}
                        className="mt-3 px-4 h-9 rounded-xl bg-primary-container text-on-primary-container font-semibold text-[13px] cursor-pointer"
                      >
                        Reset Semua Filter
                      </button>
                    )}
                  </div>
                )}

                {/* Section 4: Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 bg-surface border-t border-border-subtle">
                  <span className="text-[12px] sm:text-[13px] text-text-muted order-2 sm:order-1">
                    Menampilkan{' '}
                    <strong className="text-on-surface font-semibold">
                      {filteredParticipants.length > 0 ? `1-${filteredParticipants.length}` : '0'}
                    </strong>{' '}
                    dari{' '}
                    <strong className="text-on-surface font-semibold">
                      {totalCount}
                    </strong>{' '}
                    peserta
                  </span>

                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={() =>
                        setParticipantPage((p) => Math.max(1, p - 1))
                      }
                      className="h-9 px-3 rounded-xl bg-canvas-admin hover:bg-surface-container text-text-muted hover:text-on-surface font-medium text-[12px] transition-all flex items-center gap-1 cursor-pointer border border-border-subtle"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        chevron_left
                      </span>
                      <span className="hidden sm:inline">Sebelumnya</span>
                    </button>

                    <button
                      type="button"
                      className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container font-semibold text-[13px] shadow-2xs transition-all"
                    >
                      {participantPage}
                    </button>

                    <button
                      type="button"
                      onClick={() => setParticipantPage((p) => p + 1)}
                      className="h-9 px-3 rounded-xl bg-canvas-admin hover:bg-surface-container text-text-muted hover:text-on-surface font-medium text-[12px] transition-all flex items-center gap-1 cursor-pointer border border-border-subtle"
                    >
                      <span className="hidden sm:inline">Berikutnya</span>
                      <span className="material-symbols-outlined text-[16px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
