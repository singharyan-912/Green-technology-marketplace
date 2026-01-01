// js/vendor.js - FULL COMPLETE LOGIC
import { database, ref, push, onValue, remove, update, auth } from './firebase.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

// Global state for charts and filtering
let salesChartInstance = null;
let topProductsChartInstance = null;
let allProducts = [];
let allOrders = [];
let currentEditProductId = null; // Add this at the top with other let variables
document.addEventListener('DOMContentLoaded', function() {
    // --- Global Selectors & Database Refs ---
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const productsRef = ref(database, 'products');
    const ordersRef = ref(database, 'orders');

    // --- Sidebar Toggle Logic ---
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('closed');
            if (dashboardContainer) dashboardContainer.classList.toggle('sidebar-closed');
        });
    }
    

    // --- Profile Modal Logic ---
    const profileTrigger = document.getElementById('userProfileTrigger');
    const profileModal = document.getElementById('profileModal');
    const closeProfile = document.getElementById('closeProfileModal');

    if (profileTrigger) {
        profileTrigger.onclick = () => profileModal.classList.add('active');
    }
    if (closeProfile) {
        closeProfile.onclick = () => profileModal.classList.remove('active');
    }

    // --- Auth State & Dynamic Profile Sync with Fallback ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // 1. Try to get data from 'vendors' node first
            const vendorRef = ref(database, `vendors/${user.uid}`);
            onValue(vendorRef, (snapshot) => {
                let data = snapshot.val();
                
                if (!data) {
                    // 2. FALLBACK: If 'vendors' folder is missing, check 'users' folder
                    const userRef = ref(database, `users/${user.uid}`);
                    onValue(userRef, (userSnapshot) => {
                        const userData = userSnapshot.val();
                        if (userData) updateUIWithData(userData, user.email);
                    });
                } else {
                    updateUIWithData(data, user.email);
                }
            });
        } else {
            // Redirect if not logged in (Except on index)
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = "../index.html";
            }
        }
    });

    // Helper function to update Header and Modal
    function updateUIWithData(data, email) {
        const name = data.businessName || `${data.firstName} ${data.lastName}` || "Green Vendor";
        const initial = name.charAt(0).toUpperCase();

        // Update Header
        const hName = document.getElementById('headerUserName');
        const hAvatar = document.getElementById('headerUserAvatar');
        if(hName) hName.textContent = name;
        if(hAvatar) hAvatar.textContent = initial;
        
        // Update Modal
        const mName = document.getElementById('modalUserName');
        const mAvatar = document.getElementById('modalUserAvatar');
        const mEmail = document.getElementById('modalUserEmail');
        const mType = document.getElementById('modalBusinessType');
        if(mName) mName.textContent = name;
        if(mAvatar) mAvatar.textContent = initial;
        if(mEmail) mEmail.textContent = email;
        if(mType) mType.textContent = data.category || "Green Technology";

        // Fill Settings Form
        const settingsNameInput = document.getElementById('vendorName');
        const settingsEmailInput = document.getElementById('vendorEmail');
        if(settingsNameInput) settingsNameInput.value = name;
        if(settingsEmailInput) settingsEmailInput.value = email;
    }

    // --- Logout Functionality ---
    document.querySelectorAll('.logout-trigger, .logout-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            if(confirm("Are you sure you want to log out?")) {
                signOut(auth).then(() => {
                    window.location.href = "../index.html";
                }).catch(err => console.error("Logout Error:", err));
            }
        };
    });

    // --- Settings Update Logic ---
    const profileForm = document.getElementById('vendorProfileForm');
    if (profileForm) {
        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const updatedData = {
                businessName: document.getElementById('vendorName').value,
            };

            try {
                // Update both locations to keep data in sync
                await update(ref(database, `vendors/${user.uid}`), updatedData);
                await update(ref(database, `users/${user.uid}`), { firstName: updatedData.businessName });
                alert("Profile Updated Successfully!");
            } catch (error) {
                console.error(error);
                alert("Failed to update profile.");
            }
        };
    }
