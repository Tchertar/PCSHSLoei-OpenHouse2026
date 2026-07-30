import React, { useState } from 'react';
import { MapPin, Download, ExternalLink } from 'lucide-react';

export const MapSection: React.FC = () => {
  const [imgSrc, setImgSrc] = useState<string>(
    'https://lh3.googleusercontent.com/d/1002l5iuUNpZl2xopXluOJ7mHr-_SP7Af'
  );

  const handleImageError = () => {
    if (imgSrc.includes('lh3.googleusercontent.com')) {
      setImgSrc('https://drive.google.com/thumbnail?id=1002l5iuUNpZl2xopXluOJ7mHr-_SP7Af&sz=w2500');
    } else if (imgSrc.includes('thumbnail')) {
      setImgSrc('https://drive.google.com/uc?export=view&id=1002l5iuUNpZl2xopXluOJ7mHr-_SP7Af');
    }
  };

  return (
    <section id="map" className="py-10 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>แผนผังอาคารสถานที่ PCSHS Loei</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            แผนผังอาคารสถานที่
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย • 129 หมู่ 5 ตำบลธาตุ อำเภอเชียงคาน จังหวัดเลย
          </p>
        </div>

        {/* REAL MAP IMAGE CONTAINER */}
        <div className="w-full bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-2 sm:p-4">
          <div className="relative w-full rounded-xl overflow-hidden bg-slate-100 group">
            {/* Real Campus Map Image */}
            <img
              src={imgSrc}
              onError={handleImageError}
              alt="แผนผังอาคาร โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย"
              className="w-full h-auto object-contain select-none"
              referrerPolicy="no-referrer"
            />

            {/* Quick Action Controls Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-lg text-white text-xs z-10">
              <a
                href="https://drive.google.com/file/d/1002l5iuUNpZl2xopXluOJ7mHr-_SP7Af/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-all text-slate-200 hover:text-white"
                title="เปิดรูปภาพต้นฉบับใน Google Drive"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">เปิดภาพเต็ม</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
