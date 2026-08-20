import React, { useState } from 'react';
import { BannerCountdown } from './BannerCountdown';

export const Banner: React.FC = () => {
  const [imgSrc, setImgSrc] = useState('https://lh3.googleusercontent.com/d/1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-');

  return (
    <section className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 pt-2 pb-6 z-10">
      {/* Banner Container */}
      <div className="relative overflow-visible rounded-3xl bg-transparent p-0 m-0 border-0">
        {/* Banner Image - Floating with rounded corners and clean drop shadow */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl bg-transparent border-0 p-0 m-0">
          <img
            src={imgSrc}
            alt="PCSHS Loei Open House 2026 Banner"
            className="w-full h-auto object-contain block border-0 p-0 m-0 shadow-none outline-none select-none bg-transparent"
            referrerPolicy="no-referrer"
            onError={() => {
              setImgSrc(
                'https://drive.google.com/thumbnail?id=1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-&sz=w2000'
              );
            }}
          />

          {/* Locked Banner Countdown Timer on Desktop (Top-Left Area over banner) */}
          <div className="hidden lg:block absolute top-3 left-3 xl:top-5 xl:left-5 z-30 pointer-events-auto">
            <BannerCountdown />
          </div>
        </div>
      </div>

      {/* Countdown Timer BELOW banner on Smart Phone & iPad / Tablet */}
      <div className="lg:hidden mt-3 sm:mt-4 flex justify-center w-full z-20">
        <BannerCountdown />
      </div>
    </section>
  );
};
