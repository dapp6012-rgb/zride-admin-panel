import { useEffect, useState } from 'react';

export default function SplashFrontScreen({ onContinue }) {
  const [loading, setLoading] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(prev => prev >= 100? 100 : prev + 10);
    }, 100);

    const timer = window.setTimeout(onContinue, 1050);
    return () => {
      clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-[#FFD700] text-black flex flex-col items-center justify-center p-4" style={{fontFamily: 'Inter, sans-serif'}}>

      {/* LOGO CARD */}
      <div className="flex flex-col items-center w-full max-w-sm">

        {/* APP ICON - Logo square wala */}
        <div className="w-24 h-24 bg-[#2D2D2D] rounded-2xl flex items-center justify-center mb-4">
          <span className="text-5xl font-bold text-[#FFD700]">Z</span>
        </div>

        {/* APP NAME */}
        <h1 className="text-4xl font-bold tracking-wide text-[#2D2D2D]">ZRide</h1>
        <p className="text-sm text-[#2D2D2D] font-medium mt-1">Admin Panel</p>

        {/* DIVIDER */}
        <div className="w-32 h-px bg-[#2D2D2D] my-6"></div>

        {/* EYEBROW */}
        <div className="text-center text-xs text-[#2D2D2D] uppercase tracking-widest mb-2 font-semibold">
          Ride operations / Karachi
        </div>

        {/* HEADING */}
        <h2 className="text-center text-2xl font-bold mb-2 text-[#2D2D2D]">
          Move the city
          <br />
          with confidence.
        </h2>

        {/* SUBTEXT */}
        <p className="text-center text-sm text-[#333] mb-6">
          ZRide Admin Panel keeps every trip, driver, and safety signal in view.
        </p>

        {/* LOADING BAR */}
        <div className="w-full mb-6">
          <div className="flex justify-between text-xs text-[#333] mb-1">
            <span>Initializing Control Room</span>
            <span>{loading}%</span>
          </div>
          <div className="w-full bg-[#E6C200] rounded-full h-2">
            <div
              className="bg-[#2D2D2D] h-2 rounded-full transition-all duration-100"
              style={{ width: `${loading}%` }}
            ></div>
          </div>
        </div>

        {/* BUTTON */}
        <button
          className="w-full bg-[#2D2D2D] hover:bg-black text-[#FFD700] font-bold py-3 rounded-xl transition-all duration-200 shadow-lg"
          onClick={onContinue}
          data-testid="button-start"
        >
          Enter control room →
        </button>

        {/* FOOTER */}
        <div className="text-center text-xs text-[#444] mt-4">
          SECURE LOCAL DEMO · v2.4.1
        </div>
      </div>
    </div>
  );
}