const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * WhatsApp Service for sending invoices and notifications
 * Uses WhatsApp Business API (Twilio or Meta)
 */

class WhatsAppService {
  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || "v20.0";
    this.baseUrl = `https://graph.instagram.com/${this.apiVersion}`;
  }

  /**
   * Validate WhatsApp phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - True if valid
   */
  validatePhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Check if it's a valid Indian phone number (10 digits after country code)
    // Supports formats: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
    if (cleaned.length === 10) {
      return true; // 10-digit number
    }
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return true; // Country code + 10 digits
    }
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
      return true; // 0 + 10 digits
    }
    return false;
  }

  /**
   * Format phone number to WhatsApp format (with country code)
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Formatted number with country code
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, "");

    // If already has country code (12 digits starting with 91)
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return cleaned;
    }

    // If 10-digit number, add country code
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }

    // If starts with 0, remove it and add country code
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
      return `91${cleaned.slice(1)}`;
    }

    // If already 12 digits, assume it's correct
    if (cleaned.length === 12) {
      return cleaned;
    }

    throw new Error(`Invalid phone number format: ${phoneNumber}`);
  }

  /**
   * Send invoice via WhatsApp
   * @param {string} recipientPhoneNumber - Recipient phone number
   * @param {object} invoiceData - Invoice data to send
   * @param {string} invoiceId - Invoice ID
   * @returns {object} - Response from WhatsApp API
   */
  async sendInvoice(recipientPhoneNumber, invoiceData, invoiceId) {
    try {
      // Validate and format phone number
      if (!this.validatePhoneNumber(recipientPhoneNumber)) {
        throw new Error(`Invalid phone number: ${recipientPhoneNumber}`);
      }

      const formattedPhoneNumber = this.formatPhoneNumber(recipientPhoneNumber);

      // Prepare message content
      const clientName = invoiceData.clientName || "Valued Customer";
      const invoiceAmount = invoiceData.totalAmount || 0;
      const itemCount = invoiceData.itemCount || 0;

      const messageText = `
🧿 *Roy & Roy Opticals*

Dear ${clientName},

Thank you for your purchase!

*Invoice Details:*
📋 Invoice #: ${invoiceId}
💰 Total Amount: ₹${invoiceAmount.toFixed(2)}
📦 Items: ${itemCount}

Your invoice has been generated. Please use the link below to view your complete invoice with details.

Click the button below to view your invoice PDF:
🔗 https://your-app.com/invoices/${invoiceId}/pdf

*Payment Methods:*
💳 Cash, Card, UPI, Gift Card

For any queries, please contact us:
📱 +91-96765 43210
📧 contact@cleareyes.com

Thank you for choosing Roy & Roy Opticals!
Follow us: Instagram @cleareyes_optical

Visit us again soon! 😊
      `.trim();

      // Send via WhatsApp API
      const response = await this.sendMessage(
        formattedPhoneNumber,
        messageText
      );

      // Log the WhatsApp activity
      await this.logWhatsAppActivity(
        invoiceId,
        recipientPhoneNumber,
        "INVOICE_SENT",
        response,
        "SUCCESS"
      );

      return {
        success: true,
        messageId: response.messages[0]?.id,
        phoneNumber: formattedPhoneNumber,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error sending invoice via WhatsApp:", error.message);

      // Log the failure
      await this.logWhatsAppActivity(
        invoiceId,
        recipientPhoneNumber,
        "INVOICE_SENT",
        { error: error.message },
        "FAILED"
      );

      throw error;
    }
  }

  /**
   * Send custom message via WhatsApp
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} message - Message text
   * @returns {object} - API response
   */
  async sendMessage(phoneNumber, message) {
    try {
      if (!this.apiToken || !this.phoneNumberId) {
        throw new Error(
          "WhatsApp API credentials not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
        );
      }

      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          body: message,
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        "WhatsApp API Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to send WhatsApp message: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }

  /**
   * Send payment reminder via WhatsApp
   * @param {string} phoneNumber - Customer phone number
   * @param {object} invoiceData - Invoice information
   * @returns {object} - API response
   */
  async sendPaymentReminder(phoneNumber, invoiceData) {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const reminderMessage = `
🧿 *Roy & Roy Opticals*

Hi ${invoiceData.clientName},

This is a gentle reminder about your pending payment.

*Outstanding Amount:* ₹${invoiceData.balanceAmount.toFixed(2)}
📋 Invoice #: ${invoiceData.invoiceId}
📅 Due Date: ${invoiceData.dueDate || "On Demand"}

Please settle the payment at your earliest convenience.

*Payment Options:*
💳 Cash, Card, UPI
📱 +91-96765 43210

Thank you!
      `.trim();

      const response = await this.sendMessage(
        formattedPhoneNumber,
        reminderMessage
      );

      await this.logWhatsAppActivity(
        invoiceData.invoiceId,
        phoneNumber,
        "PAYMENT_REMINDER",
        response,
        "SUCCESS"
      );

      return response;
    } catch (error) {
      console.error("Error sending payment reminder:", error.message);
      await this.logWhatsAppActivity(
        invoiceData.invoiceId,
        phoneNumber,
        "PAYMENT_REMINDER",
        { error: error.message },
        "FAILED"
      );
      throw error;
    }
  }

  /**
   * Send OTP via WhatsApp
   * @param {string} phoneNumber - Phone number
   * @param {string} otp - One-time password
   * @returns {object} - API response
   */
  async sendOTP(phoneNumber, otp) {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const otpMessage = `🧿 *Roy & Roy Opticals*\n\nYour OTP is: *${otp}*\n\nValid for 10 minutes.\nDo not share with anyone.`;

      return await this.sendMessage(formattedPhoneNumber, otpMessage);
    } catch (error) {
      console.error("Error sending OTP:", error.message);
      throw error;
    }
  }

  /**
   * Log WhatsApp activity for audit trail
   * @param {string} invoiceId - Invoice ID
   * @param {string} phoneNumber - Phone number
   * @param {string} messageType - Type of message (INVOICE_SENT, PAYMENT_REMINDER, etc.)
   * @param {object} apiResponse - API response
   * @param {string} status - Status (SUCCESS, FAILED)
   */
  async logWhatsAppActivity(
    invoiceId,
    phoneNumber,
    messageType,
    apiResponse,
    status
  ) {
    try {
      // This stores the activity for audit/tracking purposes
      // You can create a new table for this if needed
      console.log("WhatsApp Activity Log:", {
        invoiceId,
        phoneNumber,
        messageType,
        status,
        timestamp: new Date(),
        response: apiResponse,
      });

      // Optional: Store in database
      // await prisma.whatsappLog.create({...});
    } catch (error) {
      console.error("Error logging WhatsApp activity:", error);
    }
  }

  /**
   * Check if WhatsApp is configured
   * @returns {boolean} - True if configured
   */
  isConfigured() {
    return !!(this.apiToken && this.phoneNumberId);
  }
}

module.exports = new WhatsAppService();
