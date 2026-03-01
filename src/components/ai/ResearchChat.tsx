/**
 * ResearchChat — Follow-up chat panel on the Quote page.
 * Each question costs 1 AI credit. History persists via AiContext.
 */

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useAi, ChatMessage } from "../../context/AiContext";
import { FaRobot, FaPaperPlane, FaTrash } from "react-icons/fa";
import "./ResearchChat.css";

interface ResearchChatProps {
  symbol: string;
}

const ResearchChat: React.FC<ResearchChatProps> = ({ symbol }) => {
  const { chat, getChatHistory, clearChat, configured, creditsRemaining } = useAi();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const history: ChatMessage[] = getChatHistory(symbol);

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
      await chat(symbol, trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  }, [input, loading, creditsRemaining, chat, symbol]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!configured) return null;

  return (
    <div className="research-chat">
      <div className="research-chat-header">
        <div className="research-chat-title">
          <FaRobot size={14} />
          <span>Ask about {symbol.toUpperCase()}</span>
        </div>
        {history.length > 0 && (
          <button
            className="research-chat-clear"
            onClick={() => clearChat(symbol)}
            title="Clear chat"
          >
            <FaTrash size={11} />
          </button>
        )}
      </div>

      {history.length > 0 && (
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
          placeholder={
            creditsRemaining <= 0
              ? "No credits remaining"
              : `Ask about ${symbol.toUpperCase()}…`
          }
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
