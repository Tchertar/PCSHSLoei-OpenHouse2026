import React, { useState } from 'react';
import { ExternalLink, MapPin, Navigation, School, Sparkles, Building2 } from 'lucide-react';

const BUILDINGS = [
  {
    id: 'b1',
    name: 'หอประชุมใหญ่ จุฬาภรณราชวิทยาลัย',
    desc: 'จุดลงทะเบียนกลาง พิธีเปิด-ปิด และการแข่งขันหุ่นยนต์กู้ภัย',
    zone: 'โซน A - อาคารอำนวยการ',
  },
  {
    id: 'b2',
    name: 'อาคารปฏิบัติการวิทยาศาสตร์ 1 (ฟิสิกส์ & ดาราศาสตร์)',
    desc: 'นิทรรศการฟิสิกส์ ห้องจำลองดวงดาว และแล็บกลศาสตร์',
    zone: 'โซน B - ฝั่งทิศตะวันออก',
  },
  {
    id: 'b3',
    name: 'อาคารปฏิบัติการวิทยาศาสตร์ 2 (เคมี & ชีววิทยา)',
    desc: 'การสกัด DNA พืช การทดลองสารเรืองแสงเคมี และกล้องจุลทรรศน์',
    zone: 'โซน B - ฝั่งทิศตะวันออก',
  },
  {
    id: 'b4',
    name: 'อาคารนวัตกรรมและเทคโนโลยีสารสนเทศ (ICT)',
    desc: 'นิทรรศการนวัตกรรมเยาวชน การประกวดโครงงาน และการอบรม AI',
    zone: 'โซน C - ฝั่งทิศเหนือ',
  },
  {
    id: 'b5',
    name: 'สนามฟุตบอลและลานกิจกรรมกลางแจ้ง',
    desc: 'การแข่งขันจรวดขวดน้ำประเภทแม่นยำ และกิจกรรมสันทนาการ',
    zone: 'โซน D - สนามกลาง',
  },
  {
    id: 'b6',
    name: 'โรงอาหารและซุ้มอาหารบริการผู้ร่วมงาน',
    desc: 'จุดรับประทานอาหาร คูปองสวัสดิการ เครื่องดื่ม และจุดพักผ่อน',
    zone: 'โซน E - ลานสวัสดิการ',
  },
];

export const MapSection: React.FC = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(BUILDINGS[0]);

  return (
    <section id="map" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full">
          <MapPin className="w-4 h-4 text-orange-500" />
          <span>แผนผังงาน & การเดินทาง</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          แผนผังอาคารสถานที่ & พิกัดสถานที่จัดงาน
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย 129 หมู่ 5 ตำบลธาตุ อำเภอเชียงคาน จังหวัดเลย
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Building List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              <span>โซนอาคารและจุดจัดกิจกรรม</span>
            </h3>

            <div className="space-y-2.5">
              {BUILDINGS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedBuilding(item)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedBuilding.id === item.id
                      ? 'bg-blue-50 border-orange-500 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded">
                      {item.zone}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <a
              href="https://maps.app.goo.gl/RABYiDnwZXi7cuTaA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
            >
              <Navigation className="w-4 h-4" />
              <span>นำทางด้วย Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Right Embedded Interactive Map Container */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md flex flex-col">
          {/* Map View Header */}
          <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm text-white">
                แผนที่ดาวเทียม & Google Map พิกัดโรงเรียน
              </span>
            </div>
            <span className="text-xs text-orange-400 font-medium">
              อ.เชียงคาน จ.เลย
            </span>
          </div>

          {/* Map iframe */}
          <div className="relative w-full h-[360px] lg:h-[460px] bg-slate-950">
            <iframe
              title="PCSHS Loei Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3795.733735399587!2d101.6923483!3d17.8491871!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31248be177b9d7e3%3A0x28fb34d40292bfcb!2z4LmC4Lij4LiH4Lij4Li14LmA4LiZ4Lin4Li04LmA4LiX4Lii4LmC4Lin4Li04LmA4LiX4LmI4Liy4LiZ4Lij4Liy4LiK4Liy4Lij4Li1IOC5gOC4peC4oA!5e0!3m2!1sth!2sth!4v1700000000000!5m2!1sth!2sth"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
