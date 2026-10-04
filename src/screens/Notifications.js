import { useState } from 'react';

import { API_BASE_URL as API_URL } from '../lib/api';

export default function Notifications({ notify }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('both');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if(!title || !message){
      notify('Title aur Message dono likho!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, audience })
      });

      const data = await res.json();
      
      if(data.success){
        notify(`Notification bhej di gayi to ${audience}!`);
        setTitle('');
        setMessage('');
      } else {
        notify('Error: ' + data.message);
      }
    } catch(e) {
      notify('Server Error: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 text-white max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">ZRide Notifications Center</h1>
      
      <label className="text-white/60 text-sm">Kisko bhejni hai?</label>
      <select value={audience} onChange={e => setAudience(e.target.value)} className="bg-zinc-800 p-3 rounded w-full mb-4 mt-1 border border-white/10 outline-none">
        <option value="both">Driver + Passenger (Sab ko)</option>
        <option value="driver">Sirf Driver</option>
        <option value="passenger">Sirf Passenger</option>
      </select>

      <label className="text-white/60 text-sm">Title</label>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Eid Offer 50% OFF" className="bg-zinc-800 p-3 rounded w-full mb-4 mt-1 border border-white/10 outline-none" />
      
      <label className="text-white/60 text-sm">Message</label>
      <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Poora message yahan likho..." className="bg-zinc-800 p-3 rounded w-full mb-4 mt-1 h-32 border border-white/10 outline-none" />
      
      <button disabled={loading} onClick={handleSend} className="bg-yellow-400 text-black p-3 rounded w-full font-bold text-lg hover:bg-yellow-300 disabled:bg-zinc-600">
        {loading ? 'Bhej raha hu...' : 'Bhejo Notification'}
      </button>
    </div>
  );
}