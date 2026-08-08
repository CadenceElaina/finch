import React from "react";
import NameModal from "./NameModal";

interface AddWatchlistProps {
  onCancel: () => void;
  onSave: (watchlistName: string) => void;
}

const AddWatchlistModal: React.FC<AddWatchlistProps> = ({
  onCancel,
  onSave,
}) => (
  <NameModal
    title="Create a new watchlist"
    placeholder="Watchlist name"
    onCancel={onCancel}
    onSave={onSave}
  />
);

export default AddWatchlistModal;
