const axios = require('axios');

async function testInventoryAdjust() {
  try {
    console.log('Testing inventory adjustment endpoint...');
    
    // Test the inventory adjustment directly without login first
    const adjustResponse = await axios.post(
      'http://localhost:8080/shop-admin/inventory/adjust',
      {
        productId: 1,
        newQuantity: 4,
        reason: "DAMAGE - Physical damage during handling",
        notes: "5 units damaged during handling"
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Inventory adjustment successful:', adjustResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

testInventoryAdjust();