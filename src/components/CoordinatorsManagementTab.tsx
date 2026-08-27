import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  Printer,
  Trash2,
  Phone,
  School,
  User,
  X,
  Plus,
  RefreshCw,
  Eye,
  ShieldCheck,
  Filter,
  Edit2,
  Building2,
  Users,
  GraduationCap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Coordinator, SchoolStudent } from '../types';
import {
  subscribeCoordinators,
  subscribeSchoolStudents,
  saveCoordinatorToFirestore,
  saveAllCoordinatorsToFirestore,
  deleteCoordinatorFromFirestore,
  clearAllCoordinatorsFromFirestore,
  updateCoordinatorCheckInStatus,
  formatThaiPhoneNumber,
} from '../lib/firebase';
import { SchoolStudentsModal, isStudentOfCoordinator } from './SchoolStudentsModal';

export const CoordinatorsManagementTab: React.FC = () => {
  const [coordinatorsList, setCoordinatorsList] = useState<Coordinator[]>([]);
  const [allStudentsList, setAllStudentsList] = useState<SchoolStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checkedIn' | 'notCheckedIn'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);
  const [managingStudentsCoordinator, setManagingStudentsCoordinator] = useState<Coordinator | null>(null);
  const [viewingQr, setViewingQr] = useState<Coordinator | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [school, setSchool] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to live coordinators & students
  useEffect(() => {
    const unsubCoords = subscribeCoordinators((data) => {
      if (data) {
        setCoordinatorsList(data);
      }
    });
    const unsubStudents = subscribeSchoolStudents((data) => {
      if (data) {
        setAllStudentsList(data);
      }
    });
    return () => {
      unsubCoords();
      unsubStudents();
    };
  }, []);

  // Filtered Coordinators
  const filteredList = coordinatorsList.filter((coord) => {
    // 1. Status Filter
    if (statusFilter === 'checkedIn' && !coord.checkedIn) return false;
    if (statusFilter === 'notCheckedIn' && coord.checkedIn) return false;

    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const cCode = (coord.code || '').toLowerCase();
    const cSchool = (coord.school || '').toLowerCase();
    const cName = (coord.name || '').toLowerCase();
    const cPhone = (coord.phone || '').toLowerCase();

    return (
      cCode.includes(q) ||
      cSchool.includes(q) ||
      cName.includes(q) ||
      cPhone.includes(q)
    );
  });

  // Calculate Statistics
  const totalCount = coordinatorsList.length;
  const uniqueSchoolsCount = new Set(
    coordinatorsList.map((c) => (c.school || '').trim()).filter((s) => s.length > 0)
  ).size;
  const checkedInCount = coordinatorsList.filter((c) => c.checkedIn).length;
  const notCheckedInCount = totalCount - checkedInCount;

  // 1. Download Excel Template for Coordinators
  const handleDownloadTemplate = () => {
    const headers = ['รหัส', 'โรงเรียน', 'ชื่อผู้ประสานงาน', 'เบอร์โทรศัพท์'];
    const sampleRows = [
      ['COORD-01', 'โรงเรียนอนุบาลเลย', 'นายสมเกียรติ สิทธิชัย', '0812345678'],
      ['COORD-02', 'โรงเรียนฝั่งแดงวิทยาสรรค์', 'นางสาววิภาพร อักษรศิลป์', '0898765432'],
      ['COORD-03', 'โรงเรียนชุมชนบ้านท่าสะอาด', 'นายธนกร เจริญผล', '0945671234'],
      ['COORD-04', 'โรงเรียนจุฬาภรณราชวิทยาลัย เลย', 'ดร.กานต์พิชชา วัฒนเสรี', '0861239876'],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    // Set column widths
    ws['!cols'] = [
      { wch: 18 }, // รหัส
      { wch: 36 }, // โรงเรียน
      { wch: 30 }, // ชื่อผู้ประสานงาน
      { wch: 20 }, // เบอร์โทรศัพท์
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ผู้ประสานงาน');
    XLSX.writeFile(wb, 'เทมเพลต_ผู้ประสานงาน_กลุ่มที่2.xlsx');
  };

  // 2. Export Coordinators to Excel
  const handleExportExcel = () => {
    if (coordinatorsList.length === 0) {
      alert('ไม่มีข้อมูลผู้ประสานงานสำหรับ Export');
      return;
    }

    const data = coordinatorsList.map((coord, idx) => ({
      ลำดับ: idx + 1,
      รหัส: coord.code || coord.id,
      โรงเรียน: coord.school || '-',
      ชื่อผู้ประสานงาน: coord.name || '-',
      เบอร์โทรศัพท์: formatThaiPhoneNumber(coord.phone) || '-',
      สถานะการเช็คอิน: coord.checkedIn ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน',
      เวลาเช็คอิน: coord.checkedInAt || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 36 },
      { wch: 30 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อผู้ประสานงาน');
    XLSX.writeFile(
      wb,
      `รายชื่อผู้ประสานงาน_กลุ่มที่2_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
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

        const newCoordinators: Coordinator[] = [];

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

          // 1. รหัส (Code)
          let cCode = getValue(
            'รหัส',
            'รหัสประจำตัว',
            'รหัสผู้ประสานงาน',
            'รหัสโรงเรียน',
            'Code',
            'code',
            'ID',
            'id',
            'ลำดับ',
            'No',
            'No.'
          );

          // 2. โรงเรียน (School)
          let cSchool = getValue(
            'โรงเรียน',
            'ชื่อโรงเรียน',
            'สถานศึกษา',
            'ชื่อสถานศึกษา',
            'หน่วยงาน',
            'School',
            'school',
            'Organization',
            'organization'
          );

          // 3. ชื่อผู้ประสานงาน (Coordinator Name)
          let cName = getValue(
            'ชื่อผู้ประสานงาน',
            'ชื่อ-สกุลผู้ประสานงาน',
            'ผู้ประสานงาน',
            'ครูผู้ประสานงาน',
            'ชื่อ-สกุล',
            'ชื่อ-นามสกุล',
            'ชื่อ',
            'Coordinator',
            'coordinator',
            'Name',
            'name',
            'Fullname',
            'fullname'
          );

          // 4. เบอร์โทรศัพท์ (Phone)
          let rawPhone = getValue(
            'เบอร์โทรศัพท์',
            'เบอร์โทร',
            'เบอร์ติดต่อ',
            'โทร',
            'เบอร์ผู้ประสานงาน',
            'Phone',
            'phone',
            'tel',
            'mobile',
            'Telephone'
          );

          // Fallback parsing by column position if headers differ
          if (!cCode && rowKeys.length >= 1) cCode = String(row[rowKeys[0]] || '').trim();
          if (!cSchool && rowKeys.length >= 2) cSchool = String(row[rowKeys[1]] || '').trim();
          if (!cName && rowKeys.length >= 3) cName = String(row[rowKeys[2]] || '').trim();
          if (!rawPhone && rowKeys.length >= 4) rawPhone = String(row[rowKeys[3]] || '').trim();

          const formattedPhone = formatThaiPhoneNumber(rawPhone) || '0000000000';
          if (!cCode) {
            cCode = `COORD-${String(idx + 1).padStart(3, '0')}`;
          }

          const codeSafe = cCode.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
          const nameSafe = cName.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
          const uniqueId = `coord_${codeSafe || `${nameSafe}_${idx}`}`;

          const newCoord: Coordinator = {
            id: uniqueId,
            code: cCode,
            school: cSchool || '-',
            name: cName || '-',
            phone: formattedPhone,
            checkedIn: false,
            registeredAt: new Date().toISOString(),
          };

          newCoordinators.push(newCoord);
        });

        if (newCoordinators.length === 0) {
          setImportNotice({
            type: 'error',
            message: 'ไม่สามารถแยกข้อมูลผู้ประสานงานจากไฟล์ Excel ได้ กรุณาตรวจสอบหัวตาราง',
          });
          setIsImporting(false);
          return;
        }

        // Save cleanly to Firebase and local state
        await saveAllCoordinatorsToFirestore(newCoordinators, true);
        setCoordinatorsList(newCoordinators);

        setImportNotice({
          type: 'success',
          message: `นำเข้าข้อมูลผู้ประสานงานสำเร็จทั้งหมด ${newCoordinators.length} รายการ (เติมเลข 0 นำหน้าเบอร์โทรศัพท์ครบถ้วน)`,
        });

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err: any) {
        console.error('Import Error:', err);
        setImportNotice({
          type: 'error',
          message: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`,
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // 4. Handle Add / Edit Single Coordinator
  const handleSaveCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!school.trim()) {
      setFormError('กรุณากรอกชื่อโรงเรียน');
      return;
    }
    if (!name.trim()) {
      setFormError('กรุณากรอกชื่อผู้ประสานงาน');
      return;
    }

    const cleanPhone = formatThaiPhoneNumber(phone);
    if (cleanPhone.length < 9 || cleanPhone.length > 10) {
      setFormError('หมายเลขโทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก (เช่น 0812345678)');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCode = code.trim() || `COORD-${String(coordinatorsList.length + 1).padStart(3, '0')}`;
      const docId =
        editingCoordinator?.id ||
        `coord_${finalCode.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_')}`;

      const coordData: Coordinator = {
        id: docId,
        code: finalCode,
        school: school.trim(),
        name: name.trim(),
        phone: cleanPhone,
        checkedIn: editingCoordinator?.checkedIn || false,
        checkedInAt: editingCoordinator?.checkedInAt,
        registeredAt: editingCoordinator?.registeredAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveCoordinatorToFirestore(coordData);

      setCoordinatorsList((prev) => {
        const idx = prev.findIndex((c) => c.id === docId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = coordData;
          return updated;
        }
        return [coordData, ...prev];
      });

      setIsAddModalOpen(false);
      setEditingCoordinator(null);
      setCode('');
      setSchool('');
      setName('');
      setPhone('');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setFormError(`เกิดข้อผิดพลาดในการบันทึก: ${err?.message || 'โปรดลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Toggle Check-In
  const handleToggleCheckIn = async (coord: Coordinator) => {
    const newStatus = !coord.checkedIn;
    await updateCoordinatorCheckInStatus(coord.id, newStatus);
    setCoordinatorsList((prev) =>
      prev.map((c) =>
        c.id === coord.id
          ? {
              ...c,
              checkedIn: newStatus,
              checkedInAt: newStatus ? new Date().toISOString() : undefined,
            }
          : c
      )
    );
  };

  // 6. Delete Coordinator
  const handleDeleteCoordinator = async (id: string, coordName: string) => {
    if (confirm(`คุณต้องการลบข้อมูลผู้ประสานงาน "${coordName}" ใช่หรือไม่?`)) {
      await deleteCoordinatorFromFirestore(id);
      setCoordinatorsList((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // 7. Clear All Coordinators
  const handleClearAll = async () => {
    if (
      confirm(
        '⚠️ คุณแน่ใจหรือไม่ว่าต้องการล้างฐานข้อมูลผู้ประสานงานทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้'
      )
    ) {
      await clearAllCoordinatorsFromFirestore();
      setCoordinatorsList([]);
      setImportNotice({
        type: 'success',
        message: 'ล้างฐานข้อมูลผู้ประสานงานเรียบร้อยแล้ว',
      });
    }
  };

  const handleOpenEdit = (coord: Coordinator) => {
    setEditingCoordinator(coord);
    setCode(coord.code);
    setSchool(coord.school);
    setName(coord.name);
    setPhone(coord.phone);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview & Excel Control Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ฐานข้อมูลเฉพาะสำหรับแอดมิน (Admin Only)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                ฐานข้อมูลกลุ่มที่ 2 : ผู้ประสานงาน
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                เก็บข้อมูล 4 คอลัมน์หลัก: <strong className="text-slate-700 font-semibold">รหัส, โรงเรียน, ชื่อผู้ประสานงาน, เบอร์โทรศัพท์</strong> (พร้อมระบบนำเข้าไฟล์ Excel และออกบัตร QR Code)
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
              title="ดาวน์โหลดไฟล์ตัวอย่าง Excel 4 คอลัมน์"
            >
              <Download className="w-4 h-4 text-purple-600" />
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
              id="btn-upload-excel-coordinators"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-purple-500/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className={`w-4 h-4 text-purple-100 ${isImporting ? 'animate-bounce' : ''}`} />
              <span>{isImporting ? 'กำลังนำเข้าข้อมูล...' : 'อัปโหลดไฟล์ Excel (.XLSX)'}</span>
            </button>

            {/* 3. Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
              title="ดาวน์โหลดรายชื่อผู้ประสานงานทั้งหมดในรูปแบบ Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export รายชื่อ</span>
            </button>

            {/* 4. Single Add Manual Button */}
            <button
              type="button"
              onClick={() => {
                setEditingCoordinator(null);
                setCode('');
                setSchool('');
                setName('');
                setPhone('');
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl border border-purple-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-purple-600" />
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

        {/* 4 Quick Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">ยอดผู้ประสานงานทั้งหมด</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {totalCount} <span className="text-xs font-normal text-slate-500">คน</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-700 font-medium">จำนวนโรงเรียนทั้งหมด</p>
              <p className="text-2xl font-black text-blue-900 mt-1">
                {uniqueSchoolsCount} <span className="text-xs font-normal text-blue-600">แห่ง</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-medium">สแกนเช็คอินเข้างานแล้ว</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">
                {checkedInCount} <span className="text-xs font-normal text-emerald-600">คน</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 font-medium">ยังไม่ได้เช็คอิน</p>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {notCheckedInCount} <span className="text-xs font-normal text-amber-600">คน</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>ตารางรายชื่อผู้ประสานงาน</span>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                {filteredList.length} / {totalCount} ท่าน
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
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
                    ? 'bg-emerald-600 text-white shadow-2xs'
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
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                ยังไม่เช็คอิน ({notCheckedInCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหารหัส, โรงเรียน, ชื่อ, เบอร์โทร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clear All Button */}
            {totalCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="ล้างฐานข้อมูลผู้ประสานงานทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ล้างฐานข้อมูล</span>
              </button>
            )}
          </div>
        </div>

        {/* Coordinators Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">1. รหัส</th>
                <th className="px-4 py-3.5 whitespace-nowrap">2. โรงเรียน</th>
                <th className="px-4 py-3.5 whitespace-nowrap">3. ชื่อผู้ประสานงาน</th>
                <th className="px-4 py-3.5 whitespace-nowrap">4. เบอร์โทรศัพท์</th>
                <th className="px-4 py-3.5 whitespace-nowrap">5. รายชื่อนักเรียน (Excel / เช็คชื่อ)</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">สถานะเช็คอิน</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <School className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">ยังไม่พบข้อมูลผู้ประสานงาน</p>
                      <p className="text-xs text-slate-400">
                        กดปุ่ม "อัปโหลดไฟล์ Excel (.XLSX)" ด้านบน หรือ "เพิ่มรายบุคคล" เพื่อเริ่มต้นบันทึกข้อมูล
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((coord) => (
                  <tr key={coord.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. รหัส */}
                    <td className="px-4 py-3 font-mono font-bold text-xs whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
                        {coord.code || coord.id}
                      </span>
                    </td>

                    {/* 2. โรงเรียน */}
                    <td className="px-4 py-3 text-slate-900 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="line-clamp-2">{coord.school || '-'}</span>
                      </div>
                    </td>

                    {/* 3. ชื่อผู้ประสานงาน */}
                    <td className="px-4 py-3 text-slate-800">
                      <div className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{coord.name || '-'}</span>
                      </div>
                    </td>

                    {/* 4. เบอร์โทรศัพท์ */}
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs whitespace-nowrap">
                      {coord.phone ? (
                        <a
                          href={`tel:${formatThaiPhoneNumber(coord.phone)}`}
                          className="hover:text-purple-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{formatThaiPhoneNumber(coord.phone)}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 5. รายชื่อนักเรียนของผู้ประสานงาน / โรงเรียนนี้ (Excel) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(() => {
                        const myStudents = allStudentsList.filter((s) => isStudentOfCoordinator(s, coord));
                        const count = myStudents.length;
                        const attended = myStudents.filter((s) => s.attended).length;

                        return (
                          <button
                            type="button"
                            onClick={() => setManagingStudentsCoordinator(coord)}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 hover:from-purple-100 hover:to-indigo-100 text-purple-900 border border-purple-200/90 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-2xs group"
                            title="คลิกเพื่อเพิ่มรายชื่อผู้เข้าร่วมของโรงเรียนตัวเอง (Excel) หรือเช็คชื่อนักเรียน"
                          >
                            <GraduationCap className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform shrink-0" />
                            <div className="text-left">
                              <div className="flex items-center gap-1.5">
                                <span>{count > 0 ? `นักเรียน (${count} คน)` : '+ เพิ่มรายชื่อ (Excel)'}</span>
                              </div>
                              {count > 0 && (
                                <p className="text-[10px] font-medium text-purple-600">
                                  มาแล้ว <span className="font-bold text-emerald-600">{attended}</span>/{count} คน
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })()}
                    </td>

                    {/* สถานะเช็คอิน */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleCheckIn(coord)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          coord.checkedIn
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title="คลิกเพื่อสลับสถานะเช็คอิน"
                      >
                        {coord.checkedIn ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>เช็คอินแล้ว</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>ยังไม่เช็คอิน</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* การจัดการ */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* View QR Code */}
                        <button
                          type="button"
                          onClick={() => setViewingQr(coord)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="ดู QR Code บัตรผู้ประสานงาน"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(coord)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCoordinator(coord.id, coord.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบข้อมูล"
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
      </div>

      {/* Modal 1: Add / Edit Coordinator */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingCoordinator ? 'แก้ไขข้อมูลผู้ประสานงาน' : 'เพิ่มผู้ประสานงานใหม่'}
                  </h3>
                  <p className="text-xs text-slate-500">ฐานข้อมูลกลุ่มที่ 2 : ผู้ประสานงาน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoordinator} className="space-y-3.5 text-left text-xs sm:text-sm">
              {/* 1. รหัส */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  1. รหัสประจำตัว (Code) <span className="text-slate-400 font-normal">(เว้นว่างเพื่อสร้างอัตโนมัติ)</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น COORD-01, PCSHS-C01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* 2. โรงเรียน */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  2. โรงเรียน / สถานศึกษา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โรงเรียนอนุบาลเลย, โรงเรียนฝั่งแดงวิทยาสรรค์"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* 3. ชื่อผู้ประสานงาน */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  3. ชื่อผู้ประสานงาน (พร้อมคำนำหน้า) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมเกียรติ สิทธิชัย, นางสาววิภาพร อักษรศิลป์"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* 4. เบอร์โทรศัพท์ */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  4. เบอร์โทรศัพท์ <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(เติม 0 ข้างหน้าให้อัตโนมัติ)</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : editingCoordinator ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ประสานงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View QR Code / ID Pass for Coordinator */}
      {viewingQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 text-center">
            <button
              type="button"
              onClick={() => setViewingQr(null)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>บัตรผู้ประสานงาน (กลุ่มที่ 2)</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">{viewingQr.name}</h3>
              <p className="text-xs font-semibold text-purple-700 mt-0.5">{viewingQr.school}</p>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-purple-50/60 border-2 border-dashed border-purple-200 rounded-2xl inline-block shadow-inner">
              <QRCodeSVG
                value={viewingQr.code || viewingQr.id}
                size={180}
                level="H"
                includeMargin
                className="rounded-xl shadow-xs"
              />
            </div>

            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-400">รหัสผู้ประสานงาน:</span>
                <span className="font-mono font-bold text-purple-700">{viewingQr.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">เบอร์โทรศัพท์:</span>
                <span className="font-mono font-bold">{formatThaiPhoneNumber(viewingQr.phone)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">สถานะเช็คอิน:</span>
                <span
                  className={`font-bold ${
                    viewingQr.checkedIn ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {viewingQr.checkedIn ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopyCode(viewingQr.code)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์บัตร</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: School Students Management (Excel & Attendance) */}
      {managingStudentsCoordinator && (
        <SchoolStudentsModal
          coordinator={managingStudentsCoordinator}
          onClose={() => setManagingStudentsCoordinator(null)}
        />
      )}
    </div>
  );
};
