import axios, { AxiosResponse } from "axios";

interface SendOrderConfirmationResponse {
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}

/**
 * Send order confirmation via WhatsApp for Panchali Vastra
 */
export const sendOrderConfirmation = async (
  customerName: string,
  phoneNumber: string,
  orderId: string,
  trackingId: string,
  invoiceUrl: string,
  deliveryPartner: string = "DTDC"
): Promise<SendOrderConfirmationResponse> => {
  try {
    // ✅ Default country code (India)
    const countryCode = "91";

    // ✅ Ensure phone number has country code and remove any '+'
    let formattedPhoneNumber = phoneNumber.replace(/\+/g, "");
    if (!formattedPhoneNumber.startsWith(countryCode)) {
      formattedPhoneNumber = `${countryCode}${formattedPhoneNumber}`;
    }

    // ✅ Prepare WhatsApp API form data
    const formData = new URLSearchParams({
      apiToken: "10641|R3bJazoz4iohOk42cyQhfOrCo4x0q2ZSuJezDk6m346fe236",
      phoneNumberID: "627218387152627",
      botTemplateID: "178651",
      "templateVariable-variable1-1": customerName || "Jos", // Customer name
      "templateVariable-variable2-2": "Udayaada", // Brand / Store name
      "templateVariable-variable3-3": orderId, // Order ID
      "templateVariable-variable4-4": trackingId || "Will be updated soon", // Tracking ID
      "templateVariable-variable5-5": invoiceUrl || "Not available", // Invoice URL
      "templateVariable-variable6-6": deliveryPartner || "DTDC", // Delivery partner
      sendToPhoneNumber: formattedPhoneNumber,
    });

    console.log("📨 WhatsApp Request Data:", formData.toString());

    // ✅ Send request to Wabis API
    const response: AxiosResponse = await axios.post(
      process.env.WABIS_BASE_URL ||
        "https://bot.wabis.in/api/v1/whatsapp/send/template",
      formData.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
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
