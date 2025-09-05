require("dotenv").config();
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const companyRoutes = require("./portal/company/routes/companyRoutes");
const retailerRoutes = require("./portal/retailer/routes/retailerRoutes");

const app = express();

// Middleware
const allowedOrigins = [
  "https://optical-wt18.vercel.app",
  "https://optical-omega.vercel.app",
  "https://smart-optical.vercel.app",
  "https://optical3-git-main-tj44s-projects.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));
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
app.use("/api/product", require("./routes/product"));
app.use("/api/patient", require("./routes/patient"));
app.use("/api/customer", require("./routes/customer"));

// New Company & Retailer APIs
app.use("/company", companyRoutes);
app.use("/retailer", retailerRoutes);

// Health check
app.get("/", (req, res) => {
  res.send(" Backend made by Sparkline_World_Technology ");
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${port}`);
});
