export default function Dashboard() {
  return (
    <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-white tracking-tight">Control Tower</h1>
          <p className="text-slate-400 mt-1 font-sans">Intelligent Volunteer Coordination Agent</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20 text-sm font-medium shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Agent Active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Staffing Funnel & Live Pulse */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Staffing Funnel */}
          <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl transition-all duration-300 hover:border-white/20">
            <h2 className="text-xl font-heading font-medium text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Staffing Funnel (Today)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Shifts" value="124" />
              <StatCard title="Confirmed" value="112" colorClass="border-emerald-500/30 text-emerald-400 bg-emerald-500/5" />
              <StatCard title="Unconfirmed" value="8" colorClass="border-amber-500/30 text-amber-400 bg-amber-500/5" />
              <StatCard title="Unfilled" value="4" colorClass="border-rose-500/30 text-rose-400 bg-rose-500/5" />
            </div>
          </section>

          {/* Live Pulse */}
          <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl flex-1 transition-all duration-300 hover:border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-medium text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Live Pulse
              </h2>
              <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 tracking-wide">AUTO-PILOT ON</span>
            </div>
            
            <div className="space-y-4">
              <LogEntry time="07:14 AM" text="Volunteer Sarah K. texted SUB for Route 4A." type="warning" />
              <LogEntry time="07:15 AM" text="Auto-Sub triggered. Pinging 5 waitlisted volunteers." type="info" />
              <LogEntry time="07:28 AM" text="Substitute Found: Mark T. accepted Route 4A." type="success" />
              <LogEntry time="08:00 AM" text="Sent T-2 hour reminders to 45 morning drivers." type="info" />
            </div>
          </section>

        </div>

        {/* Right Column: Red Alert Sidebar */}
        <div className="flex flex-col gap-6">
          <section className="bg-rose-950/20 backdrop-blur-xl rounded-2xl border border-rose-500/20 p-6 shadow-2xl flex-1 transition-all duration-300 hover:border-rose-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-500/20 rounded-lg shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-heading font-medium text-rose-400">Red Alerts</h2>
            </div>
            
            <div className="space-y-4">
              <AlertCard 
                title="Danger Zone Cancellation" 
                desc="John D. cancelled Route 7B (Starts in 2h). Auto-sub pinging."
                time="10m ago"
              />
              <AlertCard 
                title="Subhaustion Triggered" 
                desc="Route 12 lacks a driver. 15 substitutes declined or ignored."
                time="25m ago"
                urgent
              />
            </div>
          </section>

          {/* Impact Ticker */}
          <section className="relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-cyan-900/20 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wider mb-2 drop-shadow-md">Impact Ticker</h3>
            <div className="text-4xl font-heading font-bold text-white drop-shadow-lg">42 <span className="text-2xl text-cyan-100/70 font-medium">hrs</span></div>
            <p className="text-sm text-cyan-200/60 mt-2 font-medium">Staff hours saved this month</p>
          </section>
        </div>

      </div>
    </main>
  );
}

// --- Helper Components ---

function StatCard({ title, value, colorClass = "border-white/10 text-white bg-white/5" }: { title: string, value: string, colorClass?: string }) {
  return (
    <div className={`p-4 rounded-xl border ${colorClass} flex flex-col justify-center items-center backdrop-blur-sm transition-transform hover:scale-105`}>
      <span className="text-3xl font-heading font-semibold mb-1">{value}</span>
      <span className="text-xs uppercase tracking-wider font-medium opacity-80">{title}</span>
    </div>
  );
}

function LogEntry({ time, text, type }: { time: string, text: string, type: 'info' | 'success' | 'warning' | 'alert' }) {
  const colors = {
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    alert: "text-rose-400 bg-rose-500/10 border-rose-500/20"
  };
  
  return (
    <div className="flex gap-4 items-start p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="text-xs font-mono text-slate-500 mt-0.5 whitespace-nowrap">{time}</div>
      <div className="flex-1 text-sm text-slate-300 leading-snug">{text}</div>
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors[type].split(' ')[0].replace('text-', 'bg-')}`}></div>
    </div>
  );
}

function AlertCard({ title, desc, time, urgent = false }: { title: string, desc: string, time: string, urgent?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${urgent ? 'border-rose-500/50 bg-rose-500/10' : 'border-rose-500/20 bg-rose-950/30'} flex flex-col gap-2 relative overflow-hidden`}>
      {urgent && (
        <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/20 blur-xl rounded-full"></div>
      )}
      <div className="flex justify-between items-start">
        <h4 className="font-heading font-medium text-rose-200 text-sm">{title}</h4>
        <span className="text-xs text-rose-500/70 font-mono">{time}</span>
      </div>
      <p className="text-xs text-rose-200/70 leading-relaxed max-w-[90%]">{desc}</p>
      {urgent && (
        <button className="mt-2 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 py-1.5 px-3 rounded-md transition-colors border border-rose-500/30 self-start">
          Take Manual Action
        </button>
      )}
    </div>
  );
}
