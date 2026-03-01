import React from "react";
import "./DiscoverMore.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import { useIndexQuotes } from "../../context/IndexQuotesContext";
import { formatCurrency, formatPercent } from "../../utils/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextArrow: React.FC<any> = (props) => (
  <div className="arrow next" onClick={props.onClick}>
    <FaChevronRight />
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PrevArrow: React.FC<any> = (props) => (
  <div className="arrow prev" onClick={props.onClick}>
    <FaChevronLeft />
  </div>
);

const DiscoverMore: React.FC = () => {
  const { indexQuotesData } = useIndexQuotes();
  const settings = {
    dots: false,
    infinite: false,
    swipeToSlide: true,
    speed: 500,

    slidesToShow: 3,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  return (
    <div className="discover-container">
      <div role="heading" className="discover-heading">
        Discover more
      </div>
      <div role="heading" className="discover-subheading">
        You may be interested in
      </div>
      {indexQuotesData.length > 0 && (
        <Slider {...settings} className="slider-container">
          {Object.entries(indexQuotesData).map(([symbol, security]) => (
            <div key={symbol} className="card">
              {security && (
                <Link
                  to={`/quote/${security.symbol}`}
                  state={[false, security.symbol]}
                >
                  <div className="card-content">
                    <div className="card-symbol">{security.symbol}</div>
                    <div className="card-name">{security.name}</div>
                    <div className="card-price">{formatCurrency(security.price)}</div>
                    <div className={`card-change ${(security.percentChange ?? 0) >= 0 ? 'positive' : 'negative'}`}>{formatPercent(security.percentChange)}</div>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </Slider>
      )}
    </div>
  );
};

export default DiscoverMore;
