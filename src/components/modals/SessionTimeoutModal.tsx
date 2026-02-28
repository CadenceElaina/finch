import React, { useEffect } from "react";
import "./SessionTimeoutModal.css";
interface SessionTimeoutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  // Set up a timer to automatically logout after 3 minutes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onCancel(); // Logout if no response within 3 minutes
    }, 3 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId); // Clear the timer when the component unmounts
    };
  }, [onCancel]);

  return (
    <div className="session-timeout-modal-container">
      <div className="session-timeout-modal-content">
        <p>Your session is about to expire. Are you still there?</p>
        <button onClick={() => onConfirm()}>Yes</button>
        <button onClick={() => onCancel()}>Logout</button>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
