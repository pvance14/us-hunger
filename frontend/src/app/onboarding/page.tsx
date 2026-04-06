import React from 'react';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white flex flex-col items-center p-4">
      <div className="w-full max-w-md mt-10">
        <header className="mb-8 text-center bg-white/5 p-6 rounded-2xl backdrop-blur-xl border border-white/10 shadow-xl">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-100">
            Welcome to the Team
          </h1>
          <p className="text-blue-200 mt-2 text-sm leading-relaxed">
            Fast-track your onboarding by securely providing the required information below.
          </p>
        </header>

        <form className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 flex flex-col space-y-6">
          <div className="space-y-4">
             <div className="flex flex-col">
                <label className="text-sm font-semibold text-indigo-100 mb-1 ml-1">First Name</label>
                <input 
                  type="text" 
                  placeholder="Jane" 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
             </div>
             
             <div className="flex flex-col">
                <label className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Last Name</label>
                <input 
                  type="text" 
                  placeholder="Doe" 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
             </div>

             <div className="flex flex-col">
                <label className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="(555) 555-5555" 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
             </div>
          </div>

          <hr className="border-white/10" />

          <div className="space-y-4">
             <div>
                <h3 className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Driver's License</h3>
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-blue-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative bg-black/30 border border-dashed border-indigo-400/50 hover:border-indigo-400 rounded-xl p-6 flex flex-col items-center justify-center transition-all">
                    <span className="text-indigo-200 text-sm font-medium">Tap to upload picture</span>
                    <p className="text-xs text-indigo-400/70 mt-1">JPEG or PNG</p>
                  </div>
                </div>
             </div>

             <div>
                <h3 className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Vehicle Insurance</h3>
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-purple-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative bg-black/30 border border-dashed border-purple-400/50 hover:border-purple-400 rounded-xl p-6 flex flex-col items-center justify-center transition-all">
                    <span className="text-purple-200 text-sm font-medium">Tap to upload document</span>
                    <p className="text-xs text-purple-400/70 mt-1">PDF, JPEG, or PNG</p>
                  </div>
                </div>
             </div>
          </div>

          <button 
            type="button" 
            className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95"
          >
            Submit Application
          </button>
        </form>

        <p className="text-center text-xs text-indigo-300/60 mt-6">
          Your information is stored securely for compliance purposes.
        </p>
      </div>
    </div>
  );
}
