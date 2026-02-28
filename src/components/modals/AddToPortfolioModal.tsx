import React, { useState } from "react";
import { IoMdAddCircleOutline } from "react-icons/io";
import "./AddToPortfolioModal.css";

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
}//

const AddToPortfolioModal: React.FC<AddToPortfolioModalProps> = ({
  isOpen,
  listName,
  onClose,
  onSave,
}) => {
  const [symbol, setSymbol] = useState("");
  const [showSymbolInput, setShowSymbolInput] = useState(true);
  const [quantity, setQuantity] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);

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
    onSave(symbol, quantity, purchaseDate, purchasePrice);
    onClose();
  };

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
              <div className="addToPortfolio-row">
                <span>Quantity:</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
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
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
                  min={0}
                />
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

export default AddToPortfolioModal;
