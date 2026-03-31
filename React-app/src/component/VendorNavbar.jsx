import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import '../assets/css/vendor.css';

const VendorNavbar = ({ logo }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await signOut(auth); } catch(e) { console.error(e); }
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        {logo ? (
                            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <div className="logo-icon-default">🌿</div>
                        )}
                    </div>
                    <span>VendorPanel</span>
                </div>
            </div>
            <nav className="nav-menu">
                <ul>
                    <li>
                        <Link to="/vendor/dashboard" className={`nav-item ${isActive('/vendor/dashboard')}`}>
                            <i className="fas fa-th-large"></i> <span>Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/vendor/products" className={`nav-item ${isActive('/vendor/products')}`}>
                            <i className="fas fa-box"></i> <span>Products</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/vendor/add-product" className={`nav-item ${isActive('/vendor/add-product')}`}>
                            <i className="fas fa-plus-circle"></i> <span>Add Product</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/vendor/orders" className={`nav-item ${isActive('/vendor/orders')}`}>
                            <i className="fas fa-shopping-bag"></i> <span>Orders</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/vendor/analytics" className={`nav-item ${isActive('/vendor/analytics')}`}>
                            <i className="fas fa-chart-pie"></i> <span>Analytics</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/vendor/settings" className={`nav-item ${isActive('/vendor/settings')}`}>
                            <i className="fas fa-sliders-h"></i> <span>Settings</span>
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit' }}>
                    <i className="fas fa-sign-out-alt"></i> <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default VendorNavbar;
