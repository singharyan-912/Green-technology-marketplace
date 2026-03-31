import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { database, ref, onValue, push, update, remove } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import VendorNavbar from '../component/VendorNavbar';
import LoadingSpinner from '../component/LoadingSpinner';
import '../assets/css/vendor.css';

const CATEGORIES = [
    "Solar Energy",
    "Wind Power",
    "Energy Storage",
    "Eco Appliances",
    "Home Goods",
    "Electronics",
    "Personal Care"
];

const VendorDashboard = () => {
    const { currentUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logoURL, setLogoURL] = useState(null);
    const [stats, setStats] = useState({
        totalProducts: 0,
        pendingOrders: 0,
        outOfStock: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        unitsSold: 0,
        topProduct: 'N/A',
        avgOrderValue: 0
    });

    // Chart Refs
    const salesChartRef = useRef(null);
    const topProductsChartRef = useRef(null);
    const salesChartInstance = useRef(null);
    const topProductsChartInstance = useRef(null);

    // Modals & Dialogs State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [formToast, setFormToast] = useState('');

    // New Order Form State
    const [newOrderForm, setNewOrderForm] = useState({
        customerName: '',
        productId: '',
        quantity: 1,
        status: 'Pending'
    });

    // Determine current view from URL
    const currentPath = location.pathname;
    const view = currentPath.includes('products') ? 'products' :
                currentPath.includes('add-product') ? 'add-product' :
                currentPath.includes('orders') ? 'orders' :
                currentPath.includes('analytics') ? 'analytics' :
                currentPath.includes('settings') ? 'settings' : 'overview';

    useEffect(() => {
        if (!currentUser) return;

        const productsRef = ref(database, 'products');
        const ordersRef = ref(database, 'orders');
        const settingsRef = ref(database, 'settings/dashboardLogo');

        // Logo listener
        const unsubscribeLogo = onValue(settingsRef, (snapshot) => {
            if (snapshot.exists()) setLogoURL(snapshot.val());
        });

        // Combined data listener
        const unsubscribeProducts = onValue(productsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const productList = Object.keys(data)
                    .map(key => ({ id: key, ...data[key] }))
                    .filter(p => p.userId === currentUser.uid);
                setProducts(productList);
            }
            setLoading(false);
        });

        const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const orderList = Object.keys(data)
                    .map(key => ({ id: key, ...data[key] }))
                    .filter(o => o.vendorId === currentUser.uid);
                setOrders(orderList);
            }
        });

        return () => {
            unsubscribeLogo();
            unsubscribeProducts();
            unsubscribeOrders();
        };
    }, [currentUser]);

    // Re-calculate stats when products or orders change
    useEffect(() => {
        const productStats = {
            totalProducts: products.length,
            outOfStock: products.filter(p => !p.stock || p.stock === 0 || p.stock === '0').length
        };

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let monthlyRevenue = 0;
        let unitsSold = 0;
        let revenueByDate = {};
        let productSales = {};

        const relevantOrders = orders.filter(o => ['Fulfilled', 'Shipped', 'Pending'].includes(o.status));
        const fulfilledOrders = orders.filter(o => ['Fulfilled', 'Shipped'].includes(o.status));

        fulfilledOrders.forEach(o => {
            const orderDate = new Date(o.timestamp || o.date);
            const amount = parseFloat(o.amount || o.total) || 0;
            
            // Monthly calculation
            if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                monthlyRevenue += amount;
            }

            // Sales Timeline (Aggregation by date for Chart)
            const dateKey = orderDate.toLocaleDateString();
            revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + amount;

            // Unit Parsing Logic
            // Handle both "ProdName (x2)" and structured quantity field
            let qty = parseInt(o.quantity) || 1;
            const items = o.items || o.productName || "";
            if (typeof items === 'string') {
                const qtyMatch = items.match(/x(\d+)/);
                if (qtyMatch) qty = parseInt(qtyMatch[1]);
                
                const rawName = items.split('(')[0].trim();
                productSales[rawName] = (productSales[rawName] || 0) + qty;
                unitsSold += qty;
            }
        });

        const sortedProducts = Object.entries(productSales).sort((a,b) => b[1] - a[1]);
        const topProduct = sortedProducts.length > 0 ? sortedProducts[0][0] : 'N/A';
        const totalRevenue = fulfilledOrders.reduce((acc, curr) => acc + (parseFloat(curr.amount || curr.total) || 0), 0);
        const avgOrderValue = fulfilledOrders.length > 0 ? (totalRevenue / fulfilledOrders.length) : 0;

        setStats({
            ...productStats,
            totalRevenue,
            monthlyRevenue,
            unitsSold,
            topProduct,
            avgOrderValue,
            pendingOrders: orders.filter(o => o.status === 'Pending').length,
            revenueByDate,
            productSales
        });

        // --- Chart.js Updates ---
        if (view === 'analytics' && window.Chart) {
            updateCharts(revenueByDate, productSales);
        }

    }, [products, orders, view]);

    const updateCharts = (revenueByDate, productSales) => {
        const ctxSales = salesChartRef.current?.getContext('2d');
        const ctxProducts = topProductsChartRef.current?.getContext('2d');

        if (ctxSales) {
            if (salesChartInstance.current) salesChartInstance.current.destroy();
            const dates = Object.keys(revenueByDate).sort();
            salesChartInstance.current = new window.Chart(ctxSales, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Revenue ($)',
                        data: dates.map(d => revenueByDate[d]),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        if (ctxProducts) {
            if (topProductsChartInstance.current) topProductsChartInstance.current.destroy();
            const top5 = Object.entries(productSales).sort((a,b) => b[1] - a[1]).slice(0, 5);
            topProductsChartInstance.current = new window.Chart(ctxProducts, {
                type: 'bar',
                data: {
                    labels: top5.map(p => p[0]),
                    datasets: [{
                        label: 'Units Sold',
                        data: top5.map(p => p[1]),
                        backgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y'
                }
            });
        }
    };

    // Action Handlers
    const handleEditProduct = (e, product) => {
        e.preventDefault();
        setEditingProduct({ ...product });
        setIsEditProductModalOpen(true);
    };

    const saveEditedProduct = async (e) => {
        e.preventDefault();
        try {
            await update(ref(database, `products/${editingProduct.id}`), {
                productName: editingProduct.productName,
                category: editingProduct.category,
                price: parseFloat(editingProduct.price),
                stock: parseInt(editingProduct.stock),
                productImage: editingProduct.productImage,
                description: editingProduct.description || ''
            });
            setIsEditProductModalOpen(false);
        } catch (err) {
            alert("Error updating product: " + err.message);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await remove(ref(database, `products/${id}`));
            } catch (err) {
                alert("Error deleting product.");
            }
        }
    };

    const handleUpdateStatus = (order) => {
        setUpdatingOrder(order);
        setNewStatus(order.status);
        setIsStatusDialogOpen(true);
    };

    const saveOrderStatus = async () => {
        try {
            await update(ref(database, `orders/${updatingOrder.id}`), { status: newStatus });
            setIsStatusDialogOpen(false);
        } catch (err) {
            alert("Error updating status.");
        }
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        const selectedProduct = products.find(p => p.id === newOrderForm.productId);
        if (!selectedProduct) return;

        const amount = selectedProduct.price * newOrderForm.quantity;
        try {
            await push(ref(database, 'orders'), {
                vendorId: currentUser.uid,
                customerName: newOrderForm.customerName,
                productName: selectedProduct.productName,
                productId: selectedProduct.id,
                amount: amount,
                quantity: newOrderForm.quantity,
                status: newOrderForm.status,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now()
            });
            setIsNewOrderModalOpen(false);
            setNewOrderForm({ customerName: '', productId: '', quantity: 1, status: 'Pending' });
        } catch (err) {
            alert("Error creating order.");
        }
    };

    // View Components
    const renderOverview = () => (
        <>
            <div className="dashboard-grid fade-in">
                <div className="card summary-card">
                    <div className="card-icon blue"><i className="fas fa-box"></i></div>
                    <div className="card-info">
                        <h3>Total Products</h3>
                        <p className="summary-value">{stats.totalProducts}</p>
                        <p className="summary-trend">Live from Database</p>
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon orange"><i className="fas fa-clock"></i></div>
                    <div className="card-info">
                        <h3>Pending Orders</h3>
                        <p className="summary-value">{stats.pendingOrders}</p>
                        <p className="summary-trend warning">Needs attention</p>
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon red"><i className="fas fa-exclamation-circle"></i></div>
                    <div className="card-info">
                        <h3>Out of Stock</h3>
                        <p className="summary-value">{stats.outOfStock}</p>
                        <p className="summary-trend negative">Hidden from store</p>
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon green"><i className="fas fa-wallet"></i></div>
                    <div className="card-info">
                        <h3>Total Revenue</h3>
                        <p className="summary-value">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className="summary-trend positive">Fulfilled orders</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections fade-in">
                <div className="card table-card">
                    <div className="card-header">
                        <h3>Recent Orders</h3>
                        <button className="btn-outline" onClick={() => navigate('/vendor/orders')}>View All</button>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 5).map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id.slice(-6).toUpperCase()}</td>
                                        <td>{order.customerName}</td>
                                        <td>${parseFloat(order.amount || order.total).toFixed(2)}</td>
                                        <td><span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span></td>
                                        <td>{order.date || new Date(order.timestamp).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card table-card">
                    <div className="card-header">
                        <h3>Inventory Alerts</h3>
                        <button className="btn-outline" onClick={() => navigate('/vendor/products')}>Manage</button>
                    </div>
                    <div className="alert-list">
                        {products.filter(p => !p.stock || p.stock < 10).map(p => (
                            <div key={p.id} className="alert-item">
                                <div className="p-img"><img src={p.productImage} alt="" /></div>
                                <div className="p-info">
                                    <p className="p-name">{p.productName}</p>
                                    <p className={`p-stock ${(!p.stock || p.stock === 0) ? 'red' : 'orange'}`}>
                                        {p.stock || 0} left in stock
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

    const renderProducts = () => (
        <div className="fade-in">
            <div className="filter-toolbar">
                <div className="filter-search">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search products..." />
                </div>
                <div className="filter-group">
                    <select className="filter-select">
                        <option>All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button className="btn-icon-text"><i className="fas fa-undo"></i> Reset</button>
                </div>
            </div>
            <div className="card table-card full-width">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td><img src={p.productImage} alt="" style={{ width: 40, height: 40, borderRadius: 8 }} /></td>
                                    <td className="p-name">{p.productName}</td>
                                    <td>{p.category}</td>
                                    <td>${parseFloat(p.price).toFixed(2)}</td>
                                    <td>{p.stock}</td>
                                    <td><span className={`status-pill ${p.status === 'approved' ? 'fulfilled' : 'pending'}`}>{p.status || 'pending'}</span></td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="icon-btn edit" onClick={(e) => handleEditProduct(e, p)}><i className="fas fa-edit"></i></button>
                                            <button className="icon-btn delete" onClick={() => handleDeleteProduct(p.id)}><i className="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="fade-in">
            <div className="filter-toolbar">
                <div className="filter-search">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search orders..." />
                </div>
                <div className="filter-group">
                    <button className="btn-primary" onClick={() => setIsNewOrderModalOpen(true)}><i className="fas fa-plus"></i> New Order</button>
                </div>
            </div>
            <div className="card table-card full-width">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer Name</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...orders].reverse().map(order => (
                                <tr key={order.id}>
                                    <td>#{order.id.slice(-6).toUpperCase()}</td>
                                    <td>{order.customerName}</td>
                                    <td>{order.productName || order.items} (x{order.quantity || 1})</td>
                                    <td>${parseFloat(order.amount || order.total).toFixed(2)}</td>
                                    <td><span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span></td>
                                    <td>{order.date || new Date(order.timestamp).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn-outline btn-sm" onClick={() => handleUpdateStatus(order)}>Update</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderAnalytics = () => (
        <div className="analytics-view fade-in">
            <div className="dashboard-grid">
                <div className="card summary-card">
                    <div className="card-icon green">💰</div>
                    <div className="card-info">
                        <h3>Monthly Revenue</h3>
                        <p className="summary-value">${stats.monthlyRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon blue">📦</div>
                    <div className="card-info">
                        <h3>Units Sold</h3>
                        <p className="summary-value">{stats.unitsSold}</p>
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon orange">🏆</div>
                    <div className="card-info">
                        <h3>Top Product</h3>
                        <p className="summary-value" style={{ fontSize: '1rem' }}>{stats.topProduct}</p>
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon red">💹</div>
                    <div className="card-info">
                        <h3>Avg. Order</h3>
                        <p className="summary-value">${stats.avgOrderValue.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 30 }}>
                <div className="card chart-card">
                    <div className="card-header"><h3>Sales Performance</h3></div>
                    <div style={{ height: 300 }}>
                        <canvas ref={salesChartRef}></canvas>
                    </div>
                </div>
                <div className="card chart-card">
                    <div className="card-header"><h3>Inventory Share</h3></div>
                    <div style={{ height: 300 }}>
                        <canvas ref={topProductsChartRef}></canvas>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="settings-view fade-in">
            <div className="card" style={{ maxWidth: 600 }}>
                <div className="card-header"><h3>Store Profile</h3></div>
                <form className="modern-form" style={{ padding: 24 }}>
                    <div className="form-group"><label>Vendor Name</label><input type="text" defaultValue={currentUser?.displayName} /></div>
                    <div className="form-group"><label>Store Email</label><input type="email" defaultValue={currentUser?.email} disabled /></div>
                    <div className="form-group"><label>Business Category</label>
                        <select defaultValue="Green Technology">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <button className="btn-primary">Update Profile</button>
                </form>
            </div>
        </div>
    );

    const renderAddProductView = () => (
        <div className="card fade-in" style={{ maxWidth: 800 }}>
             <div className="card-header"><h3>Post New Technology</h3></div>
             {formToast && (
                 <div style={{ margin: '0 24px', padding: '12px 16px', borderRadius: 10, background: formToast.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: formToast.startsWith('✅') ? '#166534' : '#dc2626', fontWeight: 600, fontSize: '0.9rem', border: `1px solid ${formToast.startsWith('✅') ? '#bbf7d0' : '#fecaca'}` }}>
                     {formToast}
                 </div>
             )}
             <form className="modern-form" style={{ padding: 24 }} onSubmit={async (e) => {
                 e.preventDefault();
                 setLoading(true);
                 const formData = new FormData(e.target);
                 try {
                     await push(ref(database, 'products'), {
                         productName: formData.get('name'),
                         price: parseFloat(formData.get('price')),
                         category: formData.get('category'),
                         stock: parseInt(formData.get('stock')),
                         ecoRating: formData.get('ecoRating') || '7',
                         productImage: formData.get('image'),
                         description: formData.get('description'),
                         userId: currentUser.uid,
                         status: 'pending',
                         createdAt: new Date().toISOString()
                     });
                     setFormToast('✅ Product submitted for approval!');
                     e.target.reset();
                     setTimeout(() => navigate('/vendor/products'), 1800);
                 } catch (err) {
                     setFormToast('❌ Error: ' + err.message);
                 } finally { setLoading(false); }
             }}>
                 <div className="form-row">
                    <div className="form-group"><label>Product Name</label><input name="name" required /></div>
                    <div className="form-group"><label>Price ($)</label><input name="price" type="number" step="0.01" required /></div>
                 </div>
                 <div className="form-row">
                    <div className="form-group"><label>Category</label>
                        <select name="category" required>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label>Stock</label><input name="stock" type="number" required /></div>
                 </div>
                 <div className="form-row">
                    <div className="form-group">
                        <label>Eco Rating (1–10)</label>
                        <input name="ecoRating" type="number" min="1" max="10" placeholder="e.g. 8" />
                    </div>
                    <div className="form-group"><label>Image URL</label><input name="image" type="url" placeholder="https://..." /></div>
                 </div>
                 <div className="form-group"><label>Description</label><textarea name="description" rows="3"></textarea></div>
                 <button className="btn-primary" type="submit">Publish Product</button>
             </form>
        </div>
    );

    return (
        <div className="dashboard-container">
            <VendorNavbar logo={logoURL} />
            
            <main className="main-content">
                <header className="dashboard-header fade-in">
                    <div className="header-left">
                        <div className="page-title">
                            <h2>{view === 'add-product' ? 'Add Product' : view.charAt(0).toUpperCase() + view.slice(1)}</h2>
                            <p>{view === 'overview' ? "Welcome back, here's what's happening today." : "Manage your store efficiently."}</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <div className="notification-bell"><i className="far fa-bell"></i><span className="dot"></span></div>
                        <div className="user-profile" onClick={() => setIsProfileModalOpen(true)}>
                            <div className="user-info">
                                <span className="user-name">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Vendor'}</span>
                                <span className="user-role">Vendor</span>
                            </div>
                            <div className="user-avatar">{(currentUser?.displayName || currentUser?.email || 'V').charAt(0).toUpperCase()}</div>
                        </div>
                    </div>
                </header>

                <div className="current-view-container">
                    {loading ? <LoadingSpinner /> : (
                        view === 'overview' ? renderOverview() :
                        view === 'products' ? renderProducts() :
                        view === 'orders' ? renderOrders() :
                        view === 'analytics' ? renderAnalytics() :
                        view === 'settings' ? renderSettings() :
                        view === 'add-product' ? renderAddProductView() : renderOverview()
                    )}
                </div>
            </main>

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className="modal active">
                    <div className="profile-card">
                        <button className="close-profile" onClick={() => setIsProfileModalOpen(false)}>&times;</button>
                        <div className="profile-header">
                            <div className="large-avatar">{(currentUser?.displayName || currentUser?.email || 'V').charAt(0).toUpperCase()}</div>
                            <h3>{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Vendor'}</h3>
                            <span className="badge">Premium Seller</span>
                        </div>
                        <div className="profile-info-list" style={{ padding: 20 }}>
                            <div className="info-item">
                                <i className="fas fa-envelope"></i>
                                <div><label>Email</label><p>{currentUser?.email}</p></div>
                            </div>
                        </div>
                        <div className="profile-footer" style={{ padding: 20 }}>
                            <button className="btn-edit-profile" onClick={() => { setIsProfileModalOpen(false); navigate('/vendor/settings'); }}>Edit Profile</button>
                            <button className="btn-logout-alt" onClick={async () => { try { await logout(); } catch(e) {} navigate('/login'); }}>Log Out</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {isEditProductModalOpen && editingProduct && (
                <div className="modal active">
                    <div className="modal-content">
                        <div className="modal-header"><h3>Edit Product</h3><button className="close-button" onClick={() => setIsEditProductModalOpen(false)}>&times;</button></div>
                        <form className="modern-form" onSubmit={saveEditedProduct} style={{ padding: 20 }}>
                            <div className="form-group"><label>Name</label><input value={editingProduct.productName} onChange={e => setEditingProduct({...editingProduct, productName: e.target.value})} /></div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Price</label><input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} /></div>
                            </div>
                            <div className="form-group"><label>Stock</label><input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} /></div>
                            <div className="modal-footer"><button className="btn-primary" type="submit">Save Changes</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Update Dialog */}
            {isStatusDialogOpen && updatingOrder && (
                <div className="modal active">
                    <div className="modal-content" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Update Order Status</h3><button className="close-button" onClick={() => setIsStatusDialogOpen(false)}>&times;</button></div>
                        <div className="modern-form" style={{ padding: 20 }}>
                            {['Pending', 'Shipped', 'Fulfilled', 'Cancelled'].map(s => (
                                <label key={s} style={{ display: 'flex', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                                    <input type="radio" name="stat" checked={newStatus === s} onChange={() => setNewStatus(s)} /> {s}
                                </label>
                            ))}
                        </div>
                        <div className="modal-footer"><button className="btn-primary" onClick={saveOrderStatus}>Apply Status</button></div>
                    </div>
                </div>
            )}

            {/* New Order Modal */}
            {isNewOrderModalOpen && (
                <div className="modal active">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header"><h3>Manual Order Entry</h3><button className="close-button" onClick={() => setIsNewOrderModalOpen(false)}>&times;</button></div>
                        <form className="modern-form" style={{ padding: 20 }} onSubmit={handleCreateOrder}>
                            <div className="form-group"><label>Customer Name</label><input required value={newOrderForm.customerName} onChange={e => setNewOrderForm({...newOrderForm, customerName: e.target.value})} /></div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Product</label>
                                    <select required value={newOrderForm.productId} onChange={e => setNewOrderForm({...newOrderForm, productId: e.target.value})}>
                                        <option value="">Select Product</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.productName} (${p.price})</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Qty</label><input type="number" min="1" value={newOrderForm.quantity} onChange={e => setNewOrderForm({...newOrderForm, quantity: e.target.value})} /></div>
                            </div>
                            <div className="modal-footer"><button className="btn-primary" type="submit">Create Order</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorDashboard;
