import React, { useRef, useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./ScrollRow.css";

interface ScrollRowProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollRow: React.FC<ScrollRowProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [check]);

  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <div className="scroll-row-wrapper">
      {canLeft && (
        <button
          className="scroll-row-arrow scroll-row-arrow--left"
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
        >
          <FaChevronLeft size={12} />
        </button>
      )}
      <div ref={ref} className={`scroll-row-track ${className ?? ""}`}>
        {children}
      </div>
      {canRight && (
        <button
          className="scroll-row-arrow scroll-row-arrow--right"
          onClick={() => scroll(1)}
          aria-label="Scroll right"
        >
          <FaChevronRight size={12} />
        </button>
      )}
    </div>
  );
};

export default ScrollRow;
