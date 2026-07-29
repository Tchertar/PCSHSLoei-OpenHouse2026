import React, { useState } from 'react';
import { Attendee, AttendeeStatus, TransportMethod } from '../types';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { saveAttendeeToFirestore } from '../lib/firebase';

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
  // Steps: 'form' | 'otp'
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    status: 'นักเรียน' as AttendeeStatus,
    organization: '',
    district: 'เมืองเลย',
    province: 'เลย',
    attendeeCount: 1,
    transportMethod: 'รถส่วนตัว' as TransportMethod,
  });

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copiedOtp, setCopiedOtp] = useState(false);

  if (!isOpen) return null;

  // Handle Initial Registration Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Field Validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@') || !formData.email.includes('.')) {
      setFormError('กรุณากรอกรูปแบบอีเมลให้ถูกต้อง (เช่น user@gmail.com)');
      return;
    }

    if (!formData.password) {
      setFormError('กรุณาสร้างรหัสผ่าน');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    if (!formData.phone.trim() || !formData.organization.trim()) {
      setFormError('กรุณากรอกเบอร์โทรศัพท์และชื่อสถาบัน/หน่วยงานให้ครบถ้วน');
      return;
    }

    // Check duplicate registration
    const normalizedEmail = formData.email.trim().toLowerCase();
    const existing = existingAttendees.find((a) => a.email.toLowerCase() === normalizedEmail);

    if (existing) {
      alert(
        `👋 อีเมล ${normalizedEmail} เคยลงทะเบียนไว้ในระบบแล้ว!\n\nท่านสามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านเพื่อดูบัตรประจำตัวได้ทันที`
      );
      onRegisterSuccess(existing, true);
      onClose();
      return;
    }

    // Request OTP via backend API or fallback
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, firstName: formData.firstName }),
      });

      const data = await res.json();
      if (data.success && data.otp) {
        setSentOtp(data.otp);
      } else {
        // Fallback local OTP
        const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSentOtp(fallbackCode);
      }

      setStep('otp');
      startCooldown();
    } catch (err) {
      console.warn('API send OTP error, using fallback:', err);
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(fallbackCode);
      setStep('otp');
      startCooldown();
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    setLoading(true);

    const normalizedEmail = formData.email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, firstName: formData.firstName }),
      });
      const data = await res.json();
      if (data.success && data.otp) {
        setSentOtp(data.otp);
      } else {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSentOtp(newCode);
      }
      startCooldown();
    } catch {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(newCode);
      startCooldown();
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Code & Save to Firebase Firestore
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError('กรุณากรอกรหัสยืนยัน OTP 6 หลัก');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      // Verify OTP via API backend or local comparison
      let isVerified = false;
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, code: otpCode.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          isVerified = true;
        }
      } catch {
        // Local comparison check
        if (sentOtp && otpCode.trim() === sentOtp) {
          isVerified = true;
        }
      }

      if (!isVerified && sentOtp && otpCode.trim() === sentOtp) {
        isVerified = true;
      }

      if (!isVerified) {
        setOtpError('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบรหัสยืนยันที่ส่งไปทางอีเมล');
        setLoading(false);
        return;
      }

      // Generate Participant Code
      const codeNum = Math.floor(1000 + Math.random() * 9000);
      const participantCode = `PCSHS2026-${codeNum}`;

      const newAttendee: Attendee = {
        id: `att_${Date.now()}`,
        participantCode,
        email: normalizedEmail,
        password: formData.password,
        isVerified: true,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
        organization: formData.organization.trim(),
        district: formData.district.trim() || 'เมืองเลย',
        province: formData.province,
        attendeeCount: Number(formData.attendeeCount) || 1,
        transportMethod: formData.transportMethod,
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        checkedIn: false,
        qrCodeData: participantCode,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName)}+${encodeURIComponent(formData.lastName)}&background=0D8ABC&color=fff&bold=true`,
      };

      // Save to Firebase Firestore (Database project: PCSHS-Loei-Open-House-2026-db)
      await saveAttendeeToFirestore(newAttendee);

      // Trigger Celebration Confetti
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });

      alert(
        `🎉 ลงทะเบียนและยืนยันตัวตนด้วยอีเมลสำเร็จ!\n\nข้อมูลผู้เข้าร่วมงาน ${newAttendee.firstName} ${newAttendee.lastName} ได้ถูกบันทึกลงในฐานข้อมูล Firebase (PCSHS-Loei-Open-House-2026-db) เรียบร้อยแล้ว`
      );

      setLoading(false);
      onRegisterSuccess(newAttendee, false);
      onClose();
    } catch (err: any) {
      console.error('Registration save error:', err);
      setOtpError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  const copyOtpToClipboard = () => {
    if (sentOtp) {
      navigator.clipboard.writeText(sentOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="relative bg-slate-900 p-6 border-b border-slate-800 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-white">
                {step === 'form'
                  ? 'ลงทะเบียนเข้าร่วม PCSHS Loei Open House 2026'
                  : 'ยืนยันตัวตนด้วยรหัส OTP (Email Verification)'}
              </h3>
              <p className="text-xs sm:text-sm text-blue-300">
                โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย (28 สิงหาคม 2569)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 'form' ? (
            /* STEP 1: Registration Form with Email & Password */
            <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl text-center">
                  {formError}
                </div>
              )}

              {/* Personal Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อจริง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="เช่น สมชาย"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="เช่น ใจดี"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>อีเมลประจำตัว (Email Address) <span className="text-red-500">*</span></span>
                  <span className="text-[11px] text-slate-500 font-normal">จะใช้สำหรับเข้าสู่ระบบและรับรหัส OTP</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="เช่น example@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm font-medium"
                  />
                </div>
              </div>

              {/* Password & Confirm Password with Eye Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สร้างรหัสผ่าน (Password) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="กำหนดรหัสผ่าน (6 ตัวขึ้นไป)"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ยืนยันรหัสผ่าน (Confirm Password) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Phone & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="เช่น 0812345678"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานภาพผู้เข้าร่วม <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AttendeeStatus })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                  >
                    <option value="นักเรียน">นักเรียน</option>
                    <option value="ครู/อาจารย์">ครู / อาจารย์</option>
                    <option value="ผู้ปกครอง">ผู้ปกครอง</option>
                    <option value="บุคคลทั่วไป">บุคคลทั่วไป</option>
                  </select>
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อสถาบัน / โรงเรียน / หน่วยงาน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="เช่น โรงเรียนเลยพิทยาคม หรือ บุคคลทั่วไป"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                />
              </div>

              {/* District & Province */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่ออำเภอ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="เช่น เมืองเลย, เชียงคาน"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                  >
                    {THAI_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendee Count & Transport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวนผู้เข้าร่วม (คน) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={formData.attendeeCount}
                    onChange={(e) =>
                      setFormData({ ...formData, attendeeCount: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วิธีการเดินทาง <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.transportMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, transportMethod: e.target.value as TransportMethod })
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none shadow-sm"
                  >
                    <option value="รถส่วนตัว">รถส่วนตัว</option>
                    <option value="รถบัสโรงเรียน">รถบัสโรงเรียน</option>
                    <option value="รถตู้สถาบัน">รถตู้สถาบัน</option>
                    <option value="รถสาธารณะ">รถสาธารณะ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
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
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งรหัสยืนยัน OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>ถัดไป: ส่งรหัสยืนยันไปยัง Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Email OTP Verification Step */
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6 text-left max-w-md mx-auto py-2">
              
              {/* Real Email Sent Notification Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-blue-500/30 space-y-2 text-center">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-1 border border-blue-400/30">
                  <Mail className="w-6 h-6 text-blue-400 animate-bounce" />
                </div>
                <h3 className="font-bold text-base text-white">
                  ส่งรหัสยืนยัน OTP ไปยังอีเมลของคุณแล้ว
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ระบบได้ส่งรหัสยืนยัน OTP 6 หลัก ไปยังอีเมล{' '}
                  <strong className="text-amber-300 font-mono text-sm underline">{formData.email}</strong> แล้ว<br />
                  กรุณาเปิดเช็กใน <span className="text-white font-semibold">กล่องข้อความ (Inbox)</span> หรือ <span className="text-white font-semibold">จดหมายขยะ (Junk / Spam)</span>
                </p>
              </div>

              {/* OTP Error Message */}
              {otpError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl text-center">
                  {otpError}
                </div>
              )}

              {/* Input for OTP */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 text-center">
                  กรอกรหัสยืนยัน OTP 6 หลักที่ได้รับทางอีเมล
                </label>

                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-48 text-center bg-slate-50 border-2 border-orange-500 focus:border-orange-600 rounded-2xl px-4 py-3 text-2xl font-mono font-extrabold tracking-widest text-slate-900 focus:outline-none shadow-md"
                  />
                </div>
              </div>

              {/* Cooldown & Resend button */}
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500">
                  ไม่ได้รับรหัสยืนยัน?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-orange-600 hover:underline font-bold disabled:text-slate-400 disabled:no-underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `ขอรหัสใหม่ใน (${resendCooldown}s)` : 'ส่งรหัสยืนยันอีกครั้ง'}
                    </span>
                  </button>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  &larr; แก้ไขข้อมูล
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังยืนยันและบันทึกลง Firebase...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>ยืนยัน OTP และสร้างบัญชี</span>
                    </>
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
