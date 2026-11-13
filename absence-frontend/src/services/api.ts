import {
  AttendeePass,
  BackendAdmin,
  BackendParticipant,
  DEFAULT_SCHOOLS,
  InfoSourceType,
  School,
  TrialClassType,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    if (data?.errors) {
      this.errors = data.errors;
    }
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMessage = 'Terjadi kesalahan pada sistem.';
    if (typeof data === 'object' && data !== null) {
      if (data.message) {
        errorMessage = data.message;
      }
      if (data.errors && typeof data.errors === 'object') {
        const firstErrorKey = Object.keys(data.errors)[0];
        if (firstErrorKey && Array.isArray(data.errors[firstErrorKey]) && data.errors[firstErrorKey].length > 0) {
          errorMessage = data.errors[firstErrorKey][0];
        }
      }
    } else if (typeof data === 'string' && data.length > 0) {
      errorMessage = data;
    }

    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}

export function formatTimestampWib(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} WIB`;
  } catch {
    return isoString || '';
  }
}

export function formatTimestampWithSecondsWib(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} WIB`;
  } catch {
    return isoString || '';
  }
}

export function mapBackendToAttendeePass(p: BackendParticipant): AttendeePass {
  return {
    id: String(p.id),
    couponCode: p.coupon_code,
    fullName: p.name,
    nisnOrNip: p.identity_number,
    schoolOrigin: p.school?.name || `Sekolah #${p.school_id}`,
    schoolId: p.school_id,
    role: p.role === 'guru_pendamping' ? 'Guru Pendamping' : 'Siswa',
    trialClass: p.trial_class,
    infoSource: (p.referral_source as InfoSourceType) || 'Website',
    infoSourceDetail: p.referral_detail || undefined,
    registrationSource: 'Reg-Online',
    status: p.is_redeemed ? 'REDEEMED' : 'UNREDEEMED',
    registeredAt: formatTimestampWib(p.created_at) || 'Baru saja',
    checkedInAt: p.redeemed_at ? formatTimestampWib(p.redeemed_at) : undefined,
  };
}

export const api = {
  /**
   * Get list of schools for registration dropdown
   */
  async getSchools(): Promise<School[]> {
    try {
      const res = await request<any>('/schools');
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.length > 0 ? list : DEFAULT_SCHOOLS;
    } catch {
      return DEFAULT_SCHOOLS;
    }
  },

  /**
   * Public participant registration
   */
  async registerParticipant(data: {
    role: 'siswa' | 'guru_pendamping';
    name: string;
    identity_number?: string;
    school_id?: number;
    custom_school_name?: string | null;
    trial_class: TrialClassType;
    referral_source: string;
    referral_detail?: string | null;
  }): Promise<BackendParticipant> {
    const res = await request<any>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data ? res.data : res;
  },

  /**
   * Admin Login
   */
  async adminLogin(credentials: {
    username: string;
    password: string;
  }): Promise<{
    token: string;
    token_type: string;
    admin: BackendAdmin;
  }> {
    return await request<{
      token: string;
      token_type: string;
      admin: BackendAdmin;
    }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Get authenticated admin user
   */
  async adminGetMe(token: string): Promise<BackendAdmin> {
    const res = await request<any>('/admin/me', {}, token);
    return res.data ? res.data : res;
  },

  /**
   * Admin Logout
   */
  async adminLogout(token: string): Promise<{ message: string }> {
    return await request<{ message: string }>(
      '/admin/logout',
      {
        method: 'POST',
      },
      token
    );
  },

  /**
   * Admin Scan / Redeem Coupon
   */
  async scanCoupon(
    token: string,
    couponCode: string
  ): Promise<{
    message: string;
    data: BackendParticipant;
  }> {
    const res = await request<any>(
      '/admin/coupons/scan',
      {
        method: 'POST',
        body: JSON.stringify({ coupon_code: couponCode }),
      },
      token
    );
    const participantData = res.data || res.participant || res;
    return {
      message: res.message || 'Coupon successfully redeemed',
      data: participantData,
    };
  },

  /**
   * Admin get participants list
   */
  async getParticipants(
    token: string,
    params?: {
      search?: string;
      is_redeemed?: boolean;
      per_page?: number;
      page?: number;
    }
  ): Promise<{
    data: BackendParticipant[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.is_redeemed !== undefined)
      query.append('is_redeemed', params.is_redeemed ? '1' : '0');
    if (params?.per_page) query.append('per_page', String(params.per_page));
    if (params?.page) query.append('page', String(params.page));

    const qs = query.toString();
    const endpoint = `/admin/participants${qs ? `?${qs}` : ''}`;

    const res = await request<any>(endpoint, {}, token);
    if (Array.isArray(res)) {
      return { data: res };
    }
    return {
      data: Array.isArray(res.data) ? res.data : [],
      meta: res.meta,
    };
  },

  /**
   * Admin manual walk-in participant registration
   */
  async adminRegisterParticipant(
    token: string,
    data: {
      role: 'siswa' | 'guru_pendamping';
      name: string;
      identity_number?: string;
      school_id?: number;
      custom_school_name?: string | null;
      trial_class: TrialClassType;
      referral_source: string;
      referral_detail?: string | null;
    }
  ): Promise<BackendParticipant> {
    const res = await request<any>(
      '/admin/participants',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    );
    return res.data ? res.data : res;
  },

  /**
   * Admin delete participant
   */
  async deleteParticipant(
    token: string,
    id: number | string
  ): Promise<{ message: string }> {
    return await request<{ message: string }>(
      `/admin/participants/${id}`,
      {
        method: 'DELETE',
      },
      token
    );
  },
};