// --- Updated: Add Product Form Submission Logic ---
const vendorForm = document.getElementById('vendorForm');
if (vendorForm) {
    vendorForm.onsubmit = async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to add a product.");
            return;
        }

        const newProduct = {
            productName: document.getElementById('productName').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            price: parseFloat(document.getElementById('price').value),
            stock: parseInt(document.getElementById('stock').value),
            imageURL: document.getElementById('imageURL').value || "https://via.placeholder.com/150",
            
            // --- AUTOMATIC SETTINGS ---
            userId: user.uid, 
            status: 'pending', // New products always start as pending for Admin review
            
            addedDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        try {
            const productsRef = ref(database, 'products');
            await push(productsRef, newProduct);
            
            alert("Product submitted for approval!");
            vendorForm.reset();
            window.location.href = 'vendor_products.html';
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product.");
        }
    };
}
    // --- Edit Product Form Submission Logic ---
const editProductForm = document.getElementById('editProductForm');
if (editProductForm) {
    editProductForm.onsubmit = async (e) => {
        e.preventDefault();

        if (!currentEditProductId) return;

        const updatedProduct = {
            productName: document.getElementById('editProductName').value,
            category: document.getElementById('editCategory').value,
            price: parseFloat(document.getElementById('editPrice').value),
            stock: parseInt(document.getElementById('editStock').value),
            imageURL: document.getElementById('editImageURL').value,
            description: document.getElementById('editDescription').value,
            lastUpdated: new Date().toISOString()
            // status is NOT included here, so it remains what the admin set it to
        };

        try {
            await update(ref(database, `products/${currentEditProductId}`), updatedProduct);
            alert("Product updated successfully!");
            document.getElementById('editProductModal').classList.remove('active');
        } catch (error) {
            console.error("Update Error:", error);
            alert("Failed to update product.");
        }
    };
}
    // --- 1. Dashboard Overview Logic ---
    const totalProductsCountEl = document.getElementById('totalProductsCount');
    if (totalProductsCountEl) {
        onValue(productsRef, (snapshot) => {
            const products = Object.values(snapshot.val() || {});
            totalProductsCountEl.textContent = products.length;
            if(document.getElementById('outOfStockCount')) document.getElementById('outOfStockCount').textContent = products.filter(p => p.stock <= 0).length;
            
            const lowStockBody = document.querySelector('.low-stock-section tbody');
            if (lowStockBody) {
                lowStockBody.innerHTML = '';
                const lowItems = products.filter(p => p.stock > 0 && p.stock < 10);
                if (lowItems.length === 0) lowStockBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">All items stocked.</td></tr>';
                lowItems.forEach(p => {
                    lowStockBody.innerHTML += `<tr><td>${p.productName}</td><td>${p.category}</td><td class="bold">${p.stock}</td><td><span class="status-pill low">Low Stock</span></td></tr>`;
                });
            }
        });

        onValue(ordersRef, (snapshot) => {
            const orders = Object.entries(snapshot.val() || {}).map(([id, data]) => ({ id, ...data }));
            if(document.getElementById('pendingOrdersCount')) document.getElementById('pendingOrdersCount').textContent = orders.filter(o => o.status === 'Pending').length;
            const revenue = orders.filter(o => o.status === 'Fulfilled').reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            if(document.getElementById('totalRevenueValue')) document.getElementById('totalRevenueValue').textContent = `$${revenue.toFixed(2)}`;
            
            const recentOrdersBody = document.querySelector('#recentOrdersTable tbody');
            if (recentOrdersBody) {
                recentOrdersBody.innerHTML = '';
                orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5).forEach(o => {
                    recentOrdersBody.innerHTML += `<tr><td class="bold">#${o.id.substring(0,6).toUpperCase()}</td><td>${o.customerName}</td><td>${o.items}</td><td>$${o.total}</td><td><span class="status-pill ${o.status.toLowerCase()}">${o.status}</span></td><td>${new Date(o.orderDate).toLocaleDateString()}</td></tr>`;
                });
            }
        });
    }

    // --- 2. Product Management Logic ---
    const productTableBody = document.querySelector('#productTable tbody');
    if (productTableBody) {
        onValue(productsRef, (snapshot) => {
            allProducts = Object.entries(snapshot.val() || {}).map(([id, val]) => ({ id, ...val }));
            applyProductFilters();
        });

        function applyProductFilters() {
            const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
            const category = document.getElementById('filterCategory')?.value || 'all';
            const status = document.getElementById('filterStatus')?.value || 'all';
            const stock = document.getElementById('filterStock')?.value || 'all';

            const filtered = allProducts.filter(p => {
                const mSearch = p.productName.toLowerCase().includes(search);
                const mCat = (category === 'all' || p.category === category);
                const mStat = (status === 'all' || p.status === status);
                let mStock = true;
                if (stock === 'low') mStock = (p.stock > 0 && p.stock < 10);
                else if (stock === 'empty') mStock = (p.stock <= 0);
                return mSearch && mCat && mStat && mStock;
            });
            renderProductTable(filtered);
        }

        function renderProductTable(data) {
            productTableBody.innerHTML = '';
            const headerCount = document.getElementById('productCountHeader');
            if(headerCount) headerCount.textContent = data.length;
            data.forEach(p => {
                productTableBody.innerHTML += `
                    <tr>
                        <td>${p.id.substring(0,5)}</td>
                        <td><img src="${p.imageURL}" class="product-thumb" style="width:40px;"></td>
                        <td class="bold">${p.productName}</td><td>${p.category}</td>
                        <td>$${parseFloat(p.price).toFixed(2)}</td><td>${p.stock}</td>
                        <td><span class="status-tag ${p.status}">${p.status}</span></td>
                        <td>
                            <button onclick="openEditProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteItem('products', '${p.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
            });
        }
        ['productSearch', 'filterCategory', 'filterStatus', 'filterStock'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', applyProductFilters);
        });
    }

    // --- 3. Order Management Logic ---
    const orderTableBody = document.querySelector('.data-table tbody');
    if (orderTableBody && document.getElementById('orderSearch')) {
        onValue(ordersRef, (snapshot) => {
            allOrders = Object.entries(snapshot.val() || {}).map(([id, val]) => ({ id, ...val }));
            applyOrderFilters();
        });

        function applyOrderFilters() {
            const search = document.getElementById('orderSearch').value.toLowerCase();
            const status = document.getElementById('filterOrderStatus').value || 'all';
            const date = document.getElementById('filterOrderDate').value || '';

            const filtered = allOrders.filter(o => {
                const mSearch = o.customerName.toLowerCase().includes(search) || o.id.toLowerCase().includes(search);
                const mStat = (status === 'all' || o.status === status);
                const mDate = (date === '' || o.orderDate.split('T')[0] === date);
                return mSearch && mStat && mDate;
            });
            renderOrderTable(filtered);
        }

        function renderOrderTable(data) {
            orderTableBody.innerHTML = '';
            data.forEach(o => {
                orderTableBody.innerHTML += `
                    <tr>
                        <td class="bold">#${o.id.substring(0,6).toUpperCase()}</td>
                        <td>${o.customerName}</td><td>${o.items}</td>
                        <td class="bold">$${parseFloat(o.total).toFixed(2)}</td>
                        <td>
                            <span class="status-pill ${o.status.toLowerCase()}" 
                                  onclick="cycleOrderStatus('${o.id}', '${o.status}')">
                                ${o.status}
                            </span>
                        </td>
                        <td class="text-muted">${new Date(o.orderDate).toLocaleDateString()}</td>
                        <td>
                            <button onclick="deleteItem('orders', '${o.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
            });
        }
    }

    // --- 4. Order Entry Logic (Updated for Dynamic Products) ---
    const createOrderBtn = document.getElementById('createOrderBtn');
    const createOrderModal = document.getElementById('createOrderModal');
    const orderItemSelect = document.getElementById('orderItemSelect');
    const orderQtyInput = document.getElementById('orderQty');
    const orderTotalInput = document.getElementById('orderTotal');

    if (createOrderBtn) {
        createOrderBtn.onclick = () => {
            createOrderModal.classList.add('active');
            populateProductDropdown(); // Load products whenever modal opens
        };
    }

    // A. Function to fill the dropdown with your products
    function populateProductDropdown() {
        if (!orderItemSelect) return;
        onValue(ref(database, 'products'), (snapshot) => {
            orderItemSelect.innerHTML = '<option value="">-- Select a Product --</option>';
            snapshot.forEach((child) => {
                const p = child.val();
                if (p.status === 'approved') { // Only allow selling approved items
                    const option = document.createElement('option');
                    option.value = child.key;
                    option.dataset.price = p.price;
                    option.dataset.name = p.productName;
                    option.textContent = `${p.productName} ($${p.price})`;
                    orderItemSelect.appendChild(option);
                }
            });
        });
    }

    // B. Logic to update the Total Amount automatically
    const updateCalculatedTotal = () => {
        const selectedOption = orderItemSelect.options[orderItemSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
            const price = parseFloat(selectedOption.dataset.price);
            const qty = parseInt(orderQtyInput.value) || 1;
            orderTotalInput.value = (price * qty).toFixed(2);
        }
    };

    if (orderItemSelect) orderItemSelect.onchange = updateCalculatedTotal;
    if (orderQtyInput) orderQtyInput.oninput = updateCalculatedTotal;

    // C. Handle the Form Submission
    const createOrderForm = document.getElementById('createOrderForm');
    if (createOrderForm) {
        createOrderForm.onsubmit = async (e) => {
            e.preventDefault();

            const selectedOption = orderItemSelect.options[orderItemSelect.selectedIndex];
            if (!selectedOption.value) return alert("Please select a product");

            const newOrder = {
                customerName: document.getElementById('customerName').value,
                items: `${selectedOption.dataset.name} (x${orderQtyInput.value})`,
                total: parseFloat(orderTotalInput.value),
                status: document.getElementById('orderStatus').value,
                orderDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            try {
                await push(ref(database, 'orders'), newOrder);
                alert("Order Created successfully!");
                createOrderForm.reset();
                createOrderModal.classList.remove('active');
            } catch (err) {
                alert("Error: " + err.message);
            }
        };
    }
    // --- 5. Full Sales Analytics Logic ---
    const salesChartCanvas = document.getElementById('salesChart');
    const productsChartCanvas = document.getElementById('topProductsChart');

    if (salesChartCanvas && productsChartCanvas) {
        // Initialize Sales Performance (Line Chart)
        salesChartInstance = new Chart(salesChartCanvas.getContext('2d'), {
            type: 'line',
            data: { 
                labels: [], 
                datasets: [{ 
                    label: 'Revenue ($)', 
                    data: [], 
                    borderColor: '#10b981', 
                    tension: 0.3, 
                    fill: true, 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)' 
                }] 
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Initialize Inventory Share / Top Products (Bar Chart)
        topProductsChartInstance = new Chart(productsChartCanvas.getContext('2d'), {
            type: 'bar',
            data: { 
                labels: [], 
                datasets: [{ 
                    label: 'Units Sold', 
                    data: [], 
                    backgroundColor: '#3b82f6' 
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                indexAxis: 'y' // Horizontal bars
            }
        });

        // Listen for Real-time Updates
        onValue(ordersRef, (snapshot) => {
            const orders = Object.values(snapshot.val() || {});
            // Filter only completed orders for accurate analytics
            const fulfilled = orders.filter(o => o.status === 'Fulfilled');
            
            const revenueByDate = {};
            const productSales = {};
            let totalRevenue = 0;
            let totalUnitsSold = 0;
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            let monthlyRev = 0;

            fulfilled.forEach(o => {
                const date = new Date(o.orderDate);
                const dateKey = o.orderDate.split('T')[0];
                const orderTotal = parseFloat(o.total) || 0;

                // 1. Line Chart Data (Revenue over time)
                revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + orderTotal;
                
                // 2. Global Totals
                totalRevenue += orderTotal;
                
                // 3. Monthly Revenue Calculation
                if(date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    monthlyRev += orderTotal;
                }

                // 4. Product Sales Parsing (Handling the "Product Name (x2)" format)
                if (typeof o.items === 'string') {
                    // Split items if multiple products exist in one order (comma separated)
                    const itemsArray = o.items.split(',');
                    itemsArray.forEach(itemString => {
                        // Extract Name and Quantity using Regex for (x2) or x2 formats
                        const name = itemString.split('(')[0].trim();
                        const qtyMatch = itemString.match(/x(\d+)/);
                        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

                        if(name) {
                            productSales[name] = (productSales[name] || 0) + qty;
                            totalUnitsSold += qty;
                        }
                    });
                }
            });

            // --- Update Summary Cards ---

            // Monthly Revenue Card
            if(document.getElementById('monthlyRevenue')) 
                document.getElementById('monthlyRevenue').textContent = `$${monthlyRev.toFixed(2)}`;

            // Units Sold Card
            if(document.getElementById('unitsSold')) 
                document.getElementById('unitsSold').textContent = totalUnitsSold;

            // Avg. Order Value Card (Total Rev / Number of Orders)
            const avgVal = fulfilled.length > 0 ? (totalRevenue / fulfilled.length) : 0;
            if(document.getElementById('avgOrderValue')) 
                document.getElementById('avgOrderValue').textContent = `$${avgVal.toFixed(2)}`;

            // Top Product Card (Find product with highest qty sold)
            const sortedProductEntries = Object.entries(productSales).sort((a,b) => b[1] - a[1]);
            const topProdName = sortedProductEntries.length > 0 ? sortedProductEntries[0][0] : 'N/A';
            if(document.getElementById('topProduct')) 
                document.getElementById('topProduct').textContent = topProdName;

            // --- Update Line Chart (Sales Performance) ---
            const sortedDates = Object.keys(revenueByDate).sort();
            salesChartInstance.data.labels = sortedDates;
            salesChartInstance.data.datasets[0].data = sortedDates.map(d => revenueByDate[d]);
            salesChartInstance.update();

            // --- Update Bar Chart (Top 5 Products) ---
            const top5Products = sortedProductEntries.slice(0, 5);
            topProductsChartInstance.data.labels = top5Products.map(p => p[0]);
            topProductsChartInstance.data.datasets[0].data = top5Products.map(p => p[1]);
            topProductsChartInstance.update();
        });
    }

    // Global Helpers
    window.cycleOrderStatus = async (id, current) => {
        const flow = ["Pending", "Shipped", "Fulfilled", "Cancelled"];
        const next = flow[(flow.indexOf(current) + 1) % flow.length];
        await update(ref(database, `orders/${id}`), { status: next });
    };

    window.openEditProduct = (id) => {
    currentEditProductId = id; 
    const p = allProducts.find(item => item.id === id);
    
    if (p) {
        document.getElementById('editProductName').value = p.productName || "";
        document.getElementById('editCategory').value = p.category || "";
        document.getElementById('editPrice').value = p.price || 0;
        document.getElementById('editStock').value = p.stock || 0;
        document.getElementById('editImageURL').value = p.imageURL || "";
        document.getElementById('editDescription').value = p.description || "";
        
        // Removed: document.getElementById('editStatus').value = ...
        
        document.getElementById('editProductModal').classList.add('active');
    }
};

    window.deleteItem = (col, id) => {
        if (confirm(`Delete this ${col.slice(0, -1)}?`)) remove(ref(database, `${col}/${id}`));
    };

    document.querySelectorAll('.close-button, .close-profile, .close-dialog-btn, #cancelEdit').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.modal, .profile-modal-overlay').forEach(m => m.classList.remove('active'));
        };
    });
});