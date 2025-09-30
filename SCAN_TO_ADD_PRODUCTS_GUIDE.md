# 🔍 Enhanced Barcode Scanner - Add Products by Scanning

## Overview

This enhanced scanner system allows you to **add new products by barcode scanning**. When you scan a barcode that doesn't exist in the system, you can quickly create a new product with all details.

---

## 🚀 **New Feature: Scan-to-Add Products**

### **Workflow:**
1. **Scan unknown barcode** → System says "Product not found"
2. **Fill product details** → Name, price, category, etc.
3. **Submit** → Product created with scanned barcode
4. **Ready to use** → Can immediately stock-in/stock-out

---

## 📡 **API Endpoints**

### **1. Check if Product Exists**
```http
GET /api/inventory/product/barcode/{barcode}
Authorization: Bearer <token>
```

**Response (Product Not Found):**
```json
{
  "error": "Product with barcode EYE123456789 not found.",
  "suggestion": "Check if the barcode is correct or if the product needs to be added to the system.",
  "canCreateNew": true,
  "scannedBarcode": "EYE123456789",
  "nextAction": "Use POST /api/inventory/product/scan-to-add to create a new product with this barcode"
}
```

### **2. Add Product by Barcode Scan**
```http
POST /api/inventory/product/scan-to-add
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "scannedBarcode": "EYE123456789",
  "name": "Ray-Ban Aviator Classic",
  "description": "Premium aviator sunglasses with gold frame",
  "basePrice": 2500.00,
  "eyewearType": "SUNGLASSES",
  "frameType": "AVIATOR",
  "companyId": 1,
  "material": "Metal",
  "color": "Gold",
  "size": "58mm",
  "model": "RB3025",
  "quantity": 10,
  "sellingPrice": 2750.00
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "message": "Product created successfully from barcode scan",
  "product": {
    "id": 789,
    "name": "Ray-Ban Aviator Classic",
    "description": "Premium aviator sunglasses with gold frame",
    "barcode": "EYE123456789",
    "sku": null,
    "basePrice": 2500.00,
    "eyewearType": "SUNGLASSES",
    "frameType": "AVIATOR",
    "material": "Metal",
    "color": "Gold",
    "size": "58mm",
    "model": "RB3025",
    "company": {
      "id": 1,
      "name": "Ray-Ban"
    },
    "createdAt": "2025-09-30T15:30:00.000Z"
  },
  "inventory": {
    "id": 456,
    "quantity": 10,
    "sellingPrice": 2750.00,
    "lastRestockedAt": "2025-09-30T15:30:00.000Z"
  },
  "scanDetails": {
    "scannedBarcode": "EYE123456789",
    "productCreated": true,
    "canNowScan": true,
    "nextActions": [
      "Generate SKU (optional)",
      "Print barcode label",
      "Start stock operations"
    ]
  }
}
```

---

## 💻 **Frontend Implementation**

### **Enhanced Scanner with Add-Product Feature:**

