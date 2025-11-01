```
███████╗██████╗  █████╗ ██████╗ ██╗  ██╗██╗     ██╗███╗   ██╗███████╗
██╔════╝██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██║     ██║████╗  ██║██╔════╝
███████╗██████╔╝███████║██████╔╝█████╔╝ ██║     ██║██╔██╗ ██║█████╗
╚════██║██╔═══╝ ██╔══██║██╔══██╗██╔═██╗ ██║     ██║██║╚██╗██║██╔══╝
███████║██║     ██║  ██║██║  ██║██║  ██╗███████╗██║██║ ╚████║███████╗
╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝

     ██╗    ██╗ ██████╗ ██████╗ ██╗     ██████╗
     ██║    ██║██╔═══██╗██╔══██╗██║     ██╔══██╗
     ██║ █╗ ██║██║   ██║██████╔╝██║     ██║  ██║
     ██║███╗██║██║   ██║██╔══██╗██║     ██║  ██║
     ╚███╔███╔╝╚██████╔╝██║  ██║███████╗██████╔╝
      ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝

   ████████╗███████╗ ██████╗██╗  ██╗███╗   ██╗ ██████╗ ██╗      ██████╗  ██████╗ ██╗   ██╗
   ╚══██╔══╝██╔════╝██╔════╝██║  ██║████╗  ██║██╔═══██╗██║     ██╔═══██╗██╔════╝ ╚██╗ ██╔╝
      ██║   █████╗  ██║     ███████║██╔██╗ ██║██║   ██║██║     ██║   ██║██║  ███╗ ╚████╔╝
      ██║   ██╔══╝  ██║     ██╔══██║██║╚██╗██║██║   ██║██║     ██║   ██║██║   ██║  ╚██╔╝
      ██║   ███████╗╚██████╗██║  ██║██║ ╚████║╚██████╔╝███████╗╚██████╔╝╚██████╔╝   ██║
      ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝    ╚═╝
```

# Staff Optical — Eyewear Management Backend API

A robust Express.js + Prisma backend for managing an eyewear retail operation. Handles inventory, invoices, patients, staff, prescriptions, payments, and reporting with multi-shop isolation and secure JWT authentication.

## Features

- **Multi-Shop Support** — Complete shop isolation with secure access control
- **Inventory Management** — Stock tracking with barcode/SKU generation and audit trails
- **Invoice System** — Patient & walk-in customer invoices with tax calculations
- **PDF & Thermal Receipts** — Professional invoice PDFs and thermal printer formatting
- **Prescription Management** — Eye power data linked to patient records
- **Payment Processing** — Multi-method payments with gift card support
- **Reporting** — Daily/monthly sales, staff performance, and product analytics
- **Authentication** — JWT-based staff login with attendance tracking
- **Barcode System** — Unique barcode/SKU generation with collision avoidance

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL or MySQL (configured in Prisma)
- npm or yarn

### Installation

```bash
# Clone & install
git clone <repo>
cd staff-optical
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL, PORT, JWT_SECRET, etc.

# Prepare database
npx prisma migrate dev

# Start server
npm run dev  # development with watch
npm start    # production
```

Server runs on `http://localhost:8080` by default.



## Development

```bash
# Run with auto-reload
npm run dev

# Run tests (if configured)
npm test

# Format & lint
npm run lint
```

## Contributing

- Keep PRs focused and atomic
- Add tests for business logic and new migrations
- Follow existing transaction & shop-isolation patterns
- Update docs for new endpoints or major changes

## License

MIT
