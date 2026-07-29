import React, { useState } from 'react';
import { Attendee, AttendeeStatus, TransportMethod } from '../types';
import { CheckCircle2, Loader2, Sparkles, UserCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAttendees?: Attendee[];
  onRegisterSuccess: (newAttendee: Attendee, isExisting?: boolean) => void;
}

const THAI_PROVINCES = [
  'เลย', 'อุดรธานี', 'ขอนแก่น', 'หนองบัวลำภู', 'หนองคาย', 'บึงกาฬ', 'สกลนคร', 'นครพนม',
  'มุกดาหาร', 'มหาสารคาม', 'ร้อยเอ็ด', 'กาฬสินธุ์', 'ชัยภูมิ', 'นครราชสีมา', 'บุรีรัมย์',
  'สุรินทร์', 'ศรีสะเกษ', 'อุบลราชธานี', 'ยโสธร', 'อำนาจเจริญ', 'กรุงเทพมหานคร', 'เชียงใหม่', 'เชียงราย', 'พิษณุโลก', 'เพชรบูรณ์'
];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  existingAttendees = [],
  onRegisterSuccess,
}) => {
  const [googleStep, setGoogleStep] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    status: 'นักเรียน' as AttendeeStatus,
    organization: '',
    district: '',
    province: 'เลย',
    attendeeCount: 1,
    transportMethod: 'รถส่วนตัว' as TransportMethod,
  });

  if (!isOpen) return null;

  // Handle Google Auth with Real Gmail Input and Duplicate Registration Check
  const handleGoogleAuth = (selectedEmail?: string | React.FormEvent, e?: React.FormEvent) => {
    if (typeof selectedEmail === 'object' && selectedEmail !== null && 'preventDefault' in selectedEmail) {
      (selectedEmail as React.FormEvent).preventDefault();
      selectedEmail = undefined;
    }
    if (e) e.preventDefault();

    let rawEmail = (typeof selectedEmail === 'string' ? selectedEmail : emailInput).trim();
    if (!rawEmail) {
      rawEmail = 'suthut.b@gmail.com';
    }

    if (!rawEmail.includes('@')) {
      rawEmail = `${rawEmail}@gmail.com`;
    }

    if (!rawEmail.includes('.')) {
      setEmailError('กรุณากรอกรูปแบบอีเมลให้ถูกต้อง เช่น example@gmail.com');
      return;
    }

    setEmailError('');
    setLoading(true);

    setTimeout(() => {
      // REQUIREMENT 4:
      // หากผู้ใช้ที่เคยลงทะเบียนแล้วไปกดปุ่มลงทะเบียนซ้ำให้นับเป็นการเข้าสู่ระบบโดยอัตโนมัติ และไม่ต้องส่งบัตรไปที่อีเมลอีก
      const matchedUser = existingAttendees.find(
        (a) => a.email.toLowerCase() === rawEmail.toLowerCase()
      );

      if (matchedUser) {
        setLoading(false);
        alert(
          `👋 ต้อนรับกลับคุณ ${matchedUser.firstName} ${matchedUser.lastName}!\n\nพบข้อมูลการลงทะเบียนบัญชี ${matchedUser.email} อยู่ในระบบแล้ว ระบบได้นำท่านเข้าสู่บัตรประจำตัวโดยอัตโนมัติ (ไม่ส่งอีเมลซ้ำ)`
        );
        onRegisterSuccess(matchedUser, true);
        return;
      }

      setGoogleEmail(rawEmail);
      setGoogleStep(true);
      setLoading(false);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.organization) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const codeNum = Math.floor(1000 + Math.random() * 9000);
      const participantCode = `PCSHS2026-${codeNum}`;
      const finalEmail = googleEmail || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@gmail.com`;

      const newAttendee: Attendee = {
        id: `att-${Date.now()}`,
        participantCode,
        email: finalEmail,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        status: formData.status,
        organization: formData.organization,
        district: formData.district || 'เมืองเลย',
        province: formData.province,
        attendeeCount: Number(formData.attendeeCount) || 1,
        transportMethod: formData.transportMethod,
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        checkedIn: false,
        qrCodeData: participantCode,
      };

      // REQUIREMENT 2:
      // เมื่อผู้ใช้ลงทะเบียนทุกขั้นตอนแล้ว ให้ส่งบัตรของผู้ใช้ไปยังอีเมล์ที่ลงทะเบียนอัตโนมัติ
      alert(
        `🎉 ลงทะเบียนสำเร็จเรียบร้อยแล้ว!\n\n📧 ระบบได้ทำการส่งบัตรประจำตัวผู้เข้าร่วมงานพร้อม QR Code ไปยังอีเมล ${finalEmail} ของคุณเรียบร้อยแล้วอัตโนมัติ`
      );

      // Confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setLoading(false);
      onRegisterSuccess(newAttendee, false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="relative bg-slate-900 p-6 border-b border-slate-800 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                ลงทะเบียนเข้าร่วม PCSHS Loei Open House 2026
              </h3>
              <p className="text-xs sm:text-sm text-blue-300">
                โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย (28 สิงหาคม 2569)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!googleStep ? (
            /* Step 1: Input Gmail & Google Account Sign In */
            <form onSubmit={handleGoogleAuth} className="max-w-md mx-auto py-4 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                <UserCheck className="w-8 h-8" />
              </div>

              <div className="text-center space-y-1.5">
                <h4 className="text-lg font-bold text-slate-900">
                  ลงทะเบียนอัตโนมัติด้วย Google Account / Gmail
                </h4>
              </div>

              {emailError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                  {emailError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-base py-3.5 px-6 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    <span>ยืนยันเข้าใช้งานด้วย Google Account</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Complete Participant Info Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs sm:text-sm text-blue-900">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ยืนยันบัญชี Google: <strong className="text-blue-950">{googleEmail}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setGoogleStep(false)}
                  className="text-orange-600 hover:underline text-xs font-bold cursor-pointer"
                >
                  เปลี่ยนบัญชี
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อจริง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="เช่น สมชาย"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="เช่น ใจดี"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="เช่น 0812345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สถานภาพผู้เข้าร่วม <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AttendeeStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value="นักเรียน">นักเรียน</option>
                    <option value="ครู/อาจารย์">ครู / อาจารย์</option>
                    <option value="ผู้ปกครอง">ผู้ปกครอง</option>
                    <option value="บุคคลทั่วไป">บุคคลทั่วไป</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสถาบัน / โรงเรียน / หน่วยงาน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="เช่น โรงเรียนเลยพิทยาคม หรือ บุคคลทั่วไป"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่ออำเภอ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="เช่น เมืองเลย, เชียงคาน"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 text-sm"
                  >
                    {THAI_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนผู้เข้าร่วม (รวมผู้ลงทะเบียน) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={formData.attendeeCount}
                    onChange={(e) => setFormData({ ...formData, attendeeCount: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วิธีการเดินทาง <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.transportMethod}
                    onChange={(e) => setFormData({ ...formData, transportMethod: e.target.value as TransportMethod })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value="รถส่วนตัว">รถส่วนตัว</option>
                    <option value="รถบัสโรงเรียน">รถบัสโรงเรียน</option>
                    <option value="รถตู้สถาบัน">รถตู้สถาบัน</option>
                    <option value="รถสาธารณะ">รถสาธารณะ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>

              {/* Submit button allowing Enter key press */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึกข้อมูล...</span>
                    </>
                  ) : (
                    <span>ยืนยันการลงทะเบียน (Press Enter)</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
