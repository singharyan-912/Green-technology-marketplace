import React from 'react';
import { NavLink } from 'react-router-dom';
import '../assets/css/admin.css';

const AdminNavbar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src="/asset/admin-logo.png" className="logo-icon" alt="Logo" />
                <h2>Admin</h2>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <NavLink 
                            to="/admin/dashboard" 
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            <i className="fas fa-th-large"></i> <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin/users" 
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            <i className="fas fa-users"></i> <span>Management</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin/products" 
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            <i className="fas fa-shopping-bag"></i> <span>Products</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin/orders" 
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            <i className="fas fa-chart-line"></i> <span>Orders</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin/reviews" 
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            <i className="fas fa-comment-dots"></i> <span>Reviews</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin/settings" 
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            <i className="fas fa-cog"></i> <span>Settings</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default AdminNavbar;
