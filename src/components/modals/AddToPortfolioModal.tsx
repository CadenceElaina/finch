import React, { useState } from "react";
import axios from "axios";
import { YH_API_HOST, YH_API_KEY, ENDPOINTS } from "../../config/api";
import "./AddToPortfolioModal.css";

const BASE = `https://${YH_API_HOST}`;
const headers = () => ({
  "X-RapidAPI-Key": YH_API_KEY,
  "X-RapidAPI-Host": YH_API_HOST,
});

interface AddToPortfolioModalProps {
  type?: "portfolio" | "watchlist";
  isOpen: boolean;
  listName: string;
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
  onClose,
  onSave,
}) => {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
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
    setValidating(true);
    setError("");
    try {
      const res = await axios.get(`${BASE}${ENDPOINTS.batchQuotes.path}`, {
        params: { region: "US", symbols: sym },
        headers: headers(),
      });
      const results = res.data?.quoteResponse?.result ?? [];
      if (results.length === 0 || !results[0]?.symbol) {
        setError(`Symbol "${sym}" not found`);
        setValidating(false);
        return false;
      }
      setSymbol(sym);
      setResolvedName(results[0]?.shortName ?? results[0]?.longName ?? sym);
      setValidated(true);
      setValidating(false);
      return true;
    } catch {
      setError("Could not validate symbol — try again");
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
            onBlur={() => { if (symbol.trim() && !validated) validateSymbol(symbol); }}
          />
        </div>
        {validating && (
          <div style={{ color: "var(--text-secondary, #999)", fontSize: "0.85rem", marginTop: 4 }}>
            Validating...
          </div>
        )}
        {error && (
          <div style={{ color: "#e53935", fontSize: "0.85rem", marginTop: 4 }}>{error}</div>
        )}
        {validated && resolvedName && (
          <div style={{ color: "#00c853", fontSize: "0.85rem", marginTop: 4 }}>
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

export default AddToPortfolioModal;
