import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database, ref, get } from '../firebase/config';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import Navbar from '../component/Navbar';
import '../index.css';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const resolveImage = (p) =>
    p.productImage || p.imageUrl || p.imageURL || p.image ||
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600';

const getEcoInfo = (score) => {
    const n = parseInt(score) || 0;
    if (n >= 9) return { color: '#10b981', bg: '#ecfdf5', label: 'Excellent' };
    if (n >= 7) return { color: '#059669', bg: '#f0fdf4', label: 'Very Good' };
    if (n >= 5) return { color: '#d97706', bg: '#fffbeb', label: 'Good' };
    return { color: '#ef4444', bg: '#fef2f2', label: 'Low' };
};

// ─── Wishlist Card ──────────────────────────────────────────────────────────────
const WishlistCard = ({ product, onRemove, onAddToCart, cartAdded }) => {
    const navigate = useNavigate();
    const eco = getEcoInfo(product.displayEcoRating || product.ecoRating);
    const imgSrc = resolveImage(product);

    return (
        <div className="wl-card" onClick={() => navigate(`/product/${product.id}`)}>
            {/* Image */}
            <div className="wl-card__media">
                <img
                    src={imgSrc}
                    alt={product.displayName || product.productName}
                    className="wl-card__img"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600';
                    }}
                    loading="lazy"
                />
                {/* Eco Badge */}
                <div className="wl-card__eco" style={{ background: eco.bg, color: eco.color }}>
                    <i className="fas fa-leaf"></i>
                    <span>{product.displayEcoRating || product.ecoRating || '8'}/10</span>
                </div>
                {/* Remove Wishlist Button */}
                <button
                    className="wl-card__remove"
                    title="Remove from Wishlist"
                    onClick={(e) => { e.stopPropagation(); onRemove(product.id); }}
                >
                    <i className="fas fa-heart"></i>
                </button>
            </div>

            {/* Details */}
            <div className="wl-card__body">
                <span className="wl-card__cat">
                    {product.displayCategory || product.category || 'Eco Product'}
                </span>
                <h3 className="wl-card__name">
                    {product.displayName || product.productName || product.name}
                </h3>
                <p className="wl-card__desc">
                    {product.description
                        ? product.description.slice(0, 80) + (product.description.length > 80 ? '…' : '')
                        : 'Sustainable and eco-certified product.'}
                </p>
                <div className="wl-card__footer">
                    <div className="wl-card__price">
                        <span className="wl-card__currency">$</span>
                        <span className="wl-card__amount">{product.displayPrice || product.price || '0'}</span>
                    </div>
                    <button
                        className={`wl-card__cart-btn ${cartAdded ? 'wl-card__cart-btn--added' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                        title="Add to Cart"
                    >
                        <i className={`fas ${cartAdded ? 'fa-check' : 'fa-shopping-cart'}`}></i>
                        <span>{cartAdded ? 'Added!' : 'Add to Cart'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Page ───────────────────────────────────────────────────────────────────────
const Wishlist = () => {
    const navigate = useNavigate();
    const { wishlist, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addedMap, setAddedMap] = useState({});   // { productId: boolean }
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2200);
    };

    // Fetch full product data for each wishlist ID
    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (!wishlist || wishlist.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const promises = wishlist.map(id =>
                    get(ref(database, `products/${id}`)).then(snap => {
                        if (!snap.exists()) return null;
                        const d = snap.val();
                        return {
                            id,
                            ...d,
                            displayName: d.productName || d.name || 'Eco Product',
                            displayPrice: d.price || '0',
                            displayCategory: d.category || 'Environmental',
                            displayEcoRating: d.ecoRating || '8',
                        };
                    })
                );
                const results = await Promise.all(promises);
                setProducts(results.filter(Boolean));
            } catch (err) {
                console.error('Wishlist fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlistProducts();
    }, [wishlist]);

    const handleRemove = (productId) => {
        toggleWishlist(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        showToast('💔 Removed from wishlist');
    };

    const handleAddToCart = (product) => {
        addToCart(product);
        setAddedMap(prev => ({ ...prev, [product.id]: true }));
        showToast(`🛒 "${product.displayName}" added to cart!`);
        setTimeout(() => setAddedMap(prev => ({ ...prev, [product.id]: false })), 2000);
    };

    return (
        <div className="wl-page">
            <Navbar />

            {/* Toast */}
            {toast && <div className="page-toast">{toast}</div>}

            <main className="container wl-main">
                {/* Page Header */}
                <div className="page-hero fade-in">
                    <div className="page-hero__icon" style={{ background: 'linear-gradient(135deg, #fecdd3, #fb7185)', color: 'white' }}>
                        <i className="fas fa-heart"></i>
                    </div>
                    <div>
                        <h1 className="page-hero__title">My Wishlist</h1>
                        <p className="page-hero__sub">
                            {products.length > 0
                                ? `${products.length} eco-product${products.length !== 1 ? 's' : ''} saved`
                                : 'Items you love, all in one place'}
                        </p>
                    </div>
                    {products.length > 0 && (
                        <button className="page-hero__cta" onClick={() => navigate('/customer')}>
                            <i className="fas fa-plus"></i> Add More
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="page-loading">
                        <div className="page-spinner"></div>
                        <p>Loading your wishlist…</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="page-empty fade-in">
                        <div className="page-empty__icon">❤️</div>
                        <h2>Your wishlist is empty</h2>
                        <p>Save products you love by clicking the ❤️ on any product card.</p>
                        <button className="page-empty__btn" onClick={() => navigate('/customer')}>
                            <i className="fas fa-leaf"></i> Browse Marketplace
                        </button>
                    </div>
                ) : (
                    <div className="wl-grid fade-in">
                        {products.map(product => (
                            <WishlistCard
                                key={product.id}
                                product={product}
                                onRemove={handleRemove}
                                onAddToCart={handleAddToCart}
                                cartAdded={!!addedMap[product.id]}
                            />
                        ))}
                    </div>
                )}
            </main>

            <style>{`
                /* ─── Page Shell ─── */
                .wl-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding-bottom: 80px;
                }
                .wl-main {
                    padding-top: 110px;
                    max-width: 1280px;
                }

                /* ─── Page Hero ─── */
                .page-hero {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 40px;
                    flex-wrap: wrap;
                }
                .page-hero__icon {
                    width: 56px; height: 56px;
                    background: linear-gradient(135deg, #fecdd3, #fb7185);
                    border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.5rem; color: white;
                    box-shadow: 0 8px 20px rgba(251,113,133,0.3);
                    flex-shrink: 0;
                }
                .page-hero__title {
                    font-size: 1.875rem; font-weight: 800;
                    color: #0f172a; margin: 0 0 4px;
                }
                .page-hero__sub {
                    color: #64748b; font-size: 0.95rem; margin: 0;
                }
                .page-hero__cta {
                    margin-left: auto;
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 20px;
                    background: #10b981; color: white;
                    border: none; border-radius: 10px;
                    font-weight: 700; font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(16,185,129,0.25);
                }
                .page-hero__cta:hover { background: #059669; transform: translateY(-1px); }

                /* ─── Grid ─── */
                .wl-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                }
                @media (max-width: 1200px) { .wl-grid { grid-template-columns: repeat(3, 1fr); } }
                @media (max-width: 900px)  { .wl-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 560px)  { .wl-grid { grid-template-columns: 1fr; } }

                /* ─── Card ─── */
                .wl-card {
                    background: white;
                    border-radius: 18px;
                    overflow: hidden;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    display: flex; flex-direction: column;
                    cursor: pointer;
                    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                    position: relative;
                }
                .wl-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 32px rgba(0,0,0,0.1);
                    border-color: #10b981;
                }

                .wl-card__media {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                    background: #f1f5f9;
                }
                .wl-card__img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }
                .wl-card:hover .wl-card__img { transform: scale(1.07); }

                .wl-card__eco {
                    position: absolute; top: 12px; left: 12px;
                    display: flex; align-items: center; gap: 5px;
                    padding: 4px 10px; border-radius: 20px;
                    font-size: 0.72rem; font-weight: 700;
                    backdrop-filter: blur(4px);
                }

                .wl-card__remove {
                    position: absolute; top: 10px; right: 10px;
                    width: 34px; height: 34px;
                    background: #ef4444; color: white;
                    border: none; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.85rem; cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 3px 8px rgba(239,68,68,0.35);
                }
                .wl-card__remove:hover { background: #dc2626; transform: scale(1.12); }

                .wl-card__body {
                    padding: 16px;
                    display: flex; flex-direction: column; flex: 1;
                }
                .wl-card__cat {
                    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.08em; color: #64748b;
                    background: #f8fafc; padding: 2px 8px; border-radius: 4px;
                    display: inline-flex; width: fit-content; margin-bottom: 8px;
                }
                .wl-card__name {
                    font-size: 1rem; font-weight: 700; color: #1e293b;
                    margin-bottom: 6px; line-height: 1.35;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .wl-card__desc {
                    font-size: 0.825rem; color: #64748b; line-height: 1.5;
                    margin-bottom: 12px; flex: 1;
                }
                .wl-card__footer {
                    display: flex; align-items: center; justify-content: space-between;
                    padding-top: 12px; border-top: 1px solid #f1f5f9; gap: 10px;
                }
                .wl-card__price {
                    display: flex; align-items: flex-start; color: #0f172a;
                }
                .wl-card__currency { font-size: 0.8rem; font-weight: 600; margin-top: 2px; }
                .wl-card__amount { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.5px; }
                .wl-card__cart-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 14px;
                    background: #10b981; color: white;
                    border: none; border-radius: 8px;
                    font-weight: 700; font-size: 0.8rem; cursor: pointer;
                    transition: all 0.2s; white-space: nowrap;
                }
                .wl-card__cart-btn:hover { background: #059669; }
                .wl-card__cart-btn--added { background: #059669 !important; }

                /* ─── Loading / Empty ─── */
                .page-loading {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 100px 20px; gap: 16px; color: #64748b;
                }
                .page-spinner {
                    width: 44px; height: 44px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #10b981;
                    border-radius: 50%;
                    animation: wl-spin 0.8s linear infinite;
                }
                @keyframes wl-spin { to { transform: rotate(360deg); } }

                .page-empty {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 100px 20px; text-align: center;
                }
                .page-empty__icon { font-size: 4rem; margin-bottom: 20px; }
                .page-empty h2 { font-size: 1.5rem; color: #1e293b; margin-bottom: 10px; }
                .page-empty p { color: #64748b; font-size: 0.95rem; margin-bottom: 28px; max-width: 380px; }
                .page-empty__btn {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 12px 28px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white; border: none; border-radius: 10px;
                    font-weight: 700; font-size: 0.95rem; cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 6px 16px rgba(16,185,129,0.3);
                }
                .page-empty__btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(16,185,129,0.4); }

                /* ─── Toast ─── */
                .page-toast {
                    position: fixed; bottom: 32px; left: 50%;
                    transform: translateX(-50%);
                    background: #0f172a; color: white;
                    padding: 13px 26px; border-radius: 50px;
                    font-weight: 600; font-size: 0.9rem;
                    z-index: 9999; white-space: nowrap;
                    animation: toast-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 10px 28px rgba(0,0,0,0.2);
                }
                @keyframes toast-up {
                    from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.92); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Wishlist;
