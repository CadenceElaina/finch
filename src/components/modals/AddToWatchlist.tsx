import React, { useState } from "react";
import { IoMdAddCircleOutline } from "react-icons/io";
import axios from "axios";
import { YH_API_HOST, YH_API_KEY, ENDPOINTS } from "../../config/api";
import "./AddToPortfolioModal.css";

const BASE = `https://${YH_API_HOST}`;
const headers = () => ({
  "X-RapidAPI-Key": YH_API_KEY,
  "X-RapidAPI-Host": YH_API_HOST,
});

interface AddToWatchlistModalProps {
  isOpen: boolean;
  listName: string;
  onClose: () => void;
  onSave: (symbol: string) => void;
} //

const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({
  isOpen,
  listName,
  onClose,
  onSave,
}) => {
  const [symbol, setSymbol] = useState("");
  const [showSymbolInput, setShowSymbolInput] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

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
      setValidating(false);
      return true;
    } catch {
      setError("Could not validate symbol — try again");
      setValidating(false);
      return false;
    }
  };

  const addSymbol = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const ok = await validateSymbol(symbol);
      if (ok) setShowSymbolInput(false);
    }
  };

  const handleAddToList = async () => {
    const ok = await validateSymbol(symbol);
    if (ok) setShowSymbolInput(false);
  };

  const onCancel = () => {
    onClose();
  };

  const onSaveClick = () => {
    onSave(symbol);
    onClose();
  };
//
  return (
    <div className={`addToPortfolio-container ${isOpen ? "open" : ""}`}>
      <div className="addToPortfolio-content">
        <div role="heading">Add to {listName}</div>
        {showSymbolInput ? (
          <div className="addToPortfolio-input">
            <input
              placeholder="Type an investment symbol"
              value={symbol}
              onChange={(e) => { setSymbol(e.target.value); setError(""); }}
              onKeyDown={addSymbol}
            />
            <button className="addToPortfolio-button" onClick={handleAddToList} disabled={validating}>
              {validating ? "..." : <IoMdAddCircleOutline size={24} />}
            </button>
            {error && <div style={{ color: "red", fontSize: "0.85rem", marginTop: 4 }}>{error}</div>}
          </div>
        ) : (
          <>
            <div>
              <div className="addToPortfolio-row">
                <span>Symbol:</span>
                <span>{symbol}</span>
              </div>
            </div>
          </>
        )}
        <div className="addToPortfolio-buttons">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onSaveClick}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AddToWatchlistModal;
