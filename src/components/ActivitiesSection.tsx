import React, { useState } from 'react';
import { ActivityItem } from '../types';
import { ExternalLink, Filter, MapPin, Phone, Search, Trophy, Users, Clock, BookOpen, Layers } from 'lucide-react';

interface ActivitiesSectionProps {
  activities: ActivityItem[];
}

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({ activities }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ทั้งหมด');

  // Extract unique departments
  const departments = ['ทั้งหมด', ...Array.from(new Set(activities.map((a) => a.department)))];

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.titleTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.coordinator.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'ทั้งหมด' || activity.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <section id="activities" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full">
          <Trophy className="w-4 h-4 text-orange-500" />
          <span>นิทรรศการ & การแข่งขันวิชาการ</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          กิจกรรม & การแข่งขันภายในงาน PCSHS Loei Open House 2026
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          ขอเชิญชวนนักเรียน ครู และผู้สนใจร่วมรับชมนิทรรศการวิทยาศาสตร์ นวัตกรรมเทคโนโลยี และลงทะเบียนเข้าร่วมการแข่งขันชิงรางวัล
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหากิจกรรม, รหัสกิจกรรม, หรือชื่อผู้ประสานงาน..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-2xl border border-slate-200 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-base font-medium">ไม่พบกิจกรรมที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="group bg-white border border-slate-200/80 hover:border-orange-400/80 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-md">
                    {act.code}
                  </span>
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md truncate max-w-[180px]">
                    {act.department}
                  </span>
                </div>

                {/* Title TH & EN */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug mb-1">
                  {act.titleTh}
                </h3>
                <p className="text-xs text-slate-400 italic mb-4 font-mono line-clamp-1">
                  {act.titleEn}
                </p>

                {/* Meta details */}
                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>ระดับชั้น: <strong className="text-slate-900">{act.targetGrade}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>รองรับ: <strong className="text-slate-900">{act.maxPerRound} คน/รอบ</strong> ({act.totalRounds} รอบ)</span>
                  </div>

                  {act.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{act.location}</span>
                    </div>
                  )}

                  {act.timeSlot && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{act.timeSlot}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>
                      ครูผู้ประสานงาน: <strong className="text-slate-800">{act.coordinator}</strong> ({act.phone})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Link Button */}
              {act.registerUrl && act.registerUrl.trim() !== '' && act.registerUrl.trim() !== '-' && (
                <a
                  href={act.registerUrl.startsWith('http') ? act.registerUrl : `https://${act.registerUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>ลงทะเบียนเข้าร่วมแข่งขัน</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
