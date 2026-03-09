import React, { useState } from "react";
import { ENDPOINTS, yhFetch } from "../../config/api";
import { cacheStorage } from "../../services/storage";
import "./AddToPortfolioModal.css";

interface AddToWatchlistModalProps {
  isOpen: boolean;
  listName: string;
  onClose: () => void;
  onSave: (symbol: string) => void;
}

const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({
  isOpen,
  listName,
  onClose,
  onSave,
}) => {
  const [symbol, setSymbol] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);
  const [resolvedName, setResolvedName] = useState("");

  const validateSymbol = async (raw: string): Promise<boolean> => {
    const sym = raw.trim().toUpperCase();
    if (!sym || !/^[A-Z0-9^.=\-]{1,12}$/.test(sym)) {
      setError("Invalid symbol format");
      return false;
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
        setError(`Symbol "${sym}" not found`);
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

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value);
    setError("");
    setValidated(false);
    setResolvedName("");
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      await validateSymbol(symbol);
    }
  };

  const onSaveClick = async () => {
    if (!validated) {
      const ok = await validateSymbol(symbol);
      if (!ok) return;
    }
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
            onBlur={() => { if (symbol.trim() && !validated) validateSymbol(symbol); }}
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
          <button onClick={onSaveClick} disabled={validating || (!validated && !symbol.trim())}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToWatchlistModal;
