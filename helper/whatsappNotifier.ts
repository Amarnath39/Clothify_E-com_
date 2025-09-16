import axios from "axios";

/**
 * WhatsApp notification service configuration for Panchali Vastra
 */
interface WabisConfig {
  apiToken: string;
  phoneNumberID: string;
  orderTemplateID: string;
  baseUrl: string;
}

/**
 * Response from the Wabis API
 */
interface WabisResponse {
  success: boolean;
  data?: any;
  error?: any;
  status?: string;
  message?: string;
}

/**
 * WhatsApp notification service using Wabis API for Panchali Vastra
 * Simplified service for sending order notifications via WhatsApp
 */
class WabisWhatsAppService {
  private apiToken: string;
  private phoneNumberID: string;
  private orderTemplateID: string;
  private orderTemplateIDTracking: string;
  private baseUrl: string;

  constructor() {
    // Configuration - these should be loaded from environment variables for Panchali Vastra
    this.apiToken =
      process.env.WABIS_API_TOKEN ||
      "10550|6mJGxFiTE1MAVqkOLMsln0QleaSywkgkePKCsT7F5d78fa03";
    this.phoneNumberID = process.env.WABIS_PHONE_NUMBER_ID || "579135845293888";
    this.orderTemplateID = process.env.WABIS_ORDER_TEMPLATE_ID || "178651";
    this.baseUrl =
      process.env.WABIS_BASE_URL ||
      "https://bot.wabis.in/api/v1/whatsapp/send/template";
  }

  /**
   * Configure the WhatsApp service with new settings
   */
  configure(config: Partial<WabisConfig>): void {
    if (config.apiToken) this.apiToken = config.apiToken;
    if (config.phoneNumberID) this.phoneNumberID = config.phoneNumberID;
    if (config.orderTemplateID) this.orderTemplateID = config.orderTemplateID;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  /**
   * Send order confirmation via WhatsApp with all required variables
   * @param {string} phoneNumber - Customer's phone number
   * @param {string} customerName - Customer's name
   * @param {string} orderId - Order ID or reference
   * @param {string} trackingId - Tracking ID (optional)
   * @param {string} invoiceUrl - URL to the invoice or receipt
   * @param {string} deliveryPartner - Delivery partner name (optional)
   * @returns {Promise<WabisResponse>} - The API response
   */
  async sendOrderConfirmation(
    phoneNumber: string,
    customerName: string,
    orderId: string,
    trackingId: string,
    invoiceUrl: string,
    deliveryPartner?: string
  ): Promise<WabisResponse> {
    try {
      // Format phone number (remove non-digits and ensure it has country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Prepare form data using URLSearchParams (simulates form submission)
      // CORRECT ORDER FOR PANCHALI VASTRA TEMPLATE:
      const formData = new URLSearchParams({
        // apiToken: this.apiToken,
        // phoneNumberID: this.phoneNumberID,
        // botTemplateID: this.orderTemplateID,
        // "templateVariable-variable1-1": customerName, // customername
        // "templateVariable-variable2-2": orderId, // orderid (ON-xxxx)
        // "templateVariable-variable3-3": trackingId || "Will be updated soon", // trackingid
        // "templateVariable-variable4-4": invoiceUrl || "Not available", // url
        // "templateVariable-variable5-5": deliveryPartner || "DTDC", // deliverypartner
        // sendToPhoneNumber: formattedPhone,

        apiToken: this.apiToken,
        phoneNumberID: this.phoneNumberID,
        botTemplateID: this.orderTemplateID,
        "templateVariable-variable1-1": customerName,
        "templateVariable-variable2-2": "Panchali Vastra",
        "templateVariable-variable3-3": orderId,
        "templateVariable-variable4-4": invoiceUrl,
        sendToPhoneNumber: formattedPhone,
      });

      console.log(
        `📱 Sending WhatsApp to ${formattedPhone} for order ${orderId}`
      );

      // Send the request to Wabis API
      const response = await axios.post(this.baseUrl, formData.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000, // 15 second timeout
      });

      console.log(
        "✅ Panchali Vastra WhatsApp notification sent successfully:",
        {
          orderId,
          phone: formattedPhone,
          status: response.status,
          responseData: response.data,
        }
      );

      return {
        success: true,
        data: response.data,
        status: "sent",
        message: "WhatsApp notification sent successfully",
      };
    } catch (error: any) {
      console.error("❌ Error sending Panchali Vastra WhatsApp notification:", {
        orderId,
        phone: phoneNumber,
        error: error.response?.data || error.message,
      });

      return {
        success: false,
        error: error.response?.data || error.message,
        status: "failed",
        message: "Failed to send WhatsApp notification",
      };
    }
  }

