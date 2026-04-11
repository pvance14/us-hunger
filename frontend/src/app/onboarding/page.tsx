'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const PRIMARY = '#1B4B8A';
const PRIMARY_DARK = '#163d72';
const SUCCESS = '#3A8F6B';

const TOTAL_STEPS = 5;

const STEPS = [
  { question: "What's your name?", hint: "We'll use this to greet volunteers." },
  { question: "What's your phone number?", hint: "We'll send shift reminders here." },
  { question: "When does your insurance expire?", hint: "Required for compliance." },
  { question: "Upload your driver's license.", hint: "JPEG or PNG, front of card." },
  { question: "Upload your vehicle insurance.", hint: "PDF, JPEG, or PNG accepted." },
];

const inputClass = [
  'h-14 w-full rounded-lg border px-4 text-base text-slate-900 placeholder-slate-400 transition',
  'border-slate-200 bg-slate-50',
  'focus:outline-none focus:bg-white',
].join(' ');

export default function OnboardingPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [dlFile, setDlFile] = useState<File | null>(null);
  const [insFile, setInsFile] = useState<File | null>(null);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  function canAdvance() {
    if (step === 0) return firstName.trim().length > 0 && lastName.trim().length > 0;
    if (step === 1) return phoneNumber.trim().length > 6;
    if (step === 2) return insuranceExpiry.length > 0;
    if (step === 3) return dlFile !== null;
    if (step === 4) return insFile !== null;
    return false;
  }

  function goNext() {
    if (!canAdvance()) return;
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!canAdvance()) return;
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

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');

      setSuccess(true);
      setTimeout(() => { router.push('/'); }, 3000);
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>
        {/* Header */}
        <div className="px-8 py-5 flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
          <h1 className="text-white text-2xl font-bold" style={{ letterSpacing: '-0.5px' }}>Volunteer Portal</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94B8D4' }}>Onboarding application</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-lg bg-white p-10 text-center"
            style={{ boxShadow: '0px 2px 4px rgba(13,23,33,0.08), 0px 1px 2px rgba(21,30,40,0.08)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: '#E0F2EC' }}
            >
              <span className="text-4xl" style={{ color: SUCCESS }}>✓</span>
            </motion.div>
            <h2 className="text-2xl font-bold" style={{ color: '#0F172A' }}>You&apos;re all set!</h2>
            <p className="mt-2 text-sm" style={{ color: '#475569' }}>Application submitted. Redirecting to the dashboard…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>
      {/* Navy header bar */}
      <div className="px-8 py-5 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
        <div>
          <h1 className="text-white text-2xl font-bold" style={{ letterSpacing: '-0.5px' }}>Volunteer Portal</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94B8D4' }}>Onboarding application</p>
        </div>
        <span className="text-sm font-medium" style={{ color: '#94B8D4' }}>
          Step {step + 1} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Progress bar — sits just below the header */}
      <div className="h-1 w-full" style={{ backgroundColor: '#D6E8FA' }}>
        <motion.div
          className="h-full"
          style={{ backgroundColor: PRIMARY }}
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Centered form area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-lg bg-white overflow-hidden"
            style={{ boxShadow: '0px 2px 4px rgba(13,23,33,0.08), 0px 1px 2px rgba(21,30,40,0.08)' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="p-8"
              >
                <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>{STEPS[step].question}</h2>
                <p className="mt-1 text-sm" style={{ color: '#475569' }}>{STEPS[step].hint}</p>

                {errorMsg && (
                  <div className="mt-4 rounded-lg border px-4 py-3 text-sm"
                    style={{ borderColor: '#FECDD3', backgroundColor: '#FFF1F2', color: '#DC3545' }}>
                    {errorMsg}
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {step === 0 && (
                    <>
                      <input type="text" autoFocus placeholder="First name"
                        value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && goNext()}
                        className={inputClass}
                        style={{ borderColor: '#E2E8F0' }}
                      />
                      <input type="text" placeholder="Last name"
                        value={lastName} onChange={(e) => setLastName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && goNext()}
                        className={inputClass}
                        style={{ borderColor: '#E2E8F0' }}
                      />
                    </>
                  )}

                  {step === 1 && (
                    <input type="tel" autoFocus placeholder="(555) 555-5555"
                      value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && goNext()}
                      className={inputClass}
                      style={{ borderColor: '#E2E8F0' }}
                    />
                  )}

                  {step === 2 && (
                    <input type="date" autoFocus
                      value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)}
                      className={inputClass}
                      style={{ borderColor: '#E2E8F0' }}
                    />
                  )}

                  {step === 3 && (
                    <FileDropZone accept="image/*" file={dlFile} onChange={setDlFile} hint="JPEG or PNG" />
                  )}

                  {step === 4 && (
                    <FileDropZone accept="image/*,.pdf" file={insFile} onChange={setInsFile} hint="PDF, JPEG, or PNG" />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="px-8 py-5 flex items-center gap-3" style={{ borderTop: '1px solid #F1F5F9', backgroundColor: '#FAFBFC' }}>
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="h-12 px-5 rounded-lg text-sm font-semibold transition-colors"
                  style={{ border: '1px solid #E2E8F0', color: '#475569', backgroundColor: '#fff' }}
                >
                  ← Back
                </button>
              )}
              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance()}
                  className="h-12 flex-1 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: canAdvance() ? PRIMARY : PRIMARY }}
                  onMouseEnter={(e) => { if (canAdvance()) (e.currentTarget as HTMLElement).style.backgroundColor = PRIMARY_DARK; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = PRIMARY; }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!canAdvance() || isSubmitting}
                  className="h-12 flex-1 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: PRIMARY }}
                  onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.backgroundColor = PRIMARY_DARK; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = PRIMARY; }}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-xs" style={{ color: '#94A3B8' }}>
            Your information is stored securely for compliance purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

function FileDropZone({
  accept, file, onChange, hint,
}: {
  accept: string;
  file: File | null;
  onChange: (f: File) => void;
  hint: string;
}) {
  return (
    <label className="block cursor-pointer">
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition"
        style={file
          ? { borderColor: '#3A8F6B', backgroundColor: '#E0F2EC', color: '#2E7057' }
          : { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', color: '#64748B' }
        }
      >
        <span className="text-3xl mb-2">{file ? '✓' : '↑'}</span>
        <span className="text-sm font-semibold">{file ? file.name : 'Tap to upload'}</span>
        <span className="mt-1 text-xs opacity-70">{hint}</span>
      </div>
      <input
        type="file"
        accept={accept}
        required
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }}
      />
    </label>
  );
}
