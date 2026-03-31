import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Navbar from '../component/Navbar';
import '../index.css';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const resolveImage = (item) =>
    item.productImage || item.imageUrl || item.imageURL || item.image ||
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400';

const formatCurrency = (num) =>
    Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Cart Item Row ──────────────────────────────────────────────────────────────
const CartItem = ({ item, onRemove, onUpdateQty }) => {
    const navigate = useNavigate();
    const unitPrice = parseFloat(item.displayPrice || item.price || 0);
    const lineTotal = unitPrice * (item.quantity || 1);

    return (
        <div className="cart-item">
            {/* Thumbnail */}
            <div className="cart-item__thumb" onClick={() => navigate(`/product/${item.id}`)}>
                <img
                    src={resolveImage(item)}
                    alt={item.displayName || item.productName}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400';
                    }}
                />
            </div>

            {/* Info */}
            <div className="cart-item__info">
                <span className="cart-item__cat">
                    {item.displayCategory || item.category || 'Eco Product'}
                </span>
                <h3
                    className="cart-item__name"
                    onClick={() => navigate(`/product/${item.id}`)}
                >
                    {item.displayName || item.productName || item.name}
                </h3>
                {item.displayEcoRating && (
                    <span className="cart-item__eco">
                        <i className="fas fa-leaf"></i> Eco Score: {item.displayEcoRating}/10
                    </span>
                )}
            </div>

            {/* Quantity Stepper */}
            <div className="cart-item__stepper">
                <button
                    className="stepper-btn"
                    onClick={() => onUpdateQty(item.id, -1)}
                    aria-label="Decrease quantity"
                >
                    <i className="fas fa-minus"></i>
                </button>
                <span className="stepper-value">{item.quantity || 1}</span>
                <button
                    className="stepper-btn"
                    onClick={() => onUpdateQty(item.id, 1)}
                    aria-label="Increase quantity"
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>

            {/* Price */}
            <div className="cart-item__price">
                <span className="cart-item__line-total">${formatCurrency(lineTotal)}</span>
                {item.quantity > 1 && (
                    <span className="cart-item__unit-price">${formatCurrency(unitPrice)} each</span>
                )}
            </div>

            {/* Remove */}
            <button
                className="cart-item__remove"
                onClick={() => onRemove(item.id)}
                title="Remove item"
            >
                <i className="fas fa-trash-alt"></i>
            </button>
        </div>
    );
};

