'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [dlFile, setDlFile] = useState<File | null>(null);
  const [insFile, setInsFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('phoneNumber', phoneNumber);
      formData.append('insuranceExpiry', insuranceExpiry);
      if (dlFile) formData.append('driverLicense', dlFile);
      if (insFile) formData.append('insurance', insFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(true);
      // Wait a moment then maybe push somewhere else or just leave success message
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-white/10 p-10 rounded-3xl backdrop-blur-md shadow-2xl border border-white/20 text-center animate-pulse">
           <h2 className="text-3xl font-bold text-green-300 mb-4">Application Submitted!</h2>
           <p className="text-indigo-200">Welcome to the team. Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

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

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 flex flex-col space-y-6">
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm mb-4">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
             <div className="flex flex-col">
                <label className="text-sm font-semibold text-indigo-100 mb-1 ml-1">First Name</label>
                <input 
                  type="text" 
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane" 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
             </div>
             
             <div className="flex flex-col">
                <label className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Doe" 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
             </div>

             <div className="flex flex-col">
                <label className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="(555) 555-5555" 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
             </div>

             <div className="flex flex-col">
                <label className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Insurance Expiry</label>
                <input 
                  type="date" 
                  required
                  value={insuranceExpiry}
                  onChange={e => setInsuranceExpiry(e.target.value)}
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
             </div>
          </div>

          <hr className="border-white/10" />

          <div className="space-y-4">
             <div>
                <h3 className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Driver&apos;s License</h3>
                <label className="relative group cursor-pointer block">
                  <div className="absolute inset-0 bg-blue-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative bg-black/30 border border-dashed border-indigo-400/50 hover:border-indigo-400 rounded-xl p-6 flex flex-col items-center justify-center transition-all">
                    <span className="text-indigo-200 text-sm font-medium">{dlFile ? dlFile.name : 'Tap to upload picture'}</span>
                    <p className="text-xs text-indigo-400/70 mt-1">JPEG or PNG</p>
                    <input type="file" accept="image/*" required className="hidden" onChange={(e) => handleFileChange(e, setDlFile)} />
                  </div>
                </label>
             </div>

             <div>
                <h3 className="text-sm font-semibold text-indigo-100 mb-1 ml-1">Vehicle Insurance</h3>
                <label className="relative group cursor-pointer block">
                  <div className="absolute inset-0 bg-purple-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative bg-black/30 border border-dashed border-purple-400/50 hover:border-purple-400 rounded-xl p-6 flex flex-col items-center justify-center transition-all">
                    <span className="text-purple-200 text-sm font-medium">{insFile ? insFile.name : 'Tap to upload document'}</span>
                    <p className="text-xs text-purple-400/70 mt-1">PDF, JPEG, or PNG</p>
                    <input type="file" accept="image/*,.pdf" required className="hidden" onChange={(e) => handleFileChange(e, setInsFile)} />
                  </div>
                </label>
             </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading...' : 'Submit Application'}
          </button>
        </form>

        <p className="text-center text-xs text-indigo-300/60 mt-6">
          Your information is stored securely for compliance purposes.
        </p>
      </div>
    </div>
  );
}
