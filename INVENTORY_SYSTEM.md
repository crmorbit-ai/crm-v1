# Master Inventory System

## Overview
Complete inventory management system integrated into the Customer Database page with 4 specialized inventory tabs.

## Frontend Components

### Pages
- **MasterInventory.js** - Main inventory dashboard with all item types, stats, search, filters
- **ProductInventory.js** - Product-specific inventory with SKU, category, price, stock
- **ServiceInventory.js** - Service-specific inventory with type, duration, rate
- **LeadInventory.js** - Lead-specific inventory with email, phone, source

### Forms (All Include)
- **Basic Info**: Name*, Type/Department, Status, Description
- **Type-Specific Fields**:
  - Products: SKU, Category, Price, Stock
  - Services: ServiceType, Duration, ServiceRate
  - Leads: Email, Phone, Source
- **Financial**: QuotedAmount, WonAmount, ReceivedAmount
- **Additional**: Notes, Tags

### Features
- Add/Edit/Delete items
- Search and filter (by type, department, status)
- Pagination support
- Dashboard stats cards
- Soft delete (items marked inactive)
- Responsive grid layout

## Backend API

### Routes: `/api/master-inventory`
- `GET /dashboard` - Get statistics (count by type/dept)
- `GET /` - Get all items (paginated, filterable)
- `GET /type/:type` - Get items by type
- `GET /:id` - Get single item
- `POST /` - Create item
- `PATCH /:id` - Update item
- `DELETE /:id` - Soft delete item

### Model: MasterInventoryItem
- Fields for all item types
- Tenant isolation
- Indexed for performance
- Timestamps and audit fields

## Integration

### DataCenter.js
Located at line 238-1300:
- Added `dbTab` state to track active tab
- 5 tabs: Customers, Master Inventory, Product Inventory, Service Inventory, Lead Inventory
- Tab buttons with active state styling
- Conditional rendering for each tab content

### Service Layer: masterInventoryService.js
- Error fallbacks for all methods
- Returns default empty responses if API fails
- Prevents UI crashes even if backend is down

## Usage

1. Navigate to Customer Database page
2. Click on one of the inventory tabs:
   - **Master Inventory** - Unified view of all items
   - **Product Inventory** - Product-specific view
   - **Service Inventory** - Service-specific view
   - **Lead Inventory** - Lead-specific view
3. Click "+ Add" button to create new items
4. Use search and filters to find items
5. Click edit/delete icons to manage items

## Status
✅ Frontend: Complete with all forms and tables
✅ Backend: Complete with API routes and model
✅ Integration: Fully integrated into DataCenter page
✅ Error Handling: Fallback responses implemented
✅ Testing: Both dev servers running successfully
