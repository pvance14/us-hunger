'use client';

import Link from 'next/link';
import { startTransition, useEffect, useRef, useState } from 'react';
import type { DashboardPulse, SimulatorConversation, SimulatorVolunteerOption } from '@/lib/types';

// Same design tokens as the dashboard
const C = {
  primary:    '#1B4B8A',
  success:    '#3A8F6B',
  gray900:    '#0F172A',
  gray800:    '#212B36',
  gray600:    '#475569',
  gray500:    '#919EAB',
  gray300:    '#CBD5E1',
  gray200:    '#E2E8F0',
  gray100:    '#F1F5F9',
  white:      '#FFFFFF',
  cardShadow: '0px 2px 4px rgba(13,23,33,0.08), 0px 1px 2px rgba(21,30,40,0.08)',
  // iMessage colours
  bubbleOut:  '#1B4B8A',   // outbound = system → volunteer (right, navy)
  bubbleIn:   '#E9E9EB',   // inbound  = volunteer → system (left, gray)
  bubbleSys:  '#F1F5F9',
};

type SimulatorPayload = {
  volunteers: SimulatorVolunteerOption[];
  selectedPhoneNumber: string | null;
  conversation: SimulatorConversation;
};

const EMPTY_SIMULATOR_STATE: SimulatorPayload = {
  volunteers: [],
  selectedPhoneNumber: null,
  conversation: { volunteer: null, messages: [] },
};

const QUICK_REPLIES = ['YES', 'NO', 'SUB', 'HELP'];

