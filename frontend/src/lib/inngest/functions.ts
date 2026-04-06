// @ts-nocheck
import { inngest } from './client';
import { supabase } from '../supabase';

export const findSubstitutes = inngest.createFunction(
  { id: 'find-substitutes', event: 'shift/sub.requested' },
  async ({ event, step }) => {
    const { subRequestId, scheduleId, shiftId, volunteerId, scheduledDate } = event.data;

    // 1. Acknowledge and Danger Zone Check
    await step.run('log-request-and-check-danger-zone', async () => {
      console.log(`[INNGEST] Starting sub search for shift: ${shiftId}, schedule: ${scheduleId}`);
      
      const hoursUntilShift = (new Date(scheduledDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
      if (hoursUntilShift <= 4 && hoursUntilShift > 0) {
        console.log(`[ALERT] Danger zone! Cancelled within 4 hours. Escalate to staff dashboard!`);
        // We'll update the scheduled status to 'danger_zone' or similar so it pops up in 'Red Alert'
      }
    });

    // 2. Fetch waitlist limit 5
    const candidates = await step.run('fetch-candidates', async () => {
      // Find active volunteers who are NOT scheduled for the same shift or day (simplified for now)
      // MVP: just pick up to 5 active volunteers who are not the requester
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, first_name, last_name, phone_number')
        .eq('status', 'active')
        .neq('id', volunteerId)
        .limit(5);
        
      if (error) {
        console.error('Error fetching candidates', error);
        return [];
      }
      return data || [];
    });

    // 3. Ping sequentially
    for (const candidate of candidates) {
      await step.run(`ping-${candidate.id}`, async () => {
        console.log(`[MOCK SMS] Pinging ${candidate.first_name} ${candidate.last_name} (${candidate.phone_number}) for sub shift ${shiftId}...`);
      });
      // Wait 15 minutes before pinging next candidate. 
      // Using '15m' here but during local testing it actually sleeps for 15m.
      await step.sleep(`wait-for-response-${candidate.id}`, '15m');
      
      // In a real app we'd wait for an event, e.g. step.waitForEvent('shift/sub.accepted', { timeout: '15m' })
      // For MVP prototype we simulate the sequential delay.
    }

    await step.run('exhausted-sub-search', async () => {
      console.log(`[ALERT] Exhausted substitute list for schedule ${scheduleId}`);
      await supabase.from('sub_requests').update({ status: 'failed' }).eq('id', subRequestId);
    });

    return { status: 'exhausted' };
  }
);

export const automatedReminders = inngest.createFunction(
  { id: 'automated-reminders', cron: '0 * * * *' }, // Run every hour
  async ({ step }) => {
    await step.run('process-reminders', async () => {
      console.log('[INNGEST] Running automated reminders task...');
      
      const { data: schedules } = await supabase
        .from('schedules')
        .select('id, scheduled_date, volunteers(phone_number, first_name), shifts(name)')
        .eq('status', 'scheduled');

      if (!schedules) return;

      const now = new Date();

      for (const sched of schedules) {
        const hoursUntilShift = (new Date(sched.scheduled_date).getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilShift > 71 && hoursUntilShift <= 72) {
           console.log(`[MOCK SMS] T-72 Reminder to ${sched.volunteers?.first_name} (${sched.volunteers?.phone_number}): Are you still able to make the ${sched.shifts?.name} shift? Reply YES to confirm, or SUB to find a replacement.`);
        } else if (hoursUntilShift > 23 && hoursUntilShift <= 24) {
           console.log(`[MOCK SMS] T-24 Logistics to ${sched.volunteers?.first_name} (${sched.volunteers?.phone_number}): Tomorrow is your ${sched.shifts?.name} shift. Remember: Please bring the blue bags. Park in the North lot. Instructions: ${sched.shifts?.instructions || 'None'}`);
        } else if (hoursUntilShift > 1 && hoursUntilShift <= 2) {
           console.log(`[MOCK SMS] T-2 Nudge to ${sched.volunteers?.first_name} (${sched.volunteers?.phone_number}): Your shift ${sched.shifts?.name} starts in 2 hours! Thank you for your service and drive safely.`);
        }
      }
    });

    return { success: true };
  }
);

export const complianceAgent = inngest.createFunction(
  { id: 'compliance-agent', cron: '0 8 * * *' }, // Run every day at 8 AM
  async ({ step }) => {
    await step.run('check-compliance', async () => {

      console.log('[INNGEST] Running compliance agent...');
      
      const { data: volunteers, error } = await supabase
        .from('volunteers')
        .select('id, first_name, last_name, phone_number, insurance_expiry')
        .eq('status', 'active');
        
      if (error || !volunteers) {
        console.error('Failed to fetch volunteers for compliance', error);
        return;
      }

      const now = new Date();
      
      for (const vol of volunteers) {
        if (!vol.insurance_expiry) continue;
        
        const expiryDate = new Date(vol.insurance_expiry);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry === 30) {
          console.log(`[MOCK SMS] COMPLIANCE: Hi ${vol.first_name}, your vehicle insurance on file expires in 30 days! Please upload a new copy on your dashboard to stay active.`);
        } else if (daysUntilExpiry === 7) {
          console.log(`[MOCK SMS] COMPLIANCE: URGENT ${vol.first_name}, your vehicle insurance expires in 7 days. Action is required.`);
        } else if (daysUntilExpiry <= 0) {
           console.log(`[MOCK SMS] COMPLIANCE: ${vol.first_name}, your insurance has expired. You have been placed on inactive status.`);
           // For MVP, we mock the deactivation
           // await supabase.from('volunteers').update({ status: 'inactive' }).eq('id', vol.id);
        }
      }
    });

    return { success: true };
  }
);
