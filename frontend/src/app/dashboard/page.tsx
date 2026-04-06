'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type PulseEvent = {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'alert' | 'success';
};

export default function Dashboard() {
  const [pulses, setPulses] = useState<PulseEvent[]>([]);
  const [redAlerts, setRedAlerts] = useState<any[]>([]);
  const [funnel, setFunnel] = useState({ totalActive: 0, requestedSub: 0 });
  const pulseEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch for red alerts
    const fetchAlerts = async () => {
      const { data } = await supabase.from('sub_requests').select('*').eq('status', 'failed');
      if (data) setRedAlerts(data);
      
      const { count: totalActive } = await supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: requestedSub } = await supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('status', 'sub_requested');
      
      setFunnel({ totalActive: totalActive || 0, requestedSub: requestedSub || 0 });
    };
    fetchAlerts();

    // Setup Live Pulse Real-Time Listener
    const channel = supabase.channel('control-tower')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, payload => {
        const time = new Date().toLocaleTimeString();
        const newData = payload.new as any;
        let message = `Schedule updated: ID ${newData.id}`;
        let type: 'info' | 'alert' | 'success' = 'info';

        if (newData.status === 'sub_requested') {
           message = 'A volunteer requested a substitute!';
           type = 'alert';
        } else if (newData.status === 'completed') {
           message = 'A volunteer confirmed their shift!';
           type = 'success';
        }

        setPulses(prev => [...prev, { id: Date.now().toString(), time, message, type }]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_requests' }, payload => {
        const time = new Date().toLocaleTimeString();
        let message = `Sub Request updated`;
        let type: 'info' | 'alert' | 'success' = 'info';
        const newData = payload.new as any;

        if (newData.status === 'failed') {
          message = 'CRITICAL: Automated Sub Search Exhausted. Staff Action Required.';
          type = 'alert';
          setRedAlerts(prev => [...prev, newData]);
        }
        
        setPulses(prev => [...prev, { id: Date.now().toString(), time, message, type }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom of pulse log
    pulseEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pulses]);

  // CSV Mock Handler
  const handleCsvImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = e => {
      alert("CSV Uploaded! Seeding data process initiated (Mock).");
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-[#070B19] text-white p-6 font-sans flex flex-col md:flex-row gap-6">
      
      {/* LEFT COLUMN: Funnel & Alerts */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
         {/* HEADER */}
         <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
               Control Tower
            </h1>
            <p className="text-sm text-gray-400 mt-2">Intelligent Volunteer Coordination Agent</p>
         </div>

         {/* STAFFING FUNNEL */}
         <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex-1">
            <h2 className="text-xl font-bold mb-4 text-indigo-200">Staffing Funnel</h2>
            <div className="flex flex-col gap-4">
               <div className="bg-black/30 p-4 rounded-xl border border-blue-500/30 flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Active Volunteers</span>
                  <span className="text-2xl font-bold text-blue-400">{funnel.totalActive}</span>
               </div>
               <div className="bg-black/30 p-4 rounded-xl border border-orange-500/30 flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Substitutes Needed</span>
                  <span className="text-2xl font-bold text-orange-400">{funnel.requestedSub}</span>
               </div>
            </div>

            <button onClick={handleCsvImport} className="mt-8 w-full bg-white/10 hover:bg-white/20 transition p-3 rounded-xl border border-white/10 text-sm font-semibold flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              Import Organization Data (CSV)
            </button>
         </div>
      </div>

      {/* MIDDLE/RIGHT COLUMN: Pulse & Red Alerts */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
         
         {/* RED ALERT SIDEBAR (Top Horizontal in this layout) */}
         {redAlerts.length > 0 && (
          <div className="bg-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse">
            <h2 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Action Required
            </h2>
            <div className="flex flex-col gap-3">
              {redAlerts.map((alert, i) => (
                <div key={i} className="bg-red-950/50 p-4 rounded-xl border border-red-800/50 flex justify-between items-center">
                  <div>
                     <p className="text-red-200 text-sm font-semibold">Sub Request #{alert.id.slice(0,6).toUpperCase()} Exhausted</p>
                     <p className="text-xs text-red-400 mt-1">Manual coordinator override needed. AI search yielded no results.</p>
                  </div>
                  <button className="bg-red-600 hover:bg-red-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition">Assign Human</button>
                </div>
              ))}
            </div>
          </div>
         )}

         {/* LIVE PULSE */}
         <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-green-300 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              Live Pulse
            </h2>
            
            <div className="bg-black/40 rounded-2xl border border-white/5 flex-1 p-4 overflow-y-auto max-h-[500px]">
               {pulses.length === 0 ? (
                 <div className="text-gray-500 h-full flex items-center justify-center text-sm italic">
                   Listening for events...
                 </div>
               ) : (
                 <div className="flex flex-col gap-3">
                   {pulses.map(pulse => (
                     <div key={pulse.id} className="flex gap-4 items-start pb-3 border-b border-white/5">
                        <span className="text-xs font-mono text-gray-500 pt-1">{pulse.time}</span>
                        <div className="flex-1">
                          <p className={`text-sm ${
                            pulse.type === 'alert' ? 'text-red-300 font-bold' : 
                            pulse.type === 'success' ? 'text-green-300 font-medium' : 
                            'text-indigo-200'
                          }`}>
                            {pulse.message}
                          </p>
                        </div>
                     </div>
                   ))}
                   <div ref={pulseEndRef} />
                 </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
}
