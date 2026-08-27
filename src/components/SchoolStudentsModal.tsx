import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  Download,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  FileSpreadsheet,
  School,
  User,
  GraduationCap,
  AlertCircle,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Coordinator, SchoolStudent } from '../types';
import {
  subscribeSchoolStudents,
  saveSchoolStudentToFirestore,
  saveAllSchoolStudentsToFirestore,
  deleteSchoolStudentFromFirestore,
  toggleStudentAttendanceInFirestore,
  batchUpdateSchoolStudentsAttendance,
  clearSchoolStudentsByCoordinator,
} from '../lib/firebase';

interface SchoolStudentsModalProps {
  coordinator: Coordinator;
  onClose: () => void;
}

const PREFIX_OPTIONS = [
  'เด็กชาย',
  'เด็กหญิง',
  'ด.ช.',
  'ด.ญ.',
  'นาย',
  'นางสาว',
  'น.ส.',
  'นาง',
  'อื่นๆ (ระบุเอง)',
];

const GRADE_OPTIONS = [
  'มัธยมศึกษาปีที่ 1 (ม.1)',
  'มัธยมศึกษาปีที่ 2 (ม.2)',
  'มัธยมศึกษาปีที่ 3 (ม.3)',
  'มัธยมศึกษาปีที่ 4 (ม.4)',
  'มัธยมศึกษาปีที่ 5 (ม.5)',
  'มัธยมศึกษาปีที่ 6 (ม.6)',
  'ประถมศึกษาปีที่ 4 (ป.4)',
  'ประถมศึกษาปีที่ 5 (ป.5)',
  'ประถมศึกษาปีที่ 6 (ป.6)',
  'ปวช.',
  'ปวส.',
  'อื่นๆ (ระบุเอง)',
];

// Helper to cleanly compare school names without prefixes like รร., โรงเรียน, spaces, punctuation
export const cleanSchoolName = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(โรงเรียน|รร\.|รร\s+)/gi, '')
    .replace(/[\s\-_.,()]/g, '')
    .trim();
};

export const isStudentOfCoordinator = (student: SchoolStudent, coordinator: Coordinator): boolean => {
  if (!student || !coordinator) return false;
  // 1. Direct Coordinator ID / Code Match
  if (student.coordinatorId) {
    if (student.coordinatorId === coordinator.id) return true;
    if (coordinator.code && student.coordinatorId.trim().toLowerCase() === coordinator.code.trim().toLowerCase()) return true;
    // If student is already bound to a specific coordinator, do NOT leak to other coordinators
    return false;
  }
  // 2. Legacy fallback only if student has NO coordinatorId at all
  const stuSchool = cleanSchoolName(student.school);
  const coordSchool = cleanSchoolName(coordinator.school);
  if (stuSchool && coordSchool) {
    return stuSchool === coordSchool;
  }
  return false;
};

export const SchoolStudentsModal: React.FC<SchoolStudentsModalProps> = ({
  coordinator,
  onClose,
}) => {
  const [allStudents, setAllStudents] = useState<SchoolStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attended' | 'notAttended'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add / Edit student form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<SchoolStudent | null>(null);
  const [code, setCode] = useState('');
  const [prefix, setPrefix] = useState('ด.ช.');
  const [customPrefix, setCustomPrefix] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('มัธยมศึกษาปีที่ 1 (ม.1)');
  const [customGrade, setCustomGrade] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to live school students
  useEffect(() => {
    const unsub = subscribeSchoolStudents((data) => {
      if (data && Array.isArray(data)) {
        setAllStudents(data);
      }
    });
    return () => unsub();
  }, []);

  // Filter students belonging to this coordinator / school
  const schoolStudents = allStudents.filter((s) => isStudentOfCoordinator(s, coordinator));

  // Search & Status Filter
  const filteredStudents = schoolStudents.filter((stu) => {
    if (statusFilter === 'attended' && !stu.attended) return false;
    if (statusFilter === 'notAttended' && stu.attended) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const codeMatch = (stu.code || '').toLowerCase().includes(q);
    const prefixMatch = (stu.prefix || '').toLowerCase().includes(q);
    const firstMatch = (stu.firstName || '').toLowerCase().includes(q);
    const lastMatch = (stu.lastName || '').toLowerCase().includes(q);
    const gradeMatch = (stu.gradeLevel || '').toLowerCase().includes(q);
    const fullName = `${stu.prefix || ''}${stu.firstName || ''} ${stu.lastName || ''}`.toLowerCase();

    return codeMatch || prefixMatch || firstMatch || lastMatch || gradeMatch || fullName.includes(q);
  });

  const totalCount = schoolStudents.length;
  const attendedCount = schoolStudents.filter((s) => s.attended).length;
  const notAttendedCount = totalCount - attendedCount;

  // 1. Download Excel Template for Students
  const handleDownloadTemplate = () => {
    const headers = ['รหัส', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ระดับชั้น'];
    const sampleRows = [
      ['STU-001', 'ด.ช.', 'กิตติภูมิ', 'สุขสวัสดิ์', 'ม.1'],
      ['STU-002', 'ด.ญ.', 'พิมพ์ชนก', 'งามเลิศ', 'ม.2'],
      ['STU-003', 'นาย', 'ธนพล', 'แซ่ตั้ง', 'ม.4'],
      ['STU-004', 'นางสาว', 'กัญญาภัทร', 'วงศ์สุวรรณ', 'ม.5'],
      ['STU-005', 'ด.ช.', 'อัครเดช', 'มีชัย', 'ม.3'],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 16 }, // รหัส
      { wch: 14 }, // คำนำหน้า
      { wch: 22 }, // ชื่อ
      { wch: 24 }, // นามสกุล
      { wch: 18 }, // ระดับชั้น
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อนักเรียน');
    const safeSchoolName = (coordinator.school || 'โรงเรียน').replace(/[\/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `เทมเพลต_รายชื่อนักเรียน_${safeSchoolName}.xlsx`);
  };

  // Helper function to extract cell value by various possible column headers
  const getValue = (row: any, ...keys: string[]): string => {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const target = key.toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
      const foundKey = rowKeys.find((k) => {
        const cleaned = k.toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
        return cleaned === target || cleaned.includes(target) || target.includes(cleaned);
      });
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return String(row[foundKey]).trim();
      }
    }
    return '';
  };

  // Helper function to parse Prefix, First Name, Last Name
  const parsePrefixAndName = (rawPrefix: string, rawFirstName: string, rawLastName: string) => {
    let finalPrefix = rawPrefix.trim();
    let finalFirst = rawFirstName.trim();
    let finalLast = rawLastName.trim();

    // Known prefix dictionary
    const knownPrefixes = [
      'เด็กชาย',
      'เด็กหญิง',
      'ด.ช.',
      'ด.ญ.',
      'นาย',
      'นางสาว',
      'น.ส.',
      'นาง',
      'ดร.',
      'Mr.',
      'Ms.',
      'Mrs.',
      'Master',
    ];

    // If prefix is in first name
    if (!finalPrefix && finalFirst) {
      for (const p of knownPrefixes) {
        if (finalFirst.startsWith(p)) {
          finalPrefix = p;
          finalFirst = finalFirst.substring(p.length).trim();
          break;
        }
      }
    }

    // If first name still contains last name (e.g. single column name)
    if (!finalLast && finalFirst) {
      const parts = finalFirst.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        finalFirst = parts[0];
        finalLast = parts.slice(1).join(' ');
      }
    }

    return {
      prefix: finalPrefix || 'ด.ช.',
      firstName: finalFirst || '-',
      lastName: finalLast || '-',
    };
  };

  // 2. Import Students from Excel (.xlsx, .xls, .csv)
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setNotice(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('ไม่พบข้อมูลในไฟล์ Excel ที่เลือก');
        }

        const parsedStudents: SchoolStudent[] = [];
        let seq = 1;

        for (const row of rawJson) {
          const rawCode = getValue(row, 'รหัส', 'code', 'id', 'no', 'ลำดับ', 'รหัสนักเรียน', 'เลขประจำตัว');
          const rawPrefix = getValue(row, 'คำนำหน้า', 'prefix', 'title', 'คำนำหน้านาม');
          const rawFirst = getValue(row, 'ชื่อ', 'firstname', 'first_name', 'name', 'ชื่อจริง');
          const rawLast = getValue(row, 'นามสกุล', 'lastname', 'last_name', 'surname', 'สกุล');
          const rawGrade = getValue(row, 'ระดับชั้น', 'grade', 'class', 'ชั้น', 'ระดับ', 'gradelevel');
          const rawAttended = getValue(row, 'เช็คบ็อค', 'สถานะ', 'มาหรือไม่มา', 'attended', 'status');

          const { prefix: finalPrefix, firstName: finalFirst, lastName: finalLast } = parsePrefixAndName(
            rawPrefix,
            rawFirst,
            rawLast
          );

          if (!finalFirst && !finalLast && !rawCode) continue;

          const studentCode = rawCode || `STU-${String(seq).padStart(3, '0')}`;
          seq++;

          const isAttended =
            rawAttended.toLowerCase().includes('มา') ||
            rawAttended.toLowerCase() === 'true' ||
            rawAttended.toLowerCase() === '1' ||
            rawAttended.toLowerCase() === 'yes';

          const newStudent: SchoolStudent = {
            id: `stu_${coordinator.id}_${Date.now()}_${seq}_${Math.random().toString(36).substring(2, 6)}`,
            coordinatorId: coordinator.id,
            school: coordinator.school || '',
            code: studentCode,
            prefix: finalPrefix,
            firstName: finalFirst,
            lastName: finalLast,
            gradeLevel: rawGrade || 'ม.1',
            attended: isAttended,
            attendedAt: isAttended ? new Date().toISOString() : undefined,
            registeredAt: new Date().toISOString(),
          };

          parsedStudents.push(newStudent);
        }

        if (parsedStudents.length === 0) {
          throw new Error('ไม่สามารถแปลงข้อมูลนักเรียนจากไฟล์ได้ กรุณาตรวจสอบหัวตารางให้ตรงกับเทมเพลต');
        }

        // Bulk save and update local state immediately
        const savedStudents = await saveAllSchoolStudentsToFirestore(parsedStudents, coordinator.id, false);

        setAllStudents((prev) => {
          const map = new Map<string, SchoolStudent>();
          prev.forEach((s) => map.set(s.id, s));
          (savedStudents && savedStudents.length > 0 ? savedStudents : parsedStudents).forEach((s) =>
            map.set(s.id, s)
          );
          return Array.from(map.values());
        });

        setNotice({
          type: 'success',
          message: `นำเข้าข้อมูลนักเรียนโรงเรียน "${coordinator.school}" สำเร็จทั้งหมด ${parsedStudents.length} รายการ`,
        });

        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch {}
      } catch (err: any) {
        console.error('Error importing students Excel:', err);
        setNotice({
          type: 'error',
          message: `เกิดข้อผิดพลาดในการนำเข้า: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`,
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // 3. Export School Students to Excel
  const handleExportExcel = () => {
    if (schoolStudents.length === 0) {
      alert('ไม่มีข้อมูลนักเรียนสำหรับ Export');
      return;
    }

    const data = schoolStudents.map((stu, idx) => ({
      ลำดับ: idx + 1,
      รหัส: stu.code || '-',
      คำนำหน้า: stu.prefix || '',
      ชื่อ: stu.firstName || '-',
      นามสกุล: stu.lastName || '-',
      ระดับชั้น: stu.gradeLevel || '-',
      โรงเรียน: stu.school || coordinator.school || '-',
      สถานะการเข้าร่วม: stu.attended ? 'มา' : 'ยังไม่มา',
      เวลาที่เช็คชื่อ: stu.attendedAt || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 16 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 32 },
      { wch: 16 },
      { wch: 24 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อนักเรียน');
    const safeSchoolName = (coordinator.school || 'โรงเรียน').replace(/[\/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `รายชื่อนักเรียน_${safeSchoolName}.xlsx`);
  };

  // 4. Toggle single student attendance
  const handleToggleAttendance = async (student: SchoolStudent) => {
    const nextAttended = !student.attended;
    const now = new Date().toISOString();
    setAllStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? { ...s, attended: nextAttended, attendedAt: nextAttended ? now : undefined }
          : s
      )
    );
    await toggleStudentAttendanceInFirestore(student.id, nextAttended);
  };

  // 5. Batch Check-in all or uncheck-in all
  const handleBatchAttendance = async (attended: boolean) => {
    const targetIds = filteredStudents.map((s) => s.id);
    if (targetIds.length === 0) return;

    if (
      window.confirm(
        `คุณต้องการเปลี่ยนสถานะนักเรียนจำนวน ${targetIds.length} คน ให้เป็น "${attended ? 'มา' : 'ยังไม่มา'}" หรือไม่?`
      )
    ) {
      const now = new Date().toISOString();
      setAllStudents((prev) =>
        prev.map((s) =>
          targetIds.includes(s.id)
            ? { ...s, attended, attendedAt: attended ? now : undefined }
            : s
        )
      );
      await batchUpdateSchoolStudentsAttendance(targetIds, attended);
    }
  };

  // 6. Delete single student
  const handleDeleteStudent = async (student: SchoolStudent) => {
    if (
      !window.confirm(
        `ต้องการลบรายชื่อ "${student.prefix} ${student.firstName} ${student.lastName}" (${student.code}) หรือไม่?`
      )
    ) {
      return;
    }
    setAllStudents((prev) => prev.filter((s) => s.id !== student.id));
    await deleteSchoolStudentFromFirestore(student.id);
  };

  // 7. Clear all students for this school
  const handleClearAllStudents = async () => {
    if (
      !window.confirm(
        `⚠️ ต้องการลบรายชื่อนักเรียนทั้งหมดของ "${coordinator.school}" (${schoolStudents.length} คน) หรือไม่?`
      )
    ) {
      return;
    }
    setAllStudents((prev) => prev.filter((s) => !isStudentOfCoordinator(s, coordinator)));
    await clearSchoolStudentsByCoordinator(coordinator.id);
  };

  // 8. Open Add / Edit Form Modal
  const handleOpenAddForm = () => {
    setEditingStudent(null);
    const nextSeq = schoolStudents.length + 1;
    setCode(`STU-${String(nextSeq).padStart(3, '0')}`);
    setPrefix('ด.ช.');
    setCustomPrefix('');
    setFirstName('');
    setLastName('');
    setGradeLevel('มัธยมศึกษาปีที่ 1 (ม.1)');
    setCustomGrade('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (stu: SchoolStudent) => {
    setEditingStudent(stu);
    setCode(stu.code || '');
    
    if (PREFIX_OPTIONS.includes(stu.prefix || '')) {
      setPrefix(stu.prefix || 'ด.ช.');
      setCustomPrefix('');
    } else {
      setPrefix('อื่นๆ (ระบุเอง)');
      setCustomPrefix(stu.prefix || '');
    }

    setFirstName(stu.firstName || '');
    setLastName(stu.lastName || '');

    if (GRADE_OPTIONS.includes(stu.gradeLevel || '')) {
      setGradeLevel(stu.gradeLevel || 'มัธยมศึกษาปีที่ 1 (ม.1)');
      setCustomGrade('');
    } else {
      setGradeLevel('อื่นๆ (ระบุเอง)');
      setCustomGrade(stu.gradeLevel || '');
    }

    setFormError('');
    setIsFormOpen(true);
  };

  // 9. Submit Add / Edit Student Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalPrefix = prefix === 'อื่นๆ (ระบุเอง)' ? customPrefix.trim() : prefix;
    const finalGrade = gradeLevel === 'อื่นๆ (ระบุเอง)' ? customGrade.trim() : gradeLevel;

    if (!firstName.trim()) {
      setFormError('กรุณากรอกชื่อ');
      return;
    }
    if (!lastName.trim()) {
      setFormError('กรุณากรอกนามสกุล');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentData: SchoolStudent = {
        id: editingStudent ? editingStudent.id : `stu_${coordinator.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        coordinatorId: coordinator.id,
        school: coordinator.school || '',
        code: code.trim() || `STU-${String(schoolStudents.length + 1).padStart(3, '0')}`,
        prefix: finalPrefix,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gradeLevel: finalGrade || 'ม.1',
        attended: editingStudent ? editingStudent.attended : false,
        attendedAt: editingStudent ? editingStudent.attendedAt : undefined,
        registeredAt: editingStudent ? editingStudent.registeredAt : new Date().toISOString(),
      };

      const saved = await saveSchoolStudentToFirestore(studentData);

      setAllStudents((prev) => {
        const map = new Map<string, SchoolStudent>();
        prev.forEach((s) => map.set(s.id, s));
        map.set(saved.id, saved);
        return Array.from(map.values());
      });

      setIsSubmitting(false);
      setIsFormOpen(false);
      setNotice({
        type: 'success',
        message: editingStudent ? 'แก้ไขข้อมูลนักเรียนเรียบร้อยแล้ว' : 'เพิ่มข้อมูลนักเรียนเรียบร้อยแล้ว',
      });
    } catch (err: any) {
      console.error('Error saving student:', err);
      setFormError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative flex flex-col max-h-[92vh] text-slate-900 font-['Prompt',sans-serif]">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full mb-1">
                <School className="w-3.5 h-3.5" />
                <span>รายชื่อผู้เข้าร่วมของโรงเรียน (Excel)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 line-clamp-1">
                {coordinator.school || 'โรงเรียนที่ไม่ระบุชื่อ'}
              </h2>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span>
                  ผู้ประสานงาน: <strong className="text-slate-700 font-semibold">{coordinator.name || '-'}</strong>
                </span>
                <span>
                  โทร: <strong className="text-slate-700 font-semibold">{coordinator.phone || '-'}</strong>
                </span>
                <span>
                  รหัส: <span className="font-mono font-bold text-purple-600">{coordinator.code || coordinator.id}</span>
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div
            className={`my-3 p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-200 ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
            <button onClick={() => setNotice(null)} className="p-1 hover:bg-black/5 rounded-lg text-slate-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Statistics & Quick Actions Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 shrink-0">
          <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-purple-700">นักเรียนทั้งหมด</p>
              <p className="text-xl font-black text-purple-900">
                {totalCount} <span className="text-xs font-normal text-purple-600">คน</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-700">เช็คชื่อมาแล้ว (ติ๊กแล้ว)</p>
              <p className="text-xl font-black text-emerald-900">
                {attendedCount} <span className="text-xs font-normal text-emerald-600">คน</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-600">ยังไม่มา / ไม่ได้ติ๊ก</p>
              <p className="text-xl font-black text-slate-800">
                {notAttendedCount} <span className="text-xs font-normal text-slate-500">คน</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
              <Square className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Toolbar: Template, Upload Excel, Add, Export, Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pb-3 shrink-0">
          {/* Left Buttons: Template, Upload, Add */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Template */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
              title="ดาวน์โหลดเทมเพลต Excel สำหรับรายชื่อนักเรียน"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>เทมเพลต Excel</span>
            </button>

            {/* Hidden File Input & Upload Excel */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportExcel}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Upload className={`w-3.5 h-3.5 text-purple-100 ${isImporting ? 'animate-bounce' : ''}`} />
              <span>{isImporting ? 'กำลังนำเข้า...' : 'เพิ่มจากไฟล์ Excel (.XLSX)'}</span>
            </button>

            {/* Manual Add Student */}
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>+ เพิ่มนักเรียน</span>
            </button>

            {/* Export */}
            {schoolStudents.length > 0 && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Export รายชื่อนักเรียนเป็น Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            )}
          </div>

          {/* Right Controls: Search, Attendance filters, Batch Check-in */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick check-in all */}
            {filteredStudents.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleBatchAttendance(true)}
                  className="px-2 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="ติ๊ก 'มา' ให้ทุกคนในตารางนี้"
                >
                  <CheckSquare className="w-3 h-3 text-emerald-600" />
                  <span>มาทั้งหมด</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchAttendance(false)}
                  className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="ยกเลิกการติ๊กให้ทุกคนในตารางนี้"
                >
                  <Square className="w-3 h-3 text-slate-500" />
                  <span>ยกเลิกทั้งหมด</span>
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('attended')}
                className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'attended' ? 'bg-emerald-600 text-white shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                มาแล้ว ({attendedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('notAttended')}
                className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'notAttended' ? 'bg-slate-700 text-white shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                ยังไม่มา ({notAttendedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหารหัส, ชื่อ, ระดับชั้น..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Clear all for this school */}
            {schoolStudents.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllStudents}
                className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs transition-colors cursor-pointer"
                title="ลบรายชื่อนักเรียนทั้งหมดของโรงเรียนนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 min-h-[220px]">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 select-none sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-center whitespace-nowrap w-20">เช็คชื่อ (มา/ไม่มา)</th>
                <th className="px-3 py-2.5 whitespace-nowrap">รหัส</th>
                <th className="px-3 py-2.5 whitespace-nowrap">คำนำหน้า</th>
                <th className="px-3 py-2.5 whitespace-nowrap">ชื่อ - นามสกุล</th>
                <th className="px-3 py-2.5 whitespace-nowrap">ระดับชั้น</th>
                <th className="px-3 py-2.5 text-center whitespace-nowrap">สถานะ</th>
                <th className="px-3 py-2.5 text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <GraduationCap className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">ยังไม่มีรายชื่อนักเรียนสำหรับโรงเรียนนี้</p>
                      <p className="text-xs text-slate-400">
                        กดปุ่ม <strong>"เพิ่มจากไฟล์ Excel (.XLSX)"</strong> หรือ <strong>"+ เพิ่มนักเรียน"</strong> เพื่อบันทึกรายชื่อผู้เข้าร่วมของโรงเรียนนี้
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, index) => (
                  <tr
                    key={stu.id}
                    className={`transition-colors ${
                      stu.attended ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Checkbox for Attendance */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(stu)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer mx-auto ${
                          stu.attended
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-white border-2 border-slate-300 hover:border-slate-400 text-transparent'
                        }`}
                        title={stu.attended ? 'คลิกเพื่อยกเลิกการเช็คชื่อ' : 'คลิกเพื่อติ๊กว่า "มา"'}
                      >
                        <CheckSquare className={`w-4 h-4 ${stu.attended ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    </td>

                    {/* รหัส */}
                    <td className="px-3 py-2 font-mono font-bold text-xs whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                        {stu.code || `STU-${String(index + 1).padStart(3, '0')}`}
                      </span>
                    </td>

                    {/* คำนำหน้า */}
                    <td className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap">
                      {stu.prefix || '-'}
                    </td>

                    {/* ชื่อ - นามสกุล */}
                    <td className="px-3 py-2 text-slate-900 font-semibold">
                      <span>{stu.firstName} {stu.lastName}</span>
                    </td>

                    {/* ระดับชั้น */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-medium text-xs">
                        {stu.gradeLevel || '-'}
                      </span>
                    </td>

                    {/* สถานะ */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {stu.attended ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>มาแล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                          <span>ยังไม่มา</span>
                        </span>
                      )}
                    </td>

                    {/* การจัดการ */}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(stu)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลนักเรียน"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(stu)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="ลบนักเรียน"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
          <p className="text-xs text-slate-500">
            แสดงข้อมูลนักเรียนของโรงเรียนนี้: <strong className="text-slate-800 font-semibold">{filteredStudents.length} คน</strong>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>

        {/* SUB-MODAL: Add / Edit Single Student Form */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    {editingStudent ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มข้อมูลนักเรียนใหม่'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                {/* 1. รหัส */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. รหัสประจำตัว <span className="text-slate-400 font-normal">(เช่น STU-001 หรือเลขประจำตัว)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น STU-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* 2. คำนำหน้า */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. คำนำหน้า <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
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
                      placeholder="ระบุคำนำหน้าเอง"
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-xl"
                      required
                    />
                  )}
                </div>

                {/* 3. ชื่อ & นามสกุล */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. ชื่อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น กิตติภูมิ"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      4. นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น สุขสวัสดิ์"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* 5. ระดับชั้น */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    5. ระดับชั้น <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {gradeLevel === 'อื่นๆ (ระบุเอง)' && (
                    <input
                      type="text"
                      placeholder="ระบุระดับชั้น เช่น ม.3/1"
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-xl"
                      required
                    />
                  )}
                </div>

                {/* Form Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : editingStudent ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
