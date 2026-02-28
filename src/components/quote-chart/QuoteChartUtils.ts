export const formatTime = (time: Date, interval: string) => {
  switch (interval) {
    case "1D":
      return time.toLocaleTimeString([], {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    case "1M":
    case "6M":
    case "YTD":
    case "5Y":
    case "1Y":
    case "MAX":
      return time.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    default:
      return time.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
  }
};

export const formatXAxis = (time: Date, interval: string) => {
  switch (interval) {
    case "1D":
      return time.toLocaleTimeString([], {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    case "5D":
      return time.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "1M":
      return time.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "6M":
      return time.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "YTD":
      return time.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "1Y":
      return time.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "5Y":
      return time.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
      });
    case "MAX":
      return time.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
      });
    default:
      return time.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
  }
};
