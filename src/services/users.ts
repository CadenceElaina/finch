import axios from "axios";
import { UserCredentials } from "../types/types"; // Define your types as needed

const baseUrl = "/api/users";

const createUser = async (userData: UserCredentials) => {
  try {
    const response = await axios.post(baseUrl, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default { createUser };
