import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { database, ref, onValue, update, remove, auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import LoadingSpinner from '../component/LoadingSpinner';
import '../assets/css/admin.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolves product image from many possible Firebase field names */
const resolveProductImage = (product) => {
    return (
        product.productImage ||
        product.imageUrl ||
        product.imageURL ||
        product.image ||
        product.images?.[0] ||
        (Array.isArray(product.images) ? product.images[0] : null) ||
        null
    );
};

const StarRating = ({ rating = 0, max = 5 }) => {
    const r = Math.round(Math.min(Math.max(rating, 0), max));
    return (
        <span className="review-rating" aria-label={`${r} out of ${max} stars`}>
            {'★'.repeat(r)}{'☆'.repeat(max - r)}
        </span>
    );
};

const EmptyState = ({ icon, message }) => (
    <div className="empty-state">
        <i className={`fas fa-${icon}`}></i>
        <p>{message}</p>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, activeListings: 0, pendingOrders: 0, newReviews: 0 });
    const [data, setData] = useState({ users: [], products: [], orders: [], reviews: [], settings: {} });

    const handleLogout = async () => {
        try { await signOut(auth); } catch(e) { console.error(e); }
        navigate('/login');
    };

    // Review reply state (kept in main component to survive re-renders)
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingReply, setEditingReply] = useState(null);
    const [editReplyText, setEditReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const usersRef = ref(database, 'users');
        const productsRef = ref(database, 'products');
        const ordersRef = ref(database, 'orders');
        const reviewsRef = ref(database, 'reviews');
        const settingsRef = ref(database, 'settings');

        let loaded = 0;
        const checkLoaded = () => { loaded++; if (loaded >= 5) setLoading(false); };

        const unsubUsers = onValue(usersRef, (snap) => {
            const obj = snap.val() || {};
            const list = Object.keys(obj).map(id => ({ id, ...obj[id] }));
            setData(p => ({ ...p, users: list }));
            setStats(p => ({ ...p, totalUsers: list.length }));
            checkLoaded();
        });

        const unsubProducts = onValue(productsRef, (snap) => {
            const obj = snap.val() || {};
            const list = Object.keys(obj).map(id => ({ id, ...obj[id] }));
            setData(p => ({ ...p, products: list }));
            setStats(p => ({ ...p, activeListings: list.length }));
            checkLoaded();
        });

        const unsubOrders = onValue(ordersRef, (snap) => {
            const obj = snap.val() || {};
            const list = Object.keys(obj).map(id => ({ id, ...obj[id] }));
            setData(p => ({ ...p, orders: list }));
            setStats(p => ({ ...p, pendingOrders: list.filter(o => o.status?.toLowerCase() === 'pending').length }));
            checkLoaded();
        });

        const unsubReviews = onValue(reviewsRef, (snap) => {
            const obj = snap.val() || {};
            const list = Object.keys(obj).map(id => ({ id, ...obj[id] }));
            setData(p => ({ ...p, reviews: list }));
            setStats(p => ({ ...p, newReviews: list.length }));
            checkLoaded();
        });

        const unsubSettings = onValue(settingsRef, (snap) => {
            setData(p => ({ ...p, settings: snap.val() || {} }));
            checkLoaded();
        });

        return () => { unsubUsers(); unsubProducts(); unsubOrders(); unsubReviews(); unsubSettings(); };
    }, []);

    // ─── Section Resolver ──────────────────────────────────────────────────────

    const getSection = () => {
        const path = location.pathname;
        if (path.includes('/admin/users')) return 'management';
        if (path.includes('/admin/products')) return 'products';
        if (path.includes('/admin/orders')) return 'orders';
        if (path.includes('/admin/reviews')) return 'reviews';
        if (path.includes('/admin/settings')) return 'settings';
        return 'dashboard';
    };

    const section = getSection();

    const sectionTitles = {
        dashboard: { title: 'Dashboard', sub: 'Welcome back, Joe' },
        management: { title: 'User Management', sub: 'Manage platform users and roles' },
        products: { title: 'Product Listings', sub: 'View and manage all inventory' },
        orders: { title: 'Order Management', sub: 'Track and update order statuses' },
        reviews: { title: 'Customer Reviews', sub: 'Respond to customer feedback' },
        settings: { title: 'Platform Settings', sub: 'Configure your marketplace' },
    };

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleUpdateUser = useCallback(async (id, updates) => {
        try { await update(ref(database, `users/${id}`), updates); }
        catch (e) { console.error(e); }
    }, []);

    const handleDeleteProduct = useCallback(async (id) => {
        if (window.confirm('Are you sure you want to remove this product?')) {
            await remove(ref(database, `products/${id}`));
        }
    }, []);

    const handleUpdateOrder = useCallback(async (id, status) => {
        await update(ref(database, `orders/${id}`), { status });
    }, []);

    const handleSendReply = async (reviewId) => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            await update(ref(database, `reviews/${reviewId}`), {
                adminResponse: replyText.trim(),
                respondedAt: new Date().toISOString(),
            });
            setReplyingTo(null);
            setReplyText('');
        } catch (e) {
            alert('Failed to send response. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditReply = async (reviewId) => {
        if (!editReplyText.trim()) return;
        setIsSubmitting(true);
        try {
            await update(ref(database, `reviews/${reviewId}`), {
                adminResponse: editReplyText.trim(),
                updatedAt: new Date().toISOString(),
            });
            setEditingReply(null);
            setEditReplyText('');
        } catch (e) {
            alert('Failed to update response.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = useCallback(async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            await remove(ref(database, `users/${userId}`));
        }
    }, []);

    // ─── Render Sections (inline to preserve state) ────────────────────────────

    const renderDashboardOverview = () => (
        <div className="fade-up">
            {/* Stats */}
            <div className="admin-stats-grid">
                {[
                    { icon: 'users-cog', bg: '#ecfdf5', color: '#059669', label: 'Total Users', value: stats.totalUsers, trend: '+12%', up: true, accent: '#10b981' },
                    { icon: 'box-open', bg: '#fffbeb', color: '#d97706', label: 'Active Listings', value: stats.activeListings, trend: '+5%', up: true, accent: '#f59e0b' },
                    { icon: 'hourglass-half', bg: '#eff6ff', color: '#2563eb', label: 'Pending Orders', value: stats.pendingOrders, trend: '-2%', up: false, accent: '#3b82f6' },
                    { icon: 'star', bg: '#fef2f2', color: '#dc2626', label: 'Total Reviews', value: stats.newReviews, trend: '+24%', up: true, accent: '#ef4444' },
                ].map((card, i) => (
                    <div key={i} className="admin-stat-card" style={{ '--card-accent': card.accent }}>
                        <div className="stat-header">
                            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                                <i className={`fas fa-${card.icon}`}></i>
                            </div>
                            <span className={`stat-trend ${card.up ? 'trend-up' : 'trend-down'}`}>
                                {card.up ? '↑' : '↓'} {card.trend}
                            </span>
                        </div>
                        <div className="stat-body">
                            <h3>{card.value}</h3>
                            <p>{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="admin-content-layout">
                {/* Recent Orders */}
                <div className="admin-panel-card">
                    <div className="panel-header">
                        <h2><i className="fas fa-receipt" style={{ marginRight: 8, color: 'var(--admin-primary)' }}></i>Recent Orders</h2>
                        <button className="btn-link" onClick={() => navigate('/admin/orders')}>View All →</button>
                    </div>
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.orders.slice(-5).reverse().map(order => (
                                    <tr key={order.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{order.id.substring(0, 8)}</td>
                                        <td style={{ fontWeight: 600 }}>{order.customerName || 'Anonymous'}</td>
                                        <td>
                                            <span className={`status-badge status-${order.status?.toLowerCase() || 'pending'}`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                                            ₹{order.totalPrice || order.total || '0'}
                                        </td>
                                    </tr>
                                ))}
                                {data.orders.length === 0 && (
                                    <tr><td colSpan="4"><EmptyState icon="receipt" message="No orders yet" /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Users */}
                <div className="admin-panel-card">
                    <div className="panel-header">
                        <h2><i className="fas fa-users" style={{ marginRight: 8, color: 'var(--admin-secondary)' }}></i>Recent Users</h2>
                        <button className="btn-link" onClick={() => navigate('/admin/users')}>View All →</button>
                    </div>
                    <div>
                        {data.users.slice(-5).reverse().map(user => (
                            <div key={user.id} className="user-list-row">
                                <div className="user-mini-avatar">
                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="user-meta" style={{ flex: 1 }}>
                                    <h4>{user.name || user.email?.split('@')[0] || 'No Name'}</h4>
                                    <p>{user.role || 'customer'}</p>
                                </div>
                                <span className="status-badge status-active">Active</span>
                            </div>
                        ))}
                        {data.users.length === 0 && <EmptyState icon="user-slash" message="No users found" />}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUserManagement = () => (
        <div className="fade-up">
            <div className="admin-panel-card">
                <div className="panel-header">
                    <h2>Platform Users <span style={{ fontWeight: 400, fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: 8 }}>({data.users.length})</span></h2>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="user-mini-avatar">
                                                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name || 'No Name'}</div>
                                                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            className="role-select"
                                            value={user.role || 'customer'}
                                            onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                                        >
                                            <option value="customer">Customer</option>
                                            <option value="vendor">Vendor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td>
                                        <button
                                            className="btn-icon delete"
                                            title="Delete User"
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {data.users.length === 0 && (
                                <tr><td colSpan="4"><EmptyState icon="user-slash" message="No users found" /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderProductListings = () => (
        <div className="fade-up">
            <div className="admin-panel-card">
                <div className="panel-header">
                    <h2>Total Inventory</h2>
                    <span className="status-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                        {data.products.length} Products
                    </span>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Vendor</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.products.map(product => {
                                const imgSrc = resolveProductImage(product);
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="product-cell">
                                                {imgSrc ? (
                                                    <img
                                                        className="product-thumb"
                                                        src={imgSrc}
                                                        alt={product.productName || product.name || 'Product'}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="product-thumb-placeholder"
                                                    style={{ display: imgSrc ? 'none' : 'flex' }}
                                                >
                                                    <i className="fas fa-image"></i>
                                                </div>
                                                <div>
                                                    <div className="product-name">{product.productName || product.name || 'Unnamed Product'}</div>
                                                    <div className="product-id">ID: {product.id.substring(0, 10)}…</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="category-tag">{product.category || 'General'}</span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                                            ₹{product.price || '—'}
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {product.vendorName || product.storeName || '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    className="btn-icon delete"
                                                    title="Delete Product"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    title="View Product"
                                                    onClick={() => navigate(`/product/${product.id}`)}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {data.products.length === 0 && (
                                <tr><td colSpan="5"><EmptyState icon="box-open" message="No products found" /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderOrderManagement = () => (
        <div className="fade-up">
            <div className="admin-panel-card">
                <div className="panel-header">
                    <h2>Global Orders</h2>
                    <span className="status-badge status-pending">{data.orders.filter(o => o.status?.toLowerCase() === 'pending').length} Pending</span>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.orders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        #{order.id.substring(0, 10)}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{order.customerName || 'Anonymous'}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                        <select
                                            className={`status-badge status-${order.status?.toLowerCase() || 'pending'} order-status-select`}
                                            value={order.status || 'Pending'}
                                            onChange={(e) => handleUpdateOrder(order.id, e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Fulfilled">Fulfilled</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                                        ₹{order.totalPrice || order.total || '—'}
                                    </td>
                                </tr>
                            ))}
                            {data.orders.length === 0 && (
                                <tr><td colSpan="5"><EmptyState icon="receipt" message="No orders found" /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderReviewOverview = () => (
        <div className="fade-up">
            <div className="admin-panel-card">
                <div className="panel-header">
                    <h2>Customer Feedback</h2>
                    <span className="status-badge" style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary-dark)' }}>
                        {data.reviews.length} Reviews
                    </span>
                </div>
                <div className="review-list">
                    {data.reviews.length === 0 ? (
                        <EmptyState icon="comments" message="No customer reviews yet." />
                    ) : (
                        data.reviews.map(review => (
                            <div key={review.id} className="admin-review-card">
                                {/* Header */}
                                <div className="review-card-header">
                                    <div className="reviewer-info">
                                        <div className="reviewer-avatar">
                                            {(review.userName || 'C').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4>{review.userName || 'Anonymous Customer'}</h4>
                                            <p>{review.productName || 'General Feedback'}</p>
                                        </div>
                                    </div>
                                    <div className="review-meta">
                                        <StarRating rating={review.rating || 5} />
                                        {review.createdAt && (
                                            <span className="review-date">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Comment */}
                                {review.comment && (
                                    <p className="review-comment">{review.comment}</p>
                                )}

                                {/* Response area */}
                                {review.adminResponse ? (
                                    editingReply === review.id ? (
                                        <div className="reply-form">
                                            <textarea
                                                value={editReplyText}
                                                onChange={(e) => setEditReplyText(e.target.value)}
                                                placeholder="Edit your response..."
                                                autoFocus
                                            />
                                            <div className="reply-actions">
                                                <button
                                                    className="btn-text"
                                                    disabled={isSubmitting}
                                                    onClick={() => { setEditingReply(null); setEditReplyText(''); }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn-primary-sm"
                                                    disabled={isSubmitting || !editReplyText.trim()}
                                                    onClick={() => handleEditReply(review.id)}
                                                >
                                                    {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Saving…</> : <><i className="fas fa-check"></i> Update</>}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="admin-reply-box">
                                            <div className="reply-header-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div className="reply-header" style={{ margin: 0 }}>
                                                    <i className="fas fa-reply"></i>
                                                    <span>Admin Response</span>
                                                </div>
                                                <button
                                                    className="edit-reply-btn"
                                                    onClick={() => { setEditingReply(review.id); setEditReplyText(review.adminResponse); }}
                                                >
                                                    <i className="fas fa-pencil-alt"></i> Edit
                                                </button>
                                            </div>
                                            <p>{review.adminResponse}</p>
                                        </div>
                                    )
                                ) : (
                                    replyingTo === review.id ? (
                                        <div className="reply-form">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write a professional response to this customer..."
                                                autoFocus
                                            />
                                            <div className="reply-actions">
                                                <button
                                                    className="btn-text"
                                                    disabled={isSubmitting}
                                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn-primary-sm"
                                                    disabled={isSubmitting || !replyText.trim()}
                                                    onClick={() => handleSendReply(review.id)}
                                                >
                                                    {isSubmitting
                                                        ? <><i className="fas fa-spinner fa-spin"></i> Sending…</>
                                                        : <><i className="fas fa-paper-plane"></i> Send Response</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="review-actions-row">
                                            <button
                                                className="btn-reply-trigger"
                                                onClick={() => setReplyingTo(review.id)}
                                            >
                                                <i className="fas fa-comment-dots"></i> Reply to Review
                                            </button>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No response yet</span>
                                        </div>
                                    )
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderSystemSettings = () => (
        <div className="fade-up">
            <div className="admin-panel-card" style={{ maxWidth: '640px' }}>
                <div className="panel-header">
                    <h2><i className="fas fa-cog" style={{ marginRight: 8, color: 'var(--admin-primary)' }}></i>Platform Settings</h2>
                </div>
                <div className="settings-form">
                    <div className="form-group">
                        <label>Platform Name</label>
                        <input type="text" className="form-control" defaultValue={data.settings.platformName || 'GreenTech Marketplace'} />
                    </div>
                    <div className="form-group">
                        <label>Support Email</label>
                        <input type="email" className="form-control" defaultValue={data.settings.supportEmail || 'support@greentech.com'} />
                    </div>
                    <div className="form-group">
                        <label>Maintenance Mode</label>
                        <select className="form-control">
                            <option value="off">Off — Site is Live</option>
                            <option value="on">On — Under Maintenance</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Commission Fee (%)</label>
                        <input type="number" className="form-control" defaultValue={data.settings.commission || 5} min={0} max={50} />
                    </div>
                    <button className="btn-save">
                        <i className="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );

    // ─── Layout ────────────────────────────────────────────────────────────────

    const { title, sub } = sectionTitles[section] || sectionTitles.dashboard;

    return (
        <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/asset/admin-logo.png" className="logo-icon" alt="GreenTech Logo" />
                    <h2>Green<span>Tech</span></h2>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main</div>
                    <ul>
                        <li>
                            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsSidebarOpen(false)}>
                                <i className="fas fa-th-large"></i><span>Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsSidebarOpen(false)}>
                                <i className="fas fa-users"></i><span>User Management</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsSidebarOpen(false)}>
                                <i className="fas fa-shopping-bag"></i><span>Products</span>
                            </NavLink>
                        </li>
                    </ul>

                    <div className="sidebar-section-label">Operations</div>
                    <ul>
                        <li>
                            <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsSidebarOpen(false)}>
                                <i className="fas fa-chart-line"></i><span>Orders</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/reviews" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsSidebarOpen(false)}>
                                <i className="fas fa-comment-dots"></i>
                                <span>Reviews</span>
                                {data.reviews.filter(r => !r.adminResponse).length > 0 && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        borderRadius: '999px',
                                        padding: '2px 7px',
                                    }}>
                                        {data.reviews.filter(r => !r.adminResponse).length}
                                    </span>
                                )}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsSidebarOpen(false)}>
                                <i className="fas fa-cog"></i><span>Settings</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-footer-btn" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

            {/* Main Content */}
            <main className="admin-main">
                {/* Topbar */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="mobile-toggle" onClick={() => setIsSidebarOpen(true)}>
                            <i className="fas fa-bars"></i>
                        </div>
                        <div>
                            <h1>{title}</h1>
                            <p className="topbar-breadcrumb">
                                <i className="fas fa-home" style={{ fontSize: '0.7rem' }}></i>
                                Admin &rsaquo; {title}
                            </p>
                        </div>
                    </div>

                    <div className="topbar-right">
                        <button className="topbar-icon-btn" title="Notifications">
                            <i className="fas fa-bell"></i>
                            {data.reviews.filter(r => !r.adminResponse).length > 0 && (
                                <span className="notification-dot"></span>
                            )}
                        </button>
                        <div className="topbar-divider"></div>
                        <div className="user-profile-pill">
                            <div className="user-avatar">A</div>
                            <span>Admin</span>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </header>

                {/* Section Content */}
                <div className="admin-content-wrapper">
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            {section === 'dashboard' && renderDashboardOverview()}
                            {section === 'management' && renderUserManagement()}
                            {section === 'products' && renderProductListings()}
                            {section === 'orders' && renderOrderManagement()}
                            {section === 'reviews' && renderReviewOverview()}
                            {section === 'settings' && renderSystemSettings()}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
