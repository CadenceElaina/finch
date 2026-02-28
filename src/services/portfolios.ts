import axios from "axios";
import { Security } from "../types/types";

const baseUrl = "/api/portfolios";
let token: string | null = null;

interface NewPortfolio {
  title: string;
  user?: string;
}

const setToken = (newToken: string) => {
  token = `Bearer ${newToken}`;
};

const getAll = async () => {
  const response = await axios.get(baseUrl);
  return response.data;
};

const create = async (newObject: NewPortfolio) => {
  const storedUserString = localStorage.getItem("loggedFinanceappUser") || "{}";
  const storedUserData = JSON.parse(storedUserString);
  const token = storedUserData.token || "";
  /* console.log(token); */
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(baseUrl, newObject, config);
  return response.data;
};

const addToPortfolio = async (id: string, security: Security) => {
  const response = await axios.post(`${baseUrl}/${id}/securities`, {
    security,
  });
  return response.data;
};

const remove = async (id: string) => {
  const config = {
    headers: { Authorization: token },
  };

  const response = await axios.delete(`${baseUrl}/${id}`, config);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updatePortfolioValue = async (portfolioId: string, data: any) => {
  const response = await axios.put(`${baseUrl}/${portfolioId}`, data);
  return response; // Return the entire response object
};

export default {
  setToken,
  getAll,
  create,
  addToPortfolio,
  remove,
  updatePortfolioValue,
};