  /**
   * Send order status update via WhatsApp
   * @param {string} phoneNumber - Customer's phone number
   * @param {string} customerName - Customer's name
   * @param {string} orderId - Order ID
   * @param {string} status - Order status
   * @param {string} trackingId - Tracking ID
   * @param {string} deliveryPartner - Delivery partner name
   * @param {string} invoiceUrl - Invoice URL (optional)
   * @returns {Promise<WabisResponse>} - The API response
   */
  async sendOrderStatusUpdate(
    phoneNumber: string,
    customerName: string,
    orderId: string,
    status: string,
    trackingId?: string,
    deliveryPartner?: string,
    invoiceUrl?: string
  ): Promise<WabisResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Use different template for status updates if available
      const statusTemplateID =
        process.env.WABIS_ORDER_TEMPLATE_ID_TRACKING || this.orderTemplateID;

      // STATUS TEMPLATE ORDER (modify based on your actual status template)
      const formData = new URLSearchParams({
        apiToken: this.apiToken,
        phoneNumberID: this.phoneNumberID,
        botTemplateID: statusTemplateID,
        "templateVariable-variable1-1": customerName, // customername
        "templateVariable-variable2-2":"Panchali Vastra", // orderid
        "templateVariable-variable3-3": trackingId || "Pending", // orderid
        "templateVariable-variable4-4": deliveryPartner || "DTDC",
        // "templateVariable-variable4-4": orderId, // trackingid
        // "templateVariable-variable5-5": invoiceUrl || status,
        sendToPhoneNumber: formattedPhone,
      });

      console.log(
        `📱 Sending status update WhatsApp for order ${orderId}: ${status}`
      );

      const response = await axios.post(this.baseUrl, formData.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000,
      });

      console.log("✅ WhatsApp status update sent successfully");

      return {
        success: true,
        data: response.data,
        status: "sent",
      };
    } catch (error: any) {
      console.error(
        "❌ Error sending order status update:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        status: "failed",
      };
    }
  }

  /**
   * Format phone number by adding country code if missing
   * @param {string} phone - Phone number to format
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleanPhone = phone.replace(/\D/g, "");

    // If the number doesn't start with country code, add Indian code (91)
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    return cleanPhone;
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Whether the phone number is valid
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation for Indian phone numbers
    const cleanPhone = phone.replace(/\D/g, "");

    // Should be 12 digits (91 + 10 digit number) or 10 digits
    return (
      (cleanPhone.length === 12 && cleanPhone.startsWith("91")) ||
      cleanPhone.length === 10
    );
  }

  /**
   * Test the WhatsApp service connection
   * @returns {Promise<WabisResponse>} - Test result
   */
  async testConnection(): Promise<WabisResponse> {
    try {
      console.log("🧪 Testing Panchali Vastra WhatsApp service connection...");

      // Check if all required config is present
      if (!this.isConfigured()) {
        throw new Error("WhatsApp service is not properly configured");
      }

      return {
        success: true,
        status: "connected",
        message: "WhatsApp service is configured and ready",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: "failed",
      };
    }
  }

  /**
   * Get current configuration (without sensitive data)
   * @returns {WabisConfig} - The current configuration
   */
  getConfig(): WabisConfig {
    return {
      apiToken: this.apiToken
        ? `${this.apiToken.substring(0, 10)}...`
        : "Not set",
      phoneNumberID: this.phoneNumberID,
      orderTemplateID: this.orderTemplateID,
      baseUrl: this.baseUrl,
    };
  }

  /**
   * Validate configuration
   * @returns {boolean} - Whether the configuration is valid
   */
  isConfigured(): boolean {
    return !!(
      this.apiToken &&
      this.phoneNumberID &&
      this.orderTemplateID &&
      this.baseUrl
    );
  }

  /**
   * Get service health status
   * @returns {object} - Service health information
   */
  getHealthStatus() {
    return {
      configured: this.isConfigured(),
      apiToken: !!this.apiToken,
      phoneNumberID: !!this.phoneNumberID,
      templateID: !!this.orderTemplateID,
      baseUrl: !!this.baseUrl,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance for Panchali Vastra
export const wabisWhatsApp = new WabisWhatsAppService();
export default WabisWhatsAppService;