'use client';

import Link from 'next/link';
import { startTransition, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { DashboardAlert, DashboardPulse, DashboardSnapshot, DashboardStatCard } from '@/lib/types';

// ─── Design tokens (Figma exact values) ────────────────────────────
const C = {
  primary: '#1B4B8A',
  success: '#3A8F6B',
  warning: '#F59E0B',
  danger:  '#DC3545',
  gray900: '#0F172A',
  gray800: '#212B36',
  gray700: '#454F5B',
  gray600: '#475569',
  gray500: '#919EAB',
  gray300: '#CBD5E1',
  gray200: '#E2E8F0',
  gray100: '#F1F5F9',
  white:   '#FFFFFF',
  lavender: '#D6E8FA',
  cardShadow: '0px 2px 4px rgba(13,23,33,0.08), 0px 1px 2px rgba(21,30,40,0.08)',
};

const EMPTY_SNAPSHOT: DashboardSnapshot = { funnel: [], alerts: [], pulses: [] };

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch('/api/dashboard', { cache: 'no-store' });
  const nextSnapshot = (await response.json()) as DashboardSnapshot | { error?: string };
  const errorMessage = 'error' in nextSnapshot && typeof nextSnapshot.error === 'string' ? nextSnapshot.error : '';
  if (!response.ok || errorMessage) throw new Error(errorMessage || 'Unable to refresh the Control Tower snapshot.');
  if (!(typeof nextSnapshot === 'object' && nextSnapshot !== null && 'funnel' in nextSnapshot && 'alerts' in nextSnapshot && 'pulses' in nextSnapshot)) {
    throw new Error('Unable to refresh the Control Tower snapshot.');
  }
  return nextSnapshot;
}

// ─── SVG Icons ──────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.gray500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.gray800} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}

function CheckCircleIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.29 3.86-8.57 14.9A2 2 0 0 0 3.43 22h17.14a2 2 0 0 0 1.71-3.14l-8.57-14.9a2 2 0 0 0-3.42 0Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function MoreVertical() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.gray500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}

function TrendingDownIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────
function DonutChart({
  confirmed, unconfirmed, unfilled, total,
}: { confirmed: number; unconfirmed: number; unfilled: number; total: number }) {
  const cx = 80, cy = 80, r = 58, strokeWidth = 20;
  const circ = 2 * Math.PI * r;
  const gap = total > 0 ? 4 : 0; // gap between segments in SVG units
  const numSegments = [confirmed, unconfirmed, unfilled].filter(v => v > 0).length;
  const totalArc = circ - gap * numSegments;

  const segments = total > 0
    ? [
        { value: confirmed,   color: C.success },
        { value: unconfirmed, color: C.warning },
        { value: unfilled,    color: C.danger  },
      ]
    : [];

  let accumulated = 0;
  const arcs = segments.map(({ value, color }) => {
    const len = (value / total) * totalArc;
    const offset = accumulated;
    accumulated += len + gap;
    return { len, offset, color, value };
  });

  return (
    <svg viewBox="0 0 160 160" width="160" height="160">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.gray200}
        strokeWidth={strokeWidth} transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Segments */}
      {total > 0 ? arcs.filter(a => a.value > 0).map(({ len, offset, color }, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${len} ${circ - len}`}
          strokeDashoffset={-offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )) : null}
      {/* Center label */}
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 22, fontWeight: 700, fill: C.gray900 }}>
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        style={{ fontSize: 11, fill: C.gray500 }}>
        shifts
      </text>
    </svg>
  );
}

// ─── Top Navbar ──────────────────────────────────────────────────────
function TopBar() {
  return (
    <header
      className="flex items-center justify-between px-8 py-3 bg-white flex-shrink-0"
      style={{ boxShadow: C.cardShadow }}
    >
      {/* Search */}
      <div className="flex items-center gap-3 rounded-md border px-4 py-2.5" style={{ borderColor: '#DFE3E8', width: 282 }}>
        <SearchIcon />
        <span className="text-sm" style={{ color: C.gray500 }}>Search</span>
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <div className="relative p-2.5 rounded-md hover:bg-slate-50 cursor-pointer">
          <BellIcon />
          <span
            className="absolute top-1.5 right-1.5 h-3 w-3 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: C.danger, fontSize: 7, fontWeight: 700 }}
          >
            {/* notification count placeholder */}
          </span>
        </div>

        {/* Avatar */}
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer"
          style={{ backgroundColor: C.primary }}
        >
          CT
        </div>
      </div>
    </header>
  );
}

// ─── Main component ──────────────────────────────────────────────────
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_events' }, () => { void refreshDashboard(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_requests' }, () => { void refreshDashboard(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => { void refreshDashboard(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  async function handleTakeOver(alert: DashboardAlert) {
    if (alert.takenOver || takingOverAlertIds.includes(alert.id)) return;
    setTakingOverAlertIds((c) => [...c, alert.id]);
    setSnapshot((c) => ({ ...c, alerts: c.alerts.map((a) => a.id === alert.id ? { ...a, takenOver: true } : a) }));
    try {
      const response = await fetch('/api/dashboard/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: alert.entityId, entityType: alert.entityType }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Could not take over this alert.');
      await refreshDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not take over this alert.';
      setSnapshot((c) => ({ ...c, alerts: c.alerts.map((a) => a.id === alert.id ? { ...a, takenOver: false } : a) }));
      setErrorMessage(message);
    } finally {
      setTakingOverAlertIds((c) => c.filter((id) => id !== alert.id));
    }
  }

  // Compute funnel values for donut
  const totalCard = snapshot.funnel.find((f) => f.title === 'Total Shifts');
  const confirmedCard = snapshot.funnel.find((f) => f.title === 'Confirmed');
  const unconfirmedCard = snapshot.funnel.find((f) => f.title === 'Unconfirmed');
  const unfilledCard = snapshot.funnel.find((f) => f.title === 'Unfilled');
  const totalVal = totalCard?.value ?? 0;
  const confirmedVal = confirmedCard?.value ?? 0;
  const unconfirmedVal = unconfirmedCard?.value ?? 0;
  const unfilledVal = unfilledCard?.value ?? 0;
  const confirmedPct = totalVal > 0 ? Math.round((confirmedVal / totalVal) * 100) : 0;
  const unconfirmedPct = totalVal > 0 ? Math.round((unconfirmedVal / totalVal) * 100) : 0;
  const unfilledPct = totalVal > 0 ? Math.round((unfilledVal / totalVal) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>
      <TopBar />

      {/* Alert strip */}
      <AnimatePresence>
        {snapshot.alerts.length > 0 && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="px-8 py-2 flex items-center gap-3 flex-wrap"
            style={{ backgroundColor: '#FFF1F2', borderBottom: `1px solid #FECDD3` }}
          >
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: C.danger }}>
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: C.danger }} />
              {snapshot.alerts.length} Alert{snapshot.alerts.length !== 1 ? 's' : ''}
            </span>
            <div className="flex flex-wrap gap-2">
              {snapshot.alerts.map((alert) => (
                <AlertPill key={alert.id} alert={alert} isTakingOver={takingOverAlertIds.includes(alert.id)} onTakeOver={handleTakeOver} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purple page header */}
      <div className="px-8 py-5 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: C.primary }}>
        <h1 className="text-white text-2xl font-bold" style={{ letterSpacing: '-0.5px' }}>Dashboard</h1>
        <button
          type="button"
          onClick={() => void refreshDashboard()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: C.white, color: C.primary }}
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="flex-1 px-8 py-6 flex flex-col gap-5">
        {errorMessage && (
          <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#FECDD3', backgroundColor: '#FFF1F2', color: C.danger }}>
            {errorMessage}
          </div>
        )}

        {/* Top row: Shift Status donut + 2x2 stat cards */}
        <div className="flex gap-5">
          {/* Shift Status donut card */}
          <div className="rounded-lg bg-white p-5 flex flex-col" style={{ boxShadow: C.cardShadow, width: 400, flexShrink: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium" style={{ color: C.gray900 }}>Shift Status</h2>
              <MoreVertical />
            </div>

            <div className="flex items-center gap-6">
              {isLoading ? (
                <div className="h-40 w-40 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: C.gray100 }} />
              ) : (
                <div className="flex-shrink-0">
                  <DonutChart confirmed={confirmedVal} unconfirmed={unconfirmedVal} unfilled={unfilledVal} total={totalVal} />
                </div>
              )}
              <div className="flex flex-col gap-4 flex-1">
                {[
                  { label: 'Confirmed',   pct: confirmedPct,   color: C.success, bg: '#E0F2EC' },
                  { label: 'Unconfirmed', pct: unconfirmedPct, color: C.warning, bg: '#FEF3C7' },
                  { label: 'Unfilled',    pct: unfilledPct,    color: C.danger,  bg: '#FFF1F2' },
                ].map(({ label, pct, color, bg }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: C.gray700 }}>{label}</span>
                      <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-dm-sans)', color }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full w-full" style={{ backgroundColor: bg }}>
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2x2 stat cards */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : snapshot.funnel.map((stat) => <FunnelCard key={stat.title} stat={stat} />)
            }
          </div>
        </div>

        {/* Needs Attention + Outreach Suggestions — side by side */}
        <div className="flex gap-5">

        {/* Needs Attention table */}
        <div className="flex-1 rounded-lg bg-white overflow-hidden" style={{ boxShadow: C.cardShadow }}>
          <div className="px-4 py-4" style={{ borderBottom: `1px solid ${C.gray100}` }}>
            <div className="flex items-center gap-2">
              <span className="text-base" style={{ color: C.danger }}>⚠</span>
              <h2 className="text-base font-semibold" style={{ color: C.gray900 }}>Needs Attention</h2>
            </div>
            <p className="text-xs mt-0.5" style={{ color: C.gray500 }}>
              These shifts couldn&apos;t be resolved automatically — a coordinator needs to step in.
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: C.gray100, borderTop: `1px solid ${C.gray200}`, borderBottom: `1px solid ${C.gray200}` }}>
                {['What happened', 'Reason', 'Coordinator', 'Action'].map((col, i) => (
                  <th key={col} className={`px-4 py-3 text-sm font-medium ${i === 3 ? 'text-right' : 'text-left'}`}
                    style={{ color: '#1E293B', letterSpacing: '-0.28px' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                    {[140, 80, 70, 90].map((w, j) => (
                      <td key={j} className={`px-4 py-4 ${j === 3 ? 'text-right' : ''}`}>
                        <div className={`h-3 rounded animate-pulse ${j === 3 ? 'ml-auto' : ''}`}
                          style={{ width: w, backgroundColor: C.gray100 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : snapshot.alerts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm italic" style={{ color: C.gray500 }}>
                    No shifts need attention right now — automation is handling everything.
                  </td>
                </tr>
              ) : (
                snapshot.alerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert}
                    isTakingOver={takingOverAlertIds.includes(alert.id)} onTakeOver={handleTakeOver} />
                ))
              )}
            </tbody>
          </table>
          <div className="border-t px-4 py-3 text-center" style={{ borderColor: C.gray200 }}>
            <Link href="/simulator" className="text-sm font-medium" style={{ color: C.primary }}>
              Open Simulator →
            </Link>
          </div>
        </div>

        {/* Outreach Suggestions */}
        <div className="w-80 shrink-0">
          <OutreachSuggestions snapshot={snapshot} isLoading={isLoading} />
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel Card (stat card) ─────────────────────────────────────────
function FunnelCard({ stat }: { stat: DashboardStatCard }) {
  const prevValueRef = useRef(stat.value);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (prevValueRef.current !== stat.value) {
      prevValueRef.current = stat.value;
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(t);
    }
  }, [stat.value]);

  const iconEl =
    stat.title === 'Confirmed' ? <CheckCircleIcon color={C.success} /> :
    stat.title === 'Unconfirmed' ? <ClockIcon /> :
    stat.title === 'Unfilled' ? <AlertIcon /> :
    <BriefcaseIcon />;

  const subLabel =
    stat.title === 'Confirmed' ? 'staffed' :
    stat.title === 'Unconfirmed' ? 'pending reply' :
    stat.title === 'Unfilled' ? 'needs attention' :
    'this period';

  return (
    <motion.div
      animate={pulsing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg bg-white p-6 flex flex-col justify-between"
      style={{ boxShadow: C.cardShadow, minHeight: 140 }}
    >
      <div className="flex items-start justify-between">
        <p className="text-base font-medium" style={{ color: C.gray800 }}>{stat.title}</p>
        <div className="rounded-md p-2 flex-shrink-0" style={{ backgroundColor: C.lavender }}>
          {iconEl}
        </div>
      </div>
      <div className="flex flex-col gap-1 mt-3">
        <p className="text-5xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-dm-sans)', color: '#161C24', letterSpacing: '-0.84px', lineHeight: '1' }}>
          {stat.value}
        </p>
        <p className="text-xs" style={{ color: C.gray500 }}>
          <span className="font-bold" style={{ color: C.gray700 }}>{stat.value}</span>{' '}
          <span>{subLabel}</span>
        </p>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg bg-white p-6 animate-pulse" style={{ boxShadow: C.cardShadow, minHeight: 140 }}>
      <div className="flex items-start justify-between">
        <div className="h-4 w-24 rounded" style={{ backgroundColor: C.gray100 }} />
        <div className="h-8 w-8 rounded-md" style={{ backgroundColor: C.gray100 }} />
      </div>
      <div className="mt-4 h-12 w-16 rounded" style={{ backgroundColor: C.gray100 }} />
      <div className="mt-2 h-3 w-20 rounded" style={{ backgroundColor: C.gray100 }} />
    </div>
  );
}

// ─── Alert table row ─────────────────────────────────────────────────
function AlertRow({
  alert, isTakingOver, onTakeOver,
}: { alert: DashboardAlert; isTakingOver: boolean; onTakeOver: (a: DashboardAlert) => Promise<void> }) {
  const isDanger = alert.title.toLowerCase().includes('danger');
  const isExhausted = alert.title.toLowerCase().includes('exhausted');

  const badgeBg = isDanger ? C.danger : isExhausted ? C.warning : C.primary;
  const badgeText = isDanger ? 'Danger Zone' : isExhausted ? 'Exhausted' : 'Review';

  return (
    <tr style={{ borderBottom: `1px solid ${C.gray100}` }}>
      <td className="px-4 py-4 text-sm font-medium" style={{ color: C.gray900 }}>{alert.title}</td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: badgeBg, borderRadius: 2 }}>
          {badgeText}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: alert.takenOver ? C.success : C.danger }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: alert.takenOver ? C.success : C.danger, ...(alert.takenOver ? {} : { animation: 'pulse 1.5s infinite' }) }} />
          {alert.takenOver ? 'Taken Over' : 'Open'}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          disabled={alert.takenOver || isTakingOver}
          onClick={() => void onTakeOver(alert)}
          className="text-xs font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: C.primary }}
        >
          {alert.takenOver ? 'Active ✓' : isTakingOver ? 'Taking over…' : 'Take Over →'}
        </button>
      </td>
    </tr>
  );
}

// ─── Alert pill (strip) ──────────────────────────────────────────────
function AlertPill({
  alert, isTakingOver, onTakeOver,
}: { alert: DashboardAlert; isTakingOver: boolean; onTakeOver: (a: DashboardAlert) => Promise<void> }) {
  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs bg-white"
      style={{ borderColor: '#FECDD3' }}>
      <span className="font-semibold truncate max-w-[180px]" style={{ color: C.danger }}>{alert.title}</span>
      <span style={{ color: '#FECDD3' }}>·</span>
      <button
        type="button"
        disabled={alert.takenOver || isTakingOver}
        onClick={() => void onTakeOver(alert)}
        className="font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: C.primary }}
      >
        {alert.takenOver ? 'Active ✓' : isTakingOver ? 'Taking over…' : 'Take Over →'}
      </button>
    </div>
  );
}

// ─── Outreach Suggestions ────────────────────────────────────────────
function OutreachSuggestions({ snapshot, isLoading }: { snapshot: DashboardSnapshot; isLoading: boolean }) {
  if (isLoading) return null;

  const total = snapshot.funnel.find((f) => f.title === 'Total Shifts')?.value ?? 0;
  const unconfirmed = snapshot.funnel.find((f) => f.title === 'Unconfirmed')?.value ?? 0;
  const unfilled = snapshot.funnel.find((f) => f.title === 'Unfilled')?.value ?? 0;
  const openAlerts = snapshot.alerts.filter((a) => !a.takenOver).length;

  type Suggestion = { icon: string; text: string; action: string; urgent: boolean };
  const suggestions: Suggestion[] = [];

  if (unfilled > 0) {
    suggestions.push({
      icon: '📲',
      text: `${unfilled} shift${unfilled !== 1 ? 's' : ''} ${unfilled !== 1 ? 'are' : 'is'} unfilled with no volunteer assigned.`,
      action: 'Reach out to available substitutes now — the longer you wait, the harder it is to fill.',
      urgent: true,
    });
  }

  if (unconfirmed > 0 && total > 0) {
    const pct = Math.round((unconfirmed / total) * 100);
    suggestions.push({
      icon: '📩',
      text: `${unconfirmed} volunteer${unconfirmed !== 1 ? 's' : ''} (${pct}% of shifts) haven't confirmed yet.`,
      action: 'A short reminder text or call often gets a quick response.',
      urgent: pct > 30,
    });
  }

  if (openAlerts > 0) {
    suggestions.push({
      icon: '🙋',
      text: `${openAlerts} situation${openAlerts !== 1 ? 's' : ''} in the "Needs Attention" panel ${openAlerts !== 1 ? 'are' : 'is'} waiting for a coordinator.`,
      action: 'Claim the ones you can handle so the team isn\'t duplicating effort.',
      urgent: true,
    });
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-lg px-5 py-4 flex items-center gap-3" style={{ backgroundColor: '#EDF7F2', border: `1px solid #C6E8D9` }}>
        <span className="text-xl">✅</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#2E7057' }}>All clear — no outreach needed right now.</p>
          <p className="text-xs mt-0.5" style={{ color: '#3A8F6B' }}>All shifts are covered and confirmed. Check back before the next shift window opens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white overflow-hidden" style={{ boxShadow: C.cardShadow }}>
      <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.gray100}` }}>
        <span className="text-sm">💡</span>
        <h2 className="text-sm font-semibold" style={{ color: C.gray900 }}>Outreach Suggestions</h2>
        <span className="text-xs ml-1" style={{ color: C.gray500 }}>— based on today&apos;s staffing data</span>
      </div>
      <div className="divide-y" style={{ borderColor: C.gray100 }}>
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4">
            <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: C.gray900 }}>{s.text}</p>
              <p className="text-xs mt-0.5" style={{ color: C.gray600 }}>{s.action}</p>
            </div>
            {s.urgent && (
              <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                Urgent
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pulse row (activity log) ────────────────────────────────────────
