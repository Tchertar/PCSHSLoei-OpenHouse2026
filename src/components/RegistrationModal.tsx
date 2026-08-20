import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Attendee, AttendeeStatus, TransportMethod } from '../types';
import {
  Building,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { saveAttendeeToFirestore, getNextConsecutiveParticipantCode } from '../lib/firebase';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAttendees?: Attendee[];
  onRegisterSuccess: (newAttendee: Attendee, isExisting?: boolean) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  existingAttendees = [],
  onRegisterSuccess,
}) => {
  // Form State with 12 School Registration Fields
  const [formData, setFormData] = useState({
    schoolType: 'โรงเรียนขยายโอกาสทางการศึกษา',
    schoolName: '',
    serviceArea: '',
    studentType: 'นักเรียนมัธยมศึกษาตอนต้น (ม.1 - ม.3)',
    interestedActivities: '',
    executivesCount: 0,
    teachersCount: 1,
    studentsCount: 5,
    coordinatorName: '',
    coordinatorPhone: '',
    contactEmail: '',
    acceptanceFormUrl: '',
    password: '',
    confirmPassword: '',
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

  // Total attendees calculation
  const totalCount =
    (Number(formData.executivesCount) || 0) +
    (Number(formData.teachersCount) || 0) +
    (Number(formData.studentsCount) || 0);

  // Handle Registration Form Submission with CAPTCHA
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Field Validations
    if (!formData.schoolName.trim()) {
      setFormError('กรุณากรอกชื่อสถานศึกษา (โรงเรียน)');
      return;
    }

    if (!formData.serviceArea.trim()) {
      setFormError('กรุณาระบุเขตพื้นที่บริการที่โรงเรียนตั้งอยู่');
      return;
    }

    if (!formData.coordinatorName.trim()) {
      setFormError('กรุณากรอกชื่อ - นามสกุล ครูผู้ประสานงาน');
      return;
    }

    if (!formData.coordinatorPhone.trim()) {
      setFormError('กรุณากรอกเบอร์โทรศัพท์ครูผู้ประสานงาน');
      return;
    }

    const emailToUse =
      formData.contactEmail.trim() ||
      `school_${formData.coordinatorPhone.trim().replace(/\D/g, '') || Date.now()}@pcshsloei.ac.th`;

    if (formData.contactEmail.trim() && (!formData.contactEmail.includes('@') || !formData.contactEmail.includes('.'))) {
      setFormError('กรุณากรอกรูปแบบอีเมลติดต่อกลับให้ถูกต้อง (เช่น teacher@gmail.com)');
      return;
    }

    // Password validation (default to phone or 123456 if empty)
    const effectivePassword = formData.password.trim() || formData.coordinatorPhone.trim() || '123456';
    if (formData.password && formData.password.length < 6) {
      setFormError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setFormError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
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

    // Split coordinator name for firstName/lastName
    const nameParts = formData.coordinatorName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'ครูผู้ประสานงาน';
    const lastName = nameParts.slice(1).join(' ') || formData.schoolName.trim();

    // Check duplicate registration by school name & phone
    const existing = existingAttendees.find(
      (a) =>
        (a.schoolName && a.schoolName.trim().toLowerCase() === formData.schoolName.trim().toLowerCase()) ||
        (a.coordinatorPhone && a.coordinatorPhone.trim() === formData.coordinatorPhone.trim())
    );

    if (existing) {
      alert(
        `👋 โรงเรียน/สถานศึกษา "${formData.schoolName}" หรือเบอร์ ${formData.coordinatorPhone} เคยลงทะเบียนไว้ในระบบแล้ว!\n\nรหัสประจำตัว: ${existing.participantCode}\nท่านสามารถเข้าสู่ระบบเพื่อดูบัตรประจำตัวและ QR Code ได้ทันที`
      );
      onRegisterSuccess(existing, true);
      onClose();
      return;
    }

    setLoading(true);

    try {
      // Generate Consecutive Participant Code (e.g. PCSHS-0001, PCSHS-0002, ...)
      const participantCode = getNextConsecutiveParticipantCode(existingAttendees);

      const newAttendee: Attendee = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        participantCode,
        email: emailToUse.toLowerCase(),
        password: effectivePassword,
        isVerified: true,
        firstName,
        lastName,
        phone: formData.coordinatorPhone.trim(),
        status: 'ครู-อาจารย์' as AttendeeStatus,
        organization: formData.schoolName.trim(),
        district: formData.serviceArea.trim(),
        province: 'เลย',
        attendeeCount: Math.max(1, totalCount),
        transportMethod: 'รถตู้/รถบัสโรงเรียน' as TransportMethod,
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        checkedIn: false,
        qrCodeData: participantCode,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.schoolName)}&background=F97316&color=fff&bold=true`,
        // 12 School Specific Fields
        schoolType: formData.schoolType,
        schoolName: formData.schoolName.trim(),
        serviceArea: formData.serviceArea.trim(),
        studentType: formData.studentType,
        interestedActivities: formData.interestedActivities.trim(),
        executivesCount: Number(formData.executivesCount) || 0,
        teachersCount: Number(formData.teachersCount) || 0,
        studentsCount: Number(formData.studentsCount) || 0,
        coordinatorName: formData.coordinatorName.trim(),
        coordinatorPhone: formData.coordinatorPhone.trim(),
        contactEmail: formData.contactEmail.trim(),
        acceptanceFormUrl: formData.acceptanceFormUrl.trim(),
        registrationSource: 'web_registration',
        isWebIndividual: true,
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
        `🎉 ลงทะเบียนสถานศึกษาสำเร็จ!\n\nสถานศึกษา: ${newAttendee.schoolName}\nรหัสประจำตัว: ${newAttendee.participantCode}\nครูผู้ประสานงาน: ${newAttendee.coordinatorName}`
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
        <div className="shrink-0 relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-4 sm:p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-amber-100 hover:text-white rounded-full bg-black/15 hover:bg-black/30 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pr-8 sm:pr-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center text-amber-200 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-bold text-white leading-tight">
                แบบฟอร์มลงทะเบียนเข้าร่วมงาน (สถานศึกษา/โรงเรียน)
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-100 mt-0.5">
                โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย • วันศุกร์ที่ 28 สิงหาคม 2569
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Notice */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="text-amber-600 shrink-0">⚠️</span>
            <span>หากลงทะเบียนใน QR Code ที่ได้รับในหนังสือเชิญแล้ว ไม่ต้องลงทะเบียนซ้ำ</span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl text-center">
                {formError}
              </div>
            )}

            {/* Section 1: School Info */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-orange-500" />
                <span>1. ข้อมูลสถานศึกษา (โรงเรียน)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทของโรงเรียน <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.schoolType}
                    onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                  >
                    <option value="โรงเรียนขยายโอกาสทางการศึกษา">โรงเรียนขยายโอกาสทางการศึกษา</option>
                    <option value="โรงเรียนมัธยมศึกษา (สพม.)">โรงเรียนมัธยมศึกษา (สพม.)</option>
                    <option value="โรงเรียนประถมศึกษา (สพป.)">โรงเรียนประถมศึกษา (สพป.)</option>
                    <option value="โรงเรียนเอกชน">โรงเรียนเอกชน</option>
                    <option value="โรงเรียนสาธิต / สถาบันการศึกษาอื่นๆ">โรงเรียนสาธิต / สถาบันการศึกษาอื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อสถานศึกษา (โรงเรียน) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="เช่น โรงเรียนเลยพิทยาคม"
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  โรงเรียนตั้งอยู่เขตพื้นที่บริการ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.serviceArea}
                  onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                  placeholder="เช่น ในเขตพื้นที่บริการ สพม.เลย หนองบัวลำภู, อำเภอเมืองเลย จังหวัดเลย"
                  className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            {/* Section 2: Participants & Activities */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span>2. ข้อมูลผู้เข้าร่วมและกิจกรรมที่สนใจ</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทนักเรียนที่เข้าร่วม <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.studentType}
                    onChange={(e) => setFormData({ ...formData, studentType: e.target.value })}
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                  >
                    <option value="นักเรียนมัธยมศึกษาตอนต้น (ม.1 - ม.3)">นักเรียนมัธยมศึกษาตอนต้น (ม.1 - ม.3)</option>
                    <option value="นักเรียนมัธยมศึกษาตอนปลาย (ม.4 - ม.6)">นักเรียนมัธยมศึกษาตอนปลาย (ม.4 - ม.6)</option>
                    <option value="นักเรียนประถมศึกษาตอนปลาย (ป.4 - ป.6)">นักเรียนประถมศึกษาตอนปลาย (ป.4 - ป.6)</option>
                    <option value="นักเรียนทุกระดับชั้นที่สนใจ">นักเรียนทุกระดับชั้นที่สนใจ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รายการกิจกรรมที่สนใจเข้าร่วม
                  </label>
                  <input
                    type="text"
                    value={formData.interestedActivities}
                    onChange={(e) => setFormData({ ...formData, interestedActivities: e.target.value })}
                    placeholder="เช่น นิทรรศการ 8 สาขาวิชา, การประกวดโครงงาน"
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ผู้บริหารสถานศึกษา (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.executivesCount}
                    onChange={(e) => setFormData({ ...formData, executivesCount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ครู/บุคลากร (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.teachersCount}
                    onChange={(e) => setFormData({ ...formData, teachersCount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    นักเรียน (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.studentsCount}
                    onChange={(e) => setFormData({ ...formData, studentsCount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900">
                <span>ยอดผู้เข้าร่วมรวมทั้งหมด:</span>
                <span className="text-sm text-orange-600 font-extrabold">{totalCount} คน</span>
              </div>
            </div>

            {/* Section 3: Coordinator Contact */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>3. ข้อมูลครูผู้ประสานงานและช่องทางติดต่อ</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ - นามสกุล ครูผู้ประสานงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.coordinatorName}
                    onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                    placeholder="เช่น ครูสมชาย มั่งคั่ง"
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ (ครูผู้ประสานงาน) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.coordinatorPhone}
                    onChange={(e) => setFormData({ ...formData, coordinatorPhone: e.target.value })}
                    placeholder="เช่น 0812345678"
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมลสำหรับติดต่อกลับ
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="เช่น teacher@gmail.com"
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ลิงก์แบบตอบรับเข้าร่วมงาน (Google Drive / ลิงก์ไฟล์)
                  </label>
                  <input
                    type="url"
                    value={formData.acceptanceFormUrl}
                    onChange={(e) => setFormData({ ...formData, acceptanceFormUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/..."
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Optional Password Creation */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>4. กำหนดรหัสผ่านสำหรับเข้าสู่ระบบ (อุปกรณ์อื่น/ดูบัตร)</span>
                <span className="text-[10px] text-slate-400 font-normal">หากไม่ระบุ จะใช้เบอร์โทรศัพท์เป็นรหัสผ่าน</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">กำหนดรหัสผ่าน (ถ้ามี)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="เช่น 123456"
                      className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl pl-3 pr-9 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ยืนยันรหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                      className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl pl-3 pr-9 py-2 text-slate-900 text-sm focus:outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
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
                    <span>ยืนยันและลงทะเบียนสถานศึกษา</span>
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
