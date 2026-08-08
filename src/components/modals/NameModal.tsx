import React, { useEffect, useRef, useState } from "react";
import CustomButton from "../CustomButton";
import "./AddPortfolio.css";
import ModalBackdrop from "./ModalBackdrop";

/**
 * Shared "type a name and confirm" modal.
 *
 * Create-watchlist, create-portfolio and rename were three near-identical
 * copies that had drifted: the watchlist one validated against the previous
 * state value (Save stayed disabled until the second keystroke, and clearing
 * the field left it enabled with an empty name), and neither create modal
 * supported Enter/Escape or autofocus the way rename did. One component keeps
 * them from diverging again.
 */
interface NameModalProps {
  title: string;
  placeholder: string;
  /** Pre-filled and selected on mount (rename). */
  initialValue?: string;
  confirmLabel?: string;
  /**
   * Extra rejection rule on top of "must not be blank" — e.g. rename refusing
   * a no-op. Receives the trimmed value.
   */
  reject?: (trimmedName: string) => boolean;
  onCancel: () => void;
  onSave: (name: string) => void;
}

const NameModal: React.FC<NameModalProps> = ({
  title,
  placeholder,
  initialValue = "",
  confirmLabel = "Save",
  reject,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const trimmed = name.trim();
  const isSaveDisabled = trimmed === "" || (reject?.(trimmed) ?? false);

  const handleSave = () => {
    if (isSaveDisabled) return;
    onSave(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <>
      <ModalBackdrop visible onClick={onCancel} onBackdropClick={onCancel} />
      <div className="new-portfolio-modal visible">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-content">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div className="modal-footer">
          <CustomButton label="Cancel" onClick={onCancel} />
          <CustomButton
            label={confirmLabel}
            onClick={handleSave}
            disabled={isSaveDisabled}
          />
        </div>
      </div>
    </>
  );
};

export default NameModal;
