import { NextResponse } from 'next/server';
import { buildSimulatorConversation, listSimulatorVolunteers } from '@/lib/server/mvp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const selectedPhoneNumber = url.searchParams.get('phone');
    const volunteers = await listSimulatorVolunteers();
    const fallbackPhoneNumber = volunteers[0]?.phoneNumber ?? null;
    const phoneNumber = selectedPhoneNumber || fallbackPhoneNumber;

    const conversation = phoneNumber
      ? await buildSimulatorConversation(phoneNumber)
      : { volunteer: null, messages: [] };

    return NextResponse.json({
      volunteers,
      selectedPhoneNumber: phoneNumber,
      conversation,
    });
  } catch (error) {
    console.error('[SIMULATOR API] Failed to load simulator data', error);
    return NextResponse.json({ error: 'Failed to load simulator data' }, { status: 500 });
  }
}
