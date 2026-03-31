import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database, ref, get } from '../firebase/config';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Navbar from '../component/Navbar';
import ProductCard from '../component/ProductCard';
import LoadingSpinner from '../component/LoadingSpinner';
import '../index.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // ── Cart & Wishlist ──────────────────────────────────────
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    // ── Local State ──────────────────────────────────────────
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addedToCart, setAddedToCart] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [similarProducts, setSimilarProducts] = useState([]);
    const [similarLoading, setSimilarLoading] = useState(false);

    const inWishlist = product ? isInWishlist(product.id) : false;

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const productRef = ref(database, `products/${id}`);
                const snapshot = await get(productRef);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setProduct({
                        id,
                        ...data,
                        displayName: data.productName || data.name || 'Eco Product',
                        displayPrice: data.price || '0.00',
                        displayCategory: data.category || 'Environmental',
                        displayEcoRating: data.ecoRating || '8',
                        displayImage:
                            data.productImage ||
                            data.imageURL ||
                            data.imageUrl ||
                            data.image ||
                            'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
                    });
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    // ── Similar Products ──────────────────────────────────────
    useEffect(() => {
        if (!product) return;

        const fetchSimilar = async () => {
            setSimilarLoading(true);
            try {
                const snap = await get(ref(database, 'products'));
                if (!snap.exists()) return;

                const allData = snap.val();
                const currentEco = parseInt(product.displayEcoRating) || 8;
                const currentCat = (product.displayCategory || '').toLowerCase();

                const similar = Object.keys(allData)
                    .filter(key => key !== id)   // exclude current
                    .map(key => {
                        const d = allData[key];
                        return {
                            id: key,
                            ...d,
                            displayName: d.productName || d.name || 'Eco Product',
                            displayPrice: d.price || '0',
                            displayCategory: d.category || 'Environmental',
                            displayEcoRating: d.ecoRating || '8',
                        };
                    })
                    .filter(p => {
                        const sameCategory = (p.displayCategory || '').toLowerCase() === currentCat;
                        const ecoScore = parseInt(p.displayEcoRating) || 0;
                        const nearEco = Math.abs(ecoScore - currentEco) <= 2;
                        return sameCategory || nearEco;
                    })
                    .slice(0, 8);  // max 8 similar products

                setSimilarProducts(similar);
            } catch (err) {
                console.error('Similar products fetch error:', err);
            } finally {
                setSimilarLoading(false);
            }
        };

        fetchSimilar();
    }, [product, id]);

    // ── Helpers ──────────────────────────────────────────────
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 2200);
    };

    const getEcoInfo = (score) => {
        const n = parseInt(score);
        if (n >= 9) return { color: '#10b981', label: 'Excellent Sustainability', light: '#ecfdf5', icon: 'fa-leaf' };
        if (n >= 7) return { color: '#059669', label: 'High Eco Impact', light: '#f0fdf4', icon: 'fa-check-circle' };
        if (n >= 5) return { color: '#d97706', label: 'Sustainable Choice', light: '#fffbeb', icon: 'fa-recycle' };
        return { color: '#ef4444', label: 'Basic Eco Standard', light: '#fef2f2', icon: 'fa-info-circle' };
    };

    // ── Handlers ─────────────────────────────────────────────
    const handleAddToCart = () => {
        addToCart(product);
        setAddedToCart(true);
        showToast(`✅ "${product.displayName}" added to cart!`);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleWishlist = () => {
        toggleWishlist(product.id);
        showToast(
            inWishlist
                ? `💔 Removed from wishlist`
                : `❤️ Added to wishlist!`
        );
    };

    // ── Render States ────────────────────────────────────────
    if (loading) return <div className="detail-loading-screen"><Navbar /><LoadingSpinner /></div>;

    if (error || !product) {
        return (
            <div className="error-page">
                <Navbar />
                <div className="container error-content">
                    <div className="error-card">
                        <div className="error-icon">😕</div>
                        <h1>{error || 'Product Not Found'}</h1>
                        <p>The product you're looking for might have been removed or is temporarily unavailable.</p>
                        <button onClick={() => navigate('/customer')} className="back-home-btn">
                            <i className="fas fa-arrow-left"></i> Back to Marketplace
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const eco = getEcoInfo(product.displayEcoRating);

    return (
        <div className="product-detail-page">
            <Navbar />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="detail-toast">
                    {toastMessage}
                </div>
            )}

            <main className="container detail-container fade-in">
                <button onClick={() => navigate(-1)} className="back-nav-link">
                    <i className="fas fa-arrow-left"></i> Back to results
                </button>

                <div className="detail-grid">
                    {/* Left: Product Image */}
                    <div className="detail-media">
                        <div className="image-display-wrapper">
                            <img
                                src={product.displayImage}
                                alt={product.displayName}
                                className="main-product-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800';
                                }}
                            />
                            <div className="image-overlay-badge" style={{ backgroundColor: eco.light, color: eco.color }}>
                                <i className={`fas ${eco.icon}`}></i>
                                <span>{product.displayEcoRating}/10 Eco Score</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="detail-info">
                        <div className="info-header">
                            <span className="info-cat-tag">{product.displayCategory}</span>
                            <div className="stock-status">
                                <span className="status-dot"></span> In Stock
                            </div>
                        </div>

                        <h1 className="info-title">{product.displayName}</h1>

                        <div className="info-price-row">
                            <div className="info-price">
                                <span className="p-currency">$</span>
                                <span className="p-value">{product.displayPrice}</span>
                            </div>
                            <div className="tax-info">Excl. shipping and local taxes</div>
                        </div>

                        <div className="sustainability-box" style={{ borderColor: eco.color + '40', background: eco.light }}>
                            <div className="sus-header">
                                <i className={`fas ${eco.icon}`} style={{ color: eco.color }}></i>
                                <span style={{ color: eco.color, fontWeight: 700 }}>{eco.label}</span>
                            </div>
                            <p>This product utilizes sustainable materials and low-impact manufacturing processes to reduce its carbon footprint.</p>
                        </div>

                        <div className="info-description">
                            <h3>Product Description</h3>
                            <p>
                                {product.description ||
                                    'No detailed description available for this product yet. However, like all products in our marketplace, it has been vetted for its environmental impact and sustainability standards.'}
                            </p>
                        </div>

                        {/* ── Action Buttons ── */}
                        <div className="action-row">
                            <button
                                className={`primary-add-btn ${addedToCart ? 'primary-add-btn--added' : ''}`}
                                onClick={handleAddToCart}
                                disabled={addedToCart}
                            >
                                <i className={`fas ${addedToCart ? 'fa-check' : 'fa-shopping-cart'}`}></i>
                                <span>{addedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
                            </button>

                            <button
                                className={`secondary-wish-btn ${inWishlist ? 'secondary-wish-btn--active' : ''}`}
                                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                onClick={handleWishlist}
                                aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            >
                                <i className={inWishlist ? 'fas fa-heart' : 'far fa-heart'}></i>
                            </button>
                        </div>

                        <div className="product-highlights">
                            <div className="highlight-item">
                                <i className="fas fa-shipping-fast"></i>
                                <div>
                                    <strong>Carbon Neutral Shipping</strong>
                                    <span>Offsetting CO2 for every delivery</span>
                                </div>
                            </div>
                            <div className="highlight-item">
                                <i className="fas fa-undo"></i>
                                <div>
                                    <strong>Eco-Friendly Returns</strong>
                                    <span>30-day circular return policy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Similar Products ── */}
                {(similarProducts.length > 0 || similarLoading) && (
                    <div className="similar-section">
                        <div className="similar-header">
                            <div className="similar-header__left">
                                <h2 className="similar-title">
                                    <i className="fas fa-leaf"></i>
                                    Similar Eco-Products
                                </h2>
                                <p className="similar-subtitle">
                                    More products in {product.displayCategory} or with similar eco scores
                                </p>
                            </div>
                            <button className="similar-see-all" onClick={() => navigate('/customer')}>
                                View All <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>

                        {similarLoading ? (
                            <div className="similar-loading">
                                <div className="similar-spinner"></div>
                                <span>Finding similar products…</span>
                            </div>
                        ) : (
                            <div className="similar-scroll-track">
                                <div className="similar-cards-row">
                                    {similarProducts.map(p => (
                                        <div key={p.id} className="similar-card-wrap">
                                            <ProductCard product={p} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <style>{`
                .product-detail-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding-top: 100px;
                    padding-bottom: 60px;
                }

                .detail-container { max-width: 1200px; margin: 0 auto; }

                .back-nav-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: #64748b;
                    font-weight: 600;
                    margin-bottom: 24px;
                    cursor: pointer;
                    transition: color 0.2s;
                    padding: 0;
                    font-size: 0.95rem;
                }
                .back-nav-link:hover { color: #10b981; }

                .detail-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 1fr;
                    gap: 48px;
                    background: white;
                    padding: 40px;
                    border-radius: 24px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                }
                @media (max-width: 991px) {
                    .detail-grid { grid-template-columns: 1fr; gap: 32px; padding: 24px; }
                }

                .image-display-wrapper {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    background: #f1f5f9;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    height: 500px;
                }
                .main-product-image { width: 100%; height: 100%; object-fit: cover; }

                .image-overlay-badge {
                    position: absolute;
                    top: 20px; left: 20px;
                    padding: 8px 16px;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    backdrop-filter: blur(4px);
                }

                .info-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .info-cat-tag {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    background: #f1f5f9;
                    color: #475569;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }
                .stock-status {
                    font-size: 0.85rem;
                    color: #10b981;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .status-dot {
                    width: 8px; height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    display: inline-block;
                    animation: pulse-dot 2s ease-in-out infinite;
                }
                @keyframes pulse-dot {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
                    50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
                }

                .info-title {
                    font-size: 2.2rem;
                    color: #0f172a;
                    font-weight: 800;
                    margin-bottom: 24px;
                    line-height: 1.15;
                }
                @media (max-width: 480px) { .info-title { font-size: 1.6rem; } }

                .info-price-row { margin-bottom: 28px; }
                .info-price { display: flex; align-items: flex-start; color: #0f172a; margin-bottom: 4px; }
                .p-currency { font-size: 1.25rem; font-weight: 600; margin-top: 0.25rem; }
                .p-value { font-size: 2.75rem; font-weight: 900; letter-spacing: -0.05em; }
                @media (max-width: 480px) { .p-value { font-size: 2rem; } }
                .tax-info { font-size: 0.8rem; color: #94a3b8; }

                .sustainability-box {
                    padding: 20px;
                    border-radius: 16px;
                    border: 1.5px solid transparent;
                    margin-bottom: 28px;
                }
                .sus-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
                .sustainability-box p { font-size: 0.9rem; color: #475569; margin: 0; line-height: 1.6; }

                .info-description h3 { font-size: 1.1rem; color: #0f172a; margin-bottom: 12px; }
                .info-description p { font-size: 0.975rem; color: #64748b; line-height: 1.7; margin-bottom: 28px; }

                /* ── Action Row ── */
                .action-row {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 36px;
                }

                .primary-add-btn {
                    flex: 1;
                    height: 54px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
                }
                .primary-add-btn:hover:not(:disabled) {
                    background: #059669;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.45);
                }
                .primary-add-btn--added {
                    background: #059669 !important;
                    transform: none !important;
                }
                .primary-add-btn:disabled { cursor: not-allowed; opacity: 0.85; }

                .secondary-wish-btn {
                    width: 54px;
                    height: 54px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    flex-shrink: 0;
                }
                .secondary-wish-btn:hover { border-color: #ef4444; color: #ef4444; transform: scale(1.05); }
                .secondary-wish-btn--active {
                    border-color: #ef4444 !important;
                    color: #ef4444 !important;
                    background: #fef2f2 !important;
                }

                /* ── Toast ── */
                .detail-toast {
                    position: fixed;
                    bottom: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #0f172a;
                    color: white;
                    padding: 14px 28px;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    z-index: 9999;
                    animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    white-space: nowrap;
                }
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }

                /* ── Highlights ── */
                .product-highlights {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    padding-top: 28px;
                    border-top: 1px solid #f1f5f9;
                }
                @media (max-width: 480px) { .product-highlights { grid-template-columns: 1fr; } }
                .highlight-item { display: flex; gap: 12px; }
                .highlight-item i { font-size: 1.25rem; color: #10b981; margin-top: 3px; flex-shrink: 0; }
                .highlight-item strong { display: block; font-size: 0.85rem; color: #0f172a; margin-bottom: 2px; }
                .highlight-item span { font-size: 0.75rem; color: #94a3b8; }

                /* ── Error State ── */
                .error-content { display: flex; justify-content: center; padding-top: 60px; }
                .error-card { text-align: center; max-width: 400px; }
                .error-icon { font-size: 4rem; margin-bottom: 20px; }
                .error-card h1 { font-size: 1.5rem; color: #1e293b; margin-bottom: 12px; }
                .error-card p { color: #64748b; line-height: 1.6; margin-bottom: 24px; }
                .back-home-btn {
                    padding: 12px 28px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .back-home-btn:hover { background: #059669; transform: translateY(-1px); }

                .detail-loading-screen { min-height: 100vh; background: #f8fafc; padding-top: 100px; }

                /* ── Similar Products ── */
                .similar-section {
                    margin-top: 56px;
                    padding-top: 40px;
                    border-top: 1px solid #e2e8f0;
                }
                .similar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 28px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .similar-header__left {}
                .similar-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 4px;
                }
                .similar-title i { color: #10b981; font-size: 1.2rem; }
                .similar-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
                .similar-see-all {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 18px;
                    background: white; color: #10b981;
                    border: 1.5px solid #bbf7d0; border-radius: 10px;
                    font-weight: 700; font-size: 0.85rem; cursor: pointer;
                    transition: all 0.2s; white-space: nowrap;
                }
                .similar-see-all:hover { background: #f0fdf4; border-color: #10b981; }

                /* Scroll track — hides scrollbar but allows horizontal drag */
                .similar-scroll-track {
                    overflow-x: auto;
                    padding-bottom: 16px;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                    scrollbar-color: #e2e8f0 transparent;
                }
                .similar-scroll-track::-webkit-scrollbar { height: 5px; }
                .similar-scroll-track::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

                .similar-cards-row {
                    display: flex;
                    gap: 20px;
                    width: max-content;
                }
                .similar-card-wrap {
                    width: 260px;
                    flex-shrink: 0;
                }

                .similar-loading {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 32px 0;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .similar-spinner {
                    width: 28px; height: 28px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #10b981;
                    border-radius: 50%;
                    animation: sim-spin 0.8s linear infinite;
                    flex-shrink: 0;
                }
                @keyframes sim-spin { to { transform: rotate(360deg); } }

                @media (max-width: 640px) {
                    .similar-card-wrap { width: 220px; }
                    .similar-title { font-size: 1.2rem; }
                }
            `}</style>
        </div>
    );
};

export default ProductDetail;
