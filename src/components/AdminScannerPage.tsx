import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Home,
  UserPlus,
  QrCode,
  CheckCircle2,
  X,
  Phone,
  Mail,
  User,
  Briefcase,
  School,
  Copy,
  Check,
  Printer,
  Download,
  Plus,
  Search,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Attendee, AttendeeStatus } from '../types';
import {
  saveAttendeeToFirestore,
  getNextConsecutiveParticipantCode,
  subscribeAttendees,
  getLocallySavedAttendees,
} from '../lib/firebase';

interface AdminScannerPageProps {
  onBackToHome: () => void;
  attendees?: Attendee[];
  onAddAttendee?: (newAttendee: Attendee) => void;
}

const PREFIX_OPTIONS = [
  'นาย',
  'นาง',
  'นางสาว',
  'เด็กชาย',
  'เด็กหญิง',
  'ดร.',
  'ผศ.ดร.',
  'รศ.ดร.',
  'อาจารย์',
  'อื่นๆ (ระบุเอง)',
];

const POSITION_OPTIONS = [
  'ครู/อาจารย์',
  'นักเรียน',
  'ผู้อำนวยการโรงเรียน / ผู้บริหารสถานศึกษา',
  'รองผู้อำนวยการโรงเรียน',
  'ครูผู้ประสานงาน',
  'บุคลากรทางการศึกษา',
  'ผู้ปกครอง',
  'บุคคลทั่วไป / วิทยากร',
  'อื่นๆ (ระบุเอง)',
];

