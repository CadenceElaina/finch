import React from "react";
import NameModal from "./NameModal";

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
}) => (
  <NameModal
    title={`Rename ${itemType}`}
    placeholder={`${itemType === "portfolio" ? "Portfolio" : "Watchlist"} name`}
    initialValue={currentName}
    // A rename to the existing name is a no-op, so keep Save inert for it.
    reject={(name) => name === currentName}
    onCancel={onCancel}
    onSave={onSave}
  />
);

export default RenameModal;
