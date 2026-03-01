import React, { useState, useEffect, useRef } from "react";
import CustomButton from "../CustomButton";
import "./AddPortfolio.css";
import ModalBackdrop from "./ModalBackdrop";

interface RenameModalProps {
  currentName: string;
  itemType: "portfolio" | "watchlist";
  onCancel: () => void;
  onSave: (newName: string) => void;
}

const RenameModal: React.FC<RenameModalProps> = ({
  currentName,
  itemType,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus and select text on mount
    inputRef.current?.select();
  }, []);

  const isSaveDisabled = name.trim() === "" || name.trim() === currentName;

  const handleSave = () => {
    if (!isSaveDisabled) {
      onSave(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <>
      <ModalBackdrop visible={true} onClick={onCancel} onBackdropClick={onCancel} />
      <div className="new-portfolio-modal visible">
        <div className="modal-header">
          <h3>Rename {itemType}</h3>
        </div>
        <div className="modal-content">
          <input
            ref={inputRef}
            type="text"
            placeholder={`${itemType === "portfolio" ? "Portfolio" : "Watchlist"} name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div className="modal-footer">
          <CustomButton label="Cancel" onClick={onCancel} />
          <CustomButton label="Save" onClick={handleSave} disabled={isSaveDisabled} />
        </div>
      </div>
    </>
  );
};

export default RenameModal;
