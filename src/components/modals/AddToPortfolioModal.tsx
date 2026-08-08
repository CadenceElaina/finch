import React, { useRef, useState } from "react";
import { ENDPOINTS, yhFetch, areProvidersImpaired } from "../../config/api";
import { cacheStorage } from "../../services/storage";
import "./AddToPortfolioModal.css";

interface AddToPortfolioModalProps {
  type?: "portfolio" | "watchlist";
  isOpen: boolean;
  listName: string;
  existingSymbols?: string[];
  onClose: () => void;
  onSave: (
    symbol: string,
    quantity: number,
    purchaseDate: string,
    purchasePrice: number
  ) => void;
}

const AddToPortfolioModal: React.FC<AddToPortfolioModalProps> = ({
  isOpen,
  listName,
  existingSymbols = [],
  onClose,
  onSave,
}) => {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(
    // Empty dates reached XIRR as `new Date("")` — Invalid Date — so default
    // to today and let the user adjust.
    () => new Date().toISOString().slice(0, 10)
  );
  const [purchasePrice, setPurchasePrice] = useState(0);
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

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value);
    setError("");
    setValidated(false);
    setResolvedName("");
  };

  /** Tracks the in-flight validation so Save can await it rather than race it. */
  const runValidation = (raw: string): Promise<boolean> => {
    const pending = validateSymbol(raw);
    pendingValidation.current = pending;
    void pending.finally(() => {
      if (pendingValidation.current === pending) pendingValidation.current = null;
    });
    return pending;
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
  /** Quantity and cost only appear once the ticker validates, so they can't be
   *  required up front — but a holding of 0 shares at $0.00 is meaningless and
   *  used to be saveable in a single click. */
  const detailsComplete = quantity > 0 && purchasePrice > 0 && !!purchaseDate;

  const onSaveClick = async () => {
    const ok = validated
      ? true
      : await (pendingValidation.current ?? runValidation(symbol));
    if (!ok) return;
    // First click validates and reveals the quantity/cost fields; saving waits
    // until they hold real values.
    if (!detailsComplete) return;
    onSave(symbol.trim().toUpperCase(), quantity, purchaseDate, purchasePrice);
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
        {validated && (
          <div style={{ marginTop: "0.75rem" }}>
            <div className="addToPortfolio-row">
              <span>Quantity:</span>
              <input
                type="number"
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                min={0}
                step="any"
              />
            </div>
            <div className="addToPortfolio-row">
              <span>Purchase Date:</span>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="addToPortfolio-row">
              <span>Purchase Price:</span>
              <input
                type="number"
                value={purchasePrice || ""}
                onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                min={0}
                step="0.01"
              />
            </div>
          </div>
        )}
        {validated && !detailsComplete && (
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 6 }}>
            Enter a quantity and purchase price to add this holding.
          </div>
        )}
        <div className="addToPortfolio-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onSaveClick} disabled={!symbol.trim() || (validated && !detailsComplete)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToPortfolioModal;
