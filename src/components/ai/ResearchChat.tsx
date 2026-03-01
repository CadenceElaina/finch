/**
 * ResearchChat — Unified AI chat panel.
 * One continuous thread across all pages (like Google Finance).
 * Each question costs 1 AI credit. History persists via AiContext.
 */

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useAi, ChatMessage } from "../../context/AiContext";
import { FaRobot, FaPaperPlane, FaTrash } from "react-icons/fa";
import "./ResearchChat.css";

interface ResearchChatProps {
  /** Optional hint shown in the placeholder, e.g. "MSFT" */
  contextHint?: string;
}

const ResearchChat: React.FC<ResearchChatProps> = ({ contextHint }) => {
  const { chat, getChatHistory, clearChat, configured, creditsRemaining } = useAi();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const history: ChatMessage[] = getChatHistory();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length, loading]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || creditsRemaining <= 0) return;
    setInput("");
    setError("");
    setLoading(true);
    try {
      await chat(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  }, [input, loading, creditsRemaining, chat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!configured) return null;

  const placeholder = creditsRemaining <= 0
    ? "No credits remaining"
    : contextHint
      ? `Ask about ${contextHint}…`
      : "Ask about the market…";

  return (
    <div className="research-chat">
      <div className="research-chat-header">
        <div className="research-chat-title">
          <FaRobot size={14} />
          <span>Ask about {contextHint ? contextHint.toUpperCase() : "the market"}</span>
        </div>
        {history.length > 0 && (
          <button
            className="research-chat-clear"
            onClick={() => clearChat()}
            title="Clear chat"
          >
            <FaTrash size={11} />
          </button>
        )}
      </div>

      {(history.length > 0 || loading) && (
        <div className="research-chat-messages">
          {history.map((msg, i) => (
            <div key={i} className={`research-chat-msg ${msg.role}`}>
              <div
                className="research-chat-bubble"
                dangerouslySetInnerHTML={{
                  __html: msg.text
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>")
                    .replace(/\n/g, "<br />"),
                }}
              />
            </div>
          ))}
          {loading && (
            <div className="research-chat-msg model">
              <div className="research-chat-bubble typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {error && <p className="research-chat-error">{error}</p>}

      <div className="research-chat-input-row">
        <input
          type="text"
          className="research-chat-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || creditsRemaining <= 0}
        />
        <button
          className="research-chat-send"
          onClick={handleSend}
          disabled={loading || !input.trim() || creditsRemaining <= 0}
          title="Send"
        >
          <FaPaperPlane size={13} />
        </button>
      </div>
    </div>
  );
};

export default ResearchChat;