function isSimulatorPayload(p: unknown): p is SimulatorPayload {
  return typeof p === 'object' && p !== null && 'volunteers' in p && 'selectedPhoneNumber' in p && 'conversation' in p;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

async function fetchSimulatorPayload(phoneNumber?: string): Promise<SimulatorPayload> {
  const query = phoneNumber ? `?phone=${encodeURIComponent(phoneNumber)}` : '';
  const response = await fetch(`/api/simulator${query}`, { cache: 'no-store' });
  const payload = (await response.json()) as SimulatorPayload | { error?: string };
  const errorMessage = 'error' in payload && typeof payload.error === 'string' ? payload.error : '';
  if (!response.ok || errorMessage) throw new Error(errorMessage || 'Unable to refresh the simulator view.');
  if (!isSimulatorPayload(payload)) throw new Error('Unable to refresh the simulator view.');
  return payload;
}

export function PhoneSimulator() {
  const [simulatorState, setSimulatorState] = useState<SimulatorPayload>(EMPTY_SIMULATOR_STATE);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('');
  const [draftMessage, setDraftMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function refreshConversation(nextPhoneNumber?: string) {
    const phoneNumber = nextPhoneNumber ?? selectedPhoneNumber;
    try {
      const payload = await fetchSimulatorPayload(phoneNumber);
      const resolved = phoneNumber || payload.selectedPhoneNumber || '';
      startTransition(() => { setSimulatorState(payload); setSelectedPhoneNumber(resolved); setErrorMessage(''); });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to refresh the simulator view.';
      startTransition(() => { setErrorMessage(message); });
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await fetchSimulatorPayload(selectedPhoneNumber || undefined);
        const resolved = selectedPhoneNumber || payload.selectedPhoneNumber || '';
        startTransition(() => { setSimulatorState(payload); setSelectedPhoneNumber(resolved); setErrorMessage(''); });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to refresh the simulator view.';
        startTransition(() => { setErrorMessage(message); });
      }
    };
    void load();
    const interval = window.setInterval(() => { void load(); }, 4000);
    return () => window.clearInterval(interval);
  }, [selectedPhoneNumber]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simulatorState.conversation.messages]);

  async function sendMessage(message: string) {
    if (!selectedPhoneNumber || !message.trim()) return;
    setIsSending(true);
    try {
      const response = await fetch('/api/webhooks/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: selectedPhoneNumber, text: message.trim() }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'The simulator could not process that message.');
      startTransition(() => { setDraftMessage(''); });
      await refreshConversation(selectedPhoneNumber);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'The simulator could not process that message.';
      startTransition(() => { setErrorMessage(messageText); });
    } finally {
      setIsSending(false);
    }
  }

  const messages = simulatorState.conversation.messages;
  const volunteer = simulatorState.conversation.volunteer;

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>
      {/* Purple page header */}
      <div className="px-8 py-5 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: C.primary }}>
        <div>
          <h1 className="text-white text-2xl font-bold" style={{ letterSpacing: '-0.5px' }}>Simulator</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94B8D4' }}>Volunteer Phone View</p>
        </div>
        <Link
          href="/"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: C.white, color: C.primary }}
        >
          ← Dashboard
        </Link>
      </div>

      <div className="flex-1 px-8 py-6 flex gap-5">
        {/* Left panel */}
        <div className="flex flex-col gap-4" style={{ width: 340, flexShrink: 0 }}>
          {/* Info card */}
          <div className="rounded-lg bg-white p-6" style={{ boxShadow: C.cardShadow }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.gray500 }}>About</p>
            <p className="text-sm leading-relaxed" style={{ color: C.gray600 }}>
              MVP replacement for real SMS. Every action here runs through the same webhook and automation flow as Twilio.
            </p>
          </div>

          {/* Volunteer selector */}
          <div className="rounded-lg bg-white p-6" style={{ boxShadow: C.cardShadow }}>
            <label htmlFor="volunteer" className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gray500 }}>
              Active Phone
            </label>
            <select
              id="volunteer"
              value={selectedPhoneNumber}
              onChange={(e) => { setSelectedPhoneNumber(e.target.value); void refreshConversation(e.target.value); }}
              className="mt-3 w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                border: `1px solid ${C.gray200}`,
                color: C.gray900,
                backgroundColor: C.white,
              }}
            >
              {simulatorState.volunteers.map((v) => (
                <option key={v.id} value={v.phoneNumber}>{v.name} · {v.phoneNumber}</option>
              ))}
            </select>

            {volunteer && (
              <div className="mt-3 rounded-lg px-4 py-3" style={{ backgroundColor: C.gray100 }}>
                <p className="text-sm font-semibold" style={{ color: C.gray900 }}>{volunteer.name}</p>
                <p className="text-xs mt-0.5 capitalize" style={{ color: C.gray600 }}>
                  {volunteer.status.replace(/_/g, ' ')}
                </p>
              </div>
            )}
          </div>

          {/* Demo paths */}
          <div className="rounded-lg bg-white p-6" style={{ boxShadow: C.cardShadow }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gray500 }}>Quick Demo Paths</p>
            <div className="space-y-3 text-sm" style={{ color: C.gray600 }}>
              <p><strong style={{ color: C.gray900 }}>Maya Driver</strong> — send <code className="rounded px-1 text-xs" style={{ backgroundColor: C.gray100 }}>SUB</code> to start the standard substitute workflow.</p>
              <p><strong style={{ color: C.gray900 }}>Ava Sub</strong> — wait for the offer, then send <code className="rounded px-1 text-xs" style={{ backgroundColor: C.gray100 }}>YES</code> to accept.</p>
              <p><strong style={{ color: C.gray900 }}>Leo Driver</strong> — send <code className="rounded px-1 text-xs" style={{ backgroundColor: C.gray100 }}>SUB</code> to trigger a danger-zone alert.</p>
              <p><strong style={{ color: C.gray900 }}>Any volunteer</strong> — send <code className="rounded px-1 text-xs" style={{ backgroundColor: C.gray100 }}>HELP</code> or full text for human-in-the-loop alert.</p>
            </div>
          </div>
        </div>

        {/* Right panel — conversation */}
        <div className="flex-1 rounded-lg bg-white flex flex-col overflow-hidden" style={{ boxShadow: C.cardShadow }}>
          {/* Chat header */}
          <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${C.gray200}` }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: C.gray900 }}>
                {volunteer ? volunteer.name : 'Conversation'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: C.gray500 }}>
                {selectedPhoneNumber || 'Select a volunteer to start'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshConversation()}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ backgroundColor: C.gray100, color: C.gray600 }}
            >
              Refresh
            </button>
          </div>

          {errorMessage && (
            <div className="mx-5 mt-3 rounded-lg px-4 py-3 text-sm flex-shrink-0" style={{ backgroundColor: '#FFF1F2', color: '#DC3545' }}>
              {errorMessage}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1" style={{ backgroundColor: '#F8F8F8' }}>
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm italic" style={{ color: C.gray500 }}>No messages yet for this phone number.</p>
              </div>
            ) : (
              messages.map((message, i) => {
                const prev = messages[i - 1];
                const showTimestamp = !prev || new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <p className="text-center text-[11px] my-3" style={{ color: C.gray500 }}>
                        {formatTimestamp(message.createdAt)}
                      </p>
                    )}
                    <MessageBubble message={message} />
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: `1px solid ${C.gray200}`, backgroundColor: C.white }}>
            {/* Quick replies */}
            <div className="flex gap-2 mb-3">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => void sendMessage(reply)}
                  disabled={isSending || !selectedPhoneNumber}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: C.gray100, color: C.gray900, border: `1px solid ${C.gray200}` }}
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Text input */}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); void sendMessage(draftMessage); }}
            >
              <input
                type="text"
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                placeholder="iMessage"
                disabled={!selectedPhoneNumber}
                className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-colors disabled:opacity-50"
                style={{ border: `1px solid ${C.gray300}`, color: C.gray900, backgroundColor: C.white }}
              />
              <button
                type="submit"
                disabled={isSending || !draftMessage.trim() || !selectedPhoneNumber}
                className="rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: C.primary }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: DashboardPulse }) {
  const isInbound = message.direction === 'inbound';   // volunteer → system → left
  const isSystem  = message.direction === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#E9E9EB', color: '#6B7280' }}>
          {message.body}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-0.5`}>
      <div
        className="max-w-[72%] px-4 py-2.5 text-sm leading-relaxed"
        style={{
          backgroundColor: isInbound ? '#E9E9EB' : C.bubbleOut,
          color: isInbound ? C.gray900 : C.white,
          borderRadius: isInbound
            ? '18px 18px 18px 4px'
            : '18px 18px 4px 18px',
        }}
      >
        {message.body}
      </div>
    </div>
  );
}
