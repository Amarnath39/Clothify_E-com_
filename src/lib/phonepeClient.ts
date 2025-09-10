import { StandardCheckoutClient, Env } from "pg-sdk-node";

let phonePeClient: StandardCheckoutClient | null = null;

export function getPhonePeClient(): StandardCheckoutClient {
  if (!phonePeClient) {
    phonePeClient = StandardCheckoutClient.getInstance(
      process.env.PHONEPE_CLIENT_ID as string,
      process.env.PHONEPE_CLIENT_SECRET as string,
      parseInt(process.env.PHONEPE_CLIENT_VERSION || "1"),
      process.env.PHONEPE_ENV === "PRODUCTION" ? Env.PRODUCTION : Env.SANDBOX
    );
  }
  return phonePeClient;
}
