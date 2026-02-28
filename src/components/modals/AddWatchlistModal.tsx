import React, { useState } from "react";
import CustomButton from "../CustomButton";
import "./AddPortfolio.css";
import ModalBackdrop from "./ModalBackdrop";

interface AddWatchlistProps {
  onCancel: () => void;
  onSave: (watchlistName: string) => void;
}

const AddWatchlistModal: React.FC<AddWatchlistProps> = ({
  onCancel,
  onSave,
}) => {
  const [watchlistName, setWatchlistName] = useState<string>("");
  const [isSaveDisabled, setIsSaveDisabled] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWatchlistName(e.target.value);
    setIsSaveDisabled(watchlistName.trim() === ""); // Disable Save if the input is empty or contains only spaces
  };

  const handleClose = () => {
    setIsVisible(false);
    onCancel();
  };

  const handleSave = () => {
    onSave(watchlistName);
  };

  return (
    <>
      <ModalBackdrop
        visible={isVisible}
        onClick={handleClose}
        onBackdropClick={handleClose}
      />
      <div className={`new-portfolio-modal ${isVisible ? "visible" : ""}`}>
        <div className="modal-header">
          <h3>Create a new watchlist</h3>
        </div>
        <div className="modal-content">
          <input
            type="text"
            placeholder="Watchlist name"
            value={watchlistName}
            onChange={handleInputChange}
          />
        </div>
        <div className="modal-footer">
          <CustomButton label="Cancel" onClick={() => handleClose()} />
          <CustomButton
            label="Save"
            onClick={handleSave}
            disabled={isSaveDisabled}
          />
        </div>
      </div>
    </>
  );
};

export default AddWatchlistModal;
