import axios from "axios";
import { credentials } from "../types/types";
const baseUrl = "/api/login";

const login = async (credentials: credentials) => {
  const user = await axios.post(baseUrl, credentials);
  return user.data;
};

export default { login };
