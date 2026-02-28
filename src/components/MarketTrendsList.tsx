import { useEffect, useState } from "react";
import Table from "./table/Table";
import { RowConfig } from "./table/types";
import { ImFire } from "react-icons/im";
import { RiBarChart2Fill } from "react-icons/ri";
import CustomButton from "./CustomButton";
import { Link } from "react-router-dom";
import { MdArrowForwardIos } from "react-icons/md";
import { useQueryClient } from "@tanstack/react-query";
import { getMoversSymbols, getBatchQuotes, getTrending } from "./search/quoteUtils";
import { quoteType } from "./search/types";
import { transformQuotesToData } from "./market-trends/utils";
import { Skeleton } from "@mui/material";

const MarketTrendsList = () => {
  const marketTrendsConfig: RowConfig = {
    fields: ["symbol", "name", "article", "price", "percentChange"],
    addIcon: true,
    name: "market-trends",
  };
  const [symbols, setSymbols] = useState<string[]>([]);
  const [firstMount, setFirstMount] = useState<boolean>(true);
  const [currTrend, setCurrTrend] = useState<string>("most-active");
  const [trendingData, setTrendingData] = useState([]);
  /* const mostActiveConfig: RowConfig = {
    fields: ["symbol", "name", "price", "priceChange", "percentChange"],
    addIcon: true,
  }; */
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [mostActiveQuotes, setMostActiveQuotes] = useState<
    Record<string, quoteType | null>
  >({});

  const fetchMostActiveQuotes = async () => {
    try {
      const newSymbols = await getMoversSymbols("active");

      setSymbols(newSymbols);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchQuotesForSymbols = async () => {
    setLoading(true);
    const symbolQuoteMap = await getBatchQuotes(queryClient, symbols);
    setLoading(false);
    setMostActiveQuotes(symbolQuoteMap);
  };

  useEffect(() => {
    fetchMostActiveQuotes();
  }, [queryClient]);

  useEffect(() => {
    if (symbols.length > 0 && firstMount) {
      //Not in view on page load not priority
      //Too many api calls / second exceeds api rate limit
      const timeoutId = setTimeout(() => {
        fetchQuotesForSymbols();
        setFirstMount(false);
      }, 2000);
      return () => clearTimeout(timeoutId);
    } else if (symbols.length > 0) {
      fetchQuotesForSymbols();
    }
  }, [symbols, queryClient]);
  useEffect(() => {
    if (currTrend === "trending") {
      setLoading(true);
      const fetchTrendingData = async () => {
        try {
          const data = await getTrending(queryClient);
          setTrendingData(data.slice(0, 5));
        } catch (error) {
          console.error("Error fetching trending data:", error);
        }
      };
      fetchTrendingData();
      setLoading(false);
    }
  }, [currTrend]);

  return (
    <>
      {" "}
      <div role="heading" className="home-market-trends-heading">
        Market trends
      </div>
      <div className="home-market-trends-buttons-container">
        <div className="home-market-trends-buttons">
          <CustomButton
            label="Most Active"
            secondary
            icon={<RiBarChart2Fill />}
            onClick={() => setCurrTrend("most-active")}
          />
          <CustomButton
            label="Trending"
            secondary
            icon={<ImFire />}
            onClick={() => setCurrTrend("trending")}
          />
        </div>
        <div className="home-market-trends-buttons-more">
          <Link to={"/market-trends/active"}>
            <div>More</div>
            <div>
              <MdArrowForwardIos />
            </div>
          </Link>
        </div>
      </div>
      <div className="market-trends-list">
        {loading && (
          <div>
            {/* Add Skeletons here while waiting for data to load */}
            <Skeleton
              variant="text"
              width={80}
              height={20}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />
            <Skeleton
              variant="text"
              width="100%"
              height={30}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={150}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />
          </div>
        )}
        {!loading && currTrend === "most-active" && (
          <Table
            data={transformQuotesToData(mostActiveQuotes)}
            config={marketTrendsConfig}
            full={true}
            icon={true}
          />
        )}
        {!loading && currTrend === "trending" && (
          <Table
            data={trendingData}
            config={marketTrendsConfig}
            full={true}
            icon={true}
          />
        )}
      </div>
    </>
  );
};

export default MarketTrendsList;
