/**
 * XIRR — Extended Internal Rate of Return.
 *
 * Calculates the annualized return rate for irregular cash flows
 * using Newton's method. Accounts for the timing of each purchase,
 * unlike simple total return which ignores when money was invested.
 *
 * cashFlows: array of { date, amount }
 *   Negative amounts = money invested (outflow)
 *   Positive amounts = money received (inflow, e.g. current portfolio value)
 *
 * Returns the annual rate as a decimal (0.12 = 12%), or null if no solution.
 */
export function xirr(
  cashFlows: Array<{ date: Date; amount: number }>,
  guess = 0.1
): number | null {
  if (cashFlows.length < 2) return null;

  const d0 = cashFlows[0].date.getTime();
  const YEAR_MS = 365.25 * 86_400_000;

  // Convert dates to year fractions from the first cash flow
  const flows = cashFlows.map((cf) => ({
    amount: cf.amount,
    years: (cf.date.getTime() - d0) / YEAR_MS,
  }));

  // NPV as a function of rate
  const npv = (rate: number): number =>
    flows.reduce(
      (sum, f) => sum + f.amount / Math.pow(1 + rate, f.years),
      0
    );

  // Derivative of NPV (for Newton's method)
  const dnpv = (rate: number): number =>
    flows.reduce((sum, f) => {
      if (f.years === 0) return sum;
      return (
        sum -
        (f.years * f.amount) / Math.pow(1 + rate, f.years + 1)
      );
    }, 0);

  // Newton's method iteration
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const n = npv(rate);
    const d = dnpv(rate);
    if (Math.abs(d) < 1e-12) break;

    const next = rate - n / d;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = next;

    // Guard against divergence
    if (rate < -0.99 || rate > 100) return null;
  }

  // Accept if NPV is close enough to zero
  return Math.abs(npv(rate)) < 0.01 ? rate : null;
}