// ─── Page ───────────────────────────────────────────────────────────────────────
const Cart = () => {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
    const [toast, setToast] = useState('');
    const [checkingOut, setCheckingOut] = useState(false);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2200);
    };

    const handleRemove = (id) => {
        removeFromCart(id);
        showToast('🗑️ Item removed from cart');
    };

    const [confirmClear, setConfirmClear] = useState(false);

    const handleClearCart = () => {
        if (confirmClear) {
            clearCart();
            showToast('🗑️ Cart cleared');
            setConfirmClear(false);
        } else {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 3500);
        }
    };

    const handleCheckout = () => {
        setCheckingOut(true);
        showToast('✅ Order placed! Thank you for going green 🌿');
        setTimeout(() => {
            clearCart();
            setCheckingOut(false);
            navigate('/customer');
        }, 2400);
    };

    const subtotal = getCartTotal();
    const shipping = subtotal > 0 ? 4.99 : 0;
    const carbonOffset = subtotal > 0 ? 1.50 : 0;
    const total = subtotal + shipping + carbonOffset;
    const totalItems = cart.reduce((s, i) => s + (i.quantity || 1), 0);

    return (
        <div className="cart-page">
            <Navbar />

            {/* Toast */}
            {toast && <div className="page-toast">{toast}</div>}

            <main className="container cart-main">
                {/* Page Header */}
                <div className="page-hero fade-in">
                    <div className="page-hero__icon" style={{ background: 'linear-gradient(135deg, #bbf7d0, #6ee7b7)' }}>
                        <i className="fas fa-shopping-cart" style={{ color: '#065f46' }}></i>
                    </div>
                    <div>
                        <h1 className="page-hero__title">Shopping Cart</h1>
                        <p className="page-hero__sub">
                            {cart.length > 0
                                ? `${totalItems} item${totalItems !== 1 ? 's' : ''} · $${formatCurrency(subtotal)}`
                                : 'Your cart is empty'}
                        </p>
                    </div>
                    {cart.length > 0 && (
                        <button
                            className={`page-hero__clear ${confirmClear ? 'page-hero__clear--confirm' : ''}`}
                            onClick={handleClearCart}
                        >
                            <i className="fas fa-trash"></i>
                            {confirmClear ? 'Tap again to confirm' : 'Clear Cart'}
                        </button>
                    )}
                </div>

                {/* Empty State */}
                {cart.length === 0 ? (
                    <div className="page-empty fade-in">
                        <div className="page-empty__icon">🛒</div>
                        <h2>Your cart is empty</h2>
                        <p>Add eco-friendly products to your cart and make a positive environmental impact.</p>
                        <button className="page-empty__btn" onClick={() => navigate('/customer')}>
                            <i className="fas fa-leaf"></i> Shop Marketplace
                        </button>
                    </div>
                ) : (
                    <div className="cart-layout fade-in">
                        {/* Items List */}
                        <div className="cart-items-panel">
                            <div className="cart-items-header">
                                <span></span>
                                <span>Product</span>
                                <span className="cart-items-header__qty">Qty</span>
                                <span className="cart-items-header__price">Total</span>
                                <span></span>
                            </div>

                            <div className="cart-items-list">
                                {cart.map(item => (
                                    <CartItem
                                        key={item.id}
                                        item={item}
                                        onRemove={handleRemove}
                                        onUpdateQty={updateQuantity}
                                    />
                                ))}
                            </div>

                            {/* Continue Shopping */}
                            <button className="continue-btn" onClick={() => navigate('/customer')}>
                                <i className="fas fa-arrow-left"></i> Continue Shopping
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="cart-summary-panel">
                            <div className="cart-summary-card">
                                <h2 className="cart-summary-title">Order Summary</h2>

                                <div className="cart-summary-rows">
                                    <div className="cart-summary-row">
                                        <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                                        <span>${formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="cart-summary-row">
                                        <span>Shipping</span>
                                        <span className="cart-summary-free">
                                            {shipping === 0 ? 'Free' : `$${formatCurrency(shipping)}`}
                                        </span>
                                    </div>
                                    <div className="cart-summary-row cart-summary-row--eco">
                                        <span>
                                            <i className="fas fa-leaf"></i> Carbon Offset
                                        </span>
                                        <span>${formatCurrency(carbonOffset)}</span>
                                    </div>
                                    <div className="cart-summary-divider"></div>
                                    <div className="cart-summary-row cart-summary-row--total">
                                        <span>Total</span>
                                        <span>${formatCurrency(total)}</span>
                                    </div>
                                </div>

                                {/* Eco Badge */}
                                <div className="cart-summary-eco-badge">
                                    <i className="fas fa-seedling"></i>
                                    <p>Your purchase includes a <strong>carbon offset</strong> contribution — making this order climate-neutral! 🌍</p>
                                </div>

                                <button
                                    className="checkout-btn"
                                    onClick={handleCheckout}
                                    disabled={checkingOut}
                                >
                                    {checkingOut ? (
                                        <>
                                            <div className="checkout-spinner"></div>
                                            Processing…
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-lock"></i>
                                            Secure Checkout · ${formatCurrency(total)}
                                        </>
                                    )}
                                </button>

                                <div className="cart-summary-trust">
                                    <span><i className="fas fa-shield-alt"></i> Secure</span>
                                    <span><i className="fas fa-undo"></i> 30-day Returns</span>
                                    <span><i className="fas fa-leaf"></i> Eco-Certified</span>
                                </div>
                            </div>

                            {/* Wishlist Promo */}
                            <button className="wishlist-link-btn" onClick={() => navigate('/wishlist')}>
                                <i className="fas fa-heart"></i>
                                View Wishlist
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                /* ─── Page Shell ─── */
                .cart-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding-bottom: 80px;
                }
                .cart-main {
                    padding-top: 110px;
                    max-width: 1280px;
                }

                /* ─── Page Hero ─── */
                .page-hero {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 36px;
                    flex-wrap: wrap;
                }
                .page-hero__icon {
                    width: 56px; height: 56px;
                    border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.4rem;
                    box-shadow: 0 8px 20px rgba(16,185,129,0.2);
                    flex-shrink: 0;
                }
                .page-hero__title { font-size: 1.875rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
                .page-hero__sub   { color: #64748b; font-size: 0.95rem; margin: 0; }
                .page-hero__clear {
                    margin-left: auto;
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 18px;
                    background: #fee2e2; color: #dc2626;
                    border: none; border-radius: 10px;
                    font-weight: 700; font-size: 0.85rem; cursor: pointer;
                    transition: all 0.2s;
                }
                .page-hero__clear--confirm {
                    background: #dc2626 !important;
                    color: white !important;
                    border-radius: 10px;
                }

                /* ─── Layout ─── */
                .cart-layout {
                    display: grid;
                    grid-template-columns: 1fr 360px;
                    gap: 28px;
                    align-items: start;
                }
                @media (max-width: 1024px) {
                    .cart-layout { grid-template-columns: 1fr; }
                }

                /* ─── Items Panel ─── */
                .cart-items-panel {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.05);
                }
                .cart-items-header {
                    display: grid;
                    grid-template-columns: 88px 1fr 120px 110px 44px;
                    gap: 16px;
                    padding: 16px 24px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #64748b;
                }
                .cart-items-header__qty { text-align: center; }
                .cart-items-header__price { text-align: right; }

                .cart-items-list { display: flex; flex-direction: column; }

                /* ─── Cart Item ─── */
                .cart-item {
                    display: grid;
                    grid-template-columns: 88px 1fr 120px 110px 44px;
                    gap: 16px;
                    padding: 20px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    align-items: center;
                    transition: background 0.15s;
                }
                .cart-item:last-child { border-bottom: none; }
                .cart-item:hover { background: #fafbff; }
                @media (max-width: 640px) {
                    .cart-item { grid-template-columns: 70px 1fr; grid-template-rows: auto auto auto; gap: 12px; }
                    .cart-item__stepper, .cart-item__price, .cart-item__remove { grid-column: 2; }
                }

                .cart-item__thumb {
                    width: 88px; height: 88px;
                    border-radius: 12px; overflow: hidden;
                    background: #f1f5f9; flex-shrink: 0; cursor: pointer;
                    border: 1px solid #e2e8f0;
                }
                .cart-item__thumb img { width: 100%; height: 100%; object-fit: cover; }

                .cart-item__info { display: flex; flex-direction: column; gap: 4px; }
                .cart-item__cat {
                    font-size: 0.65rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.07em;
                    color: #64748b;
                }
                .cart-item__name {
                    font-size: 0.95rem; font-weight: 700; color: #1e293b;
                    cursor: pointer; transition: color 0.2s;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .cart-item__name:hover { color: #10b981; }
                .cart-item__eco { font-size: 0.75rem; color: #10b981; font-weight: 600; }
                .cart-item__eco i { margin-right: 4px; }

                /* Quantity stepper */
                .cart-item__stepper {
                    display: flex; align-items: center; gap: 4px;
                    background: #f8fafc; border-radius: 10px;
                    border: 1px solid #e2e8f0; overflow: hidden;
                }
                .stepper-btn {
                    width: 32px; height: 36px;
                    background: none; border: none;
                    color: #64748b; font-size: 0.75rem; cursor: pointer;
                    transition: all 0.15s; display: flex; align-items: center; justify-content: center;
                }
                .stepper-btn:hover { background: #e2e8f0; color: #10b981; }
                .stepper-value {
                    min-width: 28px; text-align: center;
                    font-weight: 700; font-size: 0.9rem; color: #1e293b;
                }

                .cart-item__price { text-align: right; }
                .cart-item__line-total { font-size: 1.05rem; font-weight: 800; color: #0f172a; display: block; }
                .cart-item__unit-price { font-size: 0.75rem; color: #94a3b8; display: block; margin-top: 2px; }

                .cart-item__remove {
                    width: 36px; height: 36px;
                    border-radius: 10px; border: 1px solid #fee2e2;
                    background: white; color: #ef4444;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                }
                .cart-item__remove:hover { background: #fee2e2; }

                .continue-btn {
                    display: flex; align-items: center; gap: 8px;
                    padding: 14px 24px;
                    color: #64748b; font-weight: 600; font-size: 0.875rem;
                    border: none; background: none; cursor: pointer;
                    transition: color 0.2s;
                    border-top: 1px solid #f1f5f9; width: 100%;
                }
                .continue-btn:hover { color: #10b981; }

                /* ─── Summary Card ─── */
                .cart-summary-panel { display: flex; flex-direction: column; gap: 16px; }
                .cart-summary-card {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    padding: 24px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.05);
                    position: sticky; top: 100px;
                    display: flex; flex-direction: column;
                }
                .cart-summary-title { font-size: 1.125rem; font-weight: 800; margin-bottom: 20px; color: #0f172a; }

                .cart-summary-rows { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
                .cart-summary-row {
                    display: flex; justify-content: space-between; align-items: center;
                    font-size: 0.9rem; color: #475569;
                }
                .cart-summary-row--eco { color: #059669; }
                .cart-summary-row--eco i { margin-right: 6px; }
                .cart-summary-row--total {
                    font-size: 1.125rem; font-weight: 800; color: #0f172a;
                }
                .cart-summary-free { color: #10b981; font-weight: 700; }
                .cart-summary-divider { height: 1px; background: #f1f5f9; }

                .cart-summary-eco-badge {
                    display: flex; gap: 12px; align-items: flex-start;
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    border-radius: 12px; padding: 14px;
                    margin-bottom: 20px;
                    font-size: 0.82rem; color: #166534; line-height: 1.5;
                }
                .cart-summary-eco-badge i { font-size: 1.1rem; color: #10b981; margin-top: 2px; flex-shrink: 0; }
                .cart-summary-eco-badge p { margin: 0; }

                .checkout-btn {
                    width: 100%; padding: 16px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white; border: none; border-radius: 12px;
                    font-weight: 800; font-size: 1rem; cursor: pointer;
                    transition: all 0.25s;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    box-shadow: 0 6px 20px rgba(16,185,129,0.35);
                    margin-bottom: 16px;
                }
                .checkout-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(16,185,129,0.45);
                }
                .checkout-btn:disabled { opacity: 0.8; cursor: not-allowed; }
                .checkout-spinner {
                    width: 20px; height: 20px;
                    border: 2px solid rgba(255,255,255,0.4);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: wl-spin 0.8s linear infinite;
                }
                @keyframes wl-spin { to { transform: rotate(360deg); } }

                .cart-summary-trust {
                    display: flex; justify-content: space-between;
                    font-size: 0.72rem; color: #64748b; font-weight: 600;
                }
                .cart-summary-trust span { display: flex; align-items: center; gap: 5px; }

                .wishlist-link-btn {
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 12px;
                    background: white; color: #ef4444;
                    border: 1.5px solid #fecdd3;
                    border-radius: 12px; font-weight: 700; font-size: 0.875rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .wishlist-link-btn:hover { background: #fff5f5; border-color: #ef4444; }

                /* ─── Empty ─── */
                .page-empty {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 100px 20px; text-align: center;
                }
                .page-empty__icon { font-size: 4rem; margin-bottom: 20px; }
                .page-empty h2 { font-size: 1.5rem; color: #1e293b; margin-bottom: 10px; }
                .page-empty p { color: #64748b; margin-bottom: 28px; max-width: 380px; }
                .page-empty__btn {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 12px 28px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white; border: none; border-radius: 10px;
                    font-weight: 700; font-size: 0.95rem; cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 6px 16px rgba(16,185,129,0.3);
                }
                .page-empty__btn:hover { transform: translateY(-2px); }

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

export default Cart;
