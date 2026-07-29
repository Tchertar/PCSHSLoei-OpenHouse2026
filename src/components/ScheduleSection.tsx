import React from 'react';
import { ScheduleItem } from '../types';
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

interface ScheduleSectionProps {
  schedule: ScheduleItem[];
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ schedule }) => {
  return (
    <section id="schedule" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-1.5 rounded-full">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span>กำหนดการจัดงานประจำวัน</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          กำหนดการกิจกรรม วันศุกร์ที่ 28 สิงหาคม พ.ศ. 2569
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          ตารางเวลาภาพรวมของพิธีเปิด การประกวดแข่งขัน นิทรรศการ และพิธีมอบรางวัลเกียรติบัตร
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Vertical Timeline Line */}
        <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-orange-400 via-blue-500 to-indigo-600 rounded-full hidden sm:block -translate-x-1/2" />

        <div className="space-y-6">
          {schedule.map((item, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                className={`relative flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isEven ? 'sm:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-4 border-orange-500 z-10 shadow-md hidden sm:block" />

                {/* Card Container */}
                <div className="w-full sm:w-[45%] bg-white border border-slate-200/80 hover:border-orange-400/80 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      {item.time}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-orange-500" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
