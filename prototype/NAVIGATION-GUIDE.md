# Navigation Guide - How Pages Are Linked

## Current Navigation Structure

### How Pages Are Currently Linked

**Issue:** Each page has its own limited navigation menu showing only related pages.

**Solution:** Created dynamic navigation system (`js/navigation.js`) that builds complete navigation for all pages.

## Navigation Linking Methods

### 1. Sidebar Navigation (Primary)
- **Location:** Left sidebar on every page
- **Type:** Hierarchical menu organized by functional area
- **Sections:**
  - Foundation (Merchandise Hierarchy, Org Hierarchy)
  - Items (Items, Item Attributes, Supplier Items)
  - Master Data (Suppliers, Locations)
  - Inventory (Positions, Counts, Physical Inventory, Transfers, Allocation)
  - Purchasing (POs, Receiving, RTV, Deals, Cost Changes)
  - Pricing (Price Lists, Promotions, Markdowns, Price Changes)
  - Planning (Forecasting, Replenishment)
  - System (Customization, AI & RAG, Reports, Settings)

### 2. Breadcrumbs
- **Location:** Top of each page
- **Shows:** Current location path (e.g., "Inventory / Transfers")
- **Purpose:** Contextual navigation

### 3. Action Links
- **Location:** Within page content (tables, cards, buttons)
- **Examples:**
  - "View All" links at top of cards
  - "View", "Edit", "Approve" buttons in tables
  - Links to related pages (e.g., "View" → detail page)

### 4. Modal Actions
- **Location:** Modal dialogs
- **Actions:** Create/edit forms that link to parent pages

## Page Relationships

### Foundation Data Flow
```
Merchandise Hierarchy → Items (filtered by category)
Organizational Hierarchy → Locations (filtered by org)
```

### Items Flow
```
Items → Item Attributes (manage attributes)
Items → Supplier Items (view suppliers for item)
Items → Inventory (view inventory for item)
Items → Purchase Orders (view POs for item)
```

### Inventory Flow
```
Inventory Positions → Transfers (create transfer)
Inventory Positions → Allocation (create allocation)
Inventory Positions → Cycle Counts (schedule count)
Cycle Counts → Physical Inventory (full counts)
```

### Purchasing Flow
```
Purchase Orders → PO Receiving (receive PO)
Purchase Orders → Returns to Vendor (create RTV)
Suppliers → Supplier Items (view items)
Suppliers → Deals (view deals)
Deals → Cost Changes (cost adjustments)
```

### Pricing Flow
```
Price Lists → Promotions (create promotion)
Price Lists → Markdowns (create markdown)
Price Lists → Price Changes (request change)
Items → Pricing (view prices for item)
```

## How to Update Navigation

### Option 1: Use Dynamic Navigation (Recommended)
1. Include `js/navigation.js` before `js/app.js`
2. Replace `<nav class="sidebar-nav">` content with empty nav
3. Navigation builds automatically on page load

### Option 2: Manual Navigation
Update each page's sidebar-nav section with complete navigation from `navigation-template.html`

## Current Status

✅ **Created:** `js/navigation.js` - Dynamic navigation builder
✅ **Updated:** `transfers.html`, `pricing.html` - Using dynamic navigation
⏳ **Pending:** Update remaining pages to use dynamic navigation

## Next Steps

To link all pages properly:
1. Update all HTML files to use dynamic navigation
2. Or manually copy complete navigation from template to each page
3. Ensure all href links point to correct files

## Testing Navigation

1. Start at `login.html`
2. Select a role
3. Navigate through sidebar menu
4. Click "View", "Edit", "Create" buttons
5. Follow breadcrumbs
6. Use "View All" links

All pages should be accessible from any page via sidebar navigation.
