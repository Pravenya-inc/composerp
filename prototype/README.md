# Composerp Clickable Prototype

This is a clickable prototype for Composerp - a modern, composable, API-first ERP platform.

## Features Demonstrated

- ✅ **Role-Based Access Control** - Administrator, Buyer, and Merchandiser roles
- ✅ **Role-Specific Dashboards** - Customized dashboards for each persona
- ✅ **Buyer Dashboard** - Product groups, purchase orders, supplier management
- ✅ **Merchandiser Dashboard** - Inventory analysis, assortment performance, forecasting
- ✅ **Administrator Dashboard** - Full system overview
- ✅ Inventory Management (SSLE/WSLE)
- ✅ Items/Products Management
- ✅ Suppliers Management
- ✅ Locations Management
- ✅ Forecasting
- ✅ Replenishment & Purchase Orders
- ✅ Customization (Salesforce-like custom fields & objects)
- ✅ AI & RAG Features
- ✅ Settings

## How to Use

1. **Start with Login**: Open `login.html` in a web browser (or it will redirect automatically)
2. **Select Your Role**: Choose from Administrator, Buyer, or Merchandiser
3. **Role-Specific Dashboards**: Each role has a customized dashboard:
   - **Administrator**: Full system access
   - **Buyer**: Focus on purchase orders and product groups
   - **Merchandiser**: Focus on inventory and assortment planning
4. Navigate through the application using the sidebar menu
5. Click on buttons and links to see modals and interactions
6. All pages are interconnected and clickable
7. **Logout**: Click on your name in the top-right to logout

## File Structure

```
prototype/
├── login.html              # Role selection/login page
├── index.html              # Admin Dashboard (redirects based on role)
├── dashboard-buyer.html    # Buyer-specific dashboard
├── dashboard-merchandiser.html # Merchandiser-specific dashboard
├── inventory.html          # Inventory management
├── items.html              # Items/products
├── suppliers.html          # Suppliers
├── locations.html          # Locations (stores/warehouses)
├── forecasting.html        # Forecasting
├── replenishment.html      # Replenishment
├── purchase-orders.html    # Purchase orders
├── customization.html      # Custom fields & objects
├── ai-rag.html            # AI & RAG features
├── settings.html           # Settings
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   ├── app.js             # App-wide JavaScript (role management)
│   └── dashboard.js       # Dashboard-specific JS
└── README.md              # This file
```

## Technologies Used

- HTML5
- CSS3 (Custom CSS with modern design)
- JavaScript (Vanilla JS)
- Chart.js (for charts)
- Font Awesome (for icons)

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Notes

- This is a **prototype** - no actual data persistence
- All interactions are simulated
- Modals and forms are functional but don't submit data
- Navigation between pages works
- All UI elements are clickable

## Next Steps

After reviewing the prototype:
1. Gather feedback
2. Refine UI/UX based on feedback
3. Begin actual application development
4. Use prototype as reference for implementation
