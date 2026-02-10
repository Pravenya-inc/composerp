// Navigation Builder - Creates comprehensive navigation for all pages
function buildNavigation(currentPage) {
    const navItems = [
        // Foundation
        { href: 'merchandise-hierarchy.html', icon: 'fa-sitemap', label: 'Merchandise Hierarchy', section: 'Foundation' },
        { href: 'organizational-hierarchy.html', icon: 'fa-building', label: 'Org Hierarchy', section: 'Foundation' },
        
        // Items
        { href: 'items.html', icon: 'fa-tags', label: 'Items', section: 'Items' },
        { href: 'item-attributes.html', icon: 'fa-list', label: 'Item Attributes', section: 'Items' },
        { href: 'supplier-items.html', icon: 'fa-link', label: 'Supplier Items', section: 'Items' },
        
        // Master Data
        { href: 'suppliers.html', icon: 'fa-truck', label: 'Suppliers', section: 'Master Data' },
        { href: 'locations.html', icon: 'fa-store', label: 'Locations', section: 'Master Data' },
        
        // Inventory
        { href: 'inventory.html', icon: 'fa-boxes', label: 'Inventory Positions', section: 'Inventory' },
        { href: 'inventory-counts.html', icon: 'fa-clipboard-check', label: 'Cycle Counts', section: 'Inventory' },
        { href: 'physical-inventory.html', icon: 'fa-clipboard-list', label: 'Physical Inventory', section: 'Inventory' },
        { href: 'transfers.html', icon: 'fa-exchange-alt', label: 'Transfers', section: 'Inventory' },
        { href: 'allocation.html', icon: 'fa-share-alt', label: 'Allocation', section: 'Inventory' },
        
        // Purchasing
        { href: 'purchase-orders.html', icon: 'fa-file-invoice', label: 'Purchase Orders', section: 'Purchasing' },
        { href: 'po-receiving.html', icon: 'fa-check-circle', label: 'PO Receiving', section: 'Purchasing' },
        { href: 'returns-vendor.html', icon: 'fa-undo', label: 'Returns (RTV)', section: 'Purchasing' },
        { href: 'deals.html', icon: 'fa-handshake', label: 'Deals', section: 'Purchasing' },
        { href: 'cost-changes.html', icon: 'fa-dollar-sign', label: 'Cost Changes', section: 'Purchasing' },
        
        // Pricing
        { href: 'pricing.html', icon: 'fa-dollar-sign', label: 'Price Lists', section: 'Pricing' },
        { href: 'promotions.html', icon: 'fa-tag', label: 'Promotions', section: 'Pricing' },
        { href: 'markdowns.html', icon: 'fa-arrow-down', label: 'Markdowns', section: 'Pricing' },
        { href: 'price-changes.html', icon: 'fa-edit', label: 'Price Changes', section: 'Pricing' },
        
        // Planning
        { href: 'forecasting.html', icon: 'fa-chart-area', label: 'Forecasting', section: 'Planning' },
        { href: 'replenishment.html', icon: 'fa-shopping-cart', label: 'Replenishment', section: 'Planning' },
        
        // System
        { href: 'customization.html', icon: 'fa-cog', label: 'Customization', section: 'System' },
        { href: 'ai-rag.html', icon: 'fa-robot', label: 'AI & RAG', section: 'System' },
        { href: 'reports.html', icon: 'fa-chart-bar', label: 'Reports', section: 'System' },
        { href: 'settings.html', icon: 'fa-sliders-h', label: 'Settings', section: 'System' }
    ];

    // Group by section
    const sections = {};
    navItems.forEach(item => {
        if (!sections[item.section]) {
            sections[item.section] = [];
        }
        sections[item.section].push(item);
    });

    // Build HTML
    let navHTML = '<a href="index.html" class="nav-item' + (currentPage === 'index.html' || currentPage === '' ? ' active' : '') + '"><i class="fas fa-chart-line"></i><span>Dashboard</span></a>';
    
    const sectionOrder = ['Foundation', 'Items', 'Master Data', 'Inventory', 'Purchasing', 'Pricing', 'Planning', 'System'];
    
    sectionOrder.forEach(section => {
        if (sections[section]) {
            navHTML += `<div style="padding: 0.5rem 1.5rem; font-size: 0.75rem; font-weight: 600; color: var(--gray); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">${section}</div>`;
            sections[section].forEach(item => {
                const isActive = currentPage === item.href;
                navHTML += `<a href="${item.href}" class="nav-item${isActive ? ' active' : ''}"><i class="fas ${item.icon}"></i><span>${item.label}</span></a>`;
            });
        }
    });

    return navHTML;
}

// Function to update navigation on page load
function updateNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navContainer = document.querySelector('.sidebar-nav');
    if (navContainer) {
        navContainer.innerHTML = buildNavigation(currentPage);
    }
}

// Call on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigation);
} else {
    updateNavigation();
}
