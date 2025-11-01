require("dotenv").config();
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const companyRoutes = require("./portal/company/routes/companyRoutes");
const retailerRoutes = require("./portal/retailer/routes/retailerRoutes");
const shopAdminRoutes = require("./portal/shopadmin/routes/shopAdminRoutes");
const doctorRoutes = require("./portal/doctor/routes/doctorRoutes");
const shopAdminStockRoutes = require("./portal/shopadmin/routes/shopAdminStockRoutes"); // New line

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(compression());
app.use(express.json());

// Define Routes (existing modules)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/royalty", require("./routes/royalty"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/gift-card", require("./routes/giftCard"));
app.use("/api/reporting", require("./routes/reporting"));
app.use("/api/barcode", require("./routes/barcode"));
app.use("/api/invoice", require("./routes/invoice"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/prescription", require("./routes/prescription"));
// app.use("/api/product", require("./routes/product")); // Commented out - use /api/inventory/product instead
app.use("/api/patient", require("./routes/patient"));
app.use("/api/customer", require("./routes/customer"));
app.use("/api/stock-receipts", require("./routes/stockReceipt"));
app.use("/api/doctor", doctorRoutes);

// New Company & Retailer APIs
app.use("/company", companyRoutes);
app.use("/retailer", retailerRoutes);
app.use("/shop-admin", shopAdminRoutes);
app.use("/shop-admin/stock", shopAdminStockRoutes); // New line
app.use("/doctor", doctorRoutes);

// Health check
app.get("/", (req, res) => {
  res.send(" Backend made by Sparkline_World_Technology ");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const port = process.env.PORT || 8080;

// ASCII Art Banner for Sparkline World Technology
const asciiArt = `
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║   ███████╗██████╗  █████╗ ██████╗ ██╗  ██╗██╗     ██╗███╗   ██╗███████╗    ║
║   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██║     ██║████╗  ██║██╔════╝    ║
║   ███████╗██████╔╝███████║██████╔╝█████╔╝ ██║     ██║██╔██╗ ██║█████╗      ║
║   ╚════██║██╔═══╝ ██╔══██║██╔══██╗██╔═██╗ ██║     ██║██║╚██╗██║██╔══╝      ║
║   ███████║██║     ██║  ██║██║  ██║██║  ██╗███████╗██║██║ ╚████║███████╗    ║
║   ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝    ║
║                                                                            ║
║                       TECHNOLOGY  INNOVATION                               ║
║                                                                            ║
║                    Staff Optical Management System                         ║
║                    Powered by Sparkline World Technology                   ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`;

app.listen(port, "0.0.0.0", () => {
  console.log(asciiArt);
  console.log(` Server is running on port ${port}`);
  console.log(` Ready to accept requests at http://localhost:${port}`);
  console.log(` Started at: ${new Date().toISOString()}`);
  console.log(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  );
});
