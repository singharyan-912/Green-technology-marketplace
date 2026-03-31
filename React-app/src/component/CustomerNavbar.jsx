import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/customer.css';

const CustomerNavbar = () => {
    return (
        <header className="main-header">
            <div className="header-container">
                <Link to="/customer" className="logo" style={{ cursor: 'pointer', textDecoration: 'none' }}>
                    <img src="/asset/site_logo.jpg" alt="Logo" className="logo-icon" loading="lazy" />
                    <span className="logo-text">Green<span>Tech</span></span>
                </Link>
                
                <div className="search-bar">
                    <input type="text" id="main-search-input" placeholder="Search eco-friendly products..." />
                    <button className="search-button" id="search-trigger">🔍</button>
                </div>

                <nav className="main-nav">
                    <ul>
                        <li><Link to="/customer" className="active">Home</Link></li>
                        <li className="dropdown">
                            <Link to="/products">Products ▾</Link>
                            <div className="dropdown-content">
                                <Link to="/products?search=Electronics">Electronics</Link>
                                <Link to="/products?search=Home%20Goods">Home Goods</Link>
                                <Link to="/products?search=Outdoor">Outdoor & Garden</Link>
                                <Link to="/products?search=Personal%20Care">Personal Care</Link>
                            </div>
                        </li>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </nav>

                <div className="user-actions">
                    <div className="action-icon">
                        <img src="/asset/e-commerce.png" alt="Wishlist" />
                        <span className="badge" id="wishlist-count">0</span>
                    </div>
                    <div className="action-icon">
                        <img src="/asset/shopping-cart.png" alt="Cart" />
                        <span className="badge" id="cart-count">0</span>
                    </div>
                    
                    <div className="user-profile dropdown">
                        <div className="avatar-wrapper">
                            <img src="/asset/myAccount.jpg" alt="User Avatar" className="avatar" />
                        </div>
                        <span id="header-user-name">Account</span>
                        <div className="dropdown-content">
                            <Link to="/customer/profile" id="btn-profile">My Profile</Link>
                            <Link to="/customer/orders" id="btn-orders">Order History</Link>
                            <hr />
                            <Link to="/logout" className="logout-link">Logout</Link>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default CustomerNavbar;
