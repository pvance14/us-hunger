'use client';

import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';
import type { DashboardPulse, SimulatorConversation, SimulatorVolunteerOption } from '@/lib/types';

type SimulatorPayload = {
  volunteers: SimulatorVolunteerOption[];
  selectedPhoneNumber: string | null;
  conversation: SimulatorConversation;
};

const EMPTY_SIMULATOR_STATE: SimulatorPayload = {
  volunteers: [],
  selectedPhoneNumber: null,
  conversation: {
    volunteer: null,
    messages: [],
  },
};

const QUICK_REPLIES = ['YES', 'NO', 'SUB', 'HELP'];

function isSimulatorPayload(payload: unknown): payload is SimulatorPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'volunteers' in payload &&
    'selectedPhoneNumber' in payload &&
    'conversation' in payload
  );
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function fetchSimulatorPayload(phoneNumber?: string): Promise<SimulatorPayload> {
  const query = phoneNumber ? `?phone=${encodeURIComponent(phoneNumber)}` : '';
  const response = await fetch(`/api/simulator${query}`, { cache: 'no-store' });
  const payload = (await response.json()) as SimulatorPayload | { error?: string };
  const errorMessage = 'error' in payload && typeof payload.error === 'string' ? payload.error : '';

  if (!response.ok || errorMessage) {
    throw new Error(errorMessage || 'Unable to refresh the simulator view.');
  }

  if (!isSimulatorPayload(payload)) {
    throw new Error('Unable to refresh the simulator view.');
  }

  return payload;
}

export function PhoneSimulator() {
  const [simulatorState, setSimulatorState] = useState<SimulatorPayload>(EMPTY_SIMULATOR_STATE);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('');
  const [draftMessage, setDraftMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function refreshConversation(nextPhoneNumber?: string) {
    const phoneNumber = nextPhoneNumber ?? selectedPhoneNumber;
    try {
      const payload = await fetchSimulatorPayload(phoneNumber);
      const resolvedPhoneNumber = phoneNumber || payload.selectedPhoneNumber || '';

      startTransition(() => {
        setSimulatorState(payload);
        setSelectedPhoneNumber(resolvedPhoneNumber);
        setErrorMessage('');
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to refresh the simulator view.';
      startTransition(() => {
        setErrorMessage(message);
      });
    }
  }

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const payload = await fetchSimulatorPayload(selectedPhoneNumber || undefined);
        const resolvedPhoneNumber = selectedPhoneNumber || payload.selectedPhoneNumber || '';

        startTransition(() => {
          setSimulatorState(payload);
          setSelectedPhoneNumber(resolvedPhoneNumber);
          setErrorMessage('');
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to refresh the simulator view.';
        startTransition(() => {
          setErrorMessage(message);
        });
      }
    };

    void loadConversation();

    const interval = window.setInterval(() => {
      void loadConversation();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [selectedPhoneNumber]);

  async function sendMessage(message: string) {
    if (!selectedPhoneNumber || !message.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/webhooks/simulator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: selectedPhoneNumber,
          text: message.trim(),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'The simulator could not process that message.');
      }

      startTransition(() => {
        setDraftMessage('');
      });

      await refreshConversation(selectedPhoneNumber);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'The simulator could not process that message.';
      startTransition(() => {
        setErrorMessage(messageText);
      });
    } finally {
      setIsSending(false);
    }
  }

  const messages = simulatorState.conversation.messages;

  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">Simulator</p>
              <h1 className="mt-3 text-3xl font-heading font-semibold text-white">Volunteer Phone View</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                This is the MVP replacement for real SMS. Every action here runs through the same webhook and
                automation flow we would use with Twilio later.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
            >
              Back to Control Tower
            </Link>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
            <label htmlFor="volunteer" className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Active Phone
            </label>
            <select
              id="volunteer"
              value={selectedPhoneNumber}
              onChange={(event) => {
                const nextPhoneNumber = event.target.value;
                setSelectedPhoneNumber(nextPhoneNumber);
                void refreshConversation(nextPhoneNumber);
              }}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
            >
              {simulatorState.volunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.phoneNumber}>
                  {volunteer.name} · {volunteer.phoneNumber}
                </option>
              ))}
            </select>

            {simulatorState.conversation.volunteer ? (
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-50">
                <p className="font-semibold">{simulatorState.conversation.volunteer.name}</p>
                <p className="mt-1 text-cyan-100/75">
                  Status: {simulatorState.conversation.volunteer.status.replace('_', ' ')}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Quick Demo Paths</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
              <p>Maya Driver: send `SUB` to start the standard substitute workflow.</p>
              <p>Ava Sub: wait for the offer, then send `YES` to accept the route.</p>
              <p>Leo Driver: send `SUB` to trigger a danger-zone alert instead of auto-sub outreach.</p>
              <p>Any volunteer: send `HELP` or a full sentence to create a human-in-the-loop alert.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-heading font-medium text-white">Conversation History</h2>
              <p className="mt-1 text-sm text-slate-400">Persisted message events for the selected volunteer phone.</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshConversation()}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
            >
              Refresh Chat
            </button>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 flex min-h-[26rem] flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-5">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm italic text-slate-500">
                  No chat history yet for this phone number.
                </div>
              ) : (
                messages.map((message) => <MessageBubble key={message.id} message={message} />)
              )}
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => void sendMessage(reply)}
                    disabled={isSending || !selectedPhoneNumber}
                    className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <form
                className="mt-4 flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(draftMessage);
                }}
              >
                <input
                  type="text"
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Type a free-text message to trigger review..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                />
                <button
                  type="submit"
                  disabled={isSending || !draftMessage.trim() || !selectedPhoneNumber}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MessageBubble({ message }: { message: DashboardPulse }) {
  const isInbound = message.direction === 'inbound';
  const bubbleClass = isInbound
    ? 'ml-auto border-cyan-400/25 bg-cyan-400/10 text-cyan-50'
    : message.direction === 'system'
      ? 'mr-auto border-emerald-400/25 bg-emerald-400/10 text-emerald-50'
      : 'mr-auto border-white/10 bg-white/[0.06] text-white';

  return (
    <div className={`max-w-[85%] rounded-[1.5rem] border px-4 py-3 ${bubbleClass}`}>
      <p className="text-sm leading-6">{message.body}</p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/50">{formatTimestamp(message.createdAt)}</p>
    </div>
  );
}
