import React, { useState, useMemo } from 'react';
import { ACTIVITY_LOCATIONS_DATA, ActivityLocationRecord } from '../data/activityLocationsData';
import { Search, MapPin, Filter, Layers, CheckCircle2, AlertCircle, X, ChevronDown, Sparkles, Building, Bookmark } from 'lucide-react';

export const ActivityLocationsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [showAll, setShowAll] = useState(true);

  // Extract unique departments and locations for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    ACTIVITY_LOCATIONS_DATA.forEach((item) => set.add(item.department));
    return Array.from(set);
  }, []);

  const locations = useMemo(() => {
    const set = new Set<string>();
    ACTIVITY_LOCATIONS_DATA.forEach((item) => {
      // Split if multiline
      item.location.split('\n').forEach((loc) => set.add(loc.trim()));
    });
    return Array.from(set).filter((loc) => loc !== '');
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return ACTIVITY_LOCATIONS_DATA.filter((item) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.no.toString() === searchTerm.trim();

      const matchDept = selectedDept === 'ALL' || item.department === selectedDept;

      const matchLocation =
        selectedLocation === 'ALL' || item.location.includes(selectedLocation);

      return matchSearch && matchDept && matchLocation;
    });
  }, [searchTerm, selectedDept, selectedLocation]);

  // Distinct department badge color mapping
  const getDeptBadgeStyle = (dept: string) => {
    if (dept.includes('คณิตศาสตร์')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (dept.includes('คอมพิวเตอร์')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (dept.includes('เคมี')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (dept.includes('ชีววิทยา')) return 'bg-lime-50 text-lime-700 border-lime-200';
    if (dept.includes('ฟิสิกส์')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (dept.includes('วิทยาศาสตร์ทั่วไป')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (dept.includes('ภาษาต่างประเทศ')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (dept.includes('ภาษาไทย')) return 'bg-pink-50 text-pink-700 border-pink-200';
    if (dept.includes('ศิลปะ')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (dept.includes('สังคมศึกษา')) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    if (dept.includes('สุขศึกษา')) return 'bg-red-50 text-red-700 border-red-200';
    if (dept.includes('หอพัก')) return 'bg-violet-50 text-violet-700 border-violet-200';
    if (dept.includes('โครงงาน')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (dept.includes('แนะแนว')) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getCodeBadgeStyle = (code: string) => {
    const prefix = code.split('-')[0];
    switch (prefix) {
      case 'MAT':
        return 'bg-amber-100/90 text-amber-900 border-amber-300';
      case 'ICT':
        return 'bg-cyan-100/90 text-cyan-900 border-cyan-300';
      case 'CHE':
        return 'bg-emerald-100/90 text-emerald-900 border-emerald-300';
      case 'BIO':
        return 'bg-lime-100/90 text-lime-900 border-lime-300';
      case 'PHY':
        return 'bg-sky-100/90 text-sky-900 border-sky-300';
      case 'GSC':
        return 'bg-teal-100/90 text-teal-900 border-teal-300';
      case 'ENG':
        return 'bg-indigo-100/90 text-indigo-900 border-indigo-300';
      case 'THA':
        return 'bg-pink-100/90 text-pink-900 border-pink-300';
      case 'ART':
        return 'bg-purple-100/90 text-purple-900 border-purple-300';
      case 'SOC':
        return 'bg-yellow-100/90 text-yellow-900 border-yellow-300';
      case 'HPE':
        return 'bg-red-100/90 text-red-900 border-red-300';
      case 'STD':
        return 'bg-violet-100/90 text-violet-900 border-violet-300';
      case 'PJN':
        return 'bg-blue-100/90 text-blue-900 border-blue-300';
      case 'ADM':
        return 'bg-orange-100/90 text-orange-900 border-orange-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setSelectedLocation('ALL');
  };

  return (
    <section id="activity-locations" className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-10 z-10">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden backdrop-blur-sm">
        
        {/* TOP HEADER - Clean header with requested title */}
        <div className="bg-gradient-to-r from-[#1b365d] via-[#1e40af] to-[#2563eb] text-white p-5 sm:p-7 text-center relative overflow-hidden">
          {/* Subtle decorative background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              สถานที่จัดกิจกรรม  PCSHS Loei Open House 2026
            </h2>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="p-4 sm:p-6 bg-slate-50/80 border-b border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาตามรหัส (เช่น MAT-01), ชื่อกิจกรรม, หรือสถานที่..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none pr-8 cursor-pointer"
              >
                <option value="ALL">กลุ่มสาระ / ฝ่ายงานทั้งหมด ({departments.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none pr-8 cursor-pointer"
              >
                <option value="ALL">สถานที่จัดกิจกรรมทั้งหมด ({locations.length})</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Active filter counter & quick resets */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">
                พบข้อมูล <strong className="text-blue-600 text-sm">{filteredData.length}</strong> จากทั้งหมด {ACTIVITY_LOCATIONS_DATA.length} กิจกรรม
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                เลื่อนลงเพื่อดูรายการทั้งหมด
              </span>
              
              {(searchTerm || selectedDept !== 'ALL' || selectedLocation !== 'ALL') && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg font-medium transition-colors border border-red-200/80 cursor-pointer ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรองทั้งหมด</span>
                </button>
              )}
            </div>

            {/* Quick Department Tags */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setSelectedDept('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedDept === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              {['คณิตศาสตร์', 'คอมพิวเตอร์', 'เคมี', 'ชีววิทยา', 'ฟิสิกส์', 'งานกิจการและหอพักนักเรียน'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDept(selectedDept === d ? 'ALL' : d)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer truncate max-w-[130px] ${
                    selectedDept === d
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                  title={d}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DATA TABLE (Scrollable container showing ~10 items at a time) */}
        <div className="overflow-x-auto overflow-y-auto max-h-[530px] relative scroll-smooth border-t border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className="bg-[#1e40af] text-white text-xs sm:text-sm font-bold border-b border-blue-900">
                <th className="py-3.5 px-3 sm:px-4 w-16 text-center border-r border-blue-700/60 bg-[#1e40af]">
                  ลำดับ
                </th>
                <th className="py-3.5 px-3 sm:px-4 w-28 sm:w-32 text-center border-r border-blue-700/60 bg-[#1e40af]">
                  รหัสกิจกรรม
                </th>
                <th className="py-3.5 px-3 sm:px-5 w-44 sm:w-56 border-r border-blue-700/60 bg-[#1e40af]">
                  ฝ่ายงาน/กลุ่มสาระ/สาขา
                </th>
                <th className="py-3.5 px-4 sm:px-6 min-w-[240px] sm:min-w-[280px] border-r border-blue-700/60 bg-[#1e40af]">
                  ชื่อกิจกรรม
                </th>
                <th className="py-3.5 px-4 sm:px-6 min-w-[200px] sm:min-w-[240px] bg-[#1e40af]">
                  สถานที่
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm text-slate-700 font-normal">
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={row.no}
                      className={`transition-colors duration-150 hover:bg-blue-50/70 ${
                        isEven ? 'bg-white' : 'bg-slate-50/60'
                      }`}
                    >
                      {/* 1. ลำดับ */}
                      <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-500 border-r border-slate-100">
                        {row.no}
                      </td>

                      {/* 2. รหัสกิจกรรม */}
                      <td className="py-3 px-3 sm:px-4 text-center border-r border-slate-100">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono font-extrabold border ${getCodeBadgeStyle(
                            row.code
                          )}`}
                        >
                          {row.code}
                        </span>
                      </td>

                      {/* 3. ฝ่ายงาน/กลุ่มสาระ/สาขา */}
                      <td className="py-3 px-3 sm:px-5 font-semibold text-slate-800 border-r border-slate-100">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getDeptBadgeStyle(
                            row.department
                          )}`}
                        >
                          {row.department}
                        </span>
                      </td>

                      {/* 4. ชื่อกิจกรรม */}
                      <td className="py-3 px-4 sm:px-6 border-r border-slate-100 font-medium">
                        {row.isUnspecifiedTitle ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span>{row.title}</span>
                          </span>
                        ) : (
                          <span className="text-slate-900 leading-relaxed break-words font-medium">
                            {row.title}
                          </span>
                        )}
                      </td>

                      {/* 5. สถานที่ */}
                      <td className="py-3 px-4 sm:px-6">
                        {row.isUnspecifiedLocation ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md text-xs font-medium">
                            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>{row.location}</span>
                          </span>
                        ) : (
                          <div className="flex items-start gap-1.5 text-slate-800 font-medium">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div className="whitespace-pre-line leading-relaxed">
                              {row.location}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-400" />
                      <p className="font-semibold text-base text-slate-700">
                        ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                      </p>
                      <p className="text-xs text-slate-500">
                        ลองเปลี่ยนคำค้นหา หรือกดปุ่มล้างตัวกรองเพื่อดูข้อมูลทั้งหมด
                      </p>
                      <button
                        onClick={clearFilters}
                        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                      >
                        แสดงข้อมูลทั้งหมด (44 รายการ)
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER BAR */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>
              โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย | งานมหกรรมเปิดบ้านวิทยาศาสตร์ Open House 2569
            </span>
          </div>
          <div className="font-medium text-slate-600">
            แสดงข้อมูลทั้งหมด <strong className="text-slate-800">{filteredData.length}</strong> รายการ
          </div>
        </div>
      </div>
    </section>
  );
};
