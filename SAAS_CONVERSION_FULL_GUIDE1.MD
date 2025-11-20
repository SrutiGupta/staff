# 🚀 Staff Optical SaaS Conversion - Complete Step-by-Step Guide

**Date:** November 2025
**Project:** Staff Optical Management System → Multi-tenant SaaS Platform
**Status:** Production-Ready Implementation Plan

---

## 📋 Table of Contents

1. [Phase 1: Architecture & Planning](#phase-1-architecture--planning)
2. [Phase 2: Multi-Tenancy Implementation](#phase-2-multi-tenancy-implementation)
3. [Phase 3: Authentication & Authorization](#phase-3-authentication--authorization)
4. [Phase 4: Database Isolation](#phase-4-database-isolation)
5. [Phase 5: Payment & Billing](#phase-5-payment--billing)
6. [Phase 6: Deployment & Infrastructure](#phase-6-deployment--infrastructure)
7. [Phase 7: Security & Compliance](#phase-security--compliance)
8. [Phase 8: Testing & Rollout](#phase-8-testing--rollout)
9. [Timeline & Resource Plan](#timeline--resource-plan)

---

## Phase 1: Architecture & Planning

### Current Architecture (Single-Tenant)

```
┌─────────────────────┐
│   Frontend (React)  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Backend (Express)  │
│  - Auth Routes      │
│  - Inventory        │
│  - Billing          │
│  - Reporting        │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  PostgreSQL DB      │
│  (Single Database)  │
└─────────────────────┘
```

### Target SaaS Architecture (Multi-Tenant)

```
┌──────────────────────────────────────┐
│      Client Portals (React)          │
│ ┌─────────────┐  ┌──────────────┐    │
│ │  Retailer   │  │  Shop Admin   │    │
│ │  Portal     │  │  Portal      │    │
│ └─────────────┘  └──────────────┘    │
└──────────────────────────────────────┘
           │                │
           └────────┬───────┘
                    │
        ┌───────────▼────────────┐
        │  API Gateway           │
        │ (Tenant ID Resolution) │
        └───────────┬────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼───┐  ┌──────▼────┐  ┌─────▼────┐
│ Tenant │  │  Tenant   │  │  Admin   │
│ Service│  │  Database │  │ Service  │
│ Layer  │  │  Manager  │  │          │
└────┬───┘  └──────┬────┘  └─────┬────┘
     │             │             │
     └─────────┬───┴─────────────┘
               │
    ┌──────────▼──────────┐
    │   PostgreSQL        │
    │ ┌──────────────┐    │
    │ │ Tenant DB 1  │    │
    │ ├──────────────┤    │
    │ │ Tenant DB 2  │    │
    │ ├──────────────┤    │
    │ │ Tenant DB N  │    │
    │ └──────────────┘    │
    └─────────────────────┘
```

### Current Entities

- **Retailer** - Distributes products to shops
- **Shop** - End point for customers
- **ShopAdmin** - Manages individual shops
- **Company** - Product manufacturers
- **Products** - Inventory items

### SaaS Model Decision

**Choose One:**

#### Option A: Shared Database + Row-Level Isolation (Recommended for MVP)

- ✅ Faster to implement
- ✅ Lower infrastructure costs
- ✅ Easier data migrations
- ❌ Slight security risk if queries not filtered
- **Best for:** 5-100 tenants

**Implementation:** Add `tenantId` to all tables

#### Option B: Separate Database Per Tenant

- ✅ Maximum data isolation
- ✅ Better compliance & security
- ✅ Easy backups per tenant
- ❌ Complex deployment
- ❌ Higher infrastructure costs
- **Best for:** 100+ tenants

**Implementation:** Create isolated PostgreSQL databases

#### Option C: Hybrid (Row-level + Database separation)

- ✅ Best of both worlds
- ✅ Scale efficiently
- ✅ Flexible pricing tiers
- ❌ Complex implementation

**RECOMMENDATION:** Start with **Option A** (Shared Database), migrate to **Option C** as you scale.

---

## Phase 2: Multi-Tenancy Implementation

### Step 1: Add Tenant Concept to Schema

#### 1.1 Create Tenant Model

```prisma
// prisma/schema.prisma - ADD THIS

model Tenant {
  id              Int        @id @default(autoincrement())
  slug            String     @unique  // Used in URLs: "opticalshop-1"
  name            String               // "ABC Optical Retailer"
  email           String     @unique
  phone           String?
  logo            String?              // URL to logo

  // Business Info
  registrationNo  String?
  gstNo          String?
  legalName       String?
  address         String?
  city            String?
  state           String?
  country         String?
  zipcode         String?

  // Subscription
  subscriptionPlan SubscriptionPlan @default(STARTER)
  status          TenantStatus        @default(ACTIVE)

  // Billing
  stripeCustomerId String?
  billingEmail    String?
  billingAddress  String?
  taxId           String?

  // Audit
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdBy       Int?

  // Relationships
  retailers       Retailer[]
  shops           Shop[]
  staffs          Staff[]
  subscriptions   Subscription[]
  invoices        TenantInvoice[]
  auditLogs       AuditLog[]

  // Usage tracking
  usageMetrics    UsageMetric[]

  @@index([slug])
  @@index([status])
}

enum SubscriptionPlan {
  FREE
  STARTER      // Up to 5 shops, basic features
  PROFESSIONAL // Up to 50 shops, advanced features
  ENTERPRISE   // Unlimited, all features
}

enum TenantStatus {
  TRIAL
  ACTIVE
  SUSPENDED
  CANCELLED
}

model Subscription {
  id              Int        @id @default(autoincrement())
  tenantId        Int
  tenant          Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  plan            SubscriptionPlan
  startDate       DateTime
  endDate         DateTime?
  autoRenew       Boolean    @default(true)

  monthlyPrice    Float
  annualPrice     Float?

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@unique([tenantId, startDate])
}

model TenantInvoice {
  id              Int        @id @default(autoincrement())
  tenantId        Int
  tenant          Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  invoiceNumber   String     @unique
  amount          Float
  currency        String     @default("INR")
  dueDate         DateTime

  status          InvoiceStatus @default(PENDING)
  paidAt          DateTime?

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}

model UsageMetric {
  id              Int        @id @default(autoincrement())
  tenantId        Int
  tenant          Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Usage tracking
  shopCount       Int        @default(0)
  userCount       Int        @default(0)
  productCount    Int        @default(0)
  invoiceCount    Int        @default(0)

  month           Int        // 1-12
  year            Int        // 2025

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@unique([tenantId, month, year])
}
```

#### 1.2 Update Existing Models to Support Multi-Tenancy

Add `tenantId` to key models:

```prisma
// Existing models - ADD tenantId

model Retailer {
  id            Int      @id @default(autoincrement())
  tenantId      Int      // NEW: Which tenant owns this retailer
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade) // NEW

  // ... existing fields ...

  @@index([tenantId]) // NEW: For fast queries
  @@unique([tenantId, email]) // NEW: Email unique per tenant
}

model Shop {
  id            Int      @id @default(autoincrement())
  tenantId      Int      // NEW
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade) // NEW

  // ... existing fields ...

  @@index([tenantId])
  @@unique([tenantId, email])
}

model Staff {
  id            Int      @id @default(autoincrement())
  tenantId      Int      // NEW
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade) // NEW

  // ... existing fields ...

  @@index([tenantId])
  @@unique([tenantId, email])
}

model ShopAdmin {
  id            Int      @id @default(autoincrement())
  tenantId      Int      // NEW
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade) // NEW

  // ... existing fields ...

  @@index([tenantId])
  @@unique([tenantId, email])
}

model Product {
  id            Int      @id @default(autoincrement())
  tenantId      Int      // NEW
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade) // NEW

  // ... existing fields ...

  @@index([tenantId])
}

// Apply same pattern to: Company, RetailerProduct, ShopInventory,
// Invoice, Patient, Customer, Attendance, etc.
```

#### 1.3 Migration Script

```bash
# Create and apply migration
npx prisma migrate dev --name add_tenant_support
```

---

### Step 2: Tenant Context Middleware

Create middleware to extract tenant from request:

```javascript
// middleware/tenantContext.js

const tenantContext = async (req, res, next) => {
  try {
    // Extract tenant ID from multiple sources (priority order)
    let tenantId = null;

    // 1. From header (for API calls)
    if (req.headers["x-tenant-id"]) {
      tenantId = parseInt(req.headers["x-tenant-id"]);
    }

    // 2. From subdomain (e.g., "retailer-1.staffoptical.com")
    if (!tenantId && req.hostname) {
      const subdomain = req.hostname.split(".")[0];
      if (subdomain && !["www", "api", "admin"].includes(subdomain)) {
        // Query tenant by slug
        const tenant = await prisma.tenant.findUnique({
          where: { slug: subdomain },
        });
        if (tenant) tenantId = tenant.id;
      }
    }

    // 3. From JWT token (after authentication)
    if (!tenantId && req.user) {
      tenantId = req.user.tenantId;
    }

    // 4. From path (e.g., "/tenant/123/api/...")
    if (!tenantId && req.path.includes("/tenant/")) {
      const match = req.path.match(/\/tenant\/(\d+)\//);
      if (match) tenantId = parseInt(match[1]);
    }

    if (!tenantId) {
      return res.status(400).json({
        error: "Tenant identification required",
        details: "Cannot determine which tenant this request belongs to",
      });
    }

    // Verify tenant exists and is active
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true, subscriptionPlan: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.status === "SUSPENDED") {
      return res.status(403).json({
        error: "Account suspended",
        details: "Your account has been suspended. Contact support.",
      });
    }

    // Attach to request
    req.tenant = { id: tenantId, ...tenant };

    next();
  } catch (error) {
    console.error("Tenant context error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = tenantContext;
```

#### 2.1 Apply Middleware to All Routes

```javascript
// index.js - MODIFY

const tenantContext = require("./middleware/tenantContext");

// Apply tenant context to ALL routes before any business logic
app.use(tenantContext);

// Now all routes have access to req.tenant.id
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/auth", require("./routes/auth"));
// ... etc
```

---

### Step 3: Create Query Filter Service

```javascript
// services/tenantQueryService.js

class TenantQueryService {
  /**
   * Automatically add tenantId filter to all queries
   * This prevents data leakage between tenants
   */

  static async findMany(model, where = {}, options = {}) {
    return prisma[model].findMany({
      ...options,
      where: {
        ...where,
        tenantId: options.tenantId, // Auto-add tenantId filter
      },
    });
  }

  static async findUnique(model, where, options = {}) {
    const record = await prisma[model].findUnique({
      ...options,
      where,
    });

    // Verify tenant match
    if (record && record.tenantId !== options.tenantId) {
      throw new Error("Unauthorized access to this resource");
    }

    return record;
  }

  static async create(model, data, options = {}) {
    return prisma[model].create({
      ...options,
      data: {
        ...data,
        tenantId: options.tenantId, // Auto-add tenantId
      },
    });
  }

  static async update(model, where, data, options = {}) {
    // First verify ownership
    const record = await this.findUnique(model, where, options);

    if (!record) {
      throw new Error("Record not found");
    }

    return prisma[model].update({
      where,
      data,
      ...options,
    });
  }

  static async delete(model, where, options = {}) {
    // Verify ownership before deletion
    const record = await this.findUnique(model, where, options);

    if (!record) {
      throw new Error("Record not found");
    }

    return prisma[model].delete({ where });
  }
}

module.exports = TenantQueryService;
```

#### 3.1 Use in Controllers

```javascript
// Example: Update existing controller

const TenantQueryService = require("../services/tenantQueryService");

exports.getInventory = async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    // OLD (WRONG):
    // const products = await prisma.product.findMany();

    // NEW (CORRECT):
    const products = await TenantQueryService.findMany(
      "product",
      {
        /* filters */
      },
      { tenantId }
    );

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## Phase 3: Authentication & Authorization

### Step 1: Update JWT to Include Tenant

```javascript
// Update auth controller - generate JWT with tenantId

const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    // ... existing auth logic ...

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId, // ADD THIS
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, tenantId: user.tenantId }); // RETURN tenantId
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Step 2: Auth Middleware with Tenant Verification

```javascript
// middleware/auth.js - MODIFY

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify tenant match
    if (req.tenant && req.tenant.id !== decoded.tenantId) {
      return res.status(403).json({
        error: "Tenant mismatch",
        details: "Your token is for a different tenant",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
```

### Step 3: Role-Based Access Control per Tenant

```javascript
// middleware/rbac.js

const ROLE_PERMISSIONS = {
  RETAILER: ["view_shops", "create_distribution", "manage_inventory"],
  SHOP_ADMIN: ["view_inventory", "manage_staff", "approve_stock"],
  STAFF: ["stock_in", "view_inventory"],
  COMPANY: ["manage_products", "view_sales"],
  SUPER_ADMIN: ["*"], // All permissions
};

const rbac = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (permissions.includes("*") || permissions.includes(requiredPermission)) {
      next();
    } else {
      res.status(403).json({
        error: "Permission denied",
        required: requiredPermission,
        yourRole: userRole,
      });
    }
  };
};

module.exports = rbac;
```

#### 3.1 Usage in Routes

```javascript
// Example route with RBAC

router.post(
  "/stock/approve",
  authMiddleware,
  rbac("approve_stock"),
  stockController.approveStock
);
```

---

## Phase 4: Database Isolation

### Step 1: Row-Level Security (RLS) Setup

```sql
-- Create policy for ShopAdmin table
-- Only admins can see their own tenant's admins

ALTER TABLE "ShopAdmin" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can only see their own tenant" ON "ShopAdmin"
  USING (tenantId = current_setting('app.current_tenant_id')::int);

CREATE POLICY "Admins can only insert for their tenant" ON "ShopAdmin"
  WITH CHECK (tenantId = current_setting('app.current_tenant_id')::int);
```

### Step 2: Set Tenant Context in Queries

```javascript
// services/databaseService.js

class DatabaseService {
  static async executeWithTenantContext(tenantId, callback) {
    // Set session variable for RLS
    await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId.toString()}, false)`;

    try {
      return await callback();
    } finally {
      // Reset
      await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', '', false)`;
    }
  }
}

module.exports = DatabaseService;
```

---

## Phase 5: Payment & Billing

### Step 1: Integrate Stripe

```bash
npm install stripe
```

### Step 2: Subscription Models

```javascript
// services/subscriptionService.js

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class SubscriptionService {
  // Create subscription for tenant
  static async createSubscription(tenantId, plan) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const prices = {
      STARTER: process.env.STRIPE_PRICE_STARTER,
      PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL,
      ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
    };

    // Create/get Stripe customer
    let stripeCustomerId = tenant.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: tenant.email,
        name: tenant.name,
        metadata: { tenantId },
      });

      stripeCustomerId = customer.id;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: prices[plan] }],
      metadata: { tenantId, plan },
    });

    // Save to DB
    await prisma.subscription.create({
      data: {
        tenantId,
        plan,
        stripeSubscriptionId: subscription.id,
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
      },
    });

    return subscription;
  }

  // Handle webhook for payment success
  static async handlePaymentSuccess(event) {
    const subscription = event.data.object;
    const tenantId = subscription.metadata.tenantId;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: "ACTIVE",
        subscriptionPlan: subscription.metadata.plan,
      },
    });
  }

  // Cancel subscription
  static async cancelSubscription(tenantId) {
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId, endDate: null },
    });

    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.del(subscription.stripeSubscriptionId);
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { endDate: new Date() },
    });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: "CANCELLED" },
    });
  }
}

