require("dotenv").config();
const axios = require("axios");
const net = require("net");

// --- Configuration ---
// Read from your .env file
const PRINTER_IP = process.env.THERMAL_PRINTER_IP;
const PRINTER_PORT = process.env.THERMAL_PRINTER_PORT;
const API_BASE_URL = "http://localhost:8080/api";

// Get the Invoice ID from the command line arguments
const invoiceId = process.argv[2];

// --- Main Function ---
async function testPrint() {
  if (!PRINTER_IP || !PRINTER_PORT) {
    console.error(
      "Error: Please set THERMAL_PRINTER_IP and THERMAL_PRINTER_PORT in your .env file."
    );
    return;
  }

  if (!invoiceId) {
    console.error("Error: Please provide an Invoice ID as an argument.");
    console.log("Usage: node test-printer.js <invoice-id>");
    return;
  }

  try {
    // 1. Fetch the thermal receipt text from your API
    console.log(`Fetching receipt for invoice ID: ${invoiceId}...`);

    const authToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFmZklkIjoxLCJpYXQiOjE3NTY1ODgxNzksImV4cCI6MTc1NjU5MTc3OX0.p4Cmrimk0X7sLUkoSvbxvj2VkxStsY7g7Cho1XHQlcs";

    const response = await axios.get(
      `${API_BASE_URL}/invoice/${invoiceId}/thermal`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const receiptText = response.data;
    console.log("--- Receipt Text Received ---");
    console.log(receiptText);
    console.log("-----------------------------");

    // 2. Connect to the thermal printer
    console.log(`Connecting to printer at ${PRINTER_IP}:${PRINTER_PORT}...`);
    const client = new net.Socket();

    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      console.log("Connected to printer. Sending data...");

      // 3. Send the receipt data
      client.write(receiptText);
      client.write("\n\n\n"); // Add some space before cutting

      // 4. Send ESC/POS command to cut the paper (for printers that support it)
      const cutCommand = Buffer.from([0x1d, 0x56, 0x01]);
      client.write(cutCommand);

      console.log("Data sent. Closing connection.");
      client.end();
    });

    client.on("error", (err) => {
      console.error("Printer connection error:", err.message);
      console.error("TROUBLESHOOTING:");
      console.error("1. Is the printer turned on and online?");
      console.error("2. Is it connected to the same network as this computer?");
      console.error("3. Is the IP address in your .env file correct?");
    });
  } catch (error) {
    if (error.response) {
      console.error(
        `API Error: ${error.response.status} ${error.response.statusText}`
      );
      console.error("Server responded with:", error.response.data);
    } else if (error.request) {
      console.error("API Error: No response received from the server.");
      console.error("Is your main application server (index.js) running?");
    } else {
      console.error("Error:", error.message);
    }
  }
}

testPrint();
