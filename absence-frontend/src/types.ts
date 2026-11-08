export type AttendeeRole = 'Siswa' | 'Guru Pendamping';

export type PassStatus = 'UNREDEEMED' | 'REDEEMED';

export type TrialClassType = 'IT' | 'DKV' | 'KULINER' | 'MOBILE_LEGENDS' | '-' | 'NONE';

export type InfoSourceType =
  | 'Medsos'
  | 'Banner'
  | 'Event'
  | 'Teman'
  | 'Guru'
  | 'Website'
  | 'Promosi/Presentasi'
  | 'Lainnya';

export interface TrialClassMeta {
  id: TrialClassType;
  label: string;
  subtitle: string;
}

export const TRIAL_CLASS_OPTIONS: TrialClassMeta[] = [
  { id: 'IT', label: 'IT', subtitle: 'Web, App & IoT' },
  { id: 'DKV', label: 'DKV', subtitle: 'Desain & Animasi' },
  { id: 'KULINER', label: 'KULINER', subtitle: 'Tata Boga & Pastry' },
  { id: 'MOBILE_LEGENDS', label: 'MOBILE LEGENDS', subtitle: 'Esports Strategy' },
];

export const INFO_SOURCE_OPTIONS: InfoSourceType[] = [
  'Medsos',
  'Banner',
  'Event',
  'Teman',
  'Guru',
  'Website',
  'Promosi/Presentasi',
  'Lainnya',
];

export const SOURCE_DETAIL_OPTIONS: Record<'Medsos' | 'Banner' | 'Event', string[]> = {
  Medsos: [
    'Instagram',
    'Facebook',
    'TikTok',
  ],
  Banner: [
    'Spanduk Promosi di area Taman Aster',
    'Spanduk Promosi di Palang Perlintasan Rel Kereta Telaga Murni',
  ],
  Event: [
    'Gen z Indonesia 2026 di Platinum Cineplex Millenia Hub Metland Cibitung (2026)',
    'Sambut Generasi Cinta Prestasi di PLatinum Cineplex Millenia Hub Metland Cibitung (2026)',
    'Metschoorama 2026 di SMK Metland Cibitung',
    'Education workshop x MLBB Tournament di SMK Metland Cibitung (2025)',
  ],
};

export function getSourceDetailOptions(source: string): string[] {
  if (source === 'Medsos' || source === 'Banner' || source === 'Event') {
    return SOURCE_DETAIL_OPTIONS[source];
  }
  return [];
}

export interface School {
  id: number;
  name: string;
}

export interface BackendParticipant {
  id: number;
  role: 'siswa' | 'guru_pendamping';
  name: string;
  identity_number: string;
  school_id: number;
  school?: School;
  trial_class: TrialClassType;
  referral_source: string;
  referral_detail: string | null;
  coupon_code: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  redeemed_by: number | null;
  redeemed_by_admin?: {
    id: number;
    name: string;
    username: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface BackendAdmin {
  id: number;
  name: string;
  username: string;
}

export interface AttendeePass {
  id: string;
  couponCode: string; // e.g., ABSC-0001
  fullName: string;
  nisnOrNip: string;
  schoolOrigin: string;
  schoolId?: number;
  role: AttendeeRole;
  trialClass: TrialClassType;
  infoSource: InfoSourceType;
  infoSourceDetail?: string;
  registrationSource: 'Reg-Online' | 'Walk-In';
  status: PassStatus;
  registeredAt: string;
  checkedInAt?: string;
}

export interface ScanLogEntry {
  id: string;
  timestamp: string;
  relativeTime: string;
  couponCode: string;
  fullName: string;
  schoolOrigin: string;
  role: AttendeeRole;
  trialClass: TrialClassType;
  infoSource: InfoSourceType;
  infoSourceDetail?: string;
  scanMethod: 'auto' | 'manual';
  status: 'success' | 'rejected' | 'manual';
  statusText: string;
  subStatusText?: string;
  deskName: string;
  verifierNote: string;
}

export interface ScanFeedback {
  id: string;
  type: 'success' | 'duplicate' | 'invalid';
  title: string;
  message: string;
  codeScanned: string;
  pass?: AttendeePass;
  timestamp: string;
}

export const EDUPASS_LOGO_URL = '/logo.png';

export const DEFAULT_SCHOOLS: School[] = [
  { id: 1, name: 'SMK Metland Cibitung' },
  { id: 2, name: 'SMK Negeri 1 Jakarta' },
  { id: 3, name: 'SMK Negeri 2 Jakarta' },
  { id: 4, name: 'SMA Negeri 1 Jakarta' },
  { id: 5, name: 'SMA Negeri 8 Jakarta' },
  { id: 6, name: 'SMK Telkom' },
  { id: 7, name: 'SMK Taruna Bhakti' },
  { id: 8, name: 'SMP Negeri 1 Cibitung' },
  { id: 9, name: 'SMP Negeri 2 Cibitung' },
  { id: 10, name: 'SMA Negeri 1 Tambun' },
];

export const INITIAL_ATTENDEES: AttendeePass[] = [
  {
    id: '1',
    couponCode: 'ABSC-0001',
    fullName: 'Ahmad Rizky Pratama',
    nisnOrNip: '0067891234',
    schoolOrigin: 'SMK Negeri 1 Jakarta',
    schoolId: 2,
    role: 'Siswa',
    trialClass: 'DKV',
    infoSource: 'Medsos',
    infoSourceDetail: 'Instagram @edupass.id',
    registrationSource: 'Reg-Online',
    status: 'REDEEMED',
    registeredAt: '07:45 WIB',
    checkedInAt: '09:15 WIB',
  },
  {
    id: '2',
    couponCode: 'ABSC-0002',
    fullName: 'Dra. Nurhayati, M.Pd.',
    nisnOrNip: '197805122005012004',
    schoolOrigin: 'SMP Negeri 1 Cibitung',
    schoolId: 8,
    role: 'Guru Pendamping',
    trialClass: '-',
    infoSource: 'Event',
    infoSourceDetail: 'Sosialisasi Sekolah',
    registrationSource: 'Reg-Online',
    status: 'UNREDEEMED',
    registeredAt: '07:50 WIB',
  },
  {
    id: '3',
    couponCode: 'ABSC-0003',
    fullName: 'Kevin Sanjaya Pratama',
    nisnOrNip: '0071298455',
    schoolOrigin: 'SMP Negeri 2 Cibitung',
    schoolId: 9,
    role: 'Siswa',
    trialClass: 'MOBILE_LEGENDS',
    infoSource: 'Teman',
    registrationSource: 'Walk-In',
    status: 'REDEEMED',
    registeredAt: '08:02 WIB',
    checkedInAt: '08:42 WIB',
  },
  {
    id: '4',
    couponCode: 'ABSC-0004',
    fullName: 'Siti Sarah Zahira',
    nisnOrNip: '0069384721',
    schoolOrigin: 'SMK Metland Cibitung',
    schoolId: 1,
    role: 'Siswa',
    trialClass: 'KULINER',
    infoSource: 'Banner',
    registrationSource: 'Reg-Online',
    status: 'UNREDEEMED',
    registeredAt: '08:15 WIB',
  },
];

export const INITIAL_SCAN_LOGS: ScanLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '09:15:20 WIB',
    relativeTime: 'Baru saja',
    couponCode: 'ABSC-0001',
    fullName: 'Ahmad Rizky Pratama',
    schoolOrigin: 'SMK Negeri 1 Jakarta',
    role: 'Siswa',
    trialClass: 'DKV',
    infoSource: 'Medsos',
    scanMethod: 'auto',
    status: 'success',
    statusText: '200 Valid',
    deskName: 'Admin Loket 01',
    verifierNote: 'Scan Terverifikasi',
  },
  {
    id: 'log-2',
    timestamp: '08:42:10 WIB',
    relativeTime: '30 menit lalu',
    couponCode: 'ABSC-0003',
    fullName: 'Kevin Sanjaya Pratama',
    schoolOrigin: 'SMP Negeri 2 Cibitung',
    role: 'Siswa',
    trialClass: 'MOBILE_LEGENDS',
    infoSource: 'Teman',
    scanMethod: 'manual',
    status: 'manual',
    statusText: '200 Valid',
    deskName: 'Admin Loket 01',
    verifierNote: 'Input Manual Loket',
  },
];
