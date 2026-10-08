import { useState, useEffect } from 'react';

export default function NoInternetBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOnline(true);
      window.location.reload();
    } else {
      // thora sa vibration / feedback
      setIsOnline(false);
    }
  };

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-4 text-sm font-medium shadow-md">
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
        No Internet Connection
      </span>
      <button
        onClick={handleRetry}
        className="bg-white text-red-600 px-3 py-1 rounded-md font-semibold hover:bg-gray-100 transition"
      >
        Retry
      </button>
    </div>
  );
}