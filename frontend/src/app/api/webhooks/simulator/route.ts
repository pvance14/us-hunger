import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, text } = body;

    console.log(`[SMS SIMULATOR] Received message from ${from}: ${text}`);

    const normalizedText = text?.trim().toUpperCase();

    // Base logic for parsing shortcodes
    switch (normalizedText) {
      case 'YES':
        console.log(`=> Action: Confirm shift for ${from}`);
        // TODO: Update Supabase schedule record to 'confirmed'
        break;
      case 'NO':
        console.log(`=> Action: Cancel shift for ${from}`);
        // TODO: Update to 'cancelled' and maybe trigger Inngest search
        break;
      case 'SUB':
        console.log(`=> Action: Trigger sub search for ${from}`);
        // TODO: Create SubRequest and trigger Inngest workflow
        break;
      case 'HELP':
      case 'HUMAN':
        console.log(`=> Action: Escalate ${from} to 'needs_review'`);
        break;
      default:
        console.log(`=> Action: Unrecognized input from ${from}, flag for review.`);
        break;
    }

    return NextResponse.json({ success: true, parsed: normalizedText });
  } catch (error) {
    console.error(`[SMS SIMULATOR] Error processing webhook:`, error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
