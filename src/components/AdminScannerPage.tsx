import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Upload,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Home,
  QrCode,
  Copy,
  Check,
  Printer,
  Trash2,
  Phone,
  Mail,
  School,
  Briefcase,
  User,
  X,
  Plus,
  RefreshCw,
  Eye,
  ShieldCheck,
  Filter,
  Building2,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Attendee, AttendeeStatus } from '../types';
import {
  saveAttendeeToFirestore,
  saveAllAttendeesToFirestore,
  deleteAttendeeFromFirestore,
  clearAllAttendeesFromFirestore,
  getNextConsecutiveParticipantCode,
  subscribeAttendees,
  formatThaiPhoneNumber,
} from '../lib/firebase';
import { CoordinatorsManagementTab } from './CoordinatorsManagementTab';
import { NewUserRegistrationsTab } from './NewUserRegistrationsTab';

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
  'ผู้อำนวยการโรงเรียน / ผู้บริหาร',
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
  const [activeGroupTab, setActiveGroupTab] = useState<'group1' | 'group2' | 'group3'>('group1');
  const [attendeesList, setAttendeesList] = useState<Attendee[]>(initialAttendees);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checkedIn' | 'notCheckedIn' | 'duplicates'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingAttendeeQr, setViewingAttendeeQr] = useState<Attendee | null>(null);
  const [createdAttendee, setCreatedAttendee] = useState<Attendee | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Single Add Form State
  const [prefix, setPrefix] = useState('นาย');
  const [customPrefix, setCustomPrefix] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [position, setPosition] = useState('ครู/อาจารย์');
  const [customPosition, setCustomPosition] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to live attendees
  useEffect(() => {
    const unsub = subscribeAttendees((data) => {
      if (data) {
        setAttendeesList(data);
      }
    });
    return () => unsub();
  }, []);

  // Compute duplicate names count
  const duplicateNameCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const att of attendeesList) {
      const first = (att.firstName || '').trim();
      const last = (att.lastName || '').trim();
      const nameKey = `${first} ${last}`.toLowerCase().replace(/\s+/g, ' ');
      if (nameKey) {
        counts.set(nameKey, (counts.get(nameKey) || 0) + 1);
      }
    }
    return counts;
  }, [attendeesList]);

  // Count total duplicate records
  const duplicateAttendeesCount = React.useMemo(() => {
    return attendeesList.filter((att) => {
      const nameKey = `${(att.firstName || '').trim()} ${(att.lastName || '').trim()}`.toLowerCase().replace(/\s+/g, ' ');
      return (duplicateNameCounts.get(nameKey) || 0) > 1;
    }).length;
  }, [attendeesList, duplicateNameCounts]);

  // Filter attendees
  const filteredAttendees = attendeesList.filter((att) => {
    // 1. Status / Duplicate Filter
    if (statusFilter === 'checkedIn' && !att.checkedIn) return false;
    if (statusFilter === 'notCheckedIn' && att.checkedIn) return false;
    if (statusFilter === 'duplicates') {
      const nameKey = `${(att.firstName || '').trim()} ${(att.lastName || '').trim()}`.toLowerCase().replace(/\s+/g, ' ');
      if ((duplicateNameCounts.get(nameKey) || 0) <= 1) return false;
    }

    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${att.prefix || ''} ${att.firstName} ${att.lastName}`.toLowerCase();
    const code = (att.participantCode || '').toLowerCase();
    const pos = (att.position || att.status || '').toLowerCase();
    const school = (att.schoolName || att.organization || '').toLowerCase();
    const ph = (att.phone || '').toLowerCase();
    const em = (att.email || '').toLowerCase();

    return (
      fullName.includes(query) ||
      code.includes(query) ||
      pos.includes(query) ||
      school.includes(query) ||
      ph.includes(query) ||
      em.includes(query)
    );
  });

  // Calculate Statistics
  const totalCount = attendeesList.length;
  const checkedInCount = attendeesList.filter((a) => a.checkedIn).length;
  const notCheckedInCount = totalCount - checkedInCount;

  // Position breakdown
  const teachersCount = attendeesList.filter(
    (a) =>
      (a.position && (a.position.includes('ครู') || a.position.includes('อาจารย์'))) ||
      a.status === 'ครู/อาจารย์'
  ).length;
  const studentsCount = attendeesList.filter(
    (a) => (a.position && a.position.includes('นักเรียน')) || a.status === 'นักเรียน'
  ).length;
  const otherCount = totalCount - (teachersCount + studentsCount);

  // 1. Download Excel Template (.xlsx)
  const handleDownloadTemplate = () => {
    const headers = [
      'รหัส',
      'ชื่อ',
      'ตำแหน่ง',
      'ชื่อสถานศึกษา(ถ้ามี)',
      'เบอร์โทรศัพท์',
      'อีเมล',
    ];

    const sampleRows = [
      [
        'PCSHS-0001',
        'นายสมชาย ใจดี',
        'ครู/อาจารย์',
        'โรงเรียนเลยพิทยาคม',
        '0812345678',
        'somchai@school.ac.th',
      ],
      [
        'PCSHS-0002',
        'นางสาววิภาดา สุขใจ',
        'นักเรียน',
        'โรงเรียนจุฬาภรณราชวิทยาลัย เลย',
        '0898765432',
        'wipada@student.ac.th',
      ],
      [
        'PCSHS-0003',
        'ดร.กิตติศักดิ์ เจริญรุ่งเรือง',
        'ผู้อำนวยการโรงเรียน',
        'โรงเรียนเชียงคาน',
        '0865551234',
        'kittisak@moe.go.th',
      ],
      [
        'PCSHS-0004',
        'นางนภาวรรณ มั่งมี',
        'ผู้ปกครอง',
        '-',
        '0841112233',
        'napawan@gmail.com',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    // Set column widths
    ws['!cols'] = [
      { wch: 16 }, // รหัส
      { wch: 26 }, // ชื่อ
      { wch: 22 }, // ตำแหน่ง
      { wch: 32 }, // ชื่อสถานศึกษา(ถ้ามี)
      { wch: 18 }, // เบอร์โทรศัพท์
      { wch: 28 }, // อีเมล
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ผู้ลงทะเบียนล่วงหน้า');
    XLSX.writeFile(wb, 'เทมเพลต_ผู้ลงทะเบียนล่วงหน้า_กลุ่มที่1.xlsx');
  };

  // 2. Export Current Attendees to Excel
  const handleExportExcel = () => {
    if (attendeesList.length === 0) {
      alert('ไม่มีข้อมูลผู้ลงทะเบียนสำหรับ Export');
      return;
    }

    const data = attendeesList.map((att, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสประจำตัว': att.participantCode,
      'คำนำหน้า': att.prefix || '',
      'ชื่อ - นามสกุล': `${att.prefix ? att.prefix + ' ' : ''}${att.firstName} ${att.lastName}`.trim(),
      'ตำแหน่ง': att.position || att.status || '-',
      'ชื่อสถานศึกษา(ถ้ามี)': att.schoolName || att.organization || '-',
      'เบอร์โทรศัพท์': att.phone,
      'อีเมล': att.email,
      'สถานะการเช็คอิน': att.checkedIn ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน',
      'เวลาลงทะเบียน': att.registeredAt || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 16 },
      { wch: 12 },
      { wch: 28 },
      { wch: 22 },
      { wch: 32 },
      { wch: 18 },
      { wch: 28 },
      { wch: 16 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อผู้ลงทะเบียน');
    XLSX.writeFile(wb, `รายชื่อผู้ลงทะเบียนล่วงหน้า_กลุ่มที่1_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // 3. Import Excel (.xlsx, .xls, .csv)
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportNotice(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          setImportNotice({
            type: 'error',
            message: 'ไม่พบข้อมูลแถวในไฟล์ Excel ที่เลือก',
          });
          setIsImporting(false);
          return;
        }

        // Calculate starting sequence number
        let currentMaxSeq = 0;
        attendeesList.forEach((a) => {
          const match = (a.participantCode || '').match(/PCSHS(?:2026)?[-_]?(\d+)/i);
          if (match && match[1]) {
            const n = parseInt(match[1], 10);
            if (!isNaN(n) && n > currentMaxSeq && n < 100000) currentMaxSeq = n;
          }
        });
        if (currentMaxSeq === 0) currentMaxSeq = attendeesList.length;

        const newAttendees: Attendee[] = [];
        let seqCounter = currentMaxSeq;

        rawRows.forEach((row, idx) => {
          const rowKeys = Object.keys(row);
          const getValue = (...keys: string[]) => {
            for (const key of keys) {
              const kLower = key.trim().toLowerCase();
              const matchedKey = rowKeys.find((k) => {
                const targetK = k.trim().toLowerCase();
                return (
                  targetK === kLower ||
                  targetK.replace(/[\s_\-()]/g, '') === kLower.replace(/[\s_\-()]/g, '') ||
                  targetK.includes(kLower)
                );
              });
              if (
                matchedKey &&
                row[matchedKey] !== undefined &&
                row[matchedKey] !== null &&
                String(row[matchedKey]).trim() !== ''
              ) {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          // 1. รหัส (Code) - check all possible headers
          let participantCode = getValue(
            'รหัส',
            'รหัสประจำตัว',
            'รหัสผู้ลงทะเบียน',
            'รหัสผู้เข้าร่วม',
            'รหัสผู้ใช้',
            'เลขประจำตัว',
            'Code',
            'code',
            'ID',
            'id',
            'Id',
            'participantCode',
            'user_id',
            'ลำดับ',
            'No',
            'No.',
            'no'
          );

          // If no matched header, check if the first column is a short code/identifier
          if (!participantCode && rowKeys.length > 0) {
            const firstVal = String(row[rowKeys[0]] || '').trim();
            if (firstVal && !firstVal.includes(' ') && firstVal.length <= 30) {
              participantCode = firstVal;
            }
          }

          if (!participantCode) {
            seqCounter += 1;
            participantCode = `PCSHS-${String(seqCounter).padStart(4, '0')}`;
          }

          // 2. ชื่อ (Name)
          const rawName = getValue(
            'ชื่อ',
            'ชื่อ-สกุล',
            'ชื่อ - นามสกุล',
            'ชื่อผู้ลงทะเบียน',
            'ชื่อ นามสกุล',
            'Name',
            'FullName',
            'firstName',
            'full_name'
          );
          if (!rawName) return; // Skip empty row

          // Parse prefix, first name, last name
          let parsedPrefix = '';
          let cleanFullName = rawName;
          const knownPrefixes = [
            'นาย',
            'นางสาว',
            'นาง',
            'เด็กชาย',
            'เด็กหญิง',
            'ดร.',
            'ผศ.ดร.',
            'รศ.ดร.',
            'ศ.ดร.',
            'อาจารย์',
            'ว่าที่ร้อยตรี',
            'ว่าที่ ร.ต.',
          ];
          for (const kp of knownPrefixes) {
            if (cleanFullName.startsWith(kp)) {
              parsedPrefix = kp;
              cleanFullName = cleanFullName.substring(kp.length).trim();
              break;
            }
          }

          const nameParts = cleanFullName.split(/\s+/).filter(Boolean);
          const firstName = nameParts[0] || 'ผู้เข้าร่วม';
          const lastName = nameParts.slice(1).join(' ') || '-';

          // 3. ตำแหน่ง (Position)
          const rawPosition =
            getValue('ตำแหน่ง', 'Position', 'หน้าที่', 'สถานะ', 'role', 'status') || 'ผู้เข้าร่วมงาน';

          // Determine general AttendeeStatus
          let mappedStatus: AttendeeStatus = 'บุคคลทั่วไป';
          if (rawPosition.includes('นักเรียน')) {
            mappedStatus = 'นักเรียน';
          } else if (
            rawPosition.includes('ครู') ||
            rawPosition.includes('อาจารย์') ||
            rawPosition.includes('ผู้อำนวยการ') ||
            rawPosition.includes('ผู้บริหาร') ||
            rawPosition.includes('บุคลากร')
          ) {
            mappedStatus = 'ครู/อาจารย์';
          } else if (rawPosition.includes('ผู้ปกครอง')) {
            mappedStatus = 'ผู้ปกครอง';
          }

          // 4. ชื่อสถานศึกษา(ถ้ามี) (School Name)
          const rawSchool =
            getValue(
              'ชื่อสถานศึกษา(ถ้ามี)',
              'ชื่อสถานศึกษา',
              'สถานศึกษา',
              'โรงเรียน',
              'หน่วยงาน',
              'สถาบัน',
              'schoolName',
              'organization',
              'school'
            ) || 'โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย';

          // 5. เบอร์โทรศัพท์ (Phone)
          const rawPhone = getValue('เบอร์โทรศัพท์', 'เบอร์โทร', 'เบอร์ติดต่อ', 'โทร', 'Phone', 'tel', 'mobile');
          const cleanPhone = formatThaiPhoneNumber(rawPhone) || '0000000000';

          // 6. อีเมล (Email)
          let rawEmail = getValue('อีเมล', 'Email', 'E-mail', 'e-mail', 'mail');
          if (!rawEmail || !rawEmail.includes('@')) {
            rawEmail = `${cleanPhone !== '0000000000' ? cleanPhone : `user_${idx + 1}`}@pcshs.ac.th`;
          }

          const codeSafe = participantCode.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
          const nameSafe = `${firstName}_${lastName}`.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
          const uniqueId = `att_${codeSafe || `${nameSafe}_${idx}`}`;

          const newAtt: Attendee = {
            id: uniqueId,
            participantCode,
            prefix: parsedPrefix,
            firstName,
            lastName,
            position: rawPosition,
            schoolName: rawSchool,
            organization: rawSchool,
            phone: cleanPhone,
            email: rawEmail.toLowerCase(),
            status: mappedStatus,
            district: 'เมืองเลย',
            province: 'เลย',
            attendeeCount: 1,
            transportMethod: 'รถส่วนตัว',
            registeredAt: new Date().toISOString(),
            checkedIn: false,
            qrCodeData: participantCode,
            registrationSource: 'excel_import',
          };

          newAttendees.push(newAtt);
        });

        if (newAttendees.length === 0) {
          setImportNotice({
            type: 'error',
            message: 'ไม่สามารถอ่านข้อมูลผู้ลงทะเบียนจากไฟล์ได้ กรุณาตรวจสอบหัวคอลัมน์ในไฟล์ Excel',
          });
          setIsImporting(false);
          return;
        }

        // Deduplicate only by exact participantCode if non-empty, preserving all unique rows
        const seenCodes = new Set<string>();
        const uniqueBatch: Attendee[] = [];

        for (const att of newAttendees) {
          const c = (att.participantCode || '').toLowerCase().trim();
          if (c && seenCodes.has(c)) continue;
          if (c) seenCodes.add(c);
          uniqueBatch.push(att);
        }

        // Replace and save cleanly to Firebase and local storage
        await saveAllAttendeesToFirestore(uniqueBatch, true);

        // Update local state list with exact imported items
        setAttendeesList(uniqueBatch);

        setImportNotice({
          type: 'success',
          message: `นำเข้าข้อมูลสำเร็จทั้งหมด ${uniqueBatch.length} รายการ (รหัสตรงตามไฟล์ Excel และหมายเลขโทรศัพท์ขึ้นต้นด้วย 0 ครบถ้วน)`,
        });

        // Trigger confetti
        try {
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      } catch (err: any) {
        console.error('Error importing Excel file:', err);
        setImportNotice({
          type: 'error',
          message: `เกิดข้อผิดพลาดในการประมวลผลไฟล์: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`,
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // 4. Toggle Check-in status
  const handleToggleCheckIn = async (attendee: Attendee) => {
    const updated: Attendee = {
      ...attendee,
      checkedIn: !attendee.checkedIn,
      checkedInAt: !attendee.checkedIn ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    setAttendeesList((prev) => prev.map((a) => (a.id === attendee.id ? updated : a)));
    await saveAttendeeToFirestore(updated);
  };

  // 5. Delete Attendee
  const handleDeleteAttendee = async (attendee: Attendee) => {
    if (
      !window.confirm(
        `คุณต้องการลบข้อมูลของ "${attendee.prefix ? attendee.prefix + ' ' : ''}${attendee.firstName} ${attendee.lastName}" (${attendee.participantCode}) หรือไม่?`
      )
    ) {
      return;
    }

    setAttendeesList((prev) => prev.filter((a) => a.id !== attendee.id));
    await deleteAttendeeFromFirestore(attendee.id);
  };

  // 6. Clear All Attendees
  const handleClearAll = async () => {
    const confirmInput = prompt(
      '⚠️ คำเตือน: คุณต้องการลบข้อมูลผู้ลงทะเบียนล่วงหน้าทั้งหมดออกจากฐานข้อมูลหรือไม่?\n\nพิมพ์ "CLEAR ALL" เพื่อยืนยัน:'
    );
    if (confirmInput !== 'CLEAR ALL') {
      if (confirmInput !== null) alert('คำยืนยันไม่ถูกต้อง');
      return;
    }

    setAttendeesList([]);
    await clearAllAttendeesFromFirestore();
    alert('ลบข้อมูลทั้งหมดเรียบร้อยแล้ว');
  };

  // 6.1 Deduplicate records immediately
  const handleDeduplicate = async () => {
    const seenCodes = new Set<string>();
    const seenKeys = new Set<string>();
    const uniqueList: Attendee[] = [];

    for (const att of attendeesList) {
      const code = (att.participantCode || '').trim().toLowerCase();
      const key = `${att.firstName || ''}_${att.lastName || ''}_${att.phone || ''}`.trim().toLowerCase();
      if (code && seenCodes.has(code)) continue;
      if (key && key !== '__' && seenKeys.has(key)) continue;

      if (code) seenCodes.add(code);
      if (key && key !== '__') seenKeys.add(key);
      uniqueList.push(att);
    }

    if (uniqueList.length === attendeesList.length) {
      alert('ไม่พบรายการซ้ำซ้อนในระบบ ข้อมูลถูกต้องครบถ้วนแล้ว');
      return;
    }

    const removedCount = attendeesList.length - uniqueList.length;
    if (
      window.confirm(
        `พบรายการซ้ำซ้อน ${removedCount} รายการ ต้องการลบรายการที่ซ้ำออกทั้งหมดและอัปเดตฐานข้อมูลให้เหลือ ${uniqueList.length} รายการ หรือไม่?`
      )
    ) {
      setAttendeesList(uniqueList);
      await saveAllAttendeesToFirestore(uniqueList, true);
      alert(`ลบรายการซ้ำซ้อนเรียบร้อยแล้ว คงเหลือข้อมูล ${uniqueList.length} รายการ`);
    }
  };

  // 7. Single Form Submit
  const handleSingleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalPrefix = prefix === 'อื่นๆ (ระบุเอง)' ? customPrefix.trim() : prefix;
    const finalPosition = position === 'อื่นๆ (ระบุเอง)' ? customPosition.trim() : position;

    if (!fullNameInput.trim()) {
      setFormError('กรุณากรอกชื่อ - นามสกุล');
      return;
    }
    if (!phone.trim()) {
      setFormError('กรุณากรอกหมายเลขโทรศัพท์');
      return;
    }

    const cleanPhone = formatThaiPhoneNumber(phone);
    if (cleanPhone.length < 9 || cleanPhone.length > 10) {
      setFormError('หมายเลขโทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก (เช่น 0812345678)');
      return;
    }

    setIsSubmitting(true);
    try {
      const nameParts = fullNameInput.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || 'ผู้เข้าร่วม';
      const lastName = nameParts.slice(1).join(' ') || '-';

      const nextCode = customCode.trim() || getNextConsecutiveParticipantCode(attendeesList);

      let mappedStatus: AttendeeStatus = 'บุคคลทั่วไป';
      if (finalPosition.includes('นักเรียน')) mappedStatus = 'นักเรียน';
      else if (
        finalPosition.includes('ครู') ||
        finalPosition.includes('อาจารย์') ||
        finalPosition.includes('ผู้อำนวยการ') ||
        finalPosition.includes('ผู้บริหาร') ||
        finalPosition.includes('บุคลากร')
      )
        mappedStatus = 'ครู/อาจารย์';
      else if (finalPosition.includes('ผู้ปกครอง')) mappedStatus = 'ผู้ปกครอง';

      const newAttendee: Attendee = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        participantCode: nextCode,
        prefix: finalPrefix,
        firstName,
        lastName,
        position: finalPosition,
        schoolName: schoolName.trim() || 'โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย',
        organization: schoolName.trim() || 'โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย',
        phone: cleanPhone,
        email: email.trim().toLowerCase() || `${cleanPhone}@pcshs.ac.th`,
        status: mappedStatus,
        district: 'เมืองเลย',
        province: 'เลย',
        attendeeCount: 1,
        transportMethod: 'รถส่วนตัว',
        registeredAt: new Date().toISOString(),
        checkedIn: false,
        qrCodeData: nextCode,
        registrationSource: 'admin_entry',
      };

      await saveAttendeeToFirestore(newAttendee);
      setAttendeesList((prev) => [newAttendee, ...prev]);

      if (onAddAttendee) onAddAttendee(newAttendee);

      setCreatedAttendee(newAttendee);
      setIsSubmitting(false);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      console.error('Error adding attendee:', err);
      setFormError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Prompt',sans-serif] flex flex-col justify-between">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3.5 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">กลับสู่หน้าหลัก</span>
            <span className="sm:hidden">กลับ</span>
          </button>

          {/* Group Switcher Tabs in Header */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 overflow-x-auto max-w-[calc(100vw-140px)] sm:max-w-none">
            <button
              type="button"
              id="tab-group-1-attendees"
              onClick={() => setActiveGroupTab('group1')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeGroupTab === 'group1'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>กลุ่ม 1 : ลงทะเบียนล่วงหน้า</span>
              <span className={`hidden md:inline-block px-1.5 py-0.2 text-[10px] rounded-md ${activeGroupTab === 'group1' ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-200 text-slate-600'}`}>
                {attendeesList.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-group-2-coordinators"
              onClick={() => setActiveGroupTab('group2')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeGroupTab === 'group2'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>กลุ่ม 2 : ผู้ประสานงาน</span>
            </button>

            <button
              type="button"
              id="tab-group-3-new-users"
              onClick={() => setActiveGroupTab('group3')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeGroupTab === 'group3'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>กลุ่ม 3 : ลงทะเบียนผู้ใช้ใหม่</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="หน้าแรก"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Conditional Tab Rendering */}
        {activeGroupTab === 'group2' ? (
          <CoordinatorsManagementTab />
        ) : activeGroupTab === 'group3' ? (
          <NewUserRegistrationsTab />
        ) : (
          <>
            {/* Top Overview & Excel Control Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ระบบจัดการฐานข้อมูลสำหรับแอดมิน (Admin Only)</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  ฐานข้อมูลผู้ใช้กลุ่มที่ 1 : ลงทะเบียนล่วงหน้า
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  เก็บข้อมูล 6 คอลัมน์หลัก: <strong className="text-slate-700 font-semibold">รหัส, ชื่อ, ตำแหน่ง, ชื่อสถานศึกษา(ถ้ามี), เบอร์โทรศัพท์, อีเมล</strong> (นับ 1 รายชื่อ = 1 ผู้เข้าร่วม)
                </p>
              </div>
            </div>

            {/* Action Buttons for Excel Import / Export / Template */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* 1. Download Template */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                title="ดาวน์โหลดไฟล์ตัวอย่าง Excel พร้อมหัวตาราง 6 คอลัมน์"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>ดาวน์โหลดเทมเพลต Excel (.XLSX)</span>
              </button>

              {/* 2. Hidden File Input & Upload Excel Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <button
                type="button"
                id="btn-upload-excel-attendees"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className={`w-4 h-4 text-blue-100 ${isImporting ? 'animate-bounce' : ''}`} />
                <span>{isImporting ? 'กำลังนำเข้าข้อมูล...' : 'อัปโหลดไฟล์ Excel (.XLSX)'}</span>
              </button>

              {/* 3. Export Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
                title="ดาวน์โหลดรายชื่อผู้ลงทะเบียนทั้งหมดในรูปแบบ Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export รายชื่อ</span>
              </button>

              {/* 4. Single Add Manual Button */}
              <button
                type="button"
                onClick={() => {
                  setFullNameInput('');
                  setPhone('');
                  setEmail('');
                  setSchoolName('');
                  setCustomCode('');
                  setFormError('');
                  setCreatedAttendee(null);
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                <span>เพิ่มรายบุคคล</span>
              </button>
            </div>
          </div>

          {/* Import Notice Banner */}
          {importNotice && (
            <div
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                importNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {importNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{importNotice.message}</span>
              </div>
              <button
                onClick={() => setImportNotice(null)}
                className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Key Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  ยอดลงทะเบียนล่วงหน้าทั้งหมด
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {totalCount} <span className="text-xs font-normal text-slate-500">คน</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 block">
                  สแกนเช็คอินเข้างานแล้ว
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800">
                  {checkedInCount} <span className="text-xs font-normal text-emerald-600">คน</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 block">
                  ยังไม่ได้เช็คอิน
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-800">
                  {notCheckedInCount} <span className="text-xs font-normal text-amber-600">คน</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-700 block">
                  สัดส่วน ครู / นร. / อื่นๆ
                </span>
                <span className="text-sm sm:text-base font-bold text-purple-900 mt-1 block">
                  ครู {teachersCount} • นร. {studentsCount} • อื่นๆ {otherCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* DATA TABLE SECTION (แสดงตารางรายชื่อในหน้าเดียวกัน) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
          
          {/* Table Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>ตารางรายชื่อผู้ลงทะเบียนล่วงหน้า</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {filteredAttendees.length} / {totalCount} ท่าน
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                ข้อมูลที่บันทึกลงในฐานข้อมูล Firebase และพร้อมสำหรับการสแกน QR Code หน้างาน
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter Pills */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('checkedIn')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'checkedIn'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  เช็คอินแล้ว ({checkedInCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('notCheckedIn')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'notCheckedIn'
                      ? 'bg-white text-amber-700 shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  ยังไม่เช็คอิน ({notCheckedInCount})
                </button>
                {duplicateAttendeesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('duplicates')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      statusFilter === 'duplicates'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-amber-800 bg-amber-100/70 hover:bg-amber-200/80'
                    }`}
                    title="แสดงเฉพาะรายชื่อที่ซ้ำกัน"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>รายชื่อซ้ำ ({duplicateAttendeesCount})</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส, ชื่อ, ตำแหน่ง, โรงเรียน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                />
              </div>

              {attendeesList.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleDeduplicate}
                    className="px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    title="ลบรายการซ้ำซ้อนและรักษารหัสจริงตามไฟล์"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                    <span>ลบรายการซ้ำ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    title="ลบข้อมูลผู้เข้าร่วมทั้งหมด"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ล้างฐานข้อมูล</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Duplicate Notice Alert Banner */}
          {duplicateAttendeesCount > 0 && statusFilter !== 'duplicates' && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  ระบบตรวจพบรายชื่อที่ซ้ำกันทั้งหมด <strong>{duplicateAttendeesCount} รายการ</strong> (แถวที่มีไฮไลต์สีส้ม/เหลือง)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter('duplicates')}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                กรองเฉพาะรายชื่อซ้ำ
              </button>
            </div>
          )}

          {/* Attendees Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">1. รหัส</th>
                  <th className="px-4 py-3.5">2. ชื่อ - นามสกุล</th>
                  <th className="px-4 py-3.5">3. ตำแหน่ง</th>
                  <th className="px-4 py-3.5">4. ชื่อสถานศึกษา (ถ้ามี)</th>
                  <th className="px-4 py-3.5">5. เบอร์โทรศัพท์</th>
                  <th className="px-4 py-3.5">6. อีเมล</th>
                  <th className="px-4 py-3.5 text-center">สถานะเช็คอิน</th>
                  <th className="px-4 py-3.5 text-right">QR & จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAttendees.map((att) => {
                  const rawFirst = (att.firstName || '').trim();
                  const rawLast = (att.lastName || '').trim();
                  const nameKey = `${rawFirst} ${rawLast}`.toLowerCase().replace(/\s+/g, ' ');
                  const duplicateCount = duplicateNameCounts.get(nameKey) || 0;
                  const isDuplicate = duplicateCount > 1;

                  return (
                    <tr
                      key={att.id}
                      className={`transition-colors ${
                        isDuplicate
                          ? 'bg-amber-50/70 hover:bg-amber-100/80 border-l-4 border-l-amber-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. รหัส */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-xs inline-block">
                          {att.participantCode}
                        </span>
                      </td>

                      {/* 2. ชื่อ */}
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <User className={`w-3.5 h-3.5 shrink-0 ${isDuplicate ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span className={isDuplicate ? 'text-amber-950 font-bold' : ''}>
                              {att.prefix ? `${att.prefix} ` : ''}
                              {att.firstName} {att.lastName}
                            </span>
                            {isDuplicate && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/90 border border-amber-400 text-amber-900 text-[10px] font-extrabold shadow-2xs"
                                title={`พบรายชื่อนี้ซ้ำกัน ${duplicateCount} รายการในฐานข้อมูล`}
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>ซ้ำ ({duplicateCount} รายการ)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                    {/* 3. ตำแหน่ง */}
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {att.position || att.status || '-'}
                      </span>
                    </td>

                    {/* 4. ชื่อสถานศึกษา(ถ้ามี) */}
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium text-slate-800">
                          {att.schoolName || att.organization || '-'}
                        </span>
                      </div>
                    </td>

                    {/* 5. เบอร์โทรศัพท์ */}
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                      {att.phone ? (
                        <a
                          href={`tel:${formatThaiPhoneNumber(att.phone)}`}
                          className="hover:text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{formatThaiPhoneNumber(att.phone)}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 6. อีเมล */}
                    <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[160px]">
                      {att.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{att.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 7. สถานะเช็คอิน */}
                    <td className="px-4 py-3 text-center">
                      {att.checkedIn ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          เช็คอินแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-xs bg-slate-100 px-2.5 py-1 rounded-full">
                          ยังไม่เช็คอิน
                        </span>
                      )}
                    </td>

                    {/* 8. QR & จัดการ */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingAttendeeQr(att)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="ดู QR Code ประจำตัว"
                        >
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          <span>QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(att)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            att.checkedIn
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          {att.checkedIn ? 'ยกเลิก' : 'เช็คอิน'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAttendee(att)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs transition-colors cursor-pointer border border-red-200/60"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}

                {filteredAttendees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {searchQuery
                            ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา'
                            : 'ยังไม่มีข้อมูลผู้ลงทะเบียนล่วงหน้าในระบบ'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          {searchQuery
                            ? 'ลองเปลี่ยนคำค้นหาเป็นชื่อ รหัส เบอร์โทรศัพท์ หรือโรงเรียน'
                            : 'กดปุ่ม "อัปโหลดไฟล์ Excel (.XLSX)" ด้านบนเพื่อนำเข้ารายชื่อผู้ลงทะเบียนล่วงหน้าพร้อมกันได้ทันที'}
                        </p>
                      </div>
                      {!searchQuery && (
                        <div className="pt-2 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>โหลดไฟล์ตัวอย่าง</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>อัปโหลด Excel</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย (PCSHS Loei Open House 2026)
      </footer>

      {/* QR CODE VIEW MODAL */}
      {viewingAttendeeQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <button
              type="button"
              onClick={() => setViewingAttendeeQr(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200">
                บัตรประจำตัวผู้ลงทะเบียนล่วงหน้า
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-2">
                {viewingAttendeeQr.prefix ? `${viewingAttendeeQr.prefix} ` : ''}
                {viewingAttendeeQr.firstName} {viewingAttendeeQr.lastName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {viewingAttendeeQr.position || viewingAttendeeQr.status} • {viewingAttendeeQr.schoolName || viewingAttendeeQr.organization}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-slate-50 border-2 border-blue-100 rounded-2xl p-4 inline-block shadow-inner mx-auto">
              <div className="bg-white p-3 rounded-xl shadow-xs inline-block">
                <QRCodeSVG
                  value={viewingAttendeeQr.participantCode}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="mt-2 text-center">
                <div className="font-mono text-base font-black text-blue-600 tracking-wider">
                  {viewingAttendeeQr.participantCode}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  📞 {formatThaiPhoneNumber(viewingAttendeeQr.phone)}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyCode(viewingAttendeeQr.participantCode)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">คัดลอกรหัสแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>คัดลอกรหัส ({viewingAttendeeQr.participantCode})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewingAttendeeQr(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE MANUAL ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 my-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!createdAttendee ? (
              <form onSubmit={handleSingleFormSubmit} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      เพิ่มข้อมูลผู้ลงทะเบียนล่วงหน้า
                    </h2>
                    <p className="text-xs text-slate-500">
                      กรอกข้อมูลตาม 6 ฟิลด์มาตรฐานเพื่อบันทึกลงฐานข้อมูล
                    </p>
                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. รหัส (ถ้ามี/เว้นว่างให้อัตโนมัติ) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. รหัสประจำตัว <span className="text-slate-400 font-normal">(เว้นว่างเพื่อให้ระบบสร้างต่ออัตโนมัติ)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น PCSHS-0001 (ถ้าเว้นว่างจะรันต่อให้อัตโนมัติ)"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                  />
                </div>

                {/* 2. คำนำหน้า & ชื่อ-สกุล */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      คำนำหน้า
                    </label>
                    <select
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-slate-800"
                    >
                      {PREFIX_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. ชื่อ - นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น สมชาย ใจดี"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* 3. ตำแหน่ง */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. ตำแหน่ง <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    {POSITION_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                  {position === 'อื่นๆ (ระบุเอง)' && (
                    <input
                      type="text"
                      placeholder="ระบุตำแหน่งเอง"
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl"
                      required
                    />
                  )}
                </div>

                {/* 4. ชื่อสถานศึกษา(ถ้ามี) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4. ชื่อสถานศึกษา(ถ้ามี)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น โรงเรียนเลยพิทยาคม"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                {/* 5. เบอร์โทรศัพท์ & 6. อีเมล */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      5. เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="0812345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={10}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6. อีเมล
                    </label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4 py-2 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    บันทึกข้อมูลสำเร็จ
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
                    {createdAttendee.prefix ? `${createdAttendee.prefix} ` : ''}
                    {createdAttendee.firstName} {createdAttendee.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    รหัสประจำตัว: <span className="font-mono font-bold text-blue-600">{createdAttendee.participantCode}</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-blue-100 rounded-2xl p-3 inline-block">
                  <QRCodeSVG value={createdAttendee.participantCode} size={140} level="H" />
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFullNameInput('');
                      setPhone('');
                      setEmail('');
                      setSchoolName('');
                      setCustomCode('');
                      setCreatedAttendee(null);
                    }}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200"
                  >
                    เพิ่มท่านต่อไป
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
