import axios from "axios";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getShiprocketToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken; // Return cached token if still valid
  }

  try {
    const response = await axios.post(
      `${process.env.SHIPROCKET_API_URL}/auth/login`,
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    cachedToken = response.data.token;
    tokenExpiry = Date.now() + 11 * 60 * 60 * 1000; // Cache for 11 hours

    console.log("New Shiprocket Token Generated");
    return cachedToken;
  } catch (error: any) {
    console.error("Error getting Shiprocket token:", error.response?.data);
    return null;
  }
}