export const AdminScannerPage: React.FC<AdminScannerPageProps> = ({
  onBackToHome,
  attendees: initialAttendees = [],
  onAddAttendee,
}) => {
  const [attendeesList, setAttendeesList] = useState<Attendee[]>(initialAttendees);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createdAttendee, setCreatedAttendee] = useState<Attendee | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form Fields State
  const [prefix, setPrefix] = useState('นาย');
  const [customPrefix, setCustomPrefix] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('ครู/อาจารย์');
  const [customPosition, setCustomPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter in recent attendees
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to live attendees
  useEffect(() => {
    const unsub = subscribeAttendees((data) => {
      if (data && data.length > 0) {
        setAttendeesList(data);
      }
    });
    return () => unsub();
  }, []);

  // Reset Form
  const resetForm = () => {
    setPrefix('นาย');
    setCustomPrefix('');
    setFirstName('');
    setLastName('');
    setPosition('ครู/อาจารย์');
    setCustomPosition('');
    setPhone('');
    setEmail('');
    setOrganization('โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย');
    setFormError('');
  };

  const handleOpenModal = () => {
    resetForm();
    setCreatedAttendee(null);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalPrefix = prefix === 'อื่นๆ (ระบุเอง)' ? customPrefix.trim() : prefix;
    const finalPosition = position === 'อื่นๆ (ระบุเอง)' ? customPosition.trim() : position;

    if (!finalPrefix) {
      setFormError('กรุณาระบุคำนำหน้าชื่อ');
      return;
    }
    if (!firstName.trim()) {
      setFormError('กรุณากรอกชื่อ');
      return;
    }
    if (!lastName.trim()) {
      setFormError('กรุณากรอกนามสกุล');
      return;
    }
    if (!finalPosition) {
      setFormError('กรุณาระบุตำแหน่ง');
      return;
    }
    if (!phone.trim()) {
      setFormError('กรุณากรอกหมายเลขโทรศัพท์');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 10) {
      setFormError('หมายเลขโทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก (เช่น 0812345678)');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine participant code
      const nextCode = getNextConsecutiveParticipantCode(attendeesList);

      // Determine general AttendeeStatus
      let mappedStatus: AttendeeStatus = 'บุคคลทั่วไป';
      if (finalPosition.includes('นักเรียน')) {
        mappedStatus = 'นักเรียน';
      } else if (finalPosition.includes('ครู') || finalPosition.includes('อาจารย์') || finalPosition.includes('ผู้อำนวยการ') || finalPosition.includes('ผู้บริหาร') || finalPosition.includes('บุคลากร')) {
        mappedStatus = 'ครู/อาจารย์';
      } else if (finalPosition.includes('ผู้ปกครอง')) {
        mappedStatus = 'ผู้ปกครอง';
      }

      const newAttendee: Attendee = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        participantCode: nextCode,
        prefix: finalPrefix,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: finalPosition,
        phone: cleanPhone,
        email: email.trim().toLowerCase() || `${cleanPhone}@pcshs.ac.th`,
        status: mappedStatus,
        organization: organization.trim() || 'โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย',
        district: 'เมืองเลย',
        province: 'เลย',
        attendeeCount: 1,
        transportMethod: 'รถส่วนตัว',
        registeredAt: new Date().toISOString(),
        checkedIn: false,
        qrCodeData: nextCode,
        registrationSource: 'admin_entry',
        schoolName: organization.trim() || 'โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย',
      };

      // Save to Firebase & local storage
      await saveAttendeeToFirestore(newAttendee);

      // Update local state list
      setAttendeesList((prev) => [newAttendee, ...prev]);

      if (onAddAttendee) {
        onAddAttendee(newAttendee);
      }

      // Success Trigger
      setCreatedAttendee(newAttendee);
      setIsSubmitting(false);

      // Celebration effect
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      console.error('Error adding attendee:', err);
      setFormError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Filtered attendees for the recent list table
  const recentAttendees = attendeesList.filter((att) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${att.prefix || ''} ${att.firstName} ${att.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      att.participantCode.toLowerCase().includes(query) ||
      att.phone.includes(query) ||
      (att.email && att.email.toLowerCase().includes(query)) ||
      (att.position && att.position.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Prompt',sans-serif] flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3.5 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <ScanLine className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-slate-800">
              สแกน QR Code สำหรับแอดมิน
            </span>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="หน้าแรก"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center space-y-8">
        
        {/* Main Card (Matches User Interface Mockup) */}
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
          
          {/* Header Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
            <ScanLine className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold rounded-full mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>หน้าสำหรับ: 2. สแกน QR Code (Admin)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              ระบบสแกน QR Code เจ้าหน้าที่
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
            </p>
          </div>

          {/* Info Notice Box */}
          <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-left text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>หน้ารองรับข้อมูล (พร้อมระบบสแกนและเช็คชื่อกลุ่มคณะ)</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              หน้านี้ถูกเตรียมไว้สำหรับระบบล็อกอินแอดมิน / เปิดกล้องสแกน QR Code / ค้นหาชื่อ-โรงเรียน / เช็คชื่อสมาชิกและคณะครู-นักเรียนแบบรายบุคคลเพื่อจัดทำเกียรติบัตร พร้อมให้ท่านส่งคำสั่งเพิ่มรายละเอียดในขั้นตอนถัดไป
            </p>
          </div>

          {/* ACTION BUTTON AREA (Exactly in the requested position indicated by red box) */}
          <div className="pt-1 space-y-3">
            <button
              type="button"
              id="btn-add-new-attendee"
              onClick={handleOpenModal}
              className="w-full py-4 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer transform hover:-translate-y-0.5 active:scale-98 group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                <UserPlus className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </div>
              <span>เพิ่มข้อมูลผู้เข้าร่วมใหม่</span>
            </button>

            <button
              type="button"
              onClick={onBackToHome}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าแรกของเว็บไซต์</span>
            </button>
          </div>
        </div>

        {/* RECENT ADDED PARTICIPANTS PREVIEW LIST (Quick Admin Table) */}
        {attendeesList.length > 0 && (
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                  {attendeesList.length}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    รายชื่อผู้เข้าร่วมในระบบ (รวม {attendeesList.length} ท่าน)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ข้อมูลผู้เข้าร่วมงานที่ลงทะเบียนและบันทึกผ่านระบบ
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัส, เบอร์..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Attendees Table */}
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">รหัส QR</th>
                    <th className="py-2.5 px-3">คำนำหน้า ชื่อ-สกุล</th>
                    <th className="py-2.5 px-3">ตำแหน่ง</th>
                    <th className="py-2.5 px-3">เบอร์โทรศัพท์</th>
                    <th className="py-2.5 px-3">อีเมล</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendees.slice(0, 15).map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                        {att.participantCode}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {att.prefix ? `${att.prefix} ` : ''}{att.firstName} {att.lastName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">
                          {att.position || att.status || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {att.phone}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[150px]">
                        {att.email}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {att.checkedIn ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            เช็คอินแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                            ยังไม่เช็คอิน
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {recentAttendees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        ไม่พบข้อมูลที่ตรงกับคำค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย (PCSHS Loei Open House 2026)
      </footer>

      {/* MODAL: เพิ่มข้อมูลผู้เข้าร่วมใหม่ (Form Modal) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 my-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!createdAttendee ? (
              /* FORM STATE */
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      เพิ่มข้อมูลผู้เข้าร่วมใหม่
                    </h2>
                    <p className="text-xs text-slate-500">
                      กรอกข้อมูลผู้เข้าร่วมงานเพื่อสร้างรหัสและ QR Code
                    </p>
                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. คำนำหน้าชื่อ (Prefix) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำนำหน้าชื่อ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800"
                    required
                  >
                    {PREFIX_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {prefix === 'อื่นๆ (ระบุเอง)' && (
                    <input
                      type="text"
                      placeholder="ระบุคำนำหน้าชื่อ เช่น ว่าที่ร้อยตรี, ศ.ดร."
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value)}
                      className="mt-2 w-full px-3.5 py-2 text-sm bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>

                {/* 2. ชื่อ & 3. สกุล */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="ชื่อจริง (เช่น สมชาย)"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      สกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="นามสกุล (เช่น ใจดี)"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* 4. ตำแหน่ง (Position) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ตำแหน่ง <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                      required
                    >
                      {POSITION_OPTIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                  {position === 'อื่นๆ (ระบุเอง)' && (
                    <input
                      type="text"
                      placeholder="ระบุตำแหน่ง เช่น นักวิชาการศึกษา, วิทยากรพิเศษ"
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      className="mt-2 w-full px-3.5 py-2 text-sm bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>

                {/* 5. หมายเลขโทรศัพท์ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="0812345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={10}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    ตัวเลข 10 หลัก ใช้สำหรับตรวจสอบและรับสิทธิ์
                  </span>
                </div>

                {/* 6. Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email (อีเมล) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* 7. โรงเรียน / หน่วยงาน */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานศึกษา / โรงเรียน / หน่วยงาน
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ชื่อโรงเรียนหรือสังกัด"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>กำลังบันทึก...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>บันทึกข้อมูลผู้เข้าร่วม</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* SUCCESS STATE WITH QR CODE */
              <div className="text-center space-y-5 py-2 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    บันทึกข้อมูลสำเร็จเรียบร้อย
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                    {createdAttendee.prefix ? `${createdAttendee.prefix} ` : ''}
                    {createdAttendee.firstName} {createdAttendee.lastName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ตำแหน่ง: {createdAttendee.position || createdAttendee.status}
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-slate-50 border-2 border-blue-100 rounded-2xl p-4 inline-block shadow-inner mx-auto">
                  <div className="bg-white p-3 rounded-xl shadow-xs inline-block">
                    <QRCodeSVG
                      value={createdAttendee.participantCode}
                      size={160}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-mono text-base font-black text-blue-600 tracking-wider">
                      {createdAttendee.participantCode}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      เบอร์โทร: {createdAttendee.phone}
                    </div>
                  </div>
                </div>

                {/* Action Buttons for QR */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(createdAttendee.participantCode)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">คัดลอกรหัสแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span>คัดลอกรหัสประจำตัว ({createdAttendee.participantCode})</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setCreatedAttendee(null);
                      }}
                      className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มท่านต่อไป</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>ปิดหน้าต่าง</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
