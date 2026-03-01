/**
 * AiPanel — Collapsible wrapper for AI features on the Quote page.
 * Groups StockSnapshot + ResearchChat into a collapsible panel
 * with a persistent toggle in the sidebar.
 */

import React, { useState } from "react";
import { useAi } from "../../context/AiContext";
import StockSnapshot from "./StockSnapshot";
import ResearchChat from "./ResearchChat";
import { QuotePageData } from "../search/types";
import { FaRobot, FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./AiPanel.css";

interface AiPanelProps {
  symbol: string;
  quotePageData: QuotePageData | null | undefined;
}

const AiPanel: React.FC<AiPanelProps> = ({ symbol, quotePageData }) => {
  const { configured, creditsRemaining, maxCredits } = useAi();
  const [isOpen, setIsOpen] = useState(true);

  if (!configured) return null;

  return (
    <div className="ai-panel">
      <div
        className="ai-panel-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsOpen((prev) => !prev)}
      >
        <div className="ai-panel-toggle-left">
          <FaRobot size={14} />
          <span>Finch AI Research</span>
        </div>
        <div className="ai-panel-toggle-right">
          <span className="ai-panel-credits">
            ⚡ {creditsRemaining}/{maxCredits}
          </span>
          {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </div>
      </div>

      {isOpen && (
        <>
          <div className="ai-panel-gradient-line" />
          <div className="ai-panel-body">
            <StockSnapshot symbol={symbol} quotePageData={quotePageData} />
            <ResearchChat symbol={symbol} />
          </div>
        </>
      )}
    </div>
  );
};

export default AiPanel;
