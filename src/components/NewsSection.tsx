import React, { useState } from 'react';
import { NewsItem } from '../types';
import { BellRing, Calendar, ChevronRight, Info, Sparkles, X } from 'lucide-react';

interface NewsSectionProps {
  news: NewsItem[];
}

export const NewsSection: React.FC<NewsSectionProps> = ({ news }) => {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  return (
    <section id="news" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full">
          <BellRing className="w-4 h-4 text-amber-500" />
          <span>ข่าวสาร & ประกาศสำคัญ</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          ประกาศและข่าวสารอัปเดตงาน Open House 2026
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          ติดตามข่าวสารล่าสุด เกณฑ์การแข่งขัน และการเตรียมความพร้อมก่อนวันจัดงาน
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {news.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedNews(item)}
            className="group bg-white border border-slate-200/80 hover:border-amber-400/80 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  {item.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.date}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug mb-3">
                {item.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                {item.content}
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-orange-600 group-hover:text-orange-500 pt-3 border-t border-slate-100">
              <span>อ่านรายละเอียดเพิ่มเติม</span>
              <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>

      {/* News Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <button
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-amber-600 font-bold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>{selectedNews.category}</span>
              <span>•</span>
              <span className="text-slate-500">{selectedNews.date}</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
              {selectedNews.title}
            </h3>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-6">
              {selectedNews.content}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedNews(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
