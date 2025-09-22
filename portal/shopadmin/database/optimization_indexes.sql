-- Shop Admin Portal Database Optimization Indexes
-- Run these indexes to optimize performance for high-load scenarios

-- ===== SHOP ADMIN INDEXES =====

-- Optimize shop admin authentication lookup
CREATE INDEX IF NOT EXISTS idx_shop_admin_email ON "ShopAdmin"("email");
CREATE INDEX IF NOT EXISTS idx_shop_admin_shop_id ON "ShopAdmin"("shopId");

-- ===== SHOP INDEXES =====

-- Optimize shop lookups
CREATE INDEX IF NOT EXISTS idx_shop_email ON "Shop"("email");

-- ===== INVOICE INDEXES =====

-- Optimize invoice queries for dashboard and reports
CREATE INDEX IF NOT EXISTS idx_invoice_shop_id ON "Invoice"("shopId");
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON "Invoice"("createdAt");
CREATE INDEX IF NOT EXISTS idx_invoice_shop_date ON "Invoice"("shopId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_invoice_status ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS idx_invoice_staff_id ON "Invoice"("staffId");

-- ===== PRODUCT INDEXES =====

-- Optimize inventory queries
CREATE INDEX IF NOT EXISTS idx_product_shop_id ON "Product"("shopId");
CREATE INDEX IF NOT EXISTS idx_product_quantity ON "Product"("quantity");
CREATE INDEX IF NOT EXISTS idx_product_shop_quantity ON "Product"("shopId", "quantity");
CREATE INDEX IF NOT EXISTS idx_product_category ON "Product"("category");
CREATE INDEX IF NOT EXISTS idx_product_sku ON "Product"("sku");
CREATE INDEX IF NOT EXISTS idx_product_name ON "Product"("name");
CREATE INDEX IF NOT EXISTS idx_product_search ON "Product"("shopId", "name", "sku");

-- ===== SHOP STAFF INDEXES =====

-- Optimize staff queries
CREATE INDEX IF NOT EXISTS idx_shop_staff_shop_id ON "ShopStaff"("shopId");
CREATE INDEX IF NOT EXISTS idx_shop_staff_status ON "ShopStaff"("status");
CREATE INDEX IF NOT EXISTS idx_shop_staff_shop_status ON "ShopStaff"("shopId", "status");

-- ===== ATTENDANCE INDEXES =====

-- Optimize attendance reports
CREATE INDEX IF NOT EXISTS idx_attendance_shop_staff_id ON "Attendance"("shopStaffId");
CREATE INDEX IF NOT EXISTS idx_attendance_date ON "Attendance"("date");
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON "Attendance"("shopStaffId", "date");

-- ===== DOCTOR INDEXES =====

-- Optimize doctor queries
CREATE INDEX IF NOT EXISTS idx_doctor_shop_id ON "Doctor"("shopId");
CREATE INDEX IF NOT EXISTS idx_doctor_status ON "Doctor"("status");

-- ===== AUDIT LOG INDEXES =====

-- Optimize audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON "AuditLog"("adminId");
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS idx_audit_log_target_type ON "AuditLog"("targetType");
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_date ON "AuditLog"("adminId", "createdAt");

-- ===== CUSTOMER INDEXES =====

-- Optimize customer queries
CREATE INDEX IF NOT EXISTS idx_customer_shop_id ON "Customer"("shopId");
CREATE INDEX IF NOT EXISTS idx_customer_phone ON "Customer"("phone");
CREATE INDEX IF NOT EXISTS idx_customer_email ON "Customer"("email");

-- ===== STOCK RECEIPT INDEXES =====

-- Optimize stock receipt queries
CREATE INDEX IF NOT EXISTS idx_stock_receipt_shop_id ON "StockReceipt"("shopId");
CREATE INDEX IF NOT EXISTS idx_stock_receipt_status ON "StockReceipt"("status");
CREATE INDEX IF NOT EXISTS idx_stock_receipt_created_at ON "StockReceipt"("createdAt");
CREATE INDEX IF NOT EXISTS idx_stock_receipt_shop_status ON "StockReceipt"("shopId", "status");

-- ===== COMPOSITE INDEXES FOR COMMON QUERIES =====

-- Dashboard metrics optimization
CREATE INDEX IF NOT EXISTS idx_invoice_dashboard_metrics ON "Invoice"("shopId", "createdAt", "total");

-- Inventory status optimization  
CREATE INDEX IF NOT EXISTS idx_product_inventory_status ON "Product"("shopId", "quantity", "category");

-- Staff performance optimization
CREATE INDEX IF NOT EXISTS idx_attendance_performance ON "Attendance"("shopStaffId", "date", "status");

-- Sales report optimization
CREATE INDEX IF NOT EXISTS idx_invoice_sales_report ON "Invoice"("shopId", "createdAt", "staffId", "total");

-- Low stock alerts optimization
CREATE INDEX IF NOT EXISTS idx_product_low_stock ON "Product"("shopId", "quantity", "minStockLevel");

-- Recent activities optimization
CREATE INDEX IF NOT EXISTS idx_audit_log_recent ON "AuditLog"("adminId", "createdAt", "action");

-- ===== PERFORMANCE TIPS =====

-- 1. Update table statistics regularly:
-- ANALYZE "ShopAdmin", "Invoice", "Product", "ShopStaff", "Attendance";

-- 2. Consider partitioning large tables by date:
-- - Invoice table by month
-- - AuditLog table by month
-- - Attendance table by month

-- 3. Monitor slow queries and add specific indexes as needed

-- 4. Use database connection pooling in application

-- 5. Implement read replicas for reporting queries

-- ===== NOTES =====

-- These indexes are designed to optimize:
-- 1. Shop admin authentication (sub-millisecond lookups)
-- 2. Dashboard data loading (fast aggregations)
-- 3. Report generation (efficient date range queries)
-- 4. Inventory management (quick stock lookups)
-- 5. Staff management (rapid staff queries)
-- 6. Audit trail queries (fast log searches)

-- Monitor index usage with:
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_tup_read DESC;