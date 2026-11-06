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
  'Lainnya',
];

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

export const INITIAL_ATTENDEES: AttendeePass[] = [];

export const INITIAL_SCAN_LOGS: ScanLogEntry[] = [];
