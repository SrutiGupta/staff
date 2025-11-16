/**
 * WhatsApp Invoice API - Comprehensive Test Suite
 * This script tests all WhatsApp invoice sending endpoints
 *
 * Usage: node whatsapp-test.js
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const API_URL = "http://localhost:8080/api";

// Color output helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

/**
 * Test 1: Check WhatsApp Service Status
 */
async function testWhatsAppServiceStatus() {
  log.test("Test 1: WhatsApp Service Configuration Status");

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    log.warn("WhatsApp not configured in environment variables");
    log.info("To configure:");
    console.log("  1. Set WHATSAPP_API_TOKEN in .env");
    console.log("  2. Set WHATSAPP_PHONE_NUMBER_ID in .env");
    console.log("  3. Set WHATSAPP_BUSINESS_ACCOUNT_ID in .env");
    return false;
  }

  log.success("WhatsApp Service is configured");
  log.info(`Phone Number ID: ${phoneId.substring(0, 5)}...`);
  log.info(`API Token: ${token.substring(0, 10)}...`);
  return true;
}

/**
 * Test 2: Create Test Data
 */
async function setupTestData() {
  log.test("\nTest 2: Setting up test data");

  try {
    // Create test shop
    let shop = await prisma.shop.findFirst();

    if (!shop) {
      log.info("Creating test shop...");
      shop = await prisma.shop.create({
        data: {
          name: "Test Roy & Roy Opticals",
          address: "68 Jessore Road, Nabadwip",
          phone: "+91-96765-43210",
          email: "test@cleareyes.com",
        },
      });
      log.success(`Shop created: ${shop.name} (ID: ${shop.id})`);
    } else {
      log.info(`Using existing shop: ${shop.name} (ID: ${shop.id})`);
    }

    // Create test staff
    let staff = await prisma.staff.findFirst({
      where: { shopId: shop.id },
    });

    if (!staff) {
      log.info("Creating test staff member...");
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("password123", 10);

      staff = await prisma.staff.create({
        data: {
          email: "teststaff@cleareyes.com",
          name: "Test Staff",
          password: hashedPassword,
          role: "SALES_STAFF",
          shopId: shop.id,
        },
      });
      log.success(`Staff created: ${staff.name} (ID: ${staff.id})`);
    } else {
      log.info(`Using existing staff: ${staff.name} (ID: ${staff.id})`);
    }

    // Create test company and product
    let company = await prisma.company.findFirst();

    if (!company) {
      log.info("Creating test company...");
      company = await prisma.company.create({
        data: {
          name: "Oakley",
          description: "Premium eyewear brand",
        },
      });
      log.success(`Company created: ${company.name}`);
    }

    let product = await prisma.product.findFirst({
      where: { companyId: company.id },
    });

    if (!product) {
      log.info("Creating test product...");
      product = await prisma.product.create({
        data: {
          name: "Oakley Sunglasses",
          basePrice: 5500,
          eyewearType: "SUNGLASSES",
          frameType: "AVIATOR",
          companyId: company.id,
          barcode: "OKL-SG-001",
          sku: "SKU-001",
        },
      });
      log.success(`Product created: ${product.name} (₹${product.basePrice})`);
    }

    // Create test customer
    let customer = await prisma.customer.findFirst({
      where: { shopId: shop.id },
    });

    if (!customer) {
      log.info("Creating test customer...");
      customer = await prisma.customer.create({
        data: {
          name: "Rajesh Kumar",
          phone: "9876543210", // Test phone number
          address: "Delhi, India",
          shopId: shop.id,
        },
      });
      log.success(
        `Customer created: ${customer.name} (Phone: ${customer.phone})`
      );
    } else {
      log.info(
        `Using existing customer: ${customer.name} (Phone: ${customer.phone})`
      );
    }

    // Create shop inventory
    let inventory = await prisma.shopInventory.findFirst({
      where: {
        shopId: shop.id,
        productId: product.id,
      },
    });

    if (!inventory) {
      log.info("Creating shop inventory...");
      inventory = await prisma.shopInventory.create({
        data: {
          shopId: shop.id,
          productId: product.id,
          quantity: 10,
          sellingPrice: 5500,
        },
      });
      log.success(`Inventory created: ${inventory.quantity} units in stock`);
    }

    // Create invoice
    let invoice = await prisma.invoice.findFirst({
      where: { customerId: customer.id },
    });

    if (!invoice) {
      log.info("Creating test invoice...");
      invoice = await prisma.invoice.create({
        data: {
          staffId: staff.id,
          customerId: customer.id,
          subtotal: 5500,
          totalAmount: 5500,
          status: "UNPAID",
          items: {
            create: [
              {
                productId: product.id,
                quantity: 1,
                unitPrice: 5500,
                totalPrice: 5500,
              },
            ],
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });
      log.success(
        `Invoice created: ${invoice.id} (Amount: ₹${invoice.totalAmount})`
      );
    } else {
      log.info(`Using existing invoice: ${invoice.id}`);
    }

    return {
      shop,
      staff,
      company,
      product,
      customer,
      invoice,
    };
  } catch (error) {
    log.error(`Failed to setup test data: ${error.message}`);
    throw error;
  }
}

/**
 * Test 3: Login and Get JWT Token
 */
async function getJWTToken(
  email = "teststaff@cleareyes.com",
  password = "password123"
) {
  log.test("\nTest 3: Getting JWT Token");

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    const token = response.data.token || response.data.jwt;

    if (!token) {
      log.error("No token in response");
      log.info("Response:", response.data);
      return null;
    }

    log.success(`JWT Token obtained: ${token.substring(0, 20)}...`);
    return token;
  } catch (error) {
    if (error.response?.status === 400) {
      log.warn("Invalid credentials. May need to create user first.");
      return null;
    }
    log.error(`Failed to get token: ${error.message}`);
    return null;
  }
}

/**
 * Test 4: Send Invoice via WhatsApp - Using Default Phone
 */
async function testSendInvoiceDefault(token, invoiceId) {
  log.test("\nTest 4: Send Invoice via WhatsApp (Using Default Phone)");

  try {
    log.info(`Sending invoice ${invoiceId} to customer's phone number...`);

    const response = await axios.post(
      `${API_URL}/invoice/${invoiceId}/send-whatsapp`,
      {
        useDefault: true,
        method: "TEXT",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      log.success(`Invoice sent successfully!`);
      log.info(`Phone: ${response.data.data.phoneNumber}`);
      log.info(`Message ID: ${response.data.data.messageId}`);
      log.info(`Total Amount: ₹${response.data.data.invoiceData.totalAmount}`);
      return true;
    } else {
      log.error(`Failed: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    const hint = error.response?.data?.hint;
    log.error(`Error: ${errorMsg}`);
    if (hint) log.info(`Hint: ${hint}`);
    return false;
  }
}

/**
 * Test 5: Send Invoice with Custom Phone
 */
async function testSendInvoiceCustomPhone(token, invoiceId, customPhone) {
  log.test("\nTest 5: Send Invoice with Custom Phone Number");

  try {
    log.info(`Sending invoice to custom phone: ${customPhone}`);

    const response = await axios.post(
      `${API_URL}/invoice/${invoiceId}/send-whatsapp`,
      {
        phoneNumber: customPhone,
        useDefault: false,
        method: "TEXT",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      log.success(`Invoice sent to custom phone!`);
      log.info(`Phone: ${response.data.data.phoneNumber}`);
      return true;
    } else {
      log.error(`Failed: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    log.error(`Error: ${errorMsg}`);
    return false;
  }
}

/**
 * Test 6: Send Payment Reminder
 */
async function testPaymentReminder(token, invoiceId) {
  log.test("\nTest 6: Send Payment Reminder via WhatsApp");

  try {
    log.info(`Sending payment reminder for invoice ${invoiceId}...`);

    const response = await axios.post(
      `${API_URL}/invoice/${invoiceId}/payment-reminder`,
      {
        useDefault: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      log.success(`Payment reminder sent!`);
      log.info(`Outstanding Amount: ₹${response.data.data.balanceAmount}`);
      return true;
    } else {
      log.error(`Failed: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    log.error(`Error: ${errorMsg}`);

    // Expected error if invoice is already paid
    if (errorMsg.includes("already fully paid")) {
      log.warn("Invoice is already fully paid - this is expected");
      return true;
    }

    return false;
  }
}

/**
 * Test 7: Phone Number Validation
 */
async function testPhoneNumberValidation(token, invoiceId) {
  log.test("\nTest 7: Phone Number Validation");

  const testNumbers = [
    { number: "12345", expected: false, name: "Too short" },
    { number: "9876543210", expected: true, name: "Valid 10-digit" },
    {
      number: "+919876543210",
      expected: true,
      name: "Valid with country code",
    },
    { number: "919876543210", expected: true, name: "Valid without +" },
    { number: "09876543210", expected: true, name: "Valid with leading 0" },
  ];

  for (const { number, expected, name } of testNumbers) {
    try {
      const response = await axios.post(
        `${API_URL}/invoice/${invoiceId}/send-whatsapp`,
        {
          phoneNumber: number,
          useDefault: false,
          method: "TEXT",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (expected) {
        log.success(`${name} (${number}): Correctly accepted`);
      } else {
        log.warn(`${name} (${number}): Should have been rejected`);
      }
    } catch (error) {
      if (!expected) {
        log.success(`${name} (${number}): Correctly rejected`);
      } else {
        log.error(
          `${name} (${number}): Should have been accepted - ${error.response?.data?.error}`
        );
      }
    }
  }
}

/**
 * Test 8: Authentication Check
 */
async function testAuthenticationRequired(invoiceId) {
  log.test("\nTest 8: Authentication Check (Missing Token)");

  try {
    await axios.post(`${API_URL}/invoice/${invoiceId}/send-whatsapp`, {
      useDefault: true,
    });

    log.error("Should have rejected request without token!");
    return false;
  } catch (error) {
    const errorMsg = error.response?.data?.msg || error.message;

    if (errorMsg.includes("token") || errorMsg.includes("unauthorized")) {
      log.success(`Correctly rejected unauthorized request: ${errorMsg}`);
      return true;
    } else {
      log.error(`Unexpected error: ${errorMsg}`);
      return false;
    }
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log(`\n${"=".repeat(70)}`);
  console.log("  🧿 WhatsApp Invoice API - Test Suite");
  console.log(`${"=".repeat(70)}\n`);

  try {
    // Test 1: Check WhatsApp configuration
    const isConfigured = await testWhatsAppServiceStatus();

    if (!isConfigured) {
      log.warn("\nSkipping remaining tests - WhatsApp not configured");
      log.info(
        "Tests that check actual WhatsApp sending require API credentials"
      );
    }

    // Test 2: Setup test data
    const testData = await setupTestData();
    const { invoice, customer, staff } = testData;

    // Test 3: Get JWT Token
    const token = await getJWTToken(staff.email);

    if (!token) {
      log.error("Could not obtain JWT token - cannot continue tests");
      return;
    }

    // Test 4-6: Test API endpoints
    await testSendInvoiceDefault(token, invoice.id);
    await testSendInvoiceCustomPhone(token, invoice.id, "9876543210");
    await testPaymentReminder(token, invoice.id);

    // Test 7: Phone validation
    await testPhoneNumberValidation(token, invoice.id);

    // Test 8: Auth check
    await testAuthenticationRequired(invoice.id);

    console.log(`\n${"=".repeat(70)}`);
    log.success("All tests completed!");
    console.log(`${"=".repeat(70)}\n`);

    log.info("Test Data Created:");
    console.log(`  Invoice ID: ${invoice.id}`);
    console.log(`  Customer: ${customer.name} (${customer.phone})`);
    console.log(`  Amount: ₹${invoice.totalAmount}`);
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runAllTests();