module.exports = SubscriptionService;
```

### Step 3: Usage Tracking & Limits

```javascript
// services/usageLimiter.js

class UsageLimiter {
  // Check if tenant exceeded limits for their plan
  static async checkLimits(tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { usageMetrics: true },
    });

    const LIMITS = {
      FREE: { shops: 1, users: 3, products: 100 },
      STARTER: { shops: 5, users: 10, products: 1000 },
      PROFESSIONAL: { shops: 50, users: 100, products: 10000 },
      ENTERPRISE: { shops: 999, users: 9999, products: 999999 },
    };

    const limits = LIMITS[tenant.subscriptionPlan];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const usage = tenant.usageMetrics.find(
      (m) => m.month === currentMonth && m.year === currentYear
    );

    return {
      isValid: {
        shops: !usage || usage.shopCount < limits.shops,
        users: !usage || usage.userCount < limits.users,
        products: !usage || usage.productCount < limits.products,
      },
      limits,
      current: usage || { shopCount: 0, userCount: 0, productCount: 0 },
    };
  }
}

module.exports = UsageLimiter;
```

---

## Phase 6: Deployment & Infrastructure

### Step 1: Cloud Architecture (AWS/GCP/Azure)

#### Option A: Render.com (Easiest - Recommended for MVP)

```
┌──────────────────┐
│  Render.com      │
│ ┌──────────────┐ │
│ │  Express App │ │ Node.js app (auto-deploys)
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ PostgreSQL   │ │ Managed database
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │  Redis Cache │ │ For sessions/cache
│ └──────────────┘ │
└──────────────────┘
```

**Setup Steps:**

```bash
1. Create account at render.com
2. Connect GitHub repository
3. Create PostgreSQL database
4. Set environment variables
5. Deploy

