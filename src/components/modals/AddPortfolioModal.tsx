import React, { useState } from "react";
import CustomButton from "../CustomButton";
import "./AddPortfolio.css";
import ModalBackdrop from "./ModalBackdrop";

interface AddPortfolioProps {
  onCancel: () => void;
  onSave: (portfolioName: string) => void;
}

const AddPortfolioModal: React.FC<AddPortfolioProps> = ({
  onCancel,
  onSave,
}) => {
  const [portfolioName, setPortfolioName] = useState<string>("");
  const [isSaveDisabled, setIsSaveDisabled] = useState<boolean>(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPortfolioName(e.target.value);
    setIsSaveDisabled(e.target.value.trim() === "");
  };

  const handleClose = () => {
    onCancel();
  };

  const handleSave = () => {
    onSave(portfolioName);
  }; //

  return (
    <>
      <ModalBackdrop
        visible={true}
        onClick={handleClose}
        onBackdropClick={handleClose}
      />
      <div className="new-portfolio-modal visible">
        <div className="modal-header">
          <h3>Create a new portfolio</h3>
        </div>
        <div className="modal-content">
          <input
            type="text"
            placeholder="Portfolio name"
            value={portfolioName}
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

export default AddPortfolioModal;
