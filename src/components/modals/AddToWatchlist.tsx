import React, { useRef, useState } from "react";
import { ENDPOINTS, yhFetch, areProvidersImpaired } from "../../config/api";
import { cacheStorage } from "../../services/storage";
import { DEMO_QUOTES } from "../../data/demo";
import { isDemoActive } from "../../data/demo/demoState";
import "./AddToPortfolioModal.css";

interface AddToWatchlistModalProps {
  isOpen: boolean;
  listName: string;
  existingSymbols?: string[];
  onClose: () => void;
  onSave: (symbol: string) => void;
}

const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({
  isOpen,
  listName,
  existingSymbols = [],
  onClose,
  onSave,
}) => {
  const [symbol, setSymbol] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);
  const [resolvedName, setResolvedName] = useState("");
  const pendingValidation = useRef<Promise<boolean> | null>(null);

  const validateSymbol = async (raw: string): Promise<boolean> => {
    const sym = raw.trim().toUpperCase();
    if (!sym || !/^[A-Z0-9^.=\-]{1,12}$/.test(sym)) {
      setError("Invalid symbol format");
      return false;
    }

    if (existingSymbols.some((s) => s.toUpperCase() === sym)) {
      setError(`${sym} is already in ${listName}`);
      return false;
    }

    // Demo mode exists so the app can be browsed without spending upstream
    // quota, but yhFetch has no demo awareness — validation used to call the
    // live API even with demo mode on. Resolve against the fixtures instead.
    if (isDemoActive()) {
      const demo = DEMO_QUOTES[sym];
      if (!demo) {
        setError(`Symbol "${sym}" is not available in demo mode`);
        return false;
      }
      setSymbol(sym);
      setResolvedName(demo.name || sym);
      setValidated(true);
      return true;
    }

    // Check localStorage cache first — if we've seen this symbol before, accept it
    const cached = cacheStorage.get<{ symbol: string; name?: string; shortName?: string }>(
      `quote_${sym}`, 24 * 60 * 60_000 // 24h — generous TTL for validation
    );
    if (cached && cached.symbol) {
      setSymbol(sym);
      setResolvedName(cached.name ?? cached.shortName ?? sym);
      setValidated(true);
      return true;
    }

    setValidating(true);
    setError("");
    try {
      const res = await yhFetch(ENDPOINTS.batchQuotes.path, {
        region: "US",
        symbols: sym,
      });
      const results =
        res.data?.quoteResponse?.result ??
        res.data?.quoteSummary?.result ??
        [];
      const firstResult = results[0];
      const sym0 = firstResult?.symbol ?? firstResult?.price?.symbol;
      if (results.length === 0 || !sym0) {
        if (areProvidersImpaired()) {
          setError("Could not validate — API temporarily unavailable. Try again in a few minutes.");
        } else {
          setError(`Symbol "${sym}" not found`);
        }
        setValidating(false);
        return false;
      }
      setSymbol(sym);
      const r0 = firstResult?.price ?? firstResult;
      setResolvedName(r0?.shortName ?? r0?.longName ?? sym);
      setValidated(true);
      setValidating(false);
      return true;
    } catch {
      setError("Could not validate symbol — API temporarily unavailable. Try again in a few minutes.");
      setValidating(false);
      return false;
    }
  };

  /** Tracks the in-flight validation so Save can await it rather than race it. */
  const runValidation = (raw: string): Promise<boolean> => {
    const p = validateSymbol(raw);
    pendingValidation.current = p;
    void p.finally(() => {
      if (pendingValidation.current === p) pendingValidation.current = null;
    });
    return p;
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value);
    setError("");
    setValidated(false);
    setResolvedName("");
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      await runValidation(symbol);
    }
  };

  /**
   * Blurring the field starts validation, and clicking Save blurs it — so the
   * button used to disable itself (`validating`) in the same tick as the
   * click, swallowing it. The first Save press did nothing and the user had to
   * click again. Save now joins any in-flight validation instead.
   */
  const onSaveClick = async () => {
    const ok = validated
      ? true
      : await (pendingValidation.current ?? runValidation(symbol));
    if (!ok) return;
    onSave(symbol.trim().toUpperCase());
    onClose();
  };

  return (
    <div className={`addToPortfolio-container ${isOpen ? "open" : ""}`}>
      <div className="addToPortfolio-content">
        <div role="heading">Add to {listName}</div>
        <div className="addToPortfolio-input">
          <input
            placeholder="Enter a ticker symbol (e.g. AAPL)"
            value={symbol}
            onChange={handleSymbolChange}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (symbol.trim() && !validated) runValidation(symbol); }}
          />
        </div>
        {validating && (
          <div style={{ color: "var(--text-secondary, #999)", fontSize: "0.85rem", marginTop: 4 }}>
            Validating...
          </div>
        )}
        {error && (
          <div style={{ color: "var(--negative)", fontSize: "0.85rem", marginTop: 4 }}>{error}</div>
        )}
        {validated && resolvedName && (
          <div style={{ color: "var(--positive)", fontSize: "0.85rem", marginTop: 4 }}>
            {symbol.toUpperCase()} — {resolvedName}
          </div>
        )}
        <div className="addToPortfolio-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onSaveClick} disabled={!symbol.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToWatchlistModal;
