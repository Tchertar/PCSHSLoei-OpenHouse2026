import React, { useState } from 'react';
import { AdminUser, Attendee } from '../types';
import { KeyRound, Lock, LogIn, UserCheck, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminsList: AdminUser[];
  attendeesList: Attendee[];
  initialTab?: 'admin' | 'user';
  onAdminLoginSuccess: (admin: AdminUser) => void;
  onAttendeeLoginSuccess: (attendee: Attendee) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  adminsList,
  attendeesList,
  initialTab = 'admin',
  onAdminLoginSuccess,
  onAttendeeLoginSuccess,
}) => {
  const [tab, setTab] = useState<'admin' | 'user'>(initialTab);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check credentials specified in requirement:
    // Super Admin: admin / admin123
    // Admin: admin01, admin02, admin03 / 12345678
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (trimmedUser === 'admin' && trimmedPass === 'admin123') {
      const superAdmin = adminsList.find((a) => a.username === 'admin') || {
        id: 'adm-super',
        username: 'admin',
        name: 'Super Admin System',
        email: 'superadmin@pcshsloei.ac.th',
        role: 'super_admin',
        createdAt: new Date().toISOString(),
      };
      onAdminLoginSuccess(superAdmin);
      return;
    }

    if (
      ['admin01', 'admin02', 'admin03'].includes(trimmedUser) &&
      trimmedPass === '12345678'
    ) {
      const matchedAdmin = adminsList.find((a) => a.username === trimmedUser) || {
        id: `adm-${trimmedUser}`,
        username: trimmedUser,
        name: `ผู้ดูแลระบบ (${trimmedUser})`,
        email: `${trimmedUser}@pcshsloei.ac.th`,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      onAdminLoginSuccess(matchedAdmin);
      return;
    }

    setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const query = userQuery.trim().toLowerCase();
    const found = attendeesList.find(
      (a) =>
        a.participantCode.toLowerCase() === query ||
        a.email.toLowerCase() === query ||
        a.phone === query
    );

    if (found) {
      onAttendeeLoginSuccess(found);
    } else {
      setError('ไม่พบรหัสผู้เข้าร่วมหรืออีเมลที่ระบุในระบบ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => {
              setTab('admin');
              setError('');
            }}
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              tab === 'admin'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            เข้าสู่ระบบ Admin
          </button>
          <button
            onClick={() => {
              setTab('user');
              setError('');
            }}
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              tab === 'user'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            ค้นหาบัตรผู้เข้าร่วม
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {tab === 'admin' ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username (ชื่อผู้ใช้)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอก Username"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password (รหัสผ่าน)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
            >
              เข้าสู่ระบบ Admin (Press Enter)
            </button>
          </form>
        ) : (
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              กรอกรหัสผู้เข้าร่วม (เช่น <code className="text-orange-600 font-bold">PCSHS2026-1001</code>) หรืออีเมลที่ใช้ลงทะเบียน
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสประจำตัว หรือ อีเมล
              </label>
              <input
                type="text"
                required
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="PCSHS2026-XXXX หรือ email@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
            >
              ค้นหาบัตรผู้เข้าร่วม (Press Enter)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