```javascript
class EnhancedBarcodeScanner {
  constructor() {
    this.scannerBuffer = '';
    this.scanTimeout = null;
    this.lastScanTime = 0;
    this.init();
  }

  init() {
    document.addEventListener('keypress', (e) => this.handleKeyPress(e));
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyPress(e) {
    const currentTime = Date.now();
    
    if (currentTime - this.lastScanTime > 100) {
      this.scannerBuffer = '';
    }
    
    this.lastScanTime = currentTime;

    if (e.key !== 'Enter') {
      this.scannerBuffer += e.key;
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Enter' && this.scannerBuffer.length > 0) {
      e.preventDefault();
      this.processBarcodeScanned(this.scannerBuffer);
      this.scannerBuffer = '';
    }
  }

  async processBarcodeScanned(barcode) {
    console.log('📷 Barcode Scanned:', barcode);
    
    try {
      // Try to find existing product
      const productInfo = await this.getProductByBarcode(barcode);
      
      if (productInfo) {
        // Product exists - show normal actions
        this.showProductActions(productInfo, barcode);
      } else {
        // Product doesn't exist - show add product option
        this.showAddProductOption(barcode);
      }
      
    } catch (error) {
      if (error.status === 404) {
        // Product not found - show add product option
        this.showAddProductOption(barcode);
      } else {
        this.showError('Failed to process scanned barcode');
      }
    }
  }

  async getProductByBarcode(barcode) {
    const response = await fetch(`/api/inventory/product/barcode/${barcode}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      const errorData = await response.json();
      throw { status: 404, data: errorData };
    } else {
      throw new Error('API Error');
    }
  }

  showAddProductOption(barcode) {
    const modal = document.createElement('div');
    modal.className = 'scanner-modal add-product-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>📷 Unknown Barcode Scanned</h3>
        <div class="barcode-info">
          <p><strong>Barcode:</strong> ${barcode}</p>
          <p><em>This product doesn't exist in the system yet.</em></p>
        </div>
        
        <div class="action-buttons">
          <button onclick="scanner.showAddProductForm('${barcode}')" class="primary">
            ➕ Add New Product
          </button>
          <button onclick="scanner.rescanBarcode()">
            🔄 Scan Again
          </button>
          <button onclick="scanner.closeModal()">
            ❌ Cancel
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
  }

  showAddProductForm(barcode) {
    this.closeModal();
    
    const formModal = document.createElement('div');
    formModal.className = 'scanner-modal add-product-form-modal';
    formModal.innerHTML = `
      <div class="modal-content">
        <h3>➕ Add New Product</h3>
        <div class="barcode-display">
          <strong>Barcode:</strong> ${barcode}
        </div>
        
        <form id="addProductForm" onsubmit="scanner.submitNewProduct(event, '${barcode}')">
          <div class="form-group">
            <label>Product Name *</label>
            <input type="text" name="name" required placeholder="e.g., Ray-Ban Aviator Classic">
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" placeholder="Product description..."></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Base Price *</label>
              <input type="number" name="basePrice" step="0.01" required placeholder="2500.00">
            </div>
            
            <div class="form-group">
              <label>Selling Price</label>
              <input type="number" name="sellingPrice" step="0.01" placeholder="2750.00">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Eyewear Type *</label>
              <select name="eyewearType" required onchange="scanner.updateFrameTypeOptions(this.value)">
                <option value="">Select Type</option>
                <option value="GLASSES">Glasses</option>
                <option value="SUNGLASSES">Sunglasses</option>
                <option value="LENSES">Lenses</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Frame Type</label>
              <select name="frameType" id="frameTypeSelect">
                <option value="">Select Frame Type</option>
                <option value="RECTANGULAR">Rectangular</option>
                <option value="OVAL">Oval</option>
                <option value="ROUND">Round</option>
                <option value="SQUARE">Square</option>
                <option value="AVIATOR">Aviator</option>
                <option value="WAYFARER">Wayfarer</option>
                <option value="CAT_EYE">Cat Eye</option>
                <option value="CLUBMASTER">Clubmaster</option>
                <option value="RIMLESS">Rimless</option>
                <option value="SEMI_RIMLESS">Semi Rimless</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Company *</label>
            <select name="companyId" required id="companySelect">
              <option value="">Select Company</option>
              <!-- Companies will be loaded dynamically -->
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Material</label>
              <input type="text" name="material" placeholder="e.g., Metal, Plastic">
            </div>
            
            <div class="form-group">
              <label>Color</label>
              <input type="text" name="color" placeholder="e.g., Gold, Black">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Size</label>
              <input type="text" name="size" placeholder="e.g., 58mm">
            </div>
            
            <div class="form-group">
              <label>Model</label>
              <input type="text" name="model" placeholder="e.g., RB3025">
            </div>
          </div>
          
          <div class="form-group">
            <label>Initial Quantity</label>
            <input type="number" name="quantity" min="0" value="0" placeholder="0">
          </div>
          
          <div class="form-buttons">
            <button type="submit" class="primary">💾 Create Product</button>
            <button type="button" onclick="scanner.closeModal()">❌ Cancel</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(formModal);
    setTimeout(() => formModal.classList.add('show'), 10);
    
    // Load companies
    this.loadCompanies();
  }

  async loadCompanies() {
    try {
      const response = await fetch('/api/inventory/companies', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const companies = await response.json();
        const select = document.getElementById('companySelect');
        
        companies.forEach(company => {
          const option = document.createElement('option');
          option.value = company.id;
          option.textContent = company.name;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  }

  updateFrameTypeOptions(eyewearType) {
    const frameTypeSelect = document.getElementById('frameTypeSelect');
    
    if (eyewearType === 'LENSES') {
      frameTypeSelect.disabled = true;
      frameTypeSelect.value = '';
    } else {
      frameTypeSelect.disabled = false;
    }
  }

  async submitNewProduct(event, barcode) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
      scannedBarcode: barcode,
      name: formData.get('name'),
      description: formData.get('description'),
      basePrice: parseFloat(formData.get('basePrice')),
      sellingPrice: formData.get('sellingPrice') ? parseFloat(formData.get('sellingPrice')) : undefined,
      eyewearType: formData.get('eyewearType'),
      frameType: formData.get('frameType') || null,
      companyId: parseInt(formData.get('companyId')),
      material: formData.get('material'),
      color: formData.get('color'),
      size: formData.get('size'),
      model: formData.get('model'),
      quantity: parseInt(formData.get('quantity')) || 0
    };

    try {
      this.showLoading('Creating product...');
      
      const response = await fetch('/api/inventory/product/scan-to-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();
      
      if (result.success) {
        this.closeModal();
        this.showSuccess(`✅ Product created: ${result.product.name}`);
        this.playSuccessSound();
        
        // Show product actions for newly created product
        setTimeout(() => {
          this.showProductActions({
            product: result.product,
            inventory: result.inventory
          }, barcode);
        }, 2000);
        
      } else {
        this.showError(result.error || 'Failed to create product');
      }
      
    } catch (error) {
      this.showError('Failed to create product');
      console.error('Product creation error:', error);
    }
  }

  showProductActions(productInfo, barcode) {
    const modal = document.createElement('div');
    modal.className = 'scanner-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>📷 Product Found</h3>
        <div class="product-info">
          <p><strong>${productInfo.product.name}</strong></p>
          <p>Barcode: ${barcode}</p>
          <p>Current Stock: ${productInfo.inventory?.quantity || 0}</p>
          <p>Price: ₹${productInfo.product.basePrice}</p>
          <p>Company: ${productInfo.product.company.name}</p>
        </div>
        <div class="action-buttons">
          <button onclick="scanner.stockIn('${barcode}')">📦 Stock In</button>
          <button onclick="scanner.stockOut('${barcode}')">📤 Stock Out</button>
          <button onclick="scanner.generateLabel('${productInfo.product.id}')">🏷️ Print Label</button>
          <button onclick="scanner.closeModal()">❌ Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
  }

  async stockIn(barcode, quantity = 1) {
    // Same as before...
  }

  async stockOut(barcode, quantity = 1) {
    // Same as before...
  }

  showLoading(message) {
    // Show loading indicator
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `<div class="spinner">${message}</div>`;
    document.body.appendChild(loader);
  }

  hideLoading() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) loader.remove();
  }

  rescanBarcode() {
    this.closeModal();
    this.showInfo('Ready to scan next barcode...');
  }

  closeModal() {
    this.hideLoading();
    const modals = document.querySelectorAll('.scanner-modal');
    modals.forEach(modal => modal.remove());
  }

  showSuccess(message) {
    console.log('✅', message);
    // Show success notification
  }

  showError(message) {
    console.error('❌', message);
    // Show error notification
  }

  showInfo(message) {
    console.log('ℹ️', message);
    // Show info notification
  }

  playSuccessSound() {
    const audio = new Audio('/sounds/beep-success.mp3');
    audio.play().catch(() => {});
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }
}

// Initialize enhanced scanner
const scanner = new EnhancedBarcodeScanner();
```

---

## 🎯 **Usage Scenarios**

### **Scenario 1: Existing Product**
1. Scan barcode → Product found
2. Show product details + stock
3. Choose action (Stock In/Out/Label)

### **Scenario 2: New Product**
1. Scan unknown barcode → "Product not found"
2. Click "Add New Product"
3. Fill product details form
4. Product created with scanned barcode
5. Ready for stock operations

### **Scenario 3: Bulk Product Addition**
1. Scan multiple unknown barcodes
2. Add each one with details
3. All products ready for inventory

---

## 📋 **Required Fields for New Products**

### **Mandatory:**
- ✅ `scannedBarcode` - The barcode that was scanned
- ✅ `name` - Product name
- ✅ `basePrice` - Base price
- ✅ `eyewearType` - GLASSES, SUNGLASSES, or LENSES
- ✅ `companyId` - Company/Brand ID

### **Optional:**
- `description` - Product description
- `frameType` - Frame style (required for GLASSES/SUNGLASSES)
- `material` - Frame material
- `color` - Product color
- `size` - Size specification
- `model` - Model number
- `quantity` - Initial stock quantity
- `sellingPrice` - Shop selling price override

---

## ✅ **Benefits of Scan-to-Add**

1. **⚡ Speed**: Add products instantly while scanning
2. **📊 Accuracy**: Barcode is automatically captured
3. **🔄 Workflow**: Seamless integration with existing scanner
4. **📋 Complete**: All product details in one form
5. **🎯 Ready**: Immediately available for stock operations

---

## 🔧 **API Testing**

### **Test with Postman:**

```bash
# 1. Check if barcode exists
GET /api/inventory/product/barcode/TEST123456789

# 2. Add new product with scanned barcode
POST /api/inventory/product/scan-to-add
{
  "scannedBarcode": "TEST123456789",
  "name": "Test Product",
  "basePrice": 100.00,
  "eyewearType": "GLASSES",
  "frameType": "RECTANGULAR",
  "companyId": 1,
  "quantity": 5
}

# 3. Verify product was created
GET /api/inventory/product/barcode/TEST123456789
```

---

## 🎉 **Result**

**Yes! You can now add new products by barcode scanning!**

✅ **Scan unknown barcode** → Get option to add new product  
✅ **Fill product details** → All details captured in one form  
✅ **Product created** → Ready for immediate use  
✅ **Stock operations** → Can immediately stock-in/stock-out  
✅ **Label printing** → Generate labels for new products  

This feature makes your barcode scanner system complete for both **existing products** and **new product addition**!