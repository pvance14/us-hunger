import { NextResponse } from 'next/server';
import { buildDashboardSnapshot } from '@/lib/server/mvp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await buildDashboardSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('[DASHBOARD API] Failed to build dashboard snapshot', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
