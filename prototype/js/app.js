// App-wide JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check for role, redirect to login if not set
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName') || 'User';
    
    if (!userRole && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // Update user name in top bar
    const userMenuSpans = document.querySelectorAll('.user-menu span');
    userMenuSpans.forEach(span => {
        if (span.textContent.includes('User')) {
            span.textContent = userName;
        }
    });

    // Role-based navigation filtering
    const rolePermissions = {
        admin: ['dashboard', 'inventory', 'items', 'suppliers', 'locations', 'forecasting', 'replenishment', 'purchase-orders', 'customization', 'ai-rag', 'settings'],
        buyer: ['dashboard', 'items', 'suppliers', 'purchase-orders', 'forecasting'],
        merchandiser: ['dashboard', 'inventory', 'items', 'locations', 'forecasting', 'replenishment']
    };

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        const pageName = href.replace('.html', '').replace('index', 'dashboard');
        const allowedPages = rolePermissions[userRole] || [];
        
        if (!allowedPages.includes(pageName) && pageName !== 'dashboard') {
            item.style.display = 'none';
        }
    });

    // Set active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Redirect to role-specific dashboard
    if (currentPage === 'index.html' || currentPage === '') {
        if (userRole === 'buyer') {
            window.location.href = 'dashboard-buyer.html';
            return;
        } else if (userRole === 'merchandiser') {
            window.location.href = 'dashboard-merchandiser.html';
            return;
        }
    }
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Add role badge to sidebar
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader && !document.querySelector('.role-badge')) {
        const roleBadge = document.createElement('div');
        roleBadge.className = 'role-badge';
        roleBadge.style.cssText = 'margin-top: 1rem; padding: 0.5rem; background: rgba(99, 102, 241, 0.1); border-radius: 0.5rem; text-align: center; font-size: 0.75rem; color: var(--primary); font-weight: 600; text-transform: uppercase;';
        roleBadge.textContent = userRole;
        sidebarHeader.appendChild(roleBadge);
    }

    // Modal functionality
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    };

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    };

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Close modal on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Logout functionality
    window.logout = function() {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = 'login.html';
    };
});
