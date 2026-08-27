import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserPlus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Download,
  Upload,
  RefreshCw,
  Phone,
  Mail,
  User,
  Hash,
  Sparkles,
  QrCode,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Printer,
  Copy,
  Users,
  Building2,
  GraduationCap,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { NewUserRegistration } from '../types';
import {
  subscribeNewRegistrations,
  saveNewRegistrationToFirestore,
  saveAllNewRegistrationsToFirestore,
  deleteNewRegistrationFromFirestore,
  clearAllNewRegistrationsFromFirestore,
  updateNewRegistrationCheckInStatus,
  getNextNewUserCode,
  formatThaiPhoneNumber,
} from '../lib/firebase';

const PREFIX_OPTIONS = ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง', 'ด.ช.', 'ด.ญ.', 'อื่นๆ'];

export const NewUserRegistrationsTab: React.FC = () => {
  const [usersList, setUsersList] = useState<NewUserRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checkedIn' | 'notCheckedIn'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<NewUserRegistration | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    prefix: 'นาย',
    customPrefix: '',
    fullName: '',
    school: '',
    phone: '',
    email: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreatedUser, setLastCreatedUser] = useState<NewUserRegistration | null>(null);

  // Delete Modal State
  const [userToDelete, setUserToDelete] = useState<NewUserRegistration | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // QR Modal State
  const [selectedUserForQr, setSelectedUserForQr] = useState<NewUserRegistration | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to realtime updates from Firestore
  useEffect(() => {
    const unsub = subscribeNewRegistrations((data) => {
      setUsersList(data);
    });
    return () => unsub();
  }, []);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return usersList.filter((item) => {
      if (statusFilter === 'checkedIn' && !item.checkedIn) return false;
      if (statusFilter === 'notCheckedIn' && item.checkedIn) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.code?.toLowerCase().includes(q) ||
        item.fullName?.toLowerCase().includes(q) ||
        item.prefix?.toLowerCase().includes(q) ||
        item.school?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q)
      );
    });
  }, [usersList, statusFilter, searchQuery]);

  // Statistics
  const totalCount = usersList.length;
  const checkedInCount = usersList.filter((u) => u.checkedIn).length;
  const notCheckedInCount = totalCount - checkedInCount;
  const checkInPercent = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  // Open modal to add new user
  const handleOpenAddModal = () => {
    const autoCode = getNextNewUserCode(usersList);
    setEditingUser(null);
    setFormData({
      code: autoCode,
      prefix: 'นาย',
      customPrefix: '',
      fullName: '',
      school: '',
      phone: '',
      email: '',
    });
    setFormError('');
    setLastCreatedUser(null);
    setIsAddModalOpen(true);
  };

  // Open modal to edit existing user
  const handleOpenEditModal = (item: NewUserRegistration) => {
    const isStandardPrefix = PREFIX_OPTIONS.includes(item.prefix);
    setEditingUser(item);
    setFormData({
      code: item.code,
      prefix: isStandardPrefix ? item.prefix : 'อื่นๆ',
      customPrefix: isStandardPrefix ? '' : item.prefix,
      fullName: item.fullName,
      school: item.school || '',
      phone: item.phone || '',
      email: item.email || '',
    });
    setFormError('');
    setLastCreatedUser(null);
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalPrefix = formData.prefix === 'อื่นๆ' ? formData.customPrefix.trim() : formData.prefix.trim();
    const finalFullName = formData.fullName.trim();
    const finalSchool = formData.school.trim();
    const finalCode = formData.code.trim() || getNextNewUserCode(usersList);
    const finalPhone = formData.phone.trim();
    const finalEmail = formData.email.trim();

    if (!finalFullName) {
      setFormError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const userItem: NewUserRegistration = {
        id: editingUser ? editingUser.id : `new_${finalCode}`,
        code: finalCode,
        prefix: finalPrefix,
        fullName: finalFullName,
        school: finalSchool,
        phone: finalPhone,
        email: finalEmail,
        checkedIn: editingUser ? editingUser.checkedIn : true, // เมื่อเพิ่มใหม่ให้สถานะเป็นเช็คอินแล้วทันที
        checkedInAt: editingUser ? (editingUser.checkedInAt || now) : now,
        registeredAt: editingUser ? editingUser.registeredAt : now,
        updatedAt: now,
      };

      await saveNewRegistrationToFirestore(userItem);

      if (!editingUser) {
        setLastCreatedUser(userItem);
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } catch {}
      } else {
        setIsAddModalOpen(false);
      }

      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Error saving new user registration:', err);
      setFormError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSubmitting(false);
    }
  };

  // Toggle Check-in status
  const handleToggleCheckIn = async (item: NewUserRegistration) => {
    const nextStatus = !item.checkedIn;
    await updateNewRegistrationCheckInStatus(item.id, nextStatus);
    if (nextStatus) {
      try {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      } catch {}
    }
  };

  // Delete single user
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    await deleteNewRegistrationFromFirestore(userToDelete.id);
    setUserToDelete(null);
  };

  // Clear all
  const handleConfirmDeleteAll = async () => {
    await clearAllNewRegistrationsFromFirestore();
    setIsDeletingAll(false);
  };

  // Copy text helper
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'รหัส': 'OH47001',
        'คำนำหน้าชื่อ': 'นาย',
        'ชื่อ-สกุล': 'สมศักดิ์ รักการเรียน',
        'โรงเรียน/สังกัด': 'โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย',
        'เบอร์โทรศัพท์': '0812345678',
        'Email': 'somsak@example.com',
      },
      {
        'รหัส': 'OH47002',
        'คำนำหน้าชื่อ': 'นางสาว',
        'ชื่อ-สกุล': 'ใจดี มีสุข',
        'โรงเรียน/สังกัด': 'โรงเรียนเลยพิทยาคม',
        'เบอร์โทรศัพท์': '0898765432',
        'Email': 'jaidee@example.com',
      },
      {
        'รหัส': 'OH47003',
        'คำนำหน้าชื่อ': 'ด.ช.',
        'ชื่อ-สกุล': 'เก่งกล้า ปัญญาไว',
        'โรงเรียน/สังกัด': 'โรงเรียนเมืองเลย',
        'เบอร์โทรศัพท์': '0901234567',
        'Email': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ลงทะเบียนผู้ใช้ใหม่');
    worksheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 36 }, { wch: 18 }, { wch: 28 }];
    XLSX.writeFile(workbook, 'Template_กลุ่ม3_ลงทะเบียนผู้ใช้ใหม่_OH47001.xlsx');
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (usersList.length === 0) {
      alert('ไม่มีข้อมูลผู้ใช้ใหม่ที่จะ Export');
      return;
    }

    const exportData = usersList.map((item, index) => ({
      'ลำดับ': index + 1,
      'รหัส': item.code,
      'คำนำหน้าชื่อ': item.prefix || '',
      'ชื่อ-สกุล': item.fullName || '',
      'โรงเรียน/สังกัด': item.school || '',
      'เบอร์โทรศัพท์': item.phone || '',
      'Email': item.email || '',
      'สถานะการเช็คอิน': item.checkedIn ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน',
      'เวลาเช็คอิน': item.checkedInAt ? new Date(item.checkedInAt).toLocaleString('th-TH') : '-',
      'เวลาลงทะเบียน': item.registeredAt ? new Date(item.registeredAt).toLocaleString('th-TH') : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ผู้ใช้ใหม่');
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
      { wch: 34 },
      { wch: 18 },
      { wch: 28 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
    ];
    XLSX.writeFile(workbook, `กลุ่ม3_ลงทะเบียนผู้ใช้ใหม่_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Import Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportNotice(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length < 2) {
        throw new Error('ไฟล์ว่างเปล่าหรือไม่พบข้อมูล');
      }

      const headerRow = rows[0] as string[];
      let codeIdx = -1;
      let prefixIdx = -1;
      let nameIdx = -1;
      let schoolIdx = -1;
      let phoneIdx = -1;
      let emailIdx = -1;

      headerRow.forEach((col, idx) => {
        if (!col) return;
        const text = String(col).trim().toLowerCase();
        if (text.includes('รหัส') || text.includes('code') || text.includes('id')) codeIdx = idx;
        else if (text.includes('คำนำหน้า') || text.includes('prefix') || text.includes('title')) prefixIdx = idx;
        else if (text.includes('ชื่อ') || text.includes('name') || text.includes('ผู้ใช้')) nameIdx = idx;
        else if (text.includes('โรงเรียน') || text.includes('สังกัด') || text.includes('school') || text.includes('organization') || text.includes('หน่วยงาน')) schoolIdx = idx;
        else if (text.includes('โทร') || text.includes('phone') || text.includes('tel') || text.includes('mobile')) phoneIdx = idx;
        else if (text.includes('email') || text.includes('อีเมล') || text.includes('mail')) emailIdx = idx;
      });

      // Default fallback indices if not identified by header names
      if (codeIdx === -1) codeIdx = 0;
      if (prefixIdx === -1 && rows[1]?.length > 1) prefixIdx = 1;
      if (nameIdx === -1) nameIdx = prefixIdx !== -1 ? 2 : 1;
      if (schoolIdx === -1) schoolIdx = 3;
      if (phoneIdx === -1) phoneIdx = 4;
      if (emailIdx === -1) emailIdx = 5;

      const importedItems: NewUserRegistration[] = [];
      let currentMaxCode = usersList.length > 0 ? getNextNewUserCode(usersList) : 'OH47001';
      let runningSeq = 47000;
      const match = currentMaxCode.match(/OH(\d+)/i);
      if (match && match[1]) runningSeq = parseInt(match[1], 10) - 1;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        let rawCode = row[codeIdx] !== undefined ? String(row[codeIdx]).trim() : '';
        let rawPrefix = row[prefixIdx] !== undefined ? String(row[prefixIdx]).trim() : '';
        let rawName = row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
        let rawSchool = schoolIdx !== -1 && row[schoolIdx] !== undefined ? String(row[schoolIdx]).trim() : '';
        let rawPhone = row[phoneIdx] !== undefined ? String(row[phoneIdx]).trim() : '';
        let rawEmail = row[emailIdx] !== undefined ? String(row[emailIdx]).trim() : '';

        if (!rawName && !rawCode) continue;

        // Auto generate code if missing
        if (!rawCode) {
          runningSeq += 1;
          rawCode = `OH${runningSeq}`;
        }

        const now = new Date().toISOString();
        const formattedPhone = formatThaiPhoneNumber(rawPhone);

        importedItems.push({
          id: `new_${rawCode.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_')}`,
          code: rawCode,
          prefix: rawPrefix || 'นาย',
          fullName: rawName,
          school: rawSchool,
          phone: formattedPhone,
          email: rawEmail,
          checkedIn: true, // เมื่อนำเข้าหรือเพิ่มให้สถานะเป็นเช็คอินแล้วทันที
          checkedInAt: now,
          registeredAt: now,
          updatedAt: now,
        });
      }

      if (importedItems.length === 0) {
        throw new Error('ไม่พบแถวข้อมูลที่สามารถนำเข้าได้');
      }

      await saveAllNewRegistrationsToFirestore(importedItems, false);
      setImportNotice({
        type: 'success',
        message: `นำเข้าข้อมูลกลุ่มที่ 3 สำเร็จจำนวน ${importedItems.length} รายการ (สถานะเช็คอินแล้วทันที)`,
      });

      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      console.error('Error importing Excel:', err);
      setImportNotice({
        type: 'error',
        message: `เกิดข้อผิดพลาดในการนำเข้า: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview & Action Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  ฐานข้อมูลกลุ่มที่ 3 : ลงทะเบียนผู้ใช้ใหม่
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  รหัสเริ่มต้น OH47001
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  เช็คอินอัตโนมัติเมื่อบันทึก
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ฟอร์มบันทึกข้อมูลผู้เข้าร่วมงาน / ผู้ใช้ใหม่หน้างาน (รหัส OH47001, คำนำหน้า, ชื่อ-สกุล, โรงเรียน/สังกัด, เบอร์โทร, Email)
              </p>
            </div>
          </div>

          {/* Primary Action Button: Add New User */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              id="btn-add-new-user-modal"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-102"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มผู้ใช้ใหม่ (เช็คอินทันที)</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">ผู้ใช้ใหม่ทั้งหมด</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</span>
              <span className="text-xs font-semibold text-slate-500">คน</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold">เช็คอินแล้ว</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">{checkedInCount}</span>
              <span className="text-xs font-semibold text-emerald-600">คน ({checkInPercent}%)</span>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold">ยังไม่เช็คอิน</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-700">{notCheckedInCount}</span>
              <span className="text-xs font-semibold text-amber-600">คน</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-800">
              <span className="text-xs font-bold">รหัสถัดไป</span>
              <Hash className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-blue-800">
                {getNextNewUserCode(usersList)}
              </span>
            </div>
          </div>
        </div>

        {/* Excel Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden Excel Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleImportExcel}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>{isImporting ? 'กำลังนำเข้า...' : 'นำเข้า Excel (.xlsx)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ดาวน์โหลดเทมเพลต</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>ส่งออก Excel ({usersList.length})</span>
            </button>
          </div>

          {usersList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDeletingAll(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างข้อมูลกลุ่ม 3 ทั้งหมด</span>
            </button>
          )}
        </div>

        {/* Notice Message */}
        {importNotice && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
              importNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{importNotice.message}</span>
            <button
              type="button"
              onClick={() => setImportNotice(null)}
              className="p-1 hover:bg-black/5 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
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
                  : 'text-slate-600 hover:text-slate-900'
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
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ยังไม่เช็คอิน ({notCheckedInCount})
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส, ชื่อ-สกุล, เบอร์โทร..."
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  รหัส (Code)
                </th>
                <th scope="col" className="px-4 py-3.5">
                  คำนำหน้า
                </th>
                <th scope="col" className="px-4 py-3.5">
                  ชื่อ - สกุล
                </th>
                <th scope="col" className="px-4 py-3.5">
                  โรงเรียน / สังกัด
                </th>
                <th scope="col" className="px-4 py-3.5">
                  เบอร์โทรศัพท์
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Email
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  สถานะเช็คอิน
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* รหัส */}
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs inline-block">
                      {item.code}
                    </span>
                  </td>

                  {/* คำนำหน้า */}
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {item.prefix || '-'}
                  </td>

                  {/* ชื่อ-สกุล */}
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.fullName}</span>
                    </div>
                  </td>

                  {/* โรงเรียน/สังกัด */}
                  <td className="px-4 py-3 text-slate-700">
                    {item.school ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium line-clamp-1" title={item.school}>{item.school}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* เบอร์โทรศัพท์ */}
                  <td className="px-4 py-3">
                    {item.phone ? (
                      <a
                        href={`tel:${item.phone}`}
                        className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-mono font-medium hover:underline bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100"
                        title="คลิกเพื่อโทรออก"
                      >
                        <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{item.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-slate-600">
                    {item.email ? (
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* สถานะเช็คอิน */}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleCheckIn(item)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        item.checkedIn
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={item.checkedIn ? 'คลิกเพื่อยกเลิกการเช็คอิน' : 'คลิกเพื่อเช็คอิน'}
                    >
                      {item.checkedIn ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>เช็คอินแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>ยังไม่เช็คอิน</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* จัดการ */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedUserForQr(item)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="ดูบัตร & QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบข้อมูล"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserPlus className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium">ไม่พบข้อมูลผู้ใช้ใหม่</p>
                      <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="mt-1 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        + คลิกที่นี่เพื่อเพิ่มผู้ใช้ใหม่คนแรก
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: ADD / EDIT USER ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {editingUser ? 'แก้ไขข้อมูลผู้ใช้ใหม่' : 'ลงทะเบียนผู้ใช้ใหม่ (กลุ่มที่ 3)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {!editingUser && 'บันทึกแล้วสถานะจะเป็น "เช็คอินแล้ว" ทันที'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Preview after adding */}
            {lastCreatedUser ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-emerald-900 text-sm sm:text-base">
                    บันทึกและเช็คอินสำเร็จ!
                  </h4>
                  <div className="inline-block px-3 py-1 bg-white border border-emerald-300 rounded-xl shadow-xs">
                    <span className="font-mono font-black text-lg text-emerald-800">
                      {lastCreatedUser.code}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold">
                    {lastCreatedUser.prefix} {lastCreatedUser.fullName}
                  </p>
                  {lastCreatedUser.school && (
                    <p className="text-xs text-emerald-800 flex items-center justify-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{lastCreatedUser.school}</span>
                    </p>
                  )}
                  {lastCreatedUser.phone && (
                    <p className="text-xs text-slate-600 font-mono">
                      เบอร์โทร: {lastCreatedUser.phone}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserForQr(lastCreatedUser);
                      setIsAddModalOpen(false);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-slate-600" />
                    <span>ดูบัตรประจำตัว</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ เพิ่มคนต่อไป</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. รหัส (Code) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสประจำตัว (Code) <span className="text-emerald-600 font-normal">*รหัสเริ่มด้วย OH47001</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="เช่น OH47001"
                      className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 2. คำนำหน้าชื่อ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำนำหน้าชื่อ <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {PREFIX_OPTIONS.slice(0, 4).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, prefix: p })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          formData.prefix === p
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {PREFIX_OPTIONS.slice(4).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, prefix: p })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          formData.prefix === p
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {formData.prefix === 'อื่นๆ' && (
                    <input
                      type="text"
                      value={formData.customPrefix}
                      onChange={(e) => setFormData({ ...formData, customPrefix: e.target.value })}
                      placeholder="ระบุคำนำหน้าชื่ออื่นๆ เช่น อาจารย์, ดร."
                      className="mt-2 w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                  )}
                </div>

                {/* 3. ชื่อ-สกุล */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="เช่น สมศักดิ์ รักการเรียน"
                      className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 4. โรงเรียน / สังกัด */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    โรงเรียน / สังกัด
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      placeholder="เช่น โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย หรือ บุคคลทั่วไป"
                      className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* 5. เบอร์โทรศัพท์ & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ (10 หลัก)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="เช่น 0812345678"
                        className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      อีเมล (Email)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="เช่น name@example.com"
                        className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Automatic Check-in Notice */}
                {!editingUser && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      เมื่อกดบันทึก ข้อมูลจะถูกจัดเก็บลงฐานข้อมูล และตั้งค่าสถานะเป็น <strong>"เช็คอินแล้วทันที"</strong>
                    </span>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingUser ? 'บันทึกการแก้ไข' : 'บันทึกและเช็คอิน'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: QR CODE & PASS ================= */}
      {selectedUserForQr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                กลุ่มที่ 3 : ผู้ใช้ใหม่
              </span>
              <button
                type="button"
                onClick={() => setSelectedUserForQr(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pass Card Preview */}
            <div className="bg-gradient-to-b from-emerald-600 to-teal-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-3">
              <div className="text-[11px] font-medium tracking-wider text-emerald-100 uppercase">
                PCSHS Loei Open House 2026
              </div>
              <div className="text-lg font-black">{selectedUserForQr.prefix} {selectedUserForQr.fullName}</div>
              {selectedUserForQr.school && (
                <div className="text-xs text-emerald-100/90 font-medium px-2 py-0.5 bg-white/10 rounded-lg">
                  {selectedUserForQr.school}
                </div>
              )}
              
              <div className="bg-white p-3 rounded-xl inline-block shadow-inner">
                <QRCodeSVG
                  value={selectedUserForQr.code}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="font-mono font-black text-xl tracking-widest text-emerald-200">
                {selectedUserForQr.code}
              </div>

              <div className="text-xs text-emerald-100/90 pt-1 border-t border-emerald-500/50 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>สถานะ: {selectedUserForQr.checkedIn ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleCopyCode(selectedUserForQr.code)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์บัตร</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRM ================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">ยืนยันการลบข้อมูล</h3>
              <p className="text-xs text-slate-500">
                คุณต้องการลบข้อมูล <strong>{userToDelete.prefix} {userToDelete.fullName}</strong> ({userToDelete.code}) หรือไม่?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE ALL CONFIRM ================= */}
      {isDeletingAll && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">ยืนยันการล้างข้อมูลกลุ่ม 3 ทั้งหมด</h3>
              <p className="text-xs text-slate-500">
                ข้อมูลผู้ใช้ใหม่ทั้งหมด {usersList.length} รายการจะถูกลบออกจากระบบอย่างถาวร
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeletingAll(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
              >
                ล้างข้อมูลทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
