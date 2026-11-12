import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  MapPin,
  Flame,
  Award
} from 'lucide-react';
import {
  AttendeePass,
  AttendeeRole,
  INFO_SOURCE_OPTIONS,
  InfoSourceType,
  School,
  TRIAL_CLASS_OPTIONS,
  TrialClassType,
  getSourceDetailOptions
} from '../types';

interface RegistrationViewProps {
  attendees: AttendeePass[];
  schools: School[];
  isLoadingSchools?: boolean;
  nextCouponCode: string;
  onRegister: (newPassData: {
    fullName: string;
    nisnOrNip?: string;
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
    const iconClass = `w-5 h-5 transition-transform duration-200 ${
      isSelected ? 'text-[#181b2b] scale-110' : 'text-[#5354ad]'
    }`;
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

  const getDetailSelectPlaceholder = (source: InfoSourceType): string => {
    if (source === 'Medsos') return '-- Pilih Media Sosial (Instagram / Facebook / TikTok) --';
    if (source === 'Banner') return '-- Pilih Lokasi Spanduk Promosi --';
    if (source === 'Event') return '-- Pilih Agenda Event --';
    return '-- Pilih Detail Sumber --';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedDetail = infoSourceDetail.trim();

    if (!trimmedName || trimmedName.length < 3) {
      setErrorMessage('Mohon isi nama lengkap peserta minimal 3 karakter.');
      return;
    }
    if (!schoolId) {
      setErrorMessage('Mohon pilih asal sekolah (SMA/SMK/MA/SMP).');
      return;
    }
    if (needsSourceDetail && !trimmedDetail) {
      setErrorMessage(`Mohon pilih Detail Sumber untuk pilihan "${infoSource}".`);
      return;
    }

    const selectedSchool = schools.find((s) => s.id === Number(schoolId));
    const schoolName = selectedSchool ? selectedSchool.name : '';

    const duplicate = attendees.find(
      (a) =>
        a.fullName.toLowerCase() === trimmedName.toLowerCase() &&
        a.schoolOrigin.toLowerCase() === schoolName.toLowerCase()
    );
    if (duplicate) {
      setErrorMessage(
        `Peserta "${trimmedName}" dari "${schoolName}" sudah terdaftar sebelumnya dengan kode kupon ${duplicate.couponCode}.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onRegister({
        fullName: trimmedName,
        nisnOrNip: '-',
        schoolId: Number(schoolId),
        schoolOrigin: schoolName,
        role,
        trialClass: role === 'Guru Pendamping' ? '-' : trialClass,
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
    <div className="w-full relative">
      {/* =================================================================== */}
      {/* AMBIENT FLOATING AURA GRADIENTS                                     */}
      {/* =================================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -35, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#9FA0FF]/25 blur-[90px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 25, 0],
            y: [0, 30, -25, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/4 -right-32 w-[450px] h-[450px] rounded-full bg-[#D5E8E6]/40 blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, 25, -30, 0],
            y: [0, 20, -15, 0],
            scale: [0.95, 1.1, 1, 0.95],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/3 left-1/4 w-[380px] h-[380px] rounded-full bg-[#ece1d1]/35 blur-[90px]"
        />
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: REFINED EDITORIAL HERO SECTION                           */}
      {/* =================================================================== */}
      <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
          {/* 12-Column Editorial Hero Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Left 7 Columns: Editorial Headline & Primary Actions */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 flex flex-col justify-between bg-white/95 backdrop-blur-sm rounded-[24px] sm:rounded-[28px] border border-[#E2E8F0] p-5 sm:p-8 lg:p-10 shadow-resting-card relative group hover:border-[#9FA0FF]/40 transition-colors duration-300"
            >
              <div className="space-y-4 sm:space-y-5">
                {/* Live Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4f2ff] border border-[#9FA0FF]/30 text-[12px] sm:text-[13px] font-semibold text-[#5354ad]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5354ad] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5354ad]" />
                  </span>
                  <span>Open House &amp; Trial Class 2026</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#5354ad]" />
                </div>

                <h1 className="font-display text-[26px] leading-[32px] sm:text-[38px] sm:leading-[46px] lg:text-[44px] lg:leading-[52px] font-extrabold text-[#181b2b] tracking-tight text-balance">
                  Welcome to the{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 underline decoration-[#9FA0FF] decoration-4 underline-offset-4">
                      Smiling Campus
                    </span>
                  </span>
                </h1>

                <p className="text-[14px] sm:text-[16px] lg:text-[17px] leading-[22px] sm:leading-[26px] text-[#464651] max-w-xl">
                  Kenali gedung baru <strong className="text-[#181b2b]">Kitchen &amp; Resto Edukasi</strong>, nikmati sajian <strong className="text-[#181b2b]">Free Flow Food &amp; Beverages</strong>, serta ikuti keseruan Trial Class, Semi Final MCBO, dan Mobile Legends Tournament Season 4.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 sm:pt-8 mt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <motion.button
                  type="button"
                  onClick={scrollToForm}
                  whileHover={{ scale: 1.025, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group h-[48px] sm:h-[52px] px-5 sm:px-7 rounded-xl bg-[#9FA0FF] hover:bg-[#8B8CF5] text-[#181b2b] font-display font-bold text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2.5 transition-all shadow-primary-glow cursor-pointer whitespace-nowrap"
                >
                  <span>Daftar &amp; Dapatkan Kode Kupon</span>
                  <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
                </motion.button>

                <motion.button
                  type="button"
                  onClick={scrollToAbout}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="group h-[48px] sm:h-[52px] px-5 sm:px-6 rounded-xl bg-[#F8FAFC] hover:bg-[#f4f2ff] text-[#181b2b] border border-[#E2E8F0] font-medium text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Baca Tentang Kegiatan</span>
                  <ArrowDown className="w-4 h-4 text-[#5354ad] shrink-0 transition-transform duration-200 group-hover:translate-y-0.5" />
                </motion.button>
              </div>
            </motion.div>

            {/* Right 5 Columns: Tactile Credential Pass Showcase Card */}
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.25 } }}
              className="lg:col-span-5 flex flex-col justify-between bg-[#181b2b] text-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 lg:p-8 shadow-floating-pass relative overflow-hidden group"
            >
              {/* Subtle Decorative Ambient Beam in Card */}
              <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-[#9FA0FF]/15 blur-2xl pointer-events-none group-hover:bg-[#9FA0FF]/25 transition-all duration-500" />

              <div className="space-y-3.5 sm:space-y-4 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-code text-[11px] sm:text-[12px] uppercase tracking-widest text-[#c1c1ff] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#9FA0FF]" />
                    OFFICIAL EVENT CREDENTIAL
                  </span>
                  <motion.span
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="px-2.5 sm:px-3 py-1 rounded-full bg-[#D5E8E6] text-[#181b2b] text-[11px] sm:text-[12px] font-bold shrink-0 shadow-2xs"
                  >
                    Free Flow F&amp;B
                  </motion.span>
                </div>

                <h2 className="font-display text-[20px] sm:text-[23px] font-bold leading-snug text-white">
                  Satu Kode Kupon untuk Seluruh Rangkaian Acara
                </h2>

                <p className="text-[13px] sm:text-[14px] leading-[20px] sm:leading-[21px] text-[#dfe1f9]/85">
                  Setiap calon peserta didik dan guru pendamping akan mendapatkan kode kupon unik untuk verifikasi kehadiran cepat di loket masuk.
                </p>
              </div>

              {/* Perforated Divider Inside Hero Card with Ticket Notches */}
              <div className="my-5 sm:my-6 relative z-10">
                <div className="border-t border-dashed border-white/20" />
              </div>

              {/* 2x2 Mini Preview of Trial Classes with tactile hover */}
              <div className="space-y-2.5 sm:space-y-3 relative z-10">
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-[#c1c1ff] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#c1c1ff]" />
                  4 Agenda Unggulan
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 text-[12px] sm:text-[13px]">
                  <motion.div
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.16)' }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2 cursor-default transition-colors"
                  >
                    <Laptop className="w-4 h-4 text-[#9FA0FF] shrink-0" />
                    <span className="font-medium leading-tight text-white/95">TRIAL CLASS IT (PPLG)</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.16)' }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2 cursor-default transition-colors"
                  >
                    <Palette className="w-4 h-4 text-[#9FA0FF] shrink-0" />
                    <span className="font-medium leading-tight text-white/95">TRIAL CLASS DKV</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.16)' }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2 cursor-default transition-colors"
                  >
                    <ChefHat className="w-4 h-4 text-[#D5E8E6] shrink-0" />
                    <span className="font-medium leading-tight text-white/95">TRIAL CLASS KULINER</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.16)' }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl bg-white/10 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2 cursor-default transition-colors"
                  >
                    <Gamepad2 className="w-4 h-4 text-[#D5E8E6] shrink-0" />
                    <span className="font-medium leading-tight text-white/95">TOURNAMENT MLBB S4</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Full-Width 4-Column Event Highlights Row Below Hero Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: MapPin,
                iconBg: 'bg-[#f4f2ff] text-[#5354ad]',
                label: 'Lokasi Utama',
                val: 'SMK Metland Cibitung',
              },
              {
                icon: ChefHat,
                iconBg: 'bg-[#D5E8E6]/60 text-[#506260]',
                label: 'Gedung & Jamuan',
                val: 'Kitchen, Resto & F&B',
              },
              {
                icon: Sparkles,
                iconBg: 'bg-[#ece1d1]/60 text-[#655d51]',
                label: 'Panggung Bakat',
                val: 'Semi Final MCBO Modeling',
              },
              {
                icon: Ticket,
                iconBg: 'bg-[#f4f2ff] text-[#32328a]',
                label: 'Kupon Berikutnya',
                val: nextCouponCode,
                isMono: true,
              },
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.45, delay: idx * 0.08, ease: 'easeOut' }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs hover:shadow-resting-card hover:border-[#9FA0FF]/40 transition-all duration-200 group cursor-default"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-[12px] text-[#64748B]">{item.label}</p>
                    <p
                      className={`${
                        item.isMono ? 'font-mono-code text-[#32328a]' : 'font-display text-[#181b2b]'
                      } text-[14px] sm:text-[15px] font-bold truncate`}
                    >
                      {item.val}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECTION 2: “WELCOME TO THE SMILING CAMPUS” DESCRIPTION SECTION      */}
      {/* =================================================================== */}
      <motion.section
        ref={aboutSectionRef}
        id="about-event-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 scroll-mt-16"
      >
        <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-[#E2E8F0] shadow-resting-card p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 hover:border-[#9FA0FF]/30 transition-colors">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-[#E2E8F0]">
            <div>
              <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-[#5354ad] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#5354ad]" />
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

          {/* 3-Paragraph Narrative Content */}
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

            <motion.div
              whileHover={{ scale: 1.008 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl bg-[#f4f2ff] border border-[#9FA0FF]/40 p-4 sm:p-6 transition-shadow hover:shadow-2xs"
            >
              <p className="text-[#181b2b] font-medium leading-[22px] sm:leading-[26px]">
                Tema <strong className="text-[#32328a]">“WELCOME TO THE SMILING CAMPUS”</strong> membawa pesan bahwa SMK Metland Cibitung adalah lingkungan belajar yang ramah, positif, aktif, dan menyenangkan—tempat setiap tamu disambut dengan hangat dan setiap peserta didik didorong untuk tumbuh, berkarya, serta berprestasi.
              </p>
            </motion.div>
          </div>

          {/* Bottom Transition Prompt to Form */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-[13px] sm:text-[14px] text-[#64748B]">
              Siap bergabung di acara ini? Lengkapi formulir kredensial di bawah untuk mendapatkan kode kupon unik Anda.
            </p>
            <motion.button
              type="button"
              onClick={scrollToForm}
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group h-[46px] sm:h-[48px] px-5 sm:px-6 rounded-xl bg-[#9FA0FF] hover:bg-[#8B8CF5] text-[#181b2b] font-display font-semibold text-[13px] sm:text-[14px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
            >
              <span>Lanjut ke Formulir Pendaftaran</span>
              <ArrowDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-1" />
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* =================================================================== */}
      {/* SECTION 3: FORM KREDENSIAL PESERTA (SCROLL TARGET)                  */}
      {/* =================================================================== */}
      <motion.section
        ref={formSectionRef}
        id="form-kredensial-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl lg:max-w-3xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 sm:pb-24 scroll-mt-16"
      >
        <div className="text-center mb-5 sm:mb-6">
          <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-[#5354ad] mb-1 flex items-center justify-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-[#5354ad]" />
            Langkah Registrasi Tiket
          </p>
          <h2 className="font-display text-[22px] sm:text-[26px] leading-[28px] sm:leading-[32px] font-bold text-[#181b2b]">
            Formulir Kredensial Peserta
          </h2>
          <p className="mt-1 text-[13px] sm:text-[14px] text-[#464651]">
            Isi data di bawah ini untuk menerbitkan kode kupon kehadiran Anda.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-resting-card p-5 sm:p-7 lg:p-8 space-y-5 sm:space-y-6 hover:border-[#9FA0FF]/30 transition-colors"
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

          {/* Animated Validation Error Alert */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                role="alert"
                className="rounded-xl bg-[#FF7171]/15 border border-[#FF7171] px-4 py-3 sm:py-3.5 flex items-start gap-3 text-[#E05353]"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-[13px] leading-[18px] font-medium">
                  {errorMessage}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <motion.button
                    key={optionRole}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setRole(optionRole)}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className={`min-h-[60px] sm:min-h-[64px] p-3 sm:p-3.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#9FA0FF] bg-[#9FA0FF]/15 text-[#181b2b] shadow-2xs'
                        : 'border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#181b2b]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
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
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#9FA0FF] text-[#181b2b] scale-105'
                          : 'border border-[#CBD5E1]'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
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

          {/* 3. Grid of Trial Class Cards (Smooth AnimatePresence toggle between Siswa and Guru) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b]">
                Pilih Sesi Trial Class
              </label>
              {role === 'Guru Pendamping' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[11px] sm:text-[12px] font-semibold text-[#506260] bg-[#D5E8E6] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Khusus Peserta Siswa
                </motion.span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {role === 'Guru Pendamping' ? (
                <motion.div
                  key="guru-pendamping-notice"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-2xs"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#D5E8E6] text-[#506260] flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display text-[14px] sm:text-[15px] font-bold text-[#181b2b]">
                      Sesi Trial Class Tidak Tersedia untuk Guru Pendamping
                    </h4>
                    <p className="text-[12px] sm:text-[13px] text-[#64748B] mt-1 leading-relaxed">
                      Sesi Trial Class (IT, DKV, Kuliner, atau MLBB) dikhususkan untuk calon peserta didik (siswa). Sebagai Guru Pendamping, Anda tidak memilih sesi trial class dan langsung terdaftar untuk akses penuh rangkaian Open House, pendampingan siswa, dan jamuan F&amp;B.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="siswa-trial-class-grid"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-label="Pilihan Trial Class"
                >
                  {TRIAL_CLASS_OPTIONS.map((tc) => {
                    const isSelected = trialClass === tc.id;
                    return (
                      <motion.button
                        key={tc.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setTrialClass(tc.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`min-h-[70px] sm:min-h-[76px] p-3 sm:p-3.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#9FA0FF] bg-[#9FA0FF]/15 text-[#181b2b] shadow-2xs'
                            : 'border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#181b2b]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
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
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#9FA0FF] text-[#181b2b] scale-105'
                              : 'border border-[#CBD5E1]'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Dropdown: Sumber Informasi & Conditional Dropdown: Detail Sumber */}
          <div className="pt-1">
            <div className={`grid grid-cols-1 ${needsSourceDetail ? 'sm:grid-cols-2' : ''} gap-4`}>
              <div>
                <label
                  htmlFor="select-info-source"
                  className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b] mb-1.5"
                >
                  Darimana kamu tahu SMK Metland?
                </label>
                <select
                  id="select-info-source"
                  value={infoSource}
                  onChange={(e) => {
                    const nextSource = e.target.value as InfoSourceType;
                    setInfoSource(nextSource);
                    setInfoSourceDetail('');
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

              <AnimatePresence>
                {needsSourceDetail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.24 }}
                  >
                    <label
                      htmlFor="select-source-detail"
                      className="block text-[14px] sm:text-[15px] font-medium text-[#181b2b] mb-1.5"
                    >
                      Pilih Detail Sumber ({infoSource})
                    </label>
                    <select
                      id="select-source-detail"
                      value={
                        getSourceDetailOptions(infoSource).find(
                          (opt) => opt.toLowerCase() === infoSourceDetail.toLowerCase()
                        ) || infoSourceDetail
                      }
                      onChange={(e) => setInfoSourceDetail(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 sm:px-4 rounded-xl bg-white border border-[#E2E8F0] focus:border-2 focus:border-[#9FA0FF] focus:outline-none text-[14px] sm:text-[15px] text-[#181b2b] transition-colors cursor-pointer"
                    >
                      <option value="" disabled>
                        {getDetailSelectPlaceholder(infoSource)}
                      </option>
                      {getSourceDetailOptions(infoSource).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Primary Submit Button */}
          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={isSubmitting ? {} : { scale: 1.015, y: -1 }}
              whileTap={isSubmitting ? {} : { scale: 0.985 }}
              className="group w-full h-[50px] sm:h-[52px] px-6 rounded-xl bg-[#9FA0FF] hover:bg-[#8B8CF5] text-[#181b2b] font-semibold text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2.5 transition-all shadow-primary-glow cursor-pointer whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#181b2b] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Menyiapkan Kupon Kamu...</span>
                </>
              ) : (
                <>
                  <span>Klaim Kode Kupon Sekarang</span>
                  <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1.5" />
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.section>
    </div>
  );
};