# Environment Variables Needed:
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
JWT_SECRET=your_secret
REDIS_URL=redis://...
NODE_ENV=production
```

#### Option B: Docker + Kubernetes (Production Scale)

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Run migrations
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
```

**Deploy to Kubernetes:**

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: staff-optical-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: staff-optical-api
  template:
    metadata:
      labels:
        app: staff-optical-api
    spec:
      containers:
        - name: api
          image: your-registry/staff-optical:latest
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: staff-optical-service
spec:
  type: LoadBalancer
  selector:
    app: staff-optical-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```

### Step 2: Environment Configuration

```bash
# .env.production
NODE_ENV=production
PORT=8080

# Database
DATABASE_URL=postgresql://user:pass@host:5432/staff_optical_prod

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRY=86400

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
SENDER_EMAIL=noreply@staffoptical.saas

# Redis Cache
REDIS_URL=redis://cache:6379

# Application
APP_URL=https://api.staffoptical.saas
CORS_ORIGIN=https://app.staffoptical.saas

# Logging
LOG_LEVEL=info
```

### Step 3: CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm install
      - run: npm test
      - run: npx prisma migrate deploy

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }} \
            -X POST
```

---

## Phase 7: Security & Compliance

### Step 1: Data Protection

```javascript
// Encryption for sensitive data

const crypto = require("crypto");

class DataEncryption {
  static encrypt(plaintext, tenantId) {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY + tenantId,
      "salt",
      32
    );

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}.${encrypted}.${authTag.toString("hex")}`;
  }

  static decrypt(ciphertext, tenantId) {
    const [ivHex, encrypted, authTagHex] = ciphertext.split(".");
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY + tenantId,
      "salt",
      32
    );

    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

