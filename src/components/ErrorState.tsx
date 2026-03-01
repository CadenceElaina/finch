import React from "react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

/**
 * Reusable error state with optional retry button.
 * Use `compact` for inline/card contexts (smaller text, no icon).
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Something went wrong.",
  onRetry,
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        style={{
          padding: "1rem 0",
          textAlign: "center",
          color: "var(--text-secondary, rgba(255,255,255,0.5))",
          fontSize: "0.85rem",
        }}
      >
        <p style={{ margin: "0 0 8px 0" }}>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
              borderRadius: "6px",
              padding: "4px 14px",
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.14)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
            }
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        textAlign: "center",
        color: "var(--text-secondary, rgba(255,255,255,0.5))",
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: "12px", opacity: 0.5 }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem" }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)",
            borderRadius: "8px",
            padding: "6px 20px",
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.14)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
        >
          Try again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
