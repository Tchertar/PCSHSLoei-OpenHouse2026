import React, { useState } from 'react';
import { AdminUser, Attendee } from '../types';
import { Eye, EyeOff, KeyRound, Lock, LogIn, Mail, UserCheck, X } from 'lucide-react';

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
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    setError('ชื่อผู้ใช้งานหรือรหัสผ่าน Admin ไม่ถูกต้อง');
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const query = userEmail.trim().toLowerCase();
    const found = attendeesList.find(
      (a) =>
        a.email.toLowerCase() === query ||
        a.participantCode.toLowerCase() === query ||
        a.phone === query
    );

    if (found) {
      // Check password if configured
      if (found.password && userPassword && found.password !== userPassword.trim()) {
        setError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
        return;
      }
      onAttendeeLoginSuccess(found);
    } else {
      setError('ไม่พบข้อมูลบัญชีอีเมลหรือรหัสประจำตัวนี้ในระบบ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 transition-colors cursor-pointer"
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
            เข้าสู่ระบบผู้เข้าร่วม
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {tab === 'admin' ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username (ชื่อผู้ใช้ Admin)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น admin หรือ admin01"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password (รหัสผ่าน Admin)
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.01]"
            >
              เข้าสู่ระบบ Admin
            </button>
          </form>
        ) : (
          <form onSubmit={handleUserSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                อีเมลประจำตัว หรือ รหัสประจำตัว
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="เช่น user@gmail.com หรือ PCSHS2026-XXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showUserPassword ? 'text' : 'password'}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านที่ตั้งไว้ตอนลงทะเบียน"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowUserPassword(!showUserPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.01]"
            >
              เข้าสู่ระบบและเปิดดูบัตรผู้เข้าร่วม
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
