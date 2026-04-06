import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { findSubstitutes, automatedReminders, complianceAgent } from '@/lib/inngest/functions';

// Create an API that serves zero-dependency functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    findSubstitutes,
    automatedReminders,
    complianceAgent
  ],
});
