import React from "react";

interface ModalBackdropProps {
  visible: boolean;
  onClick: (e: React.MouseEvent) => void;
  onBackdropClick: () => void;
}

const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  visible,
  onClick,
  onBackdropClick,
}) => {
  return (
    <div
      className={`modal-backdrop ${visible ? "visible" : ""}`}
      onClick={(e) => {
        onClick(e);
        onBackdropClick();
      }}
    />
  );
};

export default ModalBackdrop;
