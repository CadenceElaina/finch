import React from "react";
import NameModal from "./NameModal";

interface AddPortfolioProps {
  onCancel: () => void;
  onSave: (portfolioName: string) => void;
}

const AddPortfolioModal: React.FC<AddPortfolioProps> = ({
  onCancel,
  onSave,
}) => (
  <NameModal
    title="Create a new portfolio"
    placeholder="Portfolio name"
    onCancel={onCancel}
    onSave={onSave}
  />
);

export default AddPortfolioModal;
