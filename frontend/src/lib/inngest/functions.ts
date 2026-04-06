// @ts-nocheck
import { inngest } from './client';

export const findSubstitutes = inngest.createFunction(
  { id: 'find-substitutes', event: 'shift/sub.requested' },
  async ({ event, step }) => {
    // 1. Acknowledge receipt
    await step.run('log-request', async () => {
      console.log(`Starting sub search for shift: ${event.data.shiftId}`);
    });

    // 2. Fetch waitlist (Stub)
    const candidates = await step.run('fetch-candidates', async () => {
      return [{ id: 'vol_1', name: 'Alice' }, { id: 'vol_2', name: 'Bob' }];
    });

    // 3. Ping sequentially (Stub)
    for (const candidate of candidates) {
      await step.run(`ping-${candidate.id}`, async () => {
        console.log(`Pinging ${candidate.name} to see if they can sub...`);
        // Normally: send message via Simulator or Twilio
      });
      // Wait 15 minutes before pinging next candidate
      await step.sleep('wait-for-response', '15m');
    }

    return { status: 'exhausted' };
  }
);
