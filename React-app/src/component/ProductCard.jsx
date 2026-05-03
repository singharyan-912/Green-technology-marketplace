import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import '../index.css';

// Wraps matching text in a <mark> with the search-highlight CSS class
const highlightText = (text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
        regex.test(part)
            ? <mark key={i} className="search-highlight">{part}</mark>
            : part
    );
};

const ProductCard = ({ product, searchQuery = '' }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [addedToCart, setAddedToCart] = useState(false);

    const inWishlist = isInWishlist(product.id);

    const getEcoInfo = (score) => {
        const num = parseInt(score);
        if (num >= 9) return { color: '#10b981', label: 'Excellent', light: '#ecfdf5' };
        if (num >= 7) return { color: '#059669', label: 'Very Good', light: '#f0fdf4' };
        if (num >= 5) return { color: '#d97706', label: 'Good', light: '#fffbeb' };
        return { color: '#ef4444', label: 'Low', light: '#fef2f2' };
    };

    const eco = getEcoInfo(product.displayEcoRating);
    const displayImage = product.productImage || product.imageURL || product.imageUrl || product.image
        || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600';

    const handleCardClick = () => navigate(`/product/${product.id}`);

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 1800);
    };

    const handleWishlist = (e) => {
        e.stopPropagation();
        toggleWishlist(product.id);
    };

    return (
        <div className="modern-eco-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <div className="card-media">
                <img
                    src={displayImage}
                    alt={product.displayName}
                    className="card-img"
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600';
                    }}
                />

                {/* Eco Badge */}
                <div className="card-badges">
                    <div className="eco-badge" style={{ backgroundColor: eco.light, color: eco.color }}>
                        <i className="fas fa-leaf"></i>
                        <span>{product.displayEcoRating}/10</span>
                    </div>
                </div>

                {/* Wishlist Button */}
                <button
                    className={`wishlist-trigger ${inWishlist ? 'active' : ''}`}
                    onClick={handleWishlist}
                    aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                    <i className={inWishlist ? 'fas fa-heart' : 'far fa-heart'}></i>
                </button>
            </div>

            <div className="card-details">
                <div className="details-header">
                    <span className="cat-pill">{product.displayCategory}</span>
                    <div className="eco-label" style={{ color: eco.color }}>{eco.label}</div>
                </div>

                <h3 className="product-name">{highlightText(product.displayName, searchQuery)}</h3>

                <p className="product-snippet">
                    {product.description || 'Modern green technology designed for maximum efficiency and minimal environmental footprint.'}
                </p>

                <div className="card-footer">
                    <div className="price-display">
                        <span className="currency">$</span>
                        <span className="value">{product.displayPrice}</span>
                    </div>
                    <button
                        className={`cart-btn ${addedToCart ? 'cart-btn--added' : ''}`}
                        title="Add to Cart"
                        onClick={handleAddToCart}
                    >
                        <i className={addedToCart ? 'fas fa-check' : 'fas fa-shopping-cart'}></i>
                        <span>{addedToCart ? 'Added!' : 'Add'}</span>
                    </button>
                </div>
            </div>

            <style>{`
                .modern-eco-card {
                    background: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid #f1f5f9;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .modern-eco-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border-color: #10b981;
                }

                .card-media {
                    position: relative;
                    height: 240px;
                    overflow: hidden;
                }

                .card-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.6s ease;
                }

                .modern-eco-card:hover .card-img { transform: scale(1.08); }

                .card-badges {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    z-index: 5;
                }

                .eco-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 30px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    backdrop-filter: blur(4px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .wishlist-trigger {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 36px;
                    height: 36px;
                    background: rgba(255, 255, 255, 0.9);
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    z-index: 5;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    font-size: 0.9rem;
                }

                .wishlist-trigger:hover { background: #fff; color: #ef4444; transform: scale(1.15); }
                .wishlist-trigger.active { color: #ef4444; background: #fff; }

                .card-details {
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                }

                .details-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }

                .cat-pill {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    background: #f8fafc;
                    color: #64748b;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 700;
                    letter-spacing: 0.025em;
                }

                .eco-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .product-name {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    min-height: 3.15rem;
                }

                .product-snippet {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 1.25rem;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .card-footer {
                    margin-top: auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                }

                .price-display { display: flex; align-items: flex-start; color: #0f172a; }
                .currency { font-size: 0.875rem; font-weight: 600; margin-top: 0.125rem; }
                .value { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.025em; }

                .cart-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #10b981;
                    color: #ffffff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .cart-btn:hover { background: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
                .cart-btn--added { background: #059669 !important; }
                .cart-btn i { font-size: 0.9rem; }

                @media (max-width: 480px) {
                    .value { font-size: 1.25rem; }
                    .card-media { height: 200px; }
                }
            `}</style>
        </div>
    );
};

export default ProductCard;
