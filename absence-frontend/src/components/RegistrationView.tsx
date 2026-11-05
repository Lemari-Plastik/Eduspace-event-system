import React, { useRef, useState } from 'react';
import {
  GraduationCap,
  UserCheck,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  Ticket,
  Laptop,
  Palette,
  ChefHat,
  Gamepad2,
  Sparkles,
  Calendar,
  MapPin
} from 'lucide-react';
import {
  AttendeePass,
  AttendeeRole,
  INFO_SOURCE_OPTIONS,
  InfoSourceType,
  School,
  TRIAL_CLASS_OPTIONS,
  TrialClassType
} from '../types';

interface RegistrationViewProps {
  attendees: AttendeePass[];
  schools: School[];
  isLoadingSchools?: boolean;
  nextCouponCode: string;
  onRegister: (newPassData: {
    fullName: string;
    nisnOrNip: string;
    schoolId: number;
    schoolOrigin: string;
    role: AttendeeRole;
    trialClass: TrialClassType;
    infoSource: InfoSourceType;
    infoSourceDetail?: string;
  }) => Promise<AttendeePass | void> | AttendeePass | void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  attendees,
  schools,
  isLoadingSchools = false,
  nextCouponCode,
  onRegister,
}) => {
  const aboutSectionRef = useRef<HTMLDivElement | null>(null);
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  const [role, setRole] = useState<AttendeeRole>('Siswa');
  const [fullName, setFullName] = useState('');
  const [nisnOrNip, setNisnOrNip] = useState('');
  const [schoolId, setSchoolId] = useState<number | ''>('');
  const [trialClass, setTrialClass] = useState<TrialClassType>('IT');
  const [infoSource, setInfoSource] = useState<InfoSourceType>('Medsos');
  const [infoSourceDetail, setInfoSourceDetail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsSourceDetail =
    infoSource === 'Medsos' || infoSource === 'Banner' || infoSource === 'Event';

  const scrollToAbout = () => {
    aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderTrialClassIcon = (id: TrialClassType, isSelected: boolean) => {
    const iconClass = `w-5 h-5 ${isSelected ? 'text-[#181b2b]' : 'text-[#5354ad]'}`;
    switch (id) {
      case 'IT':
        return <Laptop className={iconClass} />;
      case 'DKV':
        return <Palette className={iconClass} />;
      case 'KULINER':
        return <ChefHat className={iconClass} />;
      case 'MOBILE_LEGENDS':
        return <Gamepad2 className={iconClass} />;
    }
  };

  const getDetailPlaceholder = (source: InfoSourceType): string => {
    if (source === 'Medsos') return 'Contoh: Instagram @smkmetlandcibitung / TikTok';
    if (source === 'Banner') return 'Contoh: Spanduk Gerbang Sekolah / Jalan Utama';
    if (source === 'Event') return 'Contoh: EduFair Sekolah / Sosialisasi BK';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedNisn = nisnOrNip.trim();
    const trimmedDetail = infoSourceDetail.trim();

    if (!trimmedName || trimmedName.length < 3) {
      setErrorMessage('Mohon isi nama lengkap peserta minimal 3 karakter.');
      return;
    }
    if (!trimmedNisn) {
      setErrorMessage(
        role === 'Siswa'
          ? 'Mohon isi nomor NISN peserta.'
          : 'Mohon isi nomor NIP atau identitas Guru Pendamping.'
      );
      return;
    }
    if (!schoolId) {
      setErrorMessage('Mohon pilih asal sekolah (SMA/SMK/MA/SMP).');
      return;
    }
    if (needsSourceDetail && !trimmedDetail) {
      setErrorMessage(`Mohon lengkapi Detail Sumber untuk pilihan "${infoSource}".`);
      return;
    }

    const selectedSchool = schools.find((s) => s.id === Number(schoolId));
    const schoolName = selectedSchool ? selectedSchool.name : '';

    const duplicate = attendees.find(
      (a) =>
        a.nisnOrNip.toLowerCase() === trimmedNisn.toLowerCase() ||
        (a.fullName.toLowerCase() === trimmedName.toLowerCase() &&
          a.schoolOrigin.toLowerCase() === schoolName.toLowerCase())
    );
    if (duplicate) {
      setErrorMessage(
        `Peserta "${trimmedName}" sudah terdaftar sebelumnya dengan kode kupon ${duplicate.couponCode}.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onRegister({
        fullName: trimmedName,
        nisnOrNip: trimmedNisn,
        schoolId: Number(schoolId),
        schoolOrigin: schoolName,
        role,
        trialClass,
        infoSource,
        infoSourceDetail: needsSourceDetail ? trimmedDetail : undefined,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pendaftaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* =================================================================== */}
      {/* SECTION 1: REFINED EDITORIAL HERO SECTION                           */}
      {/* =================================================================== */}
      <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
          {/* 12-Column Editorial Hero Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Left 7 Columns: Editorial Headline & Primary Actions */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-[24px] sm:rounded-[28px] border border-[#E2E8F0] p-5 sm:p-8 lg:p-10 shadow-resting-card">
              <div className="space-y-4 sm:space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-[12px] sm:text-[13px] font-semibold text-[#5354ad]">
                  <span>SMK Metland Cibitung</span>
                  <span aria-hidden="true">·</span>
                  <span>Open House &amp; Trial Class 2026</span>
                </div>

                <h1 className="font-display text-[26px] leading-[32px] sm:text-[38px] sm:leading-[46px] lg:text-[44px] lg:leading-[52px] font-extrabold text-[#181b2b] tracking-tight text-balance">
                  Welcome to the{' '}
                  <span className="underline decoration-[#9FA0FF] decoration-4 underline-offset-4">
                    Smiling Campus
                  </span>
                </h1>

                <p className="text-[14px] sm:text-[16px] lg:text-[17px] leading-[22px] sm:leading-[26px] text-[#464651] max-w-xl">
                  Kenali gedung baru <strong className="text-[#181b2b]">Kitchen &amp; Resto Edukasi</strong>, nikmati sajian <strong className="text-[#181b2b]">Free Flow Food &amp; Beverages</strong>, serta ikuti keseruan Trial Class, Semi Final MCBO, dan Mobile Legends Tournament Season 4.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 sm:pt-8 mt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="h-[48px] sm:h-[52px] px-5 sm:px-7 rounded-xl bg-[#9FA0FF] hover:bg-[#7B7CE6] active:scale-[0.98] text-[#181b2b] font-display font-bold text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2.5 transition-all shadow-primary-glow cursor-pointer whitespace-nowrap"
                >
                  <span>Daftar &amp; Klaim Kupon QR</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={scrollToAbout}
                  className="h-[48px] sm:h-[52px] px-5 sm:px-6 rounded-xl bg-[#F8FAFC] hover:bg-[#f4f2ff] text-[#181b2b] border border-[#E2E8F0] font-medium text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Baca Tentang Kegiatan</span>
                  <ArrowDown className="w-4 h-4 text-[#5354ad] shrink-0" />
                </button>
              </div>
            </div>

            {/* Right 5 Columns: Tactile Credential Pass Showcase Card */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#181b2b] text-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 lg:p-8 shadow-floating-pass relative overflow-hidden">
              <div className="space-y-3.5 sm:space-y-4 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-code text-[11px] sm:text-[12px] uppercase tracking-widest text-[#c1c1ff]">
                    OFFICIAL EVENT CREDENTIAL
                  </span>
                  <span className="px-2.5 sm:px-3 py-1 rounded-full bg-[#D5E8E6] text-[#181b2b] text-[11px] sm:text-[12px] font-semibold shrink-0">
                    Free Flow F&amp;B
                  </span>
                </div>

                <h2 className="font-display text-[20px] sm:text-[23px] font-bold leading-snug text-white">
                  Satu QR Pass untuk Seluruh Rangkaian Acara
                </h2>

                <p className="text-[13px] sm:text-[14px] leading-[20px] sm:leading-[21px] text-[#dfe1f9]/85">
                  Setiap calon peserta didik dan guru pendamping akan mendapatkan kode kupon unik untuk verifikasi kehadiran cepat di loket masuk.
                </p>
              </div>

              {/* Perforated Divider Inside Hero Card */}
              <div className="my-5 sm:my-6 border-t border-dashed border-white/20 relative z-10" />

              {/* 2x2 Mini Preview of Trial Classes */}
              <div className="space-y-2.5 sm:space-y-3 relative z-10">
                <p className="text-[11px] sm:text-[12px] font-medium uppercase tracking-wider text-[#c1c1ff]">
                  4 Program Unggulan &amp; Kompetisi
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 text-[12px] sm:text-[13px]">
                  <div className="rounded-xl bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#9FA0FF] shrink-0" />
                    <span className="font-medium leading-tight">IT (PPLG)</span>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#9FA0FF] shrink-0" />
                    <span className="font-medium leading-tight">DKV</span>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-[#D5E8E6] shrink-0" />
                    <span className="font-medium leading-tight">Kuliner</span>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-[#D5E8E6] shrink-0" />
                    <span className="font-medium leading-tight">MLBB S4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Event Highlights Row Below Hero Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#f4f2ff] text-[#5354ad] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-[12px] text-[#64748B]">Lokasi Utama</p>
                <p className="font-display text-[14px] sm:text-[15px] font-bold text-[#181b2b] truncate">
                  SMK Metland Cibitung
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#D5E8E6]/60 text-[#506260] flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-[12px] text-[#64748B]">Gedung &amp; Jamuan</p>
                <p className="font-display text-[14px] sm:text-[15px] font-bold text-[#181b2b] truncate">
                  Kitchen, Resto &amp; F&amp;B
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#ece1d1]/60 text-[#655d51] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-[12px] text-[#64748B]">Panggung Bakat</p>
                <p className="font-display text-[14px] sm:text-[15px] font-bold text-[#181b2b] truncate">
                  Semi Final MCBO Modeling
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#f4f2ff] text-[#32328a] flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-[12px] text-[#64748B]">Kupon Berikutnya</p>
                <p className="font-mono-code text-[14px] sm:text-[15px] font-bold text-[#32328a] truncate">
                  {nextCouponCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECTION 2: “WELCOME TO THE SMILING CAMPUS” DESCRIPTION SECTION      */}
      {/* =================================================================== */}
      <section
        ref={aboutSectionRef}
        id="about-event-section"
        className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 scroll-mt-16"
      >
        <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-[#E2E8F0] shadow-resting-card p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-[#E2E8F0]">
            <div>
              <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-[#5354ad] mb-1">
                Pengantar Kegiatan Terpadu · SMK Metland Cibitung
              </p>
              <h2 className="font-display text-[22px] leading-[28px] sm:text-[28px] sm:leading-[36px] font-bold text-[#181b2b] text-balance">
                “WELCOME TO THE SMILING CAMPUS”
              </h2>
            </div>

            <span className="text-[12px] sm:text-[13px] font-medium text-[#64748B] shrink-0">
              Open House · Trial Class · MCBO · MLBB Season 4
            </span>
          </div>

          {/* 3-Paragraph Narrative Content from Colleague */}
          <div className="space-y-4 sm:space-y-5 text-[14px] sm:text-[16px] leading-[22px] sm:leading-[26px] text-[#181b2b]">
            <p className="text-[#181b2b]">
              <strong className="font-semibold text-[#32328a]">
                “WELCOME TO THE SMILING CAMPUS”
              </strong>{' '}
              merupakan kegiatan terpadu SMK Metland Cibitung yang dirancang untuk memperkenalkan lingkungan sekolah, fasilitas pembelajaran, program keahlian, serta aktivitas pengembangan minat dan bakat kepada calon peserta didik, orang tua, sekolah mitra/sister schools, dan masyarakat.
            </p>

            <p className="text-[#464651]">
              Melalui Open House, para undangan diajak mengenal bangunan baru berupa{' '}
              <strong className="font-medium text-[#181b2b]">
                kitchen dan resto edukasi
              </strong>{' '}
              sekaligus menikmati jamuan{' '}
              <strong className="font-medium text-[#181b2b]">
                free flow food and beverages
              </strong>
              . Pengalaman tersebut diperkuat melalui Trial Class pada kompetensi{' '}
              <strong className="font-medium text-[#181b2b]">
                Kuliner, Desain Komunikasi Visual (DKV), dan Information Technology (PPLG)
              </strong>
              . Pada saat yang sama,{' '}
              <strong className="font-medium text-[#181b2b]">
                Semi Final Metschoo Cool Beauty Outlook (MCBO)
              </strong>{' '}
              menjadi panggung pengembangan kepercayaan diri dan potensi modeling siswa, sedangkan{' '}
              <strong className="font-medium text-[#181b2b]">
                Mobile Legends Tournament Season 4
              </strong>{' '}
              menghadirkan ruang kompetisi dan kebersamaan.
            </p>

            <div className="rounded-2xl bg-[#f4f2ff] border border-[#9FA0FF]/40 p-4 sm:p-6">
              <p className="text-[#181b2b] font-medium leading-[22px] sm:leading-[26px]">
                Tema <strong className="text-[#32328a]">“WELCOME TO THE SMILING CAMPUS”</strong> membawa pesan bahwa SMK Metland Cibitung adalah lingkungan belajar yang ramah, positif, aktif, dan menyenangkan—tempat setiap tamu disambut dengan hangat dan setiap peserta didik didorong untuk tumbuh, berkarya, serta berprestasi.
              </p>
            </div>
          </div>

          {/* Bottom Transition Prompt to Form */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-[13px] sm:text-[14px] text-[#64748B]">
              Siap bergabung di acara ini? Lengkapi formulir kredensial di bawah untuk mendapatkan tiket QR Anda.
            </p>
            <button
              type="button"
              onClick={scrollToForm}
              className="h-[46px] sm:h-[48px] px-5 sm:px-6 rounded-xl bg-[#9FA0FF] hover:bg-[#7B7CE6] text-[#181b2b] font-display font-semibold text-[13px] sm:text-[14px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Lanjut ke Formulir Pendaftaran</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECTION 3: FORM KREDENSIAL PESERTA (SCROLL TARGET)                  */}
      {/* =================================================================== */}
      <section
        ref={formSectionRef}
        id="form-kredensial-section"
        className="max-w-2xl lg:max-w-3xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 sm:pb-24 scroll-mt-16"
      >
        <div className="text-center mb-5 sm:mb-6">
          <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-[#5354ad] mb-1">
            Langkah Registrasi Tiket
          </p>
          <h2 className="font-display text-[22px] sm:text-[26px] leading-[28px] sm:leading-[32px] font-bold text-[#181b2b]">
            Formulir Kredensial Peserta
          </h2>
          <p className="mt-1 text-[13px] sm:text-[14px] text-[#464651]">
            Isi data di bawah ini untuk menerbitkan QR Pass kehadiran Anda.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-resting-card p-5 sm:p-7 lg:p-8 space-y-5 sm:space-y-6"
        >
          <div className="flex items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h3 className="font-display text-[18px] sm:text-[20px] leading-[26px] sm:leading-[28px] font-semibold text-[#181b2b]">
                Data Kredensial Peserta
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#64748B]">
                Kode kupon otomatis:{' '}
                <span className="font-mono-code font-bold text-[#32328a]">
                  {nextCouponCode}
                </span>
              </p>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#9FA0FF]/20 flex items-center justify-center text-[#32328a] shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
          </div>

          {/* Validation Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl bg-[#FF7171]/15 border border-[#FF7171] px-4 py-3 sm:py-3.5 flex items-start gap-3 text-[#E05353]"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-[13px] leading-[18px] font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          {/* 1. Role Selection Cards (Siswa vs Guru Pendamping) */}
          <div className="space-y-2">
            <label className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b]">
              Pilih Peran Peserta
            </label>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Peran Kehadiran"
            >
              {(['Siswa', 'Guru Pendamping'] as AttendeeRole[]).map((optionRole) => {
                const isSelected = role === optionRole;
                return (
                  <button
                    key={optionRole}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setRole(optionRole)}
                    className={`min-h-[60px] sm:min-h-[64px] p-3 sm:p-3.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#9FA0FF] bg-[#9FA0FF]/15 text-[#181b2b]'
                        : 'border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#181b2b]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#9FA0FF] text-[#181b2b]'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}
                      >
                        {optionRole === 'Siswa' ? (
                          <GraduationCap className="w-5 h-5" />
                        ) : (
                          <UserCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[14px] sm:text-[15px] font-semibold leading-tight">
                          {optionRole === 'Siswa' ? 'Siswa' : 'Guru'}
                        </div>
                        <div className="text-[11px] sm:text-[12px] text-[#64748B]">
                          {optionRole === 'Siswa' ? 'Peserta Didik' : 'Pendamping'}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#9FA0FF] text-[#181b2b]'
                          : 'border border-[#CBD5E1]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Personal & School Details */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="input-fullname"
                className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b] mb-1.5"
              >
                Nama Lengkap Peserta
              </label>
              <input
                id="input-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={
                  role === 'Siswa'
                    ? 'Contoh: Ahmad Rizky Pratama'
                    : 'Contoh: Dra. Nurhayati, M.Pd.'
                }
                className="w-full min-h-[48px] px-3.5 sm:px-4 rounded-xl bg-white border border-[#E2E8F0] focus:border-2 focus:border-[#9FA0FF] focus:outline-none text-[14px] sm:text-[15px] text-[#181b2b] placeholder:text-[#64748B] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="input-nisn"
                  className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b] mb-1.5"
                >
                  {role === 'Siswa'
                    ? 'Nomor Induk Siswa Nasional (NISN)'
                    : 'Nomor Induk Pegawai (NIP)'}
                </label>
                <input
                  id="input-nisn"
                  type="text"
                  value={nisnOrNip}
                  onChange={(e) => setNisnOrNip(e.target.value)}
                  placeholder={
                    role === 'Siswa' ? 'Contoh: 0067891234' : 'Contoh: 197805122005012004'
                  }
                  className="w-full min-h-[48px] px-3.5 sm:px-4 rounded-xl bg-white border border-[#E2E8F0] focus:border-2 focus:border-[#9FA0FF] focus:outline-none font-mono-code text-[14px] sm:text-[15px] text-[#181b2b] placeholder:text-[#64748B] transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="select-school"
                  className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b] mb-1.5"
                >
                  Asal Sekolah / Institusi
                </label>
                {isLoadingSchools ? (
                  <div className="w-full min-h-[48px] px-3.5 sm:px-4 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-center text-[13px] text-[#64748B] animate-pulse">
                    Memuat daftar sekolah...
                  </div>
                ) : (
                  <select
                    id="select-school"
                    value={schoolId}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      setSchoolId(val);
                    }}
                    className="w-full min-h-[48px] px-3.5 sm:px-4 rounded-xl bg-white border border-[#E2E8F0] focus:border-2 focus:border-[#9FA0FF] focus:outline-none text-[14px] sm:text-[15px] text-[#181b2b] transition-colors cursor-pointer"
                  >
                    <option value="">-- Pilih Asal Sekolah ({schools.length} sekolah terdaftar) --</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* 3. Grid of Trial Class Cards */}
          <div className="space-y-2 pt-1">
            <label className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b]">
              Pilih Sesi Trial Class
            </label>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Pilihan Trial Class"
            >
              {TRIAL_CLASS_OPTIONS.map((tc) => {
                const isSelected = trialClass === tc.id;
                return (
                  <button
                    key={tc.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setTrialClass(tc.id)}
                    className={`min-h-[70px] sm:min-h-[76px] p-3 sm:p-3.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#9FA0FF] bg-[#9FA0FF]/15 text-[#181b2b] shadow-2xs'
                        : 'border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#181b2b]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#9FA0FF]' : 'bg-[#F1F5F9]'
                        }`}
                      >
                        {renderTrialClassIcon(tc.id, isSelected)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[13px] sm:text-[14px] font-bold leading-tight">
                          {tc.label}
                        </div>
                        <div className="text-[11px] sm:text-[12px] text-[#64748B] leading-tight mt-0.5 break-words">
                          {tc.subtitle}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#9FA0FF] text-[#181b2b]'
                          : 'border border-[#CBD5E1]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Dropdown: Sumber Informasi & Conditional Input: Detail Sumber */}
          <div className="pt-1">
            <div className={`grid grid-cols-1 ${needsSourceDetail ? 'sm:grid-cols-2' : ''} gap-4`}>
              <div>
                <label
                  htmlFor="select-info-source"
                  className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b] mb-1.5"
                >
                  Sumber Informasi
                </label>
                <select
                  id="select-info-source"
                  value={infoSource}
                  onChange={(e) => {
                    const nextSource = e.target.value as InfoSourceType;
                    setInfoSource(nextSource);
                    if (
                      nextSource !== 'Medsos' &&
                      nextSource !== 'Banner' &&
                      nextSource !== 'Event'
                    ) {
                      setInfoSourceDetail('');
                    }
                  }}
                  className="w-full min-h-[48px] px-3.5 sm:px-4 rounded-xl bg-white border border-[#E2E8F0] focus:border-2 focus:border-[#9FA0FF] focus:outline-none text-[14px] sm:text-[15px] text-[#181b2b] transition-colors cursor-pointer"
                >
                  {INFO_SOURCE_OPTIONS.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              {needsSourceDetail && (
                <div>
                  <label
                    htmlFor="input-source-detail"
                    className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b] mb-1.5"
                  >
                    Detail Sumber ({infoSource})
                  </label>
                  <input
                    id="input-source-detail"
                    type="text"
                    value={infoSourceDetail}
                    onChange={(e) => setInfoSourceDetail(e.target.value)}
                    placeholder={getDetailPlaceholder(infoSource)}
                    className="w-full min-h-[48px] px-3.5 sm:px-4 rounded-xl bg-white border border-[#E2E8F0] focus:border-2 focus:border-[#9FA0FF] focus:outline-none text-[14px] sm:text-[15px] text-[#181b2b] placeholder:text-[#64748B] transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Primary Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[50px] sm:h-[52px] px-6 rounded-xl bg-[#9FA0FF] hover:bg-[#7B7CE6] active:scale-[0.98] text-[#181b2b] font-semibold text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2.5 transition-all shadow-primary-glow cursor-pointer whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#181b2b] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Menyiapkan Kupon Kamu...</span>
                </>
              ) : (
                <>
                  <span>Klaim Tiket &amp; Kupon QR Sekarang</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
