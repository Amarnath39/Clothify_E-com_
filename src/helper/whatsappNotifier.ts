import axios, { AxiosResponse } from "axios";

interface SendOrderConfirmationResponse {
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}


export const sendOrderConfirmation = async (
customerName: string, phoneNumber: string, orderId: string, merchantName: string = "S.I.S", deliveryPartner: string = "",): Promise<SendOrderConfirmationResponse> => {
  try {
    const countryCode = "91";

    let formattedPhoneNumber = phoneNumber.replace(/\+/g, "");
    if (!formattedPhoneNumber.startsWith(countryCode)) {
      formattedPhoneNumber = `${countryCode}${formattedPhoneNumber}`;
    }

    const formData = new URLSearchParams({
      apiToken: "10641|R3bJazoz4iohOk42cyQhfOrCo4x0q2ZSuJezDk6m346fe236",
      phoneNumberID: "627218387152627",
      botTemplateID: "200025",
      "templateVariable-variable1-1": customerName || "Customer",
      "templateVariable-variable2-2": merchantName,
      "templateVariable-variable3-3": orderId || "N/A",
      "templateVariable-variable4-4": deliveryPartner,
      sendToPhoneNumber: formattedPhoneNumber,
    });

    console.log("📨 WhatsApp Request Data:", formData.toString());

    const response: AxiosResponse = await axios.post(
      "https://bot.wabis.in/api/v1/whatsapp/send/template",
      formData.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("✅ WhatsApp order confirmation sent:", response.data);

    return {
      success: true,
      message: "WhatsApp order confirmation sent successfully!",
      response: response.data,
    };
  } catch (error: any) {
    console.error("❌ WhatsApp API Error:", {
      message: error.message,
      response: error.response?.data || "No response body",
    });

    return {
      success: false,
      message: "Failed to send WhatsApp order confirmation",
      error: error.response?.data || error.message,
    };
  }
};
