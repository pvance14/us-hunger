type ErrorLike = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === 'object' && value !== null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isErrorLike(error)) {
    return fallback;
  }

  const message = typeof error.message === 'string' ? error.message : '';
  const details = typeof error.details === 'string' ? error.details : '';
  const hint = typeof error.hint === 'string' ? error.hint : '';
  const combined = [message, details, hint].filter(Boolean).join(' ').trim();

  if (details.includes('ECONNREFUSED') && details.includes('127.0.0.1:54321')) {
    return 'Could not reach local Supabase at 127.0.0.1:54321. Start Supabase and retry.';
  }

  if (details.includes('ENOTFOUND') && message.includes('fetch failed')) {
    return 'Could not reach the configured Supabase project. Check NEXT_PUBLIC_SUPABASE_URL in frontend/.env.local.';
  }

  if (message.includes('Invalid URL')) {
    return 'The Supabase URL is invalid. Check NEXT_PUBLIC_SUPABASE_URL in frontend/.env.local.';
  }

  if (process.env.NODE_ENV !== 'production' && combined) {
    return combined;
  }

  return fallback;
}
