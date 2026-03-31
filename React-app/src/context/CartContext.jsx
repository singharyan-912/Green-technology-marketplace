import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('greentech_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('greentech_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    // Increase or decrease quantity; removes item if qty reaches 0
    const updateQuantity = (productId, delta) => {
        setCart(prevCart =>
            prevCart
                .map(item =>
                    item.id === productId
                        ? { ...item, quantity: Math.max(0, (item.quantity || 1) + delta) }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    };

    const clearCart = () => setCart([]);

    const getCartCount = () => cart.reduce((total, item) => total + (item.quantity || 1), 0);

    const getCartTotal = () =>
        cart.reduce((total, item) => total + parseFloat(item.displayPrice || item.price || 0) * (item.quantity || 1), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartCount, getCartTotal }}>
            {children}
        </CartContext.Provider>
    );
};
