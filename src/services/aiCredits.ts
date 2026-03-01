/**
 * AI Credits — daily usage limiter for Gemini API calls.
 * 10 credits per day per user, resets at midnight local time.
 * Stored in localStorage so it persists across page reloads.
 */

const STORAGE_KEY = "finch_ai_credits";
const MAX_DAILY_CREDITS = 10;

interface CreditData {
  /** ISO date string (YYYY-MM-DD) of the last usage day */
  date: string;
  /** Number of credits used today */
  used: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCredits(): CreditData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), used: 0 };
    const data = JSON.parse(raw) as CreditData;
    // Reset if it's a new day
    if (data.date !== today()) {
      return { date: today(), used: 0 };
    }
    return data;
  } catch {
    return { date: today(), used: 0 };
  }
}

function writeCredits(data: CreditData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Get the number of credits remaining today */
export function getCreditsRemaining(): number {
  const data = readCredits();
  return Math.max(0, MAX_DAILY_CREDITS - data.used);
}

/** Get total daily limit */
export function getMaxCredits(): number {
  return MAX_DAILY_CREDITS;
}

/** Get credits used today */
export function getCreditsUsed(): number {
  return readCredits().used;
}

/** Check if there are credits available */
export function hasCredits(): boolean {
  return getCreditsRemaining() > 0;
}

/**
 * Consume one credit. Returns true if successful, false if at limit.
 * Call this BEFORE making a Gemini API call.
 */
export function useCredit(): boolean {
  const data = readCredits();
  if (data.used >= MAX_DAILY_CREDITS) return false;
  data.used += 1;
  data.date = today();
  writeCredits(data);
  return true;
}
