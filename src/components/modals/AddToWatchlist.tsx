import React, { useState } from "react";
import { IoMdAddCircleOutline } from "react-icons/io";
import "./AddToPortfolioModal.css";

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

  const addSymbol = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setShowSymbolInput(false);
    }
  };

  const handleAddToList = () => {
    setShowSymbolInput(false);
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
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={addSymbol}
            />
            <button className="addToPortfolio-button" onClick={handleAddToList}>
              <IoMdAddCircleOutline size={24} />
            </button>
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
