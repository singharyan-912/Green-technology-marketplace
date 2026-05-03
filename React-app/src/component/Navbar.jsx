import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import '../index.css';

const Navbar = () => {
    const { currentUser, userRole, logout } = useAuth();
    const { getCartCount } = useCart();
    const { getWishlistCount } = useWishlist();
    const cartCount = getCartCount();
    const wishlistCount = getWishlistCount();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [navSearch, setNavSearch] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus when location changes
    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
    }, [location]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleNavSearch = (e) => {
        if (e.key === 'Enter' && navSearch.trim()) {
            navigate(`/customer?q=${encodeURIComponent(navSearch.trim())}`);
            setNavSearch('');
            setIsMenuOpen(false);
        }
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Marketplace', path: '/customer' },
        { name: 'About', path: '/#about' },
    ];

    // Role-specific dashboard link
    const getDashboardPath = () => {
        if (!userRole) return '/login';
        switch (userRole) {
            case 'customer': return '/customer';
            case 'vendor': return '/vendor/dashboard';
            case 'admin': return '/admin/dashboard';
            default: return '/';
        }
    };

    return (
        <nav className={`main-navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container nav-container">
                {/* Logo */}
                <Link to="/" className="brand-logo">
                    <div className="logo-icon">🌿</div>
                    <span className="logo-text">Green<span>Tech</span></span>
                </Link>

                {/* Desktop Navigation */}
                <div className="desktop-nav">
                    <ul className="nav-list">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <Link to={link.path} className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}>
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Search Bar - Subtle */}
                    <div className="nav-search">
                        <input 
                            type="text" 
                            placeholder="Search eco-tech..." 
                            value={navSearch}
                            onChange={(e) => setNavSearch(e.target.value)}
                            onKeyDown={handleNavSearch}
                        />
                        <span className="search-icon" onClick={() => { if(navSearch.trim()) navigate(`/customer?q=${encodeURIComponent(navSearch.trim())}`); setNavSearch(''); }}>🔍</span>
                    </div>

                    {/* Cart & Wishlist Icons (only for logged-in customers) */}
                    {currentUser && userRole === 'customer' && (
                        <div className="nav-icon-group">
                            <button
                                className="nav-icon-btn"
                                title="Wishlist"
                                onClick={() => navigate('/wishlist')}
                                aria-label="Go to Wishlist"
                            >
                                <i className="far fa-heart"></i>
                                {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
                            </button>
                            <button
                                className="nav-icon-btn"
                                title="Cart"
                                onClick={() => navigate('/cart')}
                                aria-label="Go to Cart"
                            >
                                <i className="fas fa-shopping-cart"></i>
                                {cartCount > 0 && <span className="nav-badge nav-badge--cart">{cartCount}</span>}
                            </button>
                        </div>
                    )}

                    {/* Auth Actions */}
                    <div className="auth-section">
                        {currentUser ? (
                            <div className="profile-wrapper">
                                <button className="profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                    <div className="avatar-small">
                                        {currentUser.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="user-role-badge">{userRole}</span>
                                </button>
                                
                                {isProfileOpen && (
                                    <div className="profile-dropdown fade-in">
                                        <div className="dropdown-header">
                                            <p className="user-name">{currentUser.email.split('@')[0]}</p>
                                            <p className="user-email">{currentUser.email}</p>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to={getDashboardPath()} className="dropdown-item">📊 My Dashboard</Link>
                                        {userRole === 'vendor' && <Link to="/add-product" className="dropdown-item">➕ Add Product</Link>}
                                        <div className="dropdown-divider"></div>
                                        <button onClick={handleLogout} className="dropdown-item logout-btn">🚪 Logout</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-btns">
                                <Link to="/login" className="login-btn-nav">Sign In</Link>
                                <Link to="/signup" className="signup-btn-nav">Join Now</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Trigger */}
                <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <div className={`hamburger ${isMenuOpen ? 'open' : ''}`}></div>
                </button>
            </div>

            {/* Mobile Drawer */}
            <div className={`mobile-drawer ${isMenuOpen ? 'active' : ''}`}>
                <div className="drawer-header">
                    <span className="logo-text">Green<span>Tech</span></span>
                    <button className="close-drawer" onClick={() => setIsMenuOpen(false)}>×</button>
                </div>
                <ul className="mobile-nav-list">
                    {navLinks.map((link) => (
                        <li key={link.name}>
                            <Link to={link.path} onClick={() => setIsMenuOpen(false)}>{link.name}</Link>
                        </li>
                    ))}
                    <div className="drawer-divider"></div>
                    {currentUser ? (
                        <>
                            <li><Link to={getDashboardPath()}>Dashboard</Link></li>
                            {userRole === 'customer' && (
                                <>
                                    <li><Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>❤️ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</Link></li>
                                    <li><Link to="/cart" onClick={() => setIsMenuOpen(false)}>🛒 Cart {cartCount > 0 && `(${cartCount})`}</Link></li>
                                </>
                            )}
                            <li><button onClick={handleLogout}>Logout</button></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/login">Sign In</Link></li>
                            <li><Link to="/signup">Sign Up</Link></li>
                        </>
                    )}
                </ul>
            </div>

            <style>{`
                .main-navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    z-index: 1000;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(10px);
                    height: 80px;
                    display: flex;
                    align-items: center;
                    transition: var(--transition);
                    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
                }

                .main-navbar.scrolled {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(16px);
                    height: 70px;
                    box-shadow: var(--shadow-sm);
                    border-bottom: 1px solid var(--border);
                }

                .nav-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }

                /* Logo Style */
                .brand-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.4rem;
                }

                .logo-icon { font-size: 1.6rem; }
                .logo-text { font-weight: 800; color: var(--text-main); letter-spacing: -0.5px; }
                .logo-text span { color: var(--primary); }

                /* Desktop Nav */
                .desktop-nav {
                    display: flex;
                    align-items: center;
                    gap: 30px;
                }

                @media (max-width: 991px) { .desktop-nav { display: none; } }

                .nav-list { display: flex; gap: 24px; }
                .nav-link {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    position: relative;
                }

                .nav-link:after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: var(--primary);
                    transition: var(--transition);
                }

                .nav-link:hover, .nav-link.active { color: var(--text-main); }
                .nav-link:hover:after, .nav-link.active:after { width: 100%; }

                /* Search Bar */
                .nav-search {
                    position: relative;
                    background: var(--input-bg);
                    border-radius: var(--radius-full);
                    padding: 6px 16px;
                    width: 220px;
                    display: flex;
                    align-items: center;
                }

                .nav-search input {
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 0.85rem;
                    width: 100%;
                }

                .search-icon { font-size: 0.8rem; opacity: 0.5; }

                /* Auth UI */
                .auth-btns { display: flex; gap: 12px; }
                .login-btn-nav {
                    padding: 8px 16px;
                    font-weight: 600;
                    color: var(--text-main);
                }

                .signup-btn-nav {
                    padding: 8px 20px;
                    background: var(--primary);
                    color: white;
                    border-radius: var(--radius-full);
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(46, 204, 113, 0.2);
                }
                .signup-btn-nav:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(46, 204, 113, 0.3); }

                /* Profile & Dropdown */
                .profile-wrapper { position: relative; }
                .profile-trigger {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 8px;
                    border-radius: var(--radius-full);
                    border: 1px solid var(--border);
                    background: white;
                }

                .avatar-small {
                    width: 32px;
                    height: 32px;
                    background: var(--primary-light);
                    color: var(--primary-dark);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.8rem;
                }

                .user-role-badge {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    background: #f1f5f9;
                    padding: 2px 8px;
                    border-radius: 4px;
                    color: var(--text-muted);
                }

                .profile-dropdown {
                    position: absolute;
                    top: calc(100% + 15px);
                    right: 0;
                    width: 220px;
                    background: white;
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border);
                    padding: 10px;
                    z-index: 1100;
                }

                .dropdown-header { padding: 8px 12px; }
                .user-name { font-weight: 700; font-size: 0.95rem; }
                .user-email { font-size: 0.75rem; color: var(--text-muted); }
                .dropdown-divider { height: 1px; background: var(--border); margin: 8px 0; }
                .dropdown-item {
                    display: block;
                    padding: 10px 12px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .dropdown-item:hover { background: #f8fafc; color: var(--primary); }
                .logout-btn { width: 100%; text-align: left; color: #e74c3c !important; }

                /* Cart & Wishlist Navbar Icons */
                .nav-icon-group {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .nav-icon-btn {
                    position: relative;
                    width: 38px;
                    height: 38px;
                    border: none;
                    background: #f8fafc;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #475569;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .nav-icon-btn:hover { background: #ecfdf5; color: #10b981; }

                .nav-badge {
                    position: absolute;
                    top: -3px;
                    right: -3px;
                    min-width: 18px;
                    height: 18px;
                    padding: 0 4px;
                    background: #ef4444;
                    color: white;
                    border-radius: 10px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    animation: badge-pop 0.3s ease;
                }

                .nav-badge--cart { background: #10b981; }

                @keyframes badge-pop {
                    0% { transform: scale(0); }
                    70% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                /* Mobile Toggle */
                .mobile-toggle {
                    display: none;
                    width: 40px;
                    height: 40px;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                @media (max-width: 991px) { .mobile-toggle { display: flex; } }

                .hamburger {
                    width: 24px;
                    height: 2px;
                    background: var(--text-main);
                    position: relative;
                }
                .hamburger:before, .hamburger:after {
                    content: '';
                    position: absolute;
                    width: 24px;
                    height: 2px;
                    background: var(--text-main);
                    transition: 0.3s;
                }
                .hamburger:before { top: -8px; }
                .hamburger:after { top: 8px; }
                .hamburger.open { background: transparent; }
                .hamburger.open:before { transform: rotate(45deg); top: 0; }
                .hamburger.open:after { transform: rotate(-45deg); top: 0; }

                /* Mobile Drawer */
                .mobile-drawer {
                    position: fixed;
                    top: 0;
                    right: -100%;
                    width: 300px;
                    height: 100%;
                    background: white;
                    z-index: 2000;
                    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    padding: 30px;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.1);
                }
                .mobile-drawer.active { right: 0; }
                .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .close-drawer { font-size: 2rem; }
                .mobile-nav-list li { margin-bottom: 24px; font-weight: 700; font-size: 1.2rem; }
                .mobile-nav-list li a, .mobile-nav-list li button { color: var(--text-main); font-weight: 600; font-size: 1.1rem; }
                .mobile-nav-list li button { background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; }
                .drawer-divider { height: 1px; background: var(--border); margin: 16px 0 24px; }
            `}</style>
        </nav>
    );
};

export default Navbar;
