import { NextResponse } from 'next/server';
import { getApiErrorMessage } from '@/lib/server/api-errors';
import { takeCoordinatorOwnership } from '@/lib/server/mvp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TakeoverPayload = {
  entityId?: string;
  entityType?: 'schedule' | 'sub_request';
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TakeoverPayload;

    if (!body.entityId || !body.entityType) {
      return NextResponse.json({ error: 'Missing takeover target.' }, { status: 400 });
    }

    await takeCoordinatorOwnership({
      entityId: body.entityId,
      entityType: body.entityType,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DASHBOARD TAKEOVER API] Failed to take ownership', error);
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Could not take over this alert.') },
      { status: 500 },
    );
  }
}
