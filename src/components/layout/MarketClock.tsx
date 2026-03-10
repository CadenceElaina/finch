import { useState, useEffect } from "react";
import { isHoliday } from "../../pages/quote/quoteUtils";
import "./MarketClock.css";

type MarketPhase =
  | "open"
  | "pre-market"
  | "after-hours"
  | "after-hours-trading"
  | "closed-weekend"
  | "closed-holiday"
  | "closed";

interface MarketState {
  phase: MarketPhase;
  label: string;
}

function getEasternNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
}

function computeMarketState(now: Date): MarketState {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();

  if (isHoliday(now))
    return { phase: "closed-holiday", label: "Closed — Holiday" };
  if (day === 0 || day === 6)
    return { phase: "closed-weekend", label: "Closed — Weekend" };
  if (mins >= 570 && mins < 960)
    return { phase: "open", label: "Market Open" };
  if (mins >= 975 && mins <= 1110)
    return { phase: "after-hours-trading", label: "After-Hours Trading" };
  if (mins >= 960)
    return { phase: "after-hours", label: "After-Hours" };
  return { phase: "pre-market", label: "Pre-Market" };
}

export default function MarketClock() {
  const [eastern, setEastern] = useState(getEasternNow);
  const [state, setState] = useState<MarketState>(() =>
    computeMarketState(getEasternNow())
  );

  useEffect(() => {
    const id = setInterval(() => {
      const now = getEasternNow();
      setEastern(now);
      setState(computeMarketState(now));
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  const timeStr = eastern.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const isOpen = state.phase === "open";
  const isExtended =
    state.phase === "pre-market" || state.phase === "after-hours-trading";

  return (
    <div className="market-clock">
      <span className="market-clock__time">{timeStr}</span>
      <span className="market-clock__sep">·</span>
      <span
        className={`market-clock__status ${
          isOpen
            ? "market-clock__status--open"
            : isExtended
            ? "market-clock__status--extended"
            : "market-clock__status--closed"
        }`}
      >
        <span className="market-clock__dot" />
        {state.label}
      </span>
    </div>
  );
}
