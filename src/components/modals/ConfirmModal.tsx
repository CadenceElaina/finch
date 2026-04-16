import React from "react";
import "./AddPortfolio.css";
import ModalBackdrop from "./ModalBackdrop";

interface ConfirmModalProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use "danger" for destructive actions (red confirm button). */
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}) => {
  return (
    <>
      <ModalBackdrop visible={true} onClick={onCancel} onBackdropClick={onCancel} />
      <div className="new-portfolio-modal visible" style={{ width: 340 }}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div
          className="modal-content"
          style={{ paddingBottom: "var(--space-4)", marginTop: "var(--space-2)" }}
        >
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        </div>
        <div className="modal-footer" style={{ gap: "var(--space-2)" }}>
          <button className="confirm-modal-cancel-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`confirm-modal-ok-btn${variant === "danger" ? " confirm-modal-danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
