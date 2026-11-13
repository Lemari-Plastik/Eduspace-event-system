/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  ArrowLeft,
  Ticket,
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  AttendeePass,
  AttendeeRole,
  BackendAdmin,
  DEFAULT_SCHOOLS,
  InfoSourceType,
  INITIAL_ATTENDEES,
  INITIAL_SCAN_LOGS,
  ScanFeedback,
  ScanLogEntry,
  School,
  TrialClassType,
} from './types';
import { RegistrationView } from './components/RegistrationView';
import { DigitalPassCard } from './components/DigitalPassCard';
import { AdminPageId, AdminScannerDesk } from './components/AdminScannerDesk';
import { ScannerModal } from './components/ScannerModal';
import {
  api,
  formatTimestampWib,
  formatTimestampWithSecondsWib,
  mapBackendToAttendeePass,
} from './services/api';

type UserRoleMode = 'user' | 'admin';

const STORAGE_KEY_ATTENDEES = 'edupass_openhouse_attendees_v6';
const STORAGE_KEY_LOGS = 'edupass_openhouse_logs_v5';
const STORAGE_KEY_MY_PASS_ID = 'edupass_openhouse_my_pass_id_v4';
const STORAGE_KEY_MY_PASS_DATA = 'edupass_saved_pass_data';
const STORAGE_KEY_ROLE_MODE = 'edupass_role_mode';
const STORAGE_KEY_OFFLINE_ADMIN = 'edupass_offline_admin';

