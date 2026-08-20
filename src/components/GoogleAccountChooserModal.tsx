import React, { useState } from 'react';
import { GoogleUserProfile, verifyGoogleTokenWithBackend } from '../lib/googleAuth';
import { Info, Loader2, LogIn, User, UserPlus, X } from 'lucide-react';

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (googleUser: GoogleUserProfile) => void;
  onOpenGuideModal?: () => void;
}

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  onOpenGuideModal,
}) => {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Google accounts for Google Sign-In
  const activeGoogleAccounts = [
    {
      googleId: '109827364519283746501',
      email: 'suthut.b@gmail.com',
      name: 'Suthut B (suthut.b@gmail.com)',
      firstName: 'Suthut',
      lastName: 'B',
      photoUrl: 'https://ui-avatars.com/api/?name=Suthut+B&background=0D8ABC&color=fff&bold=true',
    },
    {
      googleId: '109827364519283746502',
      email: 'student.pcshs@gmail.com',
      name: 'บัญชีนักเรียน (student.pcshs@gmail.com)',
      firstName: 'นักเรียน',
      lastName: 'จุฬาภรณ์',
      photoUrl: 'https://ui-avatars.com/api/?name=Student+PCSHS&background=E53E3E&color=fff&bold=true',
    },
    {
      googleId: '109827364519283746503',
      email: 'teacher.science@gmail.com',
      name: 'บัญชีคุณครู (teacher.science@gmail.com)',
      firstName: 'ครูสมชาย',
      lastName: 'ใจดี',
      photoUrl: 'https://ui-avatars.com/api/?name=Teacher+Somchai&background=38A169&color=fff&bold=true',
    },
  ];

  const handleAccountClick = async (account: Partial<GoogleUserProfile>) => {
    setErrorMsg('');
    setLoadingEmail(account.email || 'custom');

    try {
      const res = await verifyGoogleTokenWithBackend(undefined, account);
      if (res.success && res.user) {
        onSelectAccount(res.user);
      } else {
        setErrorMsg(res.error || 'ยืนยันตัวตน Google ไม่สำเร็จ');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoadingEmail(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setErrorMsg('กรุณากรอกรูปแบบอีเมล Gmail ให้ถูกต้อง');
      return;
    }

    const emailPrefix = customEmail.split('@')[0];
    const userToLogin: GoogleUserProfile = {
      googleId: `g_${Date.now()}`,
      email: customEmail.trim().toLowerCase(),
      name: customName.trim() || emailPrefix,
      firstName: customName.trim().split(' ')[0] || emailPrefix,
      lastName: customName.trim().split(' ').slice(1).join(' ') || 'Google',
      photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(customName || emailPrefix)}&background=4285F4&color=fff`,
    };

    handleAccountClick(userToLogin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        
        {/* Top Header styled like Google OAuth Account Chooser */}
        <div className="bg-slate-900 text-white p-6 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl p-2.5 shadow-md flex items-center justify-center border border-slate-100">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">เลือกบัญชี Google (Account Chooser)</h3>
              <p className="text-xs text-blue-200">
                เข้าสู่ระบบ OpenHouse 2026 ด้วย Google OAuth 2.0
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {!showCustomInput ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">
                บัญชี Google ที่ลงชื่อเข้าใช้ในเครื่องนี้:
              </p>

              {activeGoogleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleAccountClick(acc)}
                  disabled={loadingEmail !== null}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all cursor-pointer group text-left shadow-sm hover:shadow"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.photoUrl}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full border border-white shadow-sm object-cover"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        {acc.name}
                      </div>
                      <div className="text-xs font-mono text-slate-500">{acc.email}</div>
                    </div>
                  </div>

                  {loadingEmail === acc.email ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-300 shrink-0">
                      <LogIn className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-blue-700 border border-dashed border-blue-300 font-bold text-xs sm:text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ใช้บัญชี Google / Gmail อื่นๆ...</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  กรอกบัญชี Gmail / Google Account
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  &larr; ย้อนกลับไปเลือกบัญชี
                </button>
              </div>

              <div>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="เช่น user.example@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ชื่อ-นามสกุล (ระบุตัวตนบน Google)
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loadingEmail !== null}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>เข้าสู่ระบบด้วยบัญชีนี้</span>
                )}
              </button>
            </form>
          )}

          {/* Setup Guide Button for Admins/Developers */}
          {onOpenGuideModal && (
            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onOpenGuideModal}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-700 text-xs font-medium cursor-pointer transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>วิธีตั้งค่า OAuth Client ID ใน Google Cloud Console</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
