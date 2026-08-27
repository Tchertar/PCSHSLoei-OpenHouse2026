import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  ArrowLeft,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Home,
  Download,
  Printer,
  Copy,
  Check,
  User,
  School,
  Sparkles,
  Award,
  ExternalLink,
  Users,
  X,
  ChevronRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Attendee, Coordinator, SchoolStudent, NewUserRegistration } from '../types';
import {
  subscribeAttendees,
  subscribeCoordinators,
  subscribeSchoolStudents,
  subscribeNewRegistrations,
} from '../lib/firebase';

interface GetQrCodePageProps {
  onBackToHome: () => void;
  onOpenRegister?: () => void;
  onSelectAttendeeForProfile?: (attendee: Attendee) => void;
}

// Unified Result Interface
interface FoundParticipant {
  id: string;
  sourceGroup: 'group1' | 'group2_coord' | 'group2_student' | 'group3';
  groupLabel: string;
  code: string;
  prefix?: string;
  name: string;
  phone?: string;
  email?: string;
  school?: string;
  roleOrGrade?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  rawAttendee?: Attendee;
}

export const GetQrCodePage: React.FC<GetQrCodePageProps> = ({
  onBackToHome,
  onOpenRegister,
  onSelectAttendeeForProfile,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FoundParticipant[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<FoundParticipant | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Data sets from Firestore / Cache
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [schoolStudents, setSchoolStudents] = useState<SchoolStudent[]>([]);
  const [newUsers, setNewUsers] = useState<NewUserRegistration[]>([]);

  const ticketCardRef = useRef<HTMLDivElement>(null);

  // Subscribe to live data across all groups
  useEffect(() => {
    const unsubAttendees = subscribeAttendees((data) => setAttendees(data || []));
    const unsubCoordinators = subscribeCoordinators((data) => setCoordinators(data || []));
    const unsubStudents = subscribeSchoolStudents((data) => setSchoolStudents(data || []));
    const unsubNewUsers = subscribeNewRegistrations((data) => setNewUsers(data || []));

    return () => {
      unsubAttendees();
      unsubCoordinators();
      unsubStudents();
      unsubNewUsers();
    };
  }, []);

  // Normalize phone for searching
  const normalizeDigits = (val: string) => val.replace(/\D/g, '');

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    setIsSearching(true);
    setHasSearched(true);
    setSelectedPerson(null);

    const queryLower = query.toLowerCase();
    const queryDigits = normalizeDigits(query);
    const foundList: FoundParticipant[] = [];

    // Helper map for coordinator phones and schools to help their students
    const coordPhoneMap = new Map<string, string>();
    const coordSchoolMap = new Map<string, string>();
    coordinators.forEach((c) => {
      const p = normalizeDigits(c.phone || '');
      if (p) coordPhoneMap.set(c.id, p);
      if (c.code) coordPhoneMap.set(c.code.toUpperCase(), p);
      if (c.school) {
        coordSchoolMap.set(c.id, c.school);
        if (c.code) coordSchoolMap.set(c.code.toUpperCase(), c.school);
      }
    });

    // 1. Search in Group 1: Attendees
    attendees.forEach((att) => {
      const attPhone = normalizeDigits(att.phone || '');
      const attEmail = (att.email || '').toLowerCase();
      const attCode = (att.participantCode || '').toLowerCase();
      const attName = `${att.prefix || ''}${att.firstName || ''} ${att.lastName || ''}`.toLowerCase();

      let match = false;
      if (queryDigits.length >= 4 && attPhone.includes(queryDigits)) match = true;
      else if (attEmail.includes(queryLower) && queryLower.includes('@')) match = true;
      else if (attCode === queryLower || attCode.includes(queryLower)) match = true;
      else if (attName.includes(queryLower)) match = true;

      if (match) {
        foundList.push({
          id: att.id,
          sourceGroup: 'group1',
          groupLabel: 'กลุ่ม 1 : ผู้ลงทะเบียนล่วงหน้า',
          code: att.participantCode,
          prefix: att.prefix,
          name: `${att.firstName} ${att.lastName}`.trim(),
          phone: att.phone,
          email: att.email,
          school: att.organization || att.schoolName || '-',
          roleOrGrade: att.position || att.status || 'ผู้เข้าร่วมงาน',
          checkedIn: !!att.checkedIn,
          checkedInAt: att.checkedInAt,
          rawAttendee: att,
        });
      }
    });

    // 2. Search in Group 2: Coordinators
    coordinators.forEach((coord) => {
      const cPhone = normalizeDigits(coord.phone || '');
      const cEmail = (coord.email || '').toLowerCase();
      const cCode = (coord.code || '').toLowerCase();
      const cName = (coord.name || '').toLowerCase();

      let match = false;
      if (queryDigits.length >= 4 && cPhone.includes(queryDigits)) match = true;
      else if (cEmail.includes(queryLower) && queryLower.includes('@')) match = true;
      else if (cCode === queryLower || cCode.includes(queryLower)) match = true;
      else if (cName.includes(queryLower)) match = true;

      if (match) {
        foundList.push({
          id: coord.id,
          sourceGroup: 'group2_coord',
          groupLabel: 'กลุ่ม 2 : ครูผู้ประสานงานโรงเรียน',
          code: coord.code,
          name: coord.name,
          phone: coord.phone,
          email: coord.email,
          school: coord.school,
          roleOrGrade: 'ครูผู้ประสานงาน',
          checkedIn: !!coord.checkedIn,
          checkedInAt: coord.checkedInAt,
        });
      }
    });

    // 2. Search in Group 2: School Students (1,361 students)
    schoolStudents.forEach((stu) => {
      const sCode = (stu.code || '').toLowerCase();
      const sName = `${stu.prefix || ''}${stu.firstName || ''} ${stu.lastName || ''}`.toLowerCase();
      const stuSchool = stu.school || coordSchoolMap.get(stu.coordinatorId) || '-';
      const coordPhone = coordPhoneMap.get(stu.coordinatorId) || '';

      let match = false;
      if (sCode === queryLower || sCode.includes(queryLower)) match = true;
      else if (sName.includes(queryLower)) match = true;
      else if (queryDigits.length >= 9 && coordPhone.includes(queryDigits)) match = true;

      if (match) {
        foundList.push({
          id: stu.id,
          sourceGroup: 'group2_student',
          groupLabel: 'กลุ่ม 2 : นักเรียนในสังกัดโรงเรียน',
          code: stu.code,
          prefix: stu.prefix,
          name: `${stu.firstName} ${stu.lastName}`.trim(),
          school: stuSchool,
          roleOrGrade: stu.gradeLevel || stu.grade || 'นักเรียน',
          checkedIn: !!stu.attended,
          checkedInAt: stu.attendedAt,
        });
      }
    });

    // 3. Search in Group 3: New User Registrations (OH47001...)
    newUsers.forEach((u) => {
      const uPhone = normalizeDigits(u.phone || '');
      const uEmail = (u.email || '').toLowerCase();
      const uCode = (u.code || '').toLowerCase();
      const uName = (u.fullName || '').toLowerCase();

      let match = false;
      if (queryDigits.length >= 4 && uPhone.includes(queryDigits)) match = true;
      else if (uEmail.includes(queryLower) && queryLower.includes('@')) match = true;
      else if (uCode === queryLower || uCode.includes(queryLower)) match = true;
      else if (uName.includes(queryLower)) match = true;

      if (match) {
        foundList.push({
          id: u.id,
          sourceGroup: 'group3',
          groupLabel: 'กลุ่ม 3 : ผู้ลงทะเบียนหน้างาน',
          code: u.code,
          prefix: u.prefix,
          name: u.fullName,
          phone: u.phone,
          email: u.email,
          school: u.school,
          roleOrGrade: 'ผู้ลงทะเบียนหน้างาน',
          checkedIn: !!u.checkedIn,
          checkedInAt: u.checkedInAt,
        });
      }
    });

    setResults(foundList);
    if (foundList.length === 1) {
      setSelectedPerson(foundList[0]);
    }
    setIsSearching(false);
  };

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Download QR Code PNG
  const handleDownloadQrPng = (person: FoundParticipant) => {
    const svgElement = document.querySelector('#qr-ticket-card svg') as SVGElement | null;
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 400;
        canvas.height = 400;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 25, 25, 350, 350);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QRCode_PCSHS_${person.code}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Failed to export QR PNG', err);
    }
  };

  // Download Ticket Card as PDF
  const handleDownloadPdf = async (person: FoundParticipant) => {
    if (!ticketCardRef.current) return;
    setDownloadingPdf(true);

    try {
      const canvas = await html2canvas(ticketCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ticket_PCSHS_OpenHouse_${person.code}.pdf`);
    } catch (err) {
      console.error('PDF generation fallback to print:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Prompt',sans-serif] flex flex-col justify-between">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-16 sm:h-18 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-xs">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <span className="font-black text-sm sm:text-base text-slate-900">
              รับ QR Code บัตรผู้เข้าร่วมงาน
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        
        {/* Search Header Banner */}
        <div className="w-full text-center max-w-2xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>PCSHS Loei Open House 2026 Pass Retrieval</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            ค้นหาและรับ QR Code บัตรเข้าร่วมงาน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            กรอกหมายเลขโทรศัพท์ อีเมล รหัสประจำตัว (เช่น PCSHS-0001, OH0101, OH47001) หรือชื่อ-นามสกุล เพื่อรับบัตร QR Code ประจำตัว
          </p>
        </div>

        {/* SEARCH FORM BOX */}
        <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-lg mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="search-input" className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                ค้นหาด้วย: เบอร์โทรศัพท์ / อีเมล / รหัสประจำตัว / ชื่อ-สกุล
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  id="search-input"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="เช่น 0812345678, user@email.com, OH0101, ชินกฤต..."
                  className="w-full pl-12 pr-28 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl text-slate-900 font-semibold text-sm sm:text-base outline-none transition-all placeholder:text-slate-400 shadow-inner"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!searchInput.trim() || isSearching}
                  className="absolute right-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSearching ? (
                    <span>กำลังค้นหา...</span>
                  ) : (
                    <>
                      <span>ค้นหา</span>
                      <Search className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Helper Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">ตัวอย่างการค้นหา:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('08');
                  handleSearch();
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                เบอร์โทร (มี 0 นำหน้า)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('OH01');
                  handleSearch();
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                รหัสกลุ่ม OH01...
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('PCSHS-0001');
                  handleSearch();
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                PCSHS-0001
              </button>
            </div>
          </form>
        </div>

        {/* RESULTS SECTION */}
        {hasSearched && (
          <div className="w-full max-w-2xl space-y-6">
            
            {/* If NO RESULTS FOUND */}
            {results.length === 0 && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    ไม่พบข้อมูลผู้เข้าร่วมงานที่ตรงกับคำค้นหา
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    กรุณาตรวจสอบความถูกต้องของเบอร์โทรศัพท์ อีเมล หรือรหัสประจำตัว หรือลองค้นหาด้วยชื่อ-นามสกุล
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    ล้างการค้นหา
                  </button>
                  {onOpenRegister && (
                    <button
                      type="button"
                      onClick={onOpenRegister}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>ลงทะเบียนเข้าร่วมงานใหม่</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* If MULTIPLE RESULTS FOUND -> List of Candidates */}
            {results.length > 1 && !selectedPerson && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-orange-500" />
                    <span>พบข้อมูลตรงกัน {results.length} รายการ (กรุณาเลือกชื่อของท่าน)</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {results.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => setSelectedPerson(person)}
                      className="bg-white hover:bg-orange-50/40 border-2 border-slate-200 hover:border-orange-300 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm shrink-0 border border-orange-200 group-hover:scale-105 transition-transform">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-base">
                              {person.prefix ? `${person.prefix} ` : ''}{person.name}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded">
                              {person.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {person.school || '-'} • <span className="text-indigo-600 font-semibold">{person.roleOrGrade}</span>
                          </p>
                          <div className="mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">{person.groupLabel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-orange-600 hidden sm:inline group-hover:underline">
                          ดู QR Code
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-orange-500 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If A SINGLE OR SELECTED PARTICIPANT -> SHOW COMPLETE OFFICIAL PASS BADGE */}
            {selectedPerson && (
              <div className="space-y-4">
                {results.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>กลับไปเลือกรายชื่ออื่น (พบ {results.length} คน)</span>
                  </button>
                )}

                {/* THE OFFICIAL PASS TICKET CARD */}
                <div
                  ref={ticketCardRef}
                  id="qr-ticket-card"
                  className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-slate-900 relative"
                >
                  {/* Top Color Banner */}
                  <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-5 sm:p-6 text-white text-center relative">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-2 border border-white/30 shadow-inner">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/th/thumb/f/f9/Princess_Chulabhorn%27s_College_Loei_Logo.png/200px-Princess_Chulabhorn%27s_College_Loei_Logo.png"
                        alt="Logo"
                        className="w-8 h-8 object-contain"
                        onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                      />
                    </div>
                    <span className="text-[11px] uppercase tracking-widest font-black text-amber-200 block">
                      PCSHS LOEI OPEN HOUSE 2026
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                      บัตรประจำตัวผู้เข้าร่วมงาน
                    </h2>
                    <p className="text-xs text-orange-100 font-medium">
                      โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
                    </p>
                  </div>

                  {/* Pass Body Content */}
                  <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
                    
                    {/* QR Code Container */}
                    <div className="p-4 bg-white border-2 border-slate-200 rounded-3xl shadow-md relative group">
                      <QRCodeSVG
                        value={selectedPerson.code}
                        size={200}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                          src: 'https://upload.wikimedia.org/wikipedia/th/thumb/f/f9/Princess_Chulabhorn%27s_College_Loei_Logo.png/200px-Princess_Chulabhorn%27s_College_Loei_Logo.png',
                          x: undefined,
                          y: undefined,
                          height: 38,
                          width: 38,
                          excavate: true,
                        }}
                      />
                    </div>

                    {/* Participant Code Badge with Copy */}
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-base sm:text-lg font-black text-slate-800 tracking-wider">
                        {selectedPerson.code}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(selectedPerson.code)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer shadow-xs"
                        title="คัดลอกรหัส"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Participant Details */}
                    <div className="space-y-2 max-w-md w-full">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        {selectedPerson.prefix ? `${selectedPerson.prefix} ` : ''}{selectedPerson.name}
                      </h3>
                      
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-full">
                        <Award className="w-3.5 h-3.5" />
                        <span>{selectedPerson.roleOrGrade || 'ผู้เข้าร่วมงาน'}</span>
                      </div>

                      <div className="pt-2 text-xs sm:text-sm text-slate-600 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-slate-700 font-medium">
                          <School className="w-4 h-4 text-slate-400" />
                          <span>{selectedPerson.school || '-'}</span>
                        </div>
                        {selectedPerson.phone && (
                          <div className="flex items-center justify-center gap-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{selectedPerson.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attendance Status Pill */}
                    <div className="w-full pt-2">
                      {selectedPerson.checkedIn ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>เช็คชื่อเข้าร่วมงานเรียบร้อยแล้ว ✅</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 text-left">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <span>
                            <strong>ยังไม่ได้เช็คชื่อ</strong>: กรุณาแสดง QR Code นี้แก่เจ้าหน้าที่จุดลงทะเบียนเมื่อเดินทางมาถึงงาน
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Card Footer Note */}
                  <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
                    {selectedPerson.groupLabel}
                  </div>
                </div>

                {/* ACTION BUTTONS (Download PNG / Download PDF / Open Profile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadQrPng(selectedPerson)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>บันทึกภาพ QR Code (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedPerson)}
                    disabled={downloadingPdf}
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{downloadingPdf ? 'กำลังจัดทำ PDF...' : 'พิมพ์บัตร / บันทึกเป็น PDF'}</span>
                  </button>
                </div>

                {/* If full attendee profile is available */}
                {selectedPerson.rawAttendee && onSelectAttendeeForProfile && (
                  <button
                    type="button"
                    onClick={() => onSelectAttendeeForProfile(selectedPerson.rawAttendee!)}
                    className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>ดูหน้าโปรไฟล์เต็มรูปแบบ & ข้อมูลกิจกรรมของฉัน</span>
                  </button>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย (PCSHS Loei Open House 2026)
      </footer>
    </div>
  );
};
