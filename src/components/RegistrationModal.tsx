import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Attendee, AttendeeStatus, TransportMethod } from '../types';
import {
  Eye,
  EyeOff,
  Loader2,
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

  // CAPTCHA State
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate random CAPTCHA code
  const generateCaptcha = useCallback(() => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptchaInput('');
  }, []);

  // Draw CAPTCHA on canvas
  const drawCaptcha = useCallback((code: string, canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background noise dots
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Noise line waves
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(249, 115, 22, 0.45)' : 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = Math.random() * 1.5 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 20, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        canvas.width / 3, Math.random() * canvas.height,
        (canvas.width * 2) / 3, Math.random() * canvas.height,
        canvas.width - 10, Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Characters rendering
    ctx.font = 'bold 22px monospace';
    ctx.textBaseline = 'middle';
    const charWidth = canvas.width / (code.length + 1);

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.save();
      const x = charWidth * (i + 1);
      const y = canvas.height / 2 + (Math.random() * 4 - 2);
      const angle = (Math.random() - 0.5) * 0.35;

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = i % 2 === 0 ? '#fb923c' : '#38bdf8'; // orange & sky blue
      ctx.fillText(char, -8, 0);
      ctx.restore();
    }
  }, []);

  // Initialize CAPTCHA when modal opens or code updates
  useEffect(() => {
    if (isOpen) {
      if (!captchaCode) {
        generateCaptcha();
      } else if (canvasRef.current) {
        drawCaptcha(captchaCode, canvasRef.current);
      }
    }
  }, [isOpen, captchaCode, generateCaptcha, drawCaptcha]);

  if (!isOpen) return null;

  // Handle Registration Form Submission with CAPTCHA
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

    // Validate CAPTCHA
    if (!userCaptchaInput.trim()) {
      setFormError('กรุณากรอกรหัส CAPTCHA เพื่อยืนยันว่าไม่ใช่โปรแกรมอัตโนมัติ');
      return;
    }

    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setFormError('รหัส CAPTCHA ไม่ถูกต้อง กรุณาตรวจสอบรหัสแล้วลองใหม่อีกครั้ง');
      generateCaptcha();
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

    setLoading(true);

    try {
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

      // Save to Firebase Firestore
      await saveAttendeeToFirestore(newAttendee);

      // Trigger Celebration Confetti
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });

      alert(
        `🎉 ลงทะเบียนเข้าร่วมงานสำเร็จ!\n\nข้อมูลผู้เข้าร่วมงาน ${newAttendee.firstName} ${newAttendee.lastName} บันทึกลงในระบบเรียบร้อยแล้ว`
      );

      setLoading(false);
      onRegisterSuccess(newAttendee, false);
      onClose();
    } catch (err: any) {
      console.error('Registration save error:', err);
      setFormError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto sm:my-8 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="shrink-0 relative bg-slate-900 p-4 sm:p-6 border-b border-slate-800 text-white">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pr-8 sm:pr-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-bold text-white leading-tight">
                ลงทะเบียนสำหรับบุคคลทั่วไป
              </h3>
              <p className="text-[11px] sm:text-sm text-blue-300 mt-0.5">
                โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย (28 สิงหาคม 2569)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Important Registration Notice */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="text-amber-600 shrink-0">⚠️</span>
            <span>หากลงทะเบียนใน QR Code ที่ได้รับในหนังสือเชิญแล้ว ไม่ต้องลงทะเบียนซ้ำ</span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5 sm:space-y-4 text-left">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl text-center">
                {formError}
              </div>
            )}

            {/* Personal Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm"
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
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex flex-wrap items-center justify-between gap-1">
                <span>อีเมลประจำตัว (Email Address) <span className="text-red-500">*</span></span>
                <span className="text-[11px] text-slate-500 font-normal">จะใช้สำหรับเข้าสู่ระบบดูบัตรประจำตัว</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="เช่น example@gmail.com"
                className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm font-medium"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สร้างรหัสผ่าน (Password) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="กำหนดรหัสผ่าน (6 ตัวขึ้นไป)"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Phone & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">สถานภาพผู้ลงทะเบียน</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AttendeeStatus })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm"
                >
                  <option value="นักเรียน">นักเรียน</option>
                  <option value="ครู/อาจารย์">ครู / อาจารย์</option>
                  <option value="ผู้ปกครอง">ผู้ปกครอง</option>
                  <option value="ศิษย์เก่า">ศิษย์เก่า</option>
                  <option value="ประชาชนทั่วไป">ประชาชนทั่วไป</option>
                </select>
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อโรงเรียน / สถาบัน / หน่วยงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="เช่น โรงเรียนเลยพิทยาคม หรือ บุคคลทั่วไป"
                className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm"
              />
            </div>

            {/* District & Province */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จังหวัด</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none shadow-sm"
                >
                  {THAI_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CAPTCHA Security Verification Field */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2 shadow-inner">
              <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>การยืนยันความปลอดภัย (CAPTCHA Verification) <span className="text-red-400">*</span></span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Canvas Display & Refresh */}
                <div className="flex items-center gap-2">
                  <canvas
                    ref={canvasRef}
                    width={140}
                    height={42}
                    className="rounded-xl border border-slate-700 bg-slate-950 shadow-md shrink-0 cursor-pointer"
                    onClick={generateCaptcha}
                    title="คลิกเพื่อเปลี่ยนรหัส CAPTCHA ใหม่"
                  />
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer shrink-0"
                    title="เปลี่ยนรหัส CAPTCHA ใหม่"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Input Text */}
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value.toUpperCase())}
                  placeholder="กรอกรหัส 5 หลักที่เห็น"
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-amber-300 font-mono font-black text-center tracking-widest text-base sm:text-sm focus:outline-none shadow-sm uppercase placeholder-slate-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                ℹ️ พิมพ์ตัวอักษรหรือตัวเลข 5 หลักตามที่ปรากฏในช่องสีเข้ม (ตัวอักษรใหญ่-เล็กเหมือนกัน)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 sticky bottom-0 bg-white py-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors cursor-pointer text-center"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>ยืนยันและลงทะเบียน</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