module.exports = DataEncryption;
```

### Step 2: Compliance & Audit Logging

```javascript
// services/auditService.js

class AuditService {
  static async log(tenantId, userId, action, resource, details = {}) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        resource,
        resourceId: details.resourceId,
        changes: JSON.stringify(details.changes || {}),
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        timestamp: new Date(),
      },
    });
  }
}

// Usage in controllers:
exports.deleteShop = async (req, res) => {
  try {
    const shopId = req.params.id;

    // ... delete logic ...

    // Log the action
    await AuditService.log(req.tenant.id, req.user.userId, "DELETE", "Shop", {
      resourceId: shopId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ message: "Shop deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Step 3: API Rate Limiting per Tenant

```javascript
// middleware/tenantRateLimit.js

const rateLimit = require("express-rate-limit");

const tenantRateLimiter = rateLimit({
  keyGenerator: (req) => req.tenant.id, // Rate limit per tenant
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits per plan
    const limits = {
      FREE: 100,
      STARTER: 1000,
      PROFESSIONAL: 10000,
      ENTERPRISE: 100000,
    };
    return limits[req.tenant.subscriptionPlan] || 100;
  },
  message: "You have exceeded API requests. Upgrade your plan or wait.",
});

module.exports = tenantRateLimiter;
```

---

## Phase 8: Testing & Rollout

### Step 1: Multi-Tenant Test Suite

```javascript
// tests/tenant-isolation.test.js

describe("Tenant Isolation", () => {
  let tenant1, tenant2;
  let retailer1, retailer2;

  beforeAll(async () => {
    // Create test tenants
    tenant1 = await prisma.tenant.create({
      data: { slug: "tenant1", name: "Tenant 1", email: "tenant1@test.com" },
    });

    tenant2 = await prisma.tenant.create({
      data: { slug: "tenant2", name: "Tenant 2", email: "tenant2@test.com" },
    });
  });

  test("Tenant 1 cannot see Tenant 2 data", async () => {
    // Create retailer for tenant1
    retailer1 = await TenantQueryService.create(
      "retailer",
      { name: "Retailer 1", email: "r1@test.com" },
      { tenantId: tenant1.id }
    );

    // Create retailer for tenant2
    retailer2 = await TenantQueryService.create(
      "retailer",
      { name: "Retailer 2", email: "r2@test.com" },
      { tenantId: tenant2.id }
    );

    // Query tenant1 data as tenant2 user
    const result = await TenantQueryService.findMany(
      "retailer",
      {},
      { tenantId: tenant2.id }
    );

    // Should NOT include tenant1's retailer
    expect(result.map((r) => r.id)).not.toContain(retailer1.id);
    expect(result.map((r) => r.id)).toContain(retailer2.id);
  });
});
```

### Step 2: Load Testing

```javascript
// tests/load-test.js
const autocannon = require("autocannon");

const run = async () => {
  const result = await autocannon({
    url: "https://api.staffoptical.saas",
    connections: 100,
    pipelining: 10,
    duration: 30,
    requests: [
      {
        path: "/api/inventory",
        headers: {
          Authorization: "Bearer token",
          "x-tenant-id": "1",
        },
      },
    ],
  });

  console.log("Load test results:", result);
};

run();
```

### Step 3: Rollout Strategy

#### Phase 1: Internal Testing (Week 1-2)

- Test with 5 internal tenants
- Verify data isolation
- Check performance metrics

#### Phase 2: Beta Launch (Week 3-4)

- Invite 20-50 beta customers
- Monitor usage patterns
- Gather feedback
- Fix issues found

#### Phase 3: Public Launch (Week 5+)

- Open to all customers
- Monitor 24/7 for issues
- Gradual marketing rollout
- Plan enhancements based on feedback

---

## Timeline & Resource Plan

### 6-Month Implementation Timeline

```
MONTH 1: Architecture & Design
├─ Week 1-2: Design multi-tenant schema
├─ Week 3: Set up CI/CD pipeline
└─ Week 4: Create tenant management UI

MONTH 2: Core Implementation
├─ Week 1-2: Implement tenant context middleware
├─ Week 3: Add tenantId to all models
└─ Week 4: Update authentication

MONTH 3: Advanced Features
├─ Week 1-2: Integrate Stripe billing
├─ Week 3: Implement usage tracking
└─ Week 4: Set up audit logging

MONTH 4: Security & Compliance
├─ Week 1: Data encryption
├─ Week 2: GDPR compliance
├─ Week 3: Security testing (pen test)
└─ Week 4: Create security docs

MONTH 5: Testing & Optimization
├─ Week 1: Load testing
├─ Week 2: Performance optimization
├─ Week 3: Beta testing with customers
└─ Week 4: Bug fixes from beta

MONTH 6: Launch & Support
├─ Week 1: Final preparations
├─ Week 2: Public launch
├─ Week 3-4: Monitor and support
```

### Required Resources

**Team:**

- 1 Backend Developer (Lead) - 80% effort
- 1 Frontend Developer - 50% effort
- 1 DevOps/Infrastructure Engineer - 50% effort
- 1 QA Engineer - 30% effort
- 1 Product Manager - 30% effort

**Budget Estimate:**

- Developer salaries: $60,000/month (6 months)
- Infrastructure: $5,000/month (servers, databases)
- Tools: $2,000/month (monitoring, testing)
- Total: ~$400,000

**Cost Reduction Tips:**

- Use managed services (Render, Vercel)
- Shared database initially
- Outsource QA testing
- Use open-source tools

---

## Quick Reference: File Structure

```
staff-optical/
├── prisma/
│   └── schema.prisma (with Tenant model)
├── middleware/
│   ├── tenantContext.js (NEW)
│   ├── auth.js (MODIFIED)
│   ├── rbac.js (NEW)
│   └── tenantRateLimit.js (NEW)
├── services/
│   ├── tenantQueryService.js (NEW)
│   ├── subscriptionService.js (NEW)
│   ├── usageLimiter.js (NEW)
│   ├── auditService.js (NEW)
│   └── dataEncryption.js (NEW)
├── routes/
│   ├── auth.js (MODIFIED)
│   ├── tenant.js (NEW - for tenant management)
│   ├── billing.js (NEW)
│   └── (all other routes updated with tenantId)
├── controllers/
│   ├── (all updated to use TenantQueryService)
│   └── tenantController.js (NEW)
├── .github/
│   └── workflows/
│       └── deploy.yml (NEW)
└── tests/
    ├── tenant-isolation.test.js (NEW)
    └── load-test.js (NEW)
```

---

## Critical Checklist

- [ ] Tenant model added to schema
- [ ] All models updated with tenantId
- [ ] Tenant context middleware implemented
- [ ] All controllers using TenantQueryService
- [ ] Authentication includes tenantId in JWT
- [ ] Stripe integration complete
- [ ] Audit logging active
- [ ] Data encryption implemented
- [ ] Rate limiting per tenant
- [ ] CI/CD pipeline setup
- [ ] Database migration tested
- [ ] Load testing passed
- [ ] Security audit completed
- [ ] Customer documentation created
- [ ] Support team trained

---

## Common Issues & Solutions

### Issue 1: Queries returning cross-tenant data

**Solution:** Always use `TenantQueryService` with tenantId

### Issue 2: Performance degradation with shared database

**Solution:** Add indexes on tenantId columns, implement caching

### Issue 3: Data migration complexity

**Solution:** Use Prisma migrations, test in staging first

### Issue 4: Billing synchronization issues

**Solution:** Use Stripe webhooks, implement retry logic

### Issue 5: Tenant onboarding delays

**Solution:** Automate tenant creation, pre-populate templates

---

## Success Metrics

- **User Adoption:** 100+ tenants in first 3 months
- **System Uptime:** 99.9%
- **Response Time:** < 200ms average
- **Customer Retention:** > 80%
- **NPS Score:** > 50
- **Support Tickets:** < 5 per tenant per month

---

## Next Steps

1. **Week 1:** Review this document with team
2. **Week 2:** Create detailed task breakdown
3. **Week 3:** Start Phase 1 implementation
4. **Ongoing:** Regular progress reviews

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Status:** Ready for Implementation
