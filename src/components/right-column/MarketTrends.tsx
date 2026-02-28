import CustomButton from "../CustomButton";
import "./right.css";
import { useNavigate } from "react-router-dom";
import { MdOutlineStackedLineChart } from "react-icons/md";
import { ImFire } from "react-icons/im";
import { RiBarChart2Fill } from "react-icons/ri";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";

const MarketTrends = () => {
  const navigate = useNavigate();
  return (
    <div className="market-trends-container">
      <div className="market-trends-header" role="heading">
        Market Trends
      </div>

      <div className="market-trends-buttons">
        <CustomButton
          label="Market Indexes"
          secondary
          icon={<MdOutlineStackedLineChart />}
          onClick={() => navigate("/market-trends/indexes")}
        />
        <CustomButton
          label="Most Active"
          secondary
          icon={<RiBarChart2Fill />}
          onClick={() => navigate("/market-trends/active")}
        />
        <CustomButton
          label="Gainers"
          secondary
          icon={<FaArrowTrendUp />}
          isUpArrow={true}
          onClick={() => navigate("/market-trends/gainers")}
        />
        <CustomButton
          label="Losers"
          secondary
          icon={<FaArrowTrendDown />}
          isDownArrow={true}
          onClick={() => navigate("/market-trends/losers")}
        />
        <CustomButton
          label="Trending"
          secondary
          icon={<ImFire />}
          onClick={() => navigate("/market-trends/trending")}
        />
      </div>
    </div>
  );
};

export default MarketTrends;