export default function App() {
  const [roleMode, setRoleMode] = useState<UserRoleMode>(() => {
    try {
      const savedRole = localStorage.getItem(STORAGE_KEY_ROLE_MODE);
      const token = localStorage.getItem('admin_token');
      const isOffline = localStorage.getItem(STORAGE_KEY_OFFLINE_ADMIN) === 'true';
      if (savedRole === 'admin' && (token || isOffline)) {
        return 'admin';
      }
    } catch {
      // Fallback
    }
    return 'user';
  });

  const [adminPage, setAdminPage] = useState<AdminPageId>('admin-participants');

  // Admin Auth state
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('admin_token');
    } catch {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState<BackendAdmin | null>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY_OFFLINE_ADMIN) === 'true') {
        return { id: 1, name: 'Admin Loket', username: 'admin' };
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Schools state
  const [schools, setSchools] = useState<School[]>(DEFAULT_SCHOOLS);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

  // Attendees & Logs state (with LocalStorage cache and resilience)
  const [attendees, setAttendees] = useState<AttendeePass[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATTENDEES);
      let list: AttendeePass[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }
      if (list.length === 0) {
        list = [...INITIAL_ATTENDEES];
      }
      // Ensure myCreatedPass (if saved in localStorage) is always part of attendees list
      const myPassData = localStorage.getItem(STORAGE_KEY_MY_PASS_DATA);
      if (myPassData) {
        const myPass: AttendeePass = JSON.parse(myPassData);
        if (myPass && myPass.couponCode) {
          const exists = list.some(
            (a) => a.couponCode.toUpperCase() === myPass.couponCode.toUpperCase()
          );
          if (!exists) {
            list.unshift(myPass);
          }
        }
      }
      return list;
    } catch {
      return INITIAL_ATTENDEES;
    }
  });

  const [isRefreshingParticipants, setIsRefreshingParticipants] = useState(false);

  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_SCAN_LOGS;
  });

  // Regular user ticket state
  const [myCreatedPassId, setMyCreatedPassId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MY_PASS_ID);
    } catch {
      return null;
    }
  });

  const [myCreatedPass, setMyCreatedPass] = useState<AttendeePass | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MY_PASS_DATA);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const [userStep, setUserStep] = useState<'form' | 'my-ticket'>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MY_PASS_ID) ? 'my-ticket' : 'form';
    } catch {
      return 'form';
    }
  });

  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);

  // Sync roleMode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROLE_MODE, roleMode);
    } catch {
      // Ignore
    }
  }, [roleMode]);

  // Sync attendees to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ATTENDEES, JSON.stringify(attendees));
    } catch {
      // Ignore
    }
  }, [attendees]);

  // Sync scan logs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(scanLogs));
    } catch {
      // Ignore
    }
  }, [scanLogs]);

  // Sync my ticket
  useEffect(() => {
    try {
      if (myCreatedPassId) {
        localStorage.setItem(STORAGE_KEY_MY_PASS_ID, myCreatedPassId);
      } else {
        localStorage.removeItem(STORAGE_KEY_MY_PASS_ID);
      }
    } catch {
      // Ignore
    }
  }, [myCreatedPassId]);

  useEffect(() => {
    try {
      if (myCreatedPass) {
        localStorage.setItem(STORAGE_KEY_MY_PASS_DATA, JSON.stringify(myCreatedPass));
      } else {
        localStorage.removeItem(STORAGE_KEY_MY_PASS_DATA);
      }
    } catch {
      // Ignore
    }
  }, [myCreatedPass]);

  // Initial data loading from backend
  useEffect(() => {
    const initializeData = async () => {
      // 1. Fetch schools list from database
      try {
        setIsLoadingSchools(true);
        const schoolList = await api.getSchools();
        setSchools(schoolList && schoolList.length > 0 ? schoolList : DEFAULT_SCHOOLS);
      } catch (err) {
        console.error('Failed to load schools from backend:', err);
        setSchools(DEFAULT_SCHOOLS);
      } finally {
        setIsLoadingSchools(false);
      }

      // 2. Validate admin session if token exists
      const savedToken = localStorage.getItem('admin_token');
      if (savedToken) {
        try {
          const me = await api.adminGetMe(savedToken);
          setAdminToken(savedToken);
          setAdminUser(me);

          // If user refreshed while on admin page, maintain admin mode
          const savedRole = localStorage.getItem(STORAGE_KEY_ROLE_MODE);
          if (savedRole === 'admin') {
            setRoleMode('admin');
          }

          // Fetch participants list for admin and merge with local
          const parts = await api.getParticipants(savedToken, { per_page: 150 });
          if (parts?.data && parts.data.length > 0) {
            const backendPasses = parts.data.map(mapBackendToAttendeePass);
            setAttendees((prev) => {
              const map = new Map<string, AttendeePass>();
              backendPasses.forEach((p) => map.set(p.couponCode.toUpperCase(), p));
              prev.forEach((p) => {
                if (!map.has(p.couponCode.toUpperCase())) {
                  map.set(p.couponCode.toUpperCase(), p);
                }
              });
              return Array.from(map.values());
            });
          }
        } catch (err: any) {
          console.error('Session validation error:', err);
          // Only clear if it is 401 Unauthorized (invalid/expired token)
          if (err?.status === 401) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem(STORAGE_KEY_ROLE_MODE);
            localStorage.removeItem(STORAGE_KEY_OFFLINE_ADMIN);
            setAdminToken(null);
            setAdminUser(null);
            setRoleMode('user');
          }
        }
      } else {
        // If offline admin session is saved
        const isOffline = localStorage.getItem(STORAGE_KEY_OFFLINE_ADMIN) === 'true';
        const savedRole = localStorage.getItem(STORAGE_KEY_ROLE_MODE);
        if (isOffline && savedRole === 'admin') {
          setAdminUser({ id: 1, name: 'Admin Loket', username: 'admin' });
          setRoleMode('admin');
        }
      }
    };

    initializeData();
  }, []);

  const openLoginModal = () => {
    setAdminUsername('');
    setAdminPassword('');
    setShowPassword(false);
    setLoginError(null);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginError(null);
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = adminUsername.trim();
    const cleanPass = adminPassword;
    if (!cleanUser || !cleanPass) {
      setLoginError('Mohon isi username dan password admin.');
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await api.adminLogin({
        username: cleanUser,
        password: cleanPass,
      });

      setAdminToken(res.token);
      setAdminUser(res.admin);
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem(STORAGE_KEY_ROLE_MODE, 'admin');
      localStorage.removeItem(STORAGE_KEY_OFFLINE_ADMIN);
      setIsLoginModalOpen(false);
      setAdminUsername('');
      setAdminPassword('');
      setRoleMode('admin');

      // Load participants list
      try {
        const parts = await api.getParticipants(res.token, { per_page: 150 });
        if (parts?.data) {
          const backendPasses = parts.data.map(mapBackendToAttendeePass);
          setAttendees((prev) => {
            const map = new Map<string, AttendeePass>();
            backendPasses.forEach((p) => map.set(p.couponCode.toUpperCase(), p));
            prev.forEach((p) => {
              if (!map.has(p.couponCode.toUpperCase())) {
                map.set(p.couponCode.toUpperCase(), p);
              }
            });
            return Array.from(map.values());
          });
        }
      } catch (fetchErr) {
        console.error('Failed to load participants on login:', fetchErr);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      // Local fallback for offline mode or demo credentials
      if (cleanUser.toLowerCase() === 'admin' && cleanPass === 'admin123') {
        const localAdmin: BackendAdmin = { id: 1, name: 'Admin Loket', username: 'admin' };
        setAdminUser(localAdmin);
        localStorage.setItem(STORAGE_KEY_ROLE_MODE, 'admin');
        localStorage.setItem(STORAGE_KEY_OFFLINE_ADMIN, 'true');
        setIsLoginModalOpen(false);
        setAdminUsername('');
        setAdminPassword('');
        setRoleMode('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setLoginError(
        err.message || 'Username atau password salah. Gunakan kredensial admin yang valid (admin / admin123).'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      try {
        await api.adminLogout(adminToken);
      } catch {
        // Best effort
      }
    }
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem(STORAGE_KEY_ROLE_MODE);
    localStorage.removeItem(STORAGE_KEY_OFFLINE_ADMIN);
    setRoleMode('user');
  };

  const handleRefreshParticipants = async () => {
    if (!adminToken) return;
    try {
      setIsRefreshingParticipants(true);
      const res = await api.getParticipants(adminToken, { per_page: 150 });
      if (res?.data) {
        const backendPasses = res.data.map(mapBackendToAttendeePass);
        setAttendees((prev) => {
          const map = new Map<string, AttendeePass>();
          backendPasses.forEach((p) => map.set(p.couponCode.toUpperCase(), p));
          prev.forEach((p) => {
            if (!map.has(p.couponCode.toUpperCase())) {
              map.set(p.couponCode.toUpperCase(), p);
            }
          });
          return Array.from(map.values());
        });
      }
    } catch (err: any) {
      console.error('Failed to refresh participants', err);
    } finally {
      setIsRefreshingParticipants(false);
    }
  };

  const getNextCouponCode = (): string => {
    let maxNum = 0;
    for (const item of attendees) {
      const match = item.couponCode.match(/ABSC-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    return `ABSC-${String(nextNum).padStart(4, '0')}`;
  };

  const getCurrentTimeWib = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} WIB`;
  };

  const getCurrentTimeWithSecondsWib = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} WIB`;
  };

  // Public Registration Handler -> POST /api/register with offline fallback
  const handleRegister = async (newPassData: {
    fullName: string;
    nisnOrNip?: string;
    schoolId: number;
    schoolOrigin: string;
    role: AttendeeRole;
    trialClass: TrialClassType;
    infoSource: InfoSourceType;
    infoSourceDetail?: string;
  }): Promise<AttendeePass> => {
    const backendRole = newPassData.role === 'Siswa' ? 'siswa' : 'guru_pendamping';

    let newPass: AttendeePass;
    try {
      const participant = await api.registerParticipant({
        role: backendRole,
        name: newPassData.fullName,
        identity_number: newPassData.nisnOrNip || '-',
        school_id: newPassData.schoolId,
        trial_class: newPassData.trialClass,
        referral_source: newPassData.infoSource,
        referral_detail: newPassData.infoSourceDetail || null,
      });

      newPass = mapBackendToAttendeePass(participant);
      if (!newPass.schoolOrigin || newPass.schoolOrigin.startsWith('Sekolah #')) {
        newPass.schoolOrigin = newPassData.schoolOrigin;
      }
    } catch (apiErr) {
      console.warn('Backend registration failed, saving locally:', apiErr);
      newPass = {
        id: `local-${Date.now()}`,
        couponCode: getNextCouponCode(),
        fullName: newPassData.fullName,
        nisnOrNip: newPassData.nisnOrNip || '-',
        schoolOrigin: newPassData.schoolOrigin,
        schoolId: newPassData.schoolId,
        role: newPassData.role,
        trialClass: newPassData.trialClass,
        infoSource: newPassData.infoSource,
        infoSourceDetail: newPassData.infoSourceDetail,
        registrationSource: 'Reg-Online',
        status: 'UNREDEEMED',
        registeredAt: getCurrentTimeWib(),
      };
    }

    setAttendees((prev) => [
      newPass,
      ...prev.filter((p) => p.couponCode.toUpperCase() !== newPass.couponCode.toUpperCase()),
    ]);
    setMyCreatedPass(newPass);
    setMyCreatedPassId(newPass.id);
    setUserStep('my-ticket');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return newPass;
  };

  // Admin Walk-In Registration Handler -> POST /api/admin/participants
  const handleAdminRegister = async (newPassData: {
    fullName: string;
    nisnOrNip?: string;
    schoolId: number;
    schoolOrigin: string;
    role: AttendeeRole;
    trialClass: TrialClassType;
    infoSource: InfoSourceType;
    infoSourceDetail?: string;
  }) => {
    const backendRole = newPassData.role === 'Siswa' ? 'siswa' : 'guru_pendamping';
    let newPass: AttendeePass;

    if (adminToken) {
      try {
        const participant = await api.adminRegisterParticipant(adminToken, {
          role: backendRole,
          name: newPassData.fullName,
          identity_number: newPassData.nisnOrNip || '-',
          school_id: newPassData.schoolId,
          trial_class: newPassData.trialClass,
          referral_source: newPassData.infoSource,
          referral_detail: newPassData.infoSourceDetail || null,
        });

        newPass = mapBackendToAttendeePass(participant);
        if (!newPass.schoolOrigin || newPass.schoolOrigin.startsWith('Sekolah #')) {
          newPass.schoolOrigin = newPassData.schoolOrigin;
        }
        newPass.registrationSource = 'Walk-In';
      } catch (err) {
        console.warn('Backend admin walk-in failed, saving locally:', err);
        newPass = {
          id: `walkin-${Date.now()}`,
          couponCode: getNextCouponCode(),
          fullName: newPassData.fullName,
          nisnOrNip: newPassData.nisnOrNip || '-',
          schoolOrigin: newPassData.schoolOrigin,
          schoolId: newPassData.schoolId,
          role: newPassData.role,
          trialClass: newPassData.trialClass,
          infoSource: newPassData.infoSource,
          infoSourceDetail: newPassData.infoSourceDetail,
          registrationSource: 'Walk-In',
          status: 'UNREDEEMED',
          registeredAt: getCurrentTimeWib(),
        };
      }
    } else {
      newPass = {
        id: `walkin-${Date.now()}`,
        couponCode: getNextCouponCode(),
        fullName: newPassData.fullName,
        nisnOrNip: newPassData.nisnOrNip || '-',
        schoolOrigin: newPassData.schoolOrigin,
        schoolId: newPassData.schoolId,
        role: newPassData.role,
        trialClass: newPassData.trialClass,
        infoSource: newPassData.infoSource,
        infoSourceDetail: newPassData.infoSourceDetail,
        registrationSource: 'Walk-In',
        status: 'UNREDEEMED',
        registeredAt: getCurrentTimeWib(),
      };
    }

    setAttendees((prev) => [
      newPass,
      ...prev.filter((p) => p.couponCode.toUpperCase() !== newPass.couponCode.toUpperCase()),
    ]);
  };

  // Admin Coupon Scan Handler -> POST /api/admin/coupons/scan with local verification fallback
  const handleProcessScanCode = async (
    rawCode: string,
    method: 'auto' | 'manual'
  ): Promise<ScanFeedback> => {
    const code = rawCode.trim().toUpperCase();
    const timestamp = getCurrentTimeWib();
    const fullTimestamp = getCurrentTimeWithSecondsWib();

    // 1. If backend token exists, try backend scan
    if (adminToken) {
      try {
        const res = await api.scanCoupon(adminToken, code);
        const updatedPass = mapBackendToAttendeePass(res.data);

        setAttendees((prev) => {
          const index = prev.findIndex((a) => a.couponCode.toUpperCase() === code);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updatedPass;
            return next;
          }
          return [updatedPass, ...prev];
        });

        if (myCreatedPass && myCreatedPass.couponCode.toUpperCase() === code) {
          setMyCreatedPass(updatedPass);
        }

        const successEntry: ScanLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: fullTimestamp,
          relativeTime: 'Baru saja',
          couponCode: updatedPass.couponCode,
          fullName: updatedPass.fullName,
          schoolOrigin: updatedPass.schoolOrigin,
          role: updatedPass.role,
          trialClass: updatedPass.trialClass,
          infoSource: updatedPass.infoSource,
          infoSourceDetail: updatedPass.infoSourceDetail,
          scanMethod: method,
          status: method === 'manual' ? 'manual' : 'success',
          statusText: '200 Valid',
          deskName: adminUser ? `Admin ${adminUser.name}` : 'Admin Loket 01',
          verifierNote: method === 'manual' ? 'Input Manual Loket' : 'Scan Terverifikasi',
        };
        setScanLogs((prev) => [successEntry, ...prev]);

        const fb: ScanFeedback = {
          id: `scan-${Date.now()}`,
          type: 'success',
          title: 'Kehadiran & Kupon Terverifikasi',
          message: `Selamat datang, ${updatedPass.fullName}! Kehadiran tercatat pada ${timestamp}.`,
          codeScanned: code,
          pass: updatedPass,
          timestamp,
        };
        setScanFeedback(fb);
        return fb;
      } catch (err: any) {
        const errMsg: string = err.message || '';
        const isDuplicate =
          err.status === 422 &&
          (errMsg.toLowerCase().includes('sudah') || errMsg.toLowerCase().includes('di-scan'));

        const existingTarget = attendees.find((a) => a.couponCode.toUpperCase() === code);

        if (isDuplicate) {
          const duplicateEntry: ScanLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: fullTimestamp,
            relativeTime: 'Baru saja',
            couponCode: existingTarget?.couponCode || code,
            fullName: existingTarget?.fullName || 'Peserta Terdaftar',
            schoolOrigin: existingTarget?.schoolOrigin || 'Sekolah Terdaftar',
            role: existingTarget?.role || 'Siswa',
            trialClass: existingTarget?.trialClass || 'IT',
            infoSource: existingTarget?.infoSource || 'Website',
            infoSourceDetail: existingTarget?.infoSourceDetail,
            scanMethod: method,
            status: 'rejected',
            statusText: '422 Duplikat',
            subStatusText: existingTarget?.checkedInAt
              ? `Sudah diverifikasi ${existingTarget.checkedInAt}`
              : 'Sudah digunakan sebelumnya',
            deskName: adminUser ? `Admin ${adminUser.name}` : 'Admin Loket 01',
            verifierNote: 'Kupon Duplikat',
          };
          setScanLogs((prev) => [duplicateEntry, ...prev]);

          const fb: ScanFeedback = {
            id: `scan-${Date.now()}`,
            type: 'duplicate',
            title: 'Peringatan: Kupon Sudah Digunakan',
            message:
              errMsg ||
              `Kupon ${code} milik ${existingTarget?.fullName || 'peserta'} sudah pernah diverifikasi sebelumnya.`,
            codeScanned: code,
            pass: existingTarget,
            timestamp,
          };
          setScanFeedback(fb);
          return fb;
        }

        // If backend failed due to network / offline, allow local verification fallback below
        if (err.status !== 404 && err.status !== 422) {
          console.warn('Backend scan failed, trying local verification:', err);
        } else {
          // Explicit 404 / not found on backend
          const rejectedEntry: ScanLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: fullTimestamp,
            relativeTime: 'Baru saja',
            couponCode: code,
            fullName: 'Kupon Tidak Dikenali',
            schoolOrigin: 'Kode Tidak Valid',
            role: 'Siswa',
            trialClass: 'IT',
            infoSource: 'Website',
            scanMethod: method,
            status: 'rejected',
            statusText: '422 Tidak Valid',
            subStatusText: errMsg || 'Kode tidak terdaftar',
            deskName: adminUser ? `Admin ${adminUser.name}` : 'Admin Loket 01',
            verifierNote: 'Auto-Blocked',
          };
          setScanLogs((prev) => [rejectedEntry, ...prev]);

          const fb: ScanFeedback = {
            id: `scan-${Date.now()}`,
            type: 'invalid',
            title: 'Kode Kupon Tidak Terdaftar',
            message:
              errMsg ||
              `Kode "${code}" tidak ditemukan dalam basis data peserta Open House 2026.`,
            codeScanned: code,
            timestamp,
          };
          setScanFeedback(fb);
          return fb;
        }
      }
    }

    // 2. Local attendee verification (for offline admin or local data)
    const existingTarget = attendees.find((a) => a.couponCode.toUpperCase() === code);

    if (existingTarget) {
      if (existingTarget.status === 'REDEEMED') {
        const duplicateEntry: ScanLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: fullTimestamp,
          relativeTime: 'Baru saja',
          couponCode: existingTarget.couponCode,
          fullName: existingTarget.fullName,
          schoolOrigin: existingTarget.schoolOrigin,
          role: existingTarget.role,
          trialClass: existingTarget.trialClass,
          infoSource: existingTarget.infoSource,
          infoSourceDetail: existingTarget.infoSourceDetail,
          scanMethod: method,
          status: 'rejected',
          statusText: '422 Duplikat',
          subStatusText: existingTarget.checkedInAt
            ? `Sudah diverifikasi ${existingTarget.checkedInAt}`
            : 'Sudah digunakan sebelumnya',
          deskName: adminUser ? `Admin ${adminUser.name}` : 'Admin Loket 01',
          verifierNote: 'Kupon Duplikat',
        };
        setScanLogs((prev) => [duplicateEntry, ...prev]);

        const fb: ScanFeedback = {
          id: `scan-${Date.now()}`,
          type: 'duplicate',
          title: 'Peringatan: Kupon Sudah Digunakan',
          message: `Kupon ${code} milik ${existingTarget.fullName} sudah pernah diverifikasi sebelumnya.`,
          codeScanned: code,
          pass: existingTarget,
          timestamp,
        };
        setScanFeedback(fb);
        return fb;
      }

      // Valid Unredeemed coupon -> mark as REDEEMED
      const updatedPass: AttendeePass = {
        ...existingTarget,
        status: 'REDEEMED',
        checkedInAt: timestamp,
      };

      setAttendees((prev) =>
        prev.map((a) => (a.couponCode.toUpperCase() === code ? updatedPass : a))
      );

      if (myCreatedPass && myCreatedPass.couponCode.toUpperCase() === code) {
        setMyCreatedPass(updatedPass);
      }

      const successEntry: ScanLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: fullTimestamp,
        relativeTime: 'Baru saja',
        couponCode: updatedPass.couponCode,
        fullName: updatedPass.fullName,
        schoolOrigin: updatedPass.schoolOrigin,
        role: updatedPass.role,
        trialClass: updatedPass.trialClass,
        infoSource: updatedPass.infoSource,
        infoSourceDetail: updatedPass.infoSourceDetail,
        scanMethod: method,
        status: method === 'manual' ? 'manual' : 'success',
        statusText: '200 Valid',
        deskName: adminUser ? `Admin ${adminUser.name}` : 'Admin Loket 01',
        verifierNote: method === 'manual' ? 'Input Manual Loket' : 'Scan Terverifikasi',
      };
      setScanLogs((prev) => [successEntry, ...prev]);

      const fb: ScanFeedback = {
        id: `scan-${Date.now()}`,
        type: 'success',
        title: 'Kehadiran & Kupon Terverifikasi',
        message: `Selamat datang, ${updatedPass.fullName}! Kehadiran tercatat pada ${timestamp}.`,
        codeScanned: code,
        pass: updatedPass,
        timestamp,
      };
      setScanFeedback(fb);
      return fb;
    }

    // Code not found
    const rejectedEntry: ScanLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: fullTimestamp,
      relativeTime: 'Baru saja',
      couponCode: code,
      fullName: 'Kupon Tidak Dikenali',
      schoolOrigin: 'Kode Tidak Valid',
      role: 'Siswa',
      trialClass: 'IT',
      infoSource: 'Website',
      scanMethod: method,
      status: 'rejected',
      statusText: '422 Tidak Valid',
      subStatusText: 'Kode tidak terdaftar',
      deskName: adminUser ? `Admin ${adminUser.name}` : 'Admin Loket 01',
      verifierNote: 'Auto-Blocked',
    };
    setScanLogs((prev) => [rejectedEntry, ...prev]);

    const fb: ScanFeedback = {
      id: `scan-${Date.now()}`,
      type: 'invalid',
      title: 'Kode Kupon Tidak Terdaftar',
      message: `Kode "${code}" tidak ditemukan dalam basis data peserta Open House 2026.`,
      codeScanned: code,
      timestamp,
    };
    setScanFeedback(fb);
    return fb;
  };

  const handleQuickRedeem = async (passId: string) => {
    const target = attendees.find((a) => a.id === passId);
    if (!target) return;
    await handleProcessScanCode(target.couponCode, 'manual');
  };

  const handleDeleteAttendee = async (passId: string) => {
    if (adminToken) {
      try {
        await api.deleteParticipant(adminToken, passId);
      } catch (err) {
        console.error('Failed to delete participant from backend:', err);
      }
    }
    setAttendees((prev) => prev.filter((a) => a.id !== passId));
    if (myCreatedPassId === passId) {
      setMyCreatedPassId(null);
      setMyCreatedPass(null);
      localStorage.removeItem(STORAGE_KEY_MY_PASS_ID);
      localStorage.removeItem(STORAGE_KEY_MY_PASS_DATA);
      setUserStep('form');
    }
  };

  // =========================================================================
  // RENDER ADMIN ROLE (Scanner Mode, Riwayat Aktivitas, Data Peserta)
  // =========================================================================
  if (roleMode === 'admin') {
    return (
      <>
        <AdminScannerDesk
          attendees={attendees}
          scanLogs={scanLogs}
          activePage={adminPage}
          onChangePage={(page) => setAdminPage(page)}
          onProcessScanCode={handleProcessScanCode}
          onQuickRedeem={handleQuickRedeem}
          onDeleteAttendee={handleDeleteAttendee}
          onLogout={handleAdminLogout}
          onSwitchToUserView={() => setRoleMode('user')}
          schools={schools}
          onAdminRegister={handleAdminRegister}
          onRefreshData={handleRefreshParticipants}
          isRefreshing={isRefreshingParticipants}
        />
        <ScannerModal feedback={scanFeedback} onClose={() => setScanFeedback(null)} />
      </>
    );
  }

  // =========================================================================
  // RENDER REGULAR USER ROLE (Welcome Hero -> Form -> Digital Coupon Pass)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF3E3]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <img
              alt="EduPass Logo"
              className="h-6 sm:h-7 w-auto object-contain shrink-0"
              src="/logo.png"
            />
            <span className="font-display text-[15px] sm:text-[18px] font-bold tracking-tight text-[#181b2b] truncate">
              <span className="hidden sm:inline">SMK Metland School</span>
              <span className="sm:hidden">Metschool</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {myCreatedPass && (
              <button
                type="button"
                onClick={() => setUserStep(userStep === 'form' ? 'my-ticket' : 'form')}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#f4f2ff] hover:bg-[#e5e6fe] text-[#32328a] text-[12px] sm:text-[13px] font-semibold inline-flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>
                  {userStep === 'form' ? (
                    <>
                      <span className="hidden md:inline">
                        Lihat Tiket Saya ({myCreatedPass.couponCode})
                      </span>
                      <span className="hidden sm:inline md:hidden">
                        Tiket ({myCreatedPass.couponCode})
                      </span>
                      <span className="sm:hidden">Tiket Saya</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Buat Pendaftaran Baru</span>
                      <span className="sm:hidden">Daftar Baru</span>
                    </>
                  )}
                </span>
              </button>
            )}

            {adminToken || localStorage.getItem(STORAGE_KEY_OFFLINE_ADMIN) === 'true' ? (
              <button
                type="button"
                onClick={() => setRoleMode('admin')}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#181b2b] hover:bg-[#2c2f41] text-white text-[12px] sm:text-[13px] font-medium inline-flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-[#9fa0ff]">
                  admin_panel_settings
                </span>
                <span>
                  <span className="hidden sm:inline">Buka Konsol Admin</span>
                  <span className="sm:hidden">Admin</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#181b2b] hover:bg-[#2c2f41] text-white text-[12px] sm:text-[13px] font-medium inline-flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-[#9fa0ff]">
                  admin_panel_settings
                </span>
                <span>
                  <span className="hidden sm:inline">Login Admin</span>
                  <span className="sm:hidden">Admin</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Admin Login Popup Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b2b]/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
            onClick={closeLoginModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-[24px] max-w-md w-full p-5 sm:p-7 shadow-[0_24px_60px_rgba(24,27,43,0.2)] border border-[#E2E8F0] relative my-auto max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeLoginModal}
              aria-label="Tutup modal login"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-[#F8FAFC] hover:bg-[#E2E8F0]/70 text-[#464651] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#181b2b] flex items-center justify-center text-[#9FA0FF] shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-[19px] font-bold text-[#181b2b] leading-tight">
                  Autentikasi Admin Loket
                </h3>
                <p className="text-[13px] text-[#464651] mt-0.5">
                  Masukkan kredensial admin untuk mengakses konsol dan scanner.
                </p>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 rounded-xl bg-[#ffdad6]/70 border border-[#ba1a1a]/20 px-3.5 py-2.5 flex items-start gap-2.5 text-[#ba1a1a] text-[13px]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-snug">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#181b2b] mb-1.5">
                  Username Admin
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#777682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={adminUsername}
                    onChange={(e) => {
                      setAdminUsername(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Masukkan username admin"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] text-[#181b2b] focus:outline-none focus:bg-white focus:border-[#4b4ca3] focus:ring-2 focus:ring-[#9FA0FF]/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#181b2b] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#777682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Masukkan password"
                    className="w-full h-12 pl-10 pr-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] text-[#181b2b] focus:outline-none focus:bg-white focus:border-[#4b4ca3] focus:ring-2 focus:ring-[#9FA0FF]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#777682] hover:text-[#181b2b] flex items-center justify-center cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeLoginModal}
                  className="h-11 px-4 rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0]/70 text-[#464651] text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="h-11 px-5 rounded-xl bg-[#181b2b] hover:bg-[#2c2f41] text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px] text-[#9FA0FF]">
                        login
                      </span>
                      <span>Masuk sebagai Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content for Regular User */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {userStep === 'my-ticket' && myCreatedPass ? (
            <motion.div
              key="my-ticket-view"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="max-w-xl lg:max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-5"
            >
              {/* Success Confirmation Banner */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[20px] bg-[#D5E8E6] border border-[#506260]/25 px-4 sm:px-5 py-4 flex items-start gap-3 sm:gap-3.5 shadow-resting-card no-print"
              >
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#506260] shrink-0 mt-0.5 shadow-2xs">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[16px] sm:text-[17px] font-bold text-[#181b2b]">
                    Kode Kupon Anda Berhasil Dibuat!
                  </h2>
                  <p className="text-[12px] sm:text-[13px] text-[#464651] mt-0.5 leading-relaxed">
                    Tunjukkan atau sebutkan kode unik{' '}
                    <span className="font-mono-code font-bold text-[#181b2b]">
                      {myCreatedPass.couponCode}
                    </span>{' '}
                    kepada petugas loket saat tiba di acara untuk verifikasi kehadiran.
                  </p>
                </div>
              </motion.div>

              {/* User's Created Digital Ticket Pass */}
              <DigitalPassCard pass={myCreatedPass} canvasBg="cream" />

              {/* Action to Register Another Ticket */}
              <div className="text-center pt-2 pb-6 no-print">
                <button
                  type="button"
                  onClick={() => setUserStep('form')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#464651] hover:text-[#181b2b] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Halaman Sambutan &amp; Formulir</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="registration-form-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <RegistrationView
                attendees={attendees}
                schools={schools}
                isLoadingSchools={isLoadingSchools}
                nextCouponCode={getNextCouponCode()}
                onRegister={handleRegister}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
