import { describe, it, expect, beforeEach } from "vitest";
import {
  getCreditsRemaining,
  getMaxCredits,
  getCreditsUsed,
  hasCredits,
  useCredit,
} from "./aiCredits";

const STORAGE_KEY = "finch_ai_credits";

describe("aiCredits", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with 10 credits remaining", () => {
    expect(getCreditsRemaining()).toBe(10);
    expect(getCreditsUsed()).toBe(0);
    expect(hasCredits()).toBe(true);
  });

  it("getMaxCredits returns 10", () => {
    expect(getMaxCredits()).toBe(10);
  });

  it("useCredit decrements remaining credits", () => {
    expect(useCredit()).toBe(true);
    expect(getCreditsRemaining()).toBe(9);
    expect(getCreditsUsed()).toBe(1);
  });

  it("returns false after all 10 credits are used", () => {
    for (let i = 0; i < 10; i++) {
      expect(useCredit()).toBe(true);
    }
    expect(useCredit()).toBe(false);
    expect(getCreditsRemaining()).toBe(0);
    expect(hasCredits()).toBe(false);
  });

  it("resets credits on a new day", () => {
    // Use 5 credits
    for (let i = 0; i < 5; i++) useCredit();
    expect(getCreditsRemaining()).toBe(5);

    // Simulate a new day by writing yesterday's date into localStorage
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: `${y}-${m}-${d}`, used: 5 })
    );

    // Should reset to full credits
    expect(getCreditsRemaining()).toBe(10);
    expect(getCreditsUsed()).toBe(0);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(getCreditsRemaining()).toBe(10);
  });

  it("handles missing localStorage gracefully", () => {
    localStorage.removeItem(STORAGE_KEY);
    expect(getCreditsRemaining()).toBe(10);
  });

  it("persists credits across reads", () => {
    useCredit();
    useCredit();
    useCredit();
    // Re-read from localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const data = JSON.parse(raw!);
    expect(data.used).toBe(3);
  });
});
