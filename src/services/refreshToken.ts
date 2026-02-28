import axios from "axios";

const baseUrl = "/api/refreshToken";

interface RefreshTokenResponse {
  token: string;
  // Add other properties as needed
}

const refreshToken = async (token: string): Promise<RefreshTokenResponse> => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(baseUrl, { token }, config);
  return response.data;
};

export default refreshToken;
