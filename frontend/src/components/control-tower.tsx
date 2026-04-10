'use client';

import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DashboardAlert, DashboardPulse, DashboardSnapshot, DashboardStatCard } from '@/lib/types';

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  funnel: [],
  alerts: [],
  pulses: [],
};

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelative(value: string): string {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(elapsed / (1000 * 60)));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch('/api/dashboard', { cache: 'no-store' });
  const nextSnapshot = (await response.json()) as DashboardSnapshot | { error?: string };
  const errorMessage = 'error' in nextSnapshot && typeof nextSnapshot.error === 'string' ? nextSnapshot.error : '';

  if (!response.ok || errorMessage) {
    throw new Error(errorMessage || 'Unable to refresh the Control Tower snapshot.');
  }

  if (
    !(
      typeof nextSnapshot === 'object' &&
      nextSnapshot !== null &&
      'funnel' in nextSnapshot &&
      'alerts' in nextSnapshot &&
      'pulses' in nextSnapshot
    )
  ) {
    throw new Error('Unable to refresh the Control Tower snapshot.');
  }

  return nextSnapshot;
}

export function ControlTower() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(EMPTY_SNAPSHOT);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [takingOverAlertIds, setTakingOverAlertIds] = useState<string[]>([]);

  async function refreshDashboard() {
    try {
      const nextSnapshot = await fetchDashboardSnapshot();

      startTransition(() => {
        setSnapshot(nextSnapshot);
        setErrorMessage('');
        setIsLoading(false);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to refresh the Control Tower snapshot.';
      startTransition(() => {
        setErrorMessage(message);
        setIsLoading(false);
      });
    }
  }

  useEffect(() => {
    void refreshDashboard();

    const channel = supabase
      .channel('control-tower-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_events' }, () => {
        void refreshDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_requests' }, () => {
        void refreshDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        void refreshDashboard();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function handleTakeOver(alert: DashboardAlert) {
    if (alert.takenOver || takingOverAlertIds.includes(alert.id)) {
      return;
    }

    setTakingOverAlertIds((current) => [...current, alert.id]);
    setSnapshot((current) => ({
      ...current,
      alerts: current.alerts.map((currentAlert) =>
        currentAlert.id === alert.id ? { ...currentAlert, takenOver: true } : currentAlert,
      ),
    }));

    try {
      const response = await fetch('/api/dashboard/takeover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: alert.entityId,
          entityType: alert.entityType,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not take over this alert.');
      }

      await refreshDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not take over this alert.';

      setSnapshot((current) => ({
        ...current,
        alerts: current.alerts.map((currentAlert) =>
          currentAlert.id === alert.id ? { ...currentAlert, takenOver: false } : currentAlert,
        ),
      }));
      setErrorMessage(message);
    } finally {
      setTakingOverAlertIds((current) => current.filter((alertId) => alertId !== alert.id));
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">United Hunger MVP</p>
              <h1 className="mt-3 text-4xl font-heading font-semibold tracking-tight text-white">Control Tower</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Simulator-first volunteer coordination with live substitute outreach, reminder history, and
                coordinator escalation states.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/simulator"
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Open Volunteer Phone View
              </Link>
              <button
                type="button"
                onClick={() => void refreshDashboard()}
                className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Refresh Snapshot
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-heading font-medium text-white">Staffing Funnel</h2>
                <p className="mt-1 text-sm text-slate-400">Live counts pulled from the persisted simulator state.</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                {isLoading ? 'Loading' : 'Live'}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {snapshot.funnel.map((stat) => (
                <StatCard key={stat.title} stat={stat} />
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-rose-500/20 bg-rose-950/20 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-heading font-medium text-rose-200">Red Alerts</h2>
                <p className="mt-1 text-sm text-rose-100/70">Danger-zone cancellations, exhausted outreach, and HITL states.</p>
              </div>
              <Link
                href="/simulator"
                className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 transition hover:bg-rose-400/20"
              >
                Take Manual Action
              </Link>
            </div>

            <div className="mt-6 flex max-h-[26rem] flex-col gap-4 overflow-y-auto pr-1">
              {snapshot.alerts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                  No active escalations. Use the simulator to trigger `HELP`, a danger-zone `SUB`, or an exhausted search.
                </div>
              ) : (
                snapshot.alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    isTakingOver={takingOverAlertIds.includes(alert.id)}
                    onTakeOver={handleTakeOver}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-heading font-medium text-white">Live Pulse</h2>
              <p className="mt-1 text-sm text-slate-400">Every inbound, outbound, and system event captured by the simulator.</p>
            </div>
            <Link
              href="/simulator"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
            >
              Open Chatbox
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="max-h-[30rem] overflow-y-auto rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
              {snapshot.pulses.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm italic text-slate-400">
                  No message activity yet. The seeded demo data or simulator replies will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshot.pulses.map((pulse) => (
                    <PulseRow key={pulse.id} pulse={pulse} />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">Demo Checklist</p>
              <div className="mt-4 space-y-4 text-sm leading-6 text-cyan-50/90">
                <p>1. Open the Volunteer Phone View and choose Maya Driver. Send `SUB` to trigger standard auto-sub outreach.</p>
                <p>2. Switch to Ava Sub after the first offer appears, then send `YES` to resolve the open request.</p>
                <p>3. Choose Leo Driver and send `SUB` to demonstrate the danger-zone escalation path.</p>
                <p>4. Send free text or `HELP` from any volunteer to push an item into coordinator review.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ stat }: { stat: DashboardStatCard }) {
  const accent =
    stat.title === 'Confirmed'
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
      : stat.title === 'Unconfirmed'
        ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
        : stat.title === 'Unfilled'
          ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
          : 'border-white/10 bg-white/5 text-white';

  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-lg ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300/80">{stat.title}</p>
      <p className="mt-4 text-4xl font-heading font-semibold tracking-tight">{stat.value}</p>
    </div>
  );
}

function AlertCard({
  alert,
  isTakingOver,
  onTakeOver,
}: {
  alert: DashboardAlert;
  isTakingOver: boolean;
  onTakeOver: (alert: DashboardAlert) => Promise<void>;
}) {
  return (
    <div className="rounded-[1.5rem] border border-rose-400/25 bg-rose-950/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-rose-100">{alert.title}</p>
          <p className="mt-2 text-sm leading-6 text-rose-100/75">{alert.description}</p>
        </div>
        <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-100">
          {alert.severity}
        </span>
      </div>
      <p className="mt-4 text-xs font-mono text-rose-200/60">{formatRelative(alert.createdAt)}</p>
      <button
        type="button"
        disabled={alert.takenOver || isTakingOver}
        onClick={() => void onTakeOver(alert)}
        className="mt-4 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {alert.takenOver ? 'Coordinator Active' : isTakingOver ? 'Taking Over...' : 'Take Over'}
      </button>
    </div>
  );
}

function PulseRow({ pulse }: { pulse: DashboardPulse }) {
  const dotColor =
    pulse.requiresReview || pulse.messageType.includes('danger')
      ? 'bg-rose-400'
      : pulse.direction === 'inbound'
        ? 'bg-amber-400'
        : pulse.direction === 'outbound'
          ? 'bg-cyan-400'
          : 'bg-emerald-400';

  return (
    <div className="flex gap-4 rounded-[1.25rem] border border-white/5 bg-white/[0.03] p-4">
      <div className="pt-1 text-xs font-mono text-slate-500">{formatTime(pulse.createdAt)}</div>
      <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-slate-100">{pulse.body}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
          {pulse.volunteerName ? `${pulse.volunteerName} · ` : ''}
          {pulse.direction}
        </p>
      </div>
    </div>
  );
}
