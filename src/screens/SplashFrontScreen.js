import React, { useEffect } from 'react';

export default function SplashFrontScreen({ onContinue }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onContinue) onContinue();
    }, 2500); // 2.5 sec baad auto login pe jayega
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="w-20 h-20 bg-[#A7E92F] rounded-full animate-pulse mb-6 flex items-center justify-center">
        <span className="text-black font-bold text-3xl">Z</span>
      </div>
      <h1 className="text-3xl font-bold tracking-widest">ZRide</h1>
      <p className="text-white/60 text-sm mt-2 tracking-widest">ADMIN PANEL</p>

      <button
        onClick={onContinue}
        className="mt-10 px-8 py-3 bg-white text-black rounded-full font-semibold"
      >
        Continue
      </button>
    </div>
  );
}