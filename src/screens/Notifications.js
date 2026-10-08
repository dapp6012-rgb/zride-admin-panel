import { useState } from 'react';
import { API_URL } from '../lib/api';

export default function Notifications({ notify }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('both');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if(!title.trim() ||!message.trim()){
      notify('❌ Title aur Message dono likho!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), audience })
      });

      const data = await res.json();

      if(res.ok && data.success){
        notify(`✅ Notification bhej di gayi to ${audience}!`);
        setTitle('');
        setMessage('');
      } else {
        notify('❌ Error: ' + (data.message || 'Failed'));
      }
    } catch(e) {
      notify('❌ Server Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">ZRide Notifications Center</h1>
          <p className="text-sm text-white/50 mt-1">Send push notification to drivers & riders</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-white/50 text-xs uppercase font-bold tracking-wider">Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)} className="bg-black border border-white/10 p-3.5 rounded-xl w-full mt-2 outline-none focus:border-[#A7E92F]/50 text-sm">
              <option value="both">Driver + Passenger (Sab ko)</option>
              <option value="driver">Sirf Driver</option>
              <option value="passenger">Sirf Passenger</option>
            </select>
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase font-bold tracking-wider">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Eid Offer 50% OFF" className="bg-black border border-white/10 p-3.5 rounded-xl w-full mt-2 outline-none focus:border-[#A7E92F]/50 text-sm placeholder:text-white/20" />
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase font-bold tracking-wider">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Poora message yahan likho..." className="bg-black border border-white/10 p-3.5 rounded-xl w-full mt-2 h-32 outline-none focus:border-[#A7E92F]/50 text-sm placeholder:text-white/20 resize-none" />
            <p className="text-[11px] text-white/30 mt-2 text-right">{message.length}/200</p>
          </div>

          <button disabled={loading ||!title.trim() ||!message.trim()} onClick={handleSend} className="bg-[#A7E92F] text-black p-3.5 rounded-xl w-full font-black text-sm uppercase tracking-wide hover:bg-[#96d42a] disabled:bg-white/10 disabled:text-white/30 transition-all flex items-center justify-center gap-2">
            {loading? <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Bhej raha hu...</> : '🚀 Bhejo Notification'}
          </button>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-500/80">
          <b>Note:</b> Notification sab active users ko jayegi jo app open karenge. Test ke liye pehle "Sirf Driver" pe bhejo.
        </div>
      </div>
    </div>
  );
}