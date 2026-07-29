import React, { useState } from 'react';
import { FaqItem } from '../types';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

interface FaqSectionProps {
  faqs: FaqItem[];
}

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs }) => {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="faq" className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto z-10 relative">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full">
          <HelpCircle className="w-4 h-4 text-orange-500" />
          <span>คำถามที่พบบ่อย (FAQ)</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          คำถามที่พบบ่อยเกี่ยวกับการเข้าร่วมงาน
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          คำตอบสำหรับข้อสงสัยเกี่ยวกับการลงทะเบียน การสแกนเข้างาน กิจกรรม และบริการในวันงาน
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-8 max-w-xl mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาคำถาม..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm transition-colors"
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-mono shrink-0 font-bold border border-blue-200">
                    Q
                  </span>
                  <span>{faq.question}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-orange-500' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  <div className="pl-11">{faq.answer}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
