import React, { createContext, useContext, useState, useEffect } from 'react';
import { database, ref, get, set, remove } from '../firebase/config';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Load - from Database or Local Storage
    useEffect(() => {
        const loadWishlist = async () => {
            setLoading(true);
            try {
                if (currentUser) {
                    // Sync from Database
                    const wishlistRef = ref(database, `wishlists/${currentUser.uid}`);
                    const snapshot = await get(wishlistRef);
                    if (snapshot.exists()) {
                        const val = snapshot.val();
                        // Firebase may deserialize a saved array as an object — guard it
                        setWishlist(Array.isArray(val) ? val : Object.values(val || {}));
                    } else {
                        setWishlist([]);
                    }
                } else {
                    // Sync from Local Storage
                    const savedWishlist = localStorage.getItem('greentech_wishlist');
                    setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
                }
            } catch (error) {
                console.error("Error loading wishlist:", error);
            } finally {
                setLoading(false);
            }
        };

        loadWishlist();
    }, [currentUser]);

    // Save to Database / Local Storage on Change
    useEffect(() => {
        if (loading) return; 

        if (currentUser) {
            set(ref(database, `wishlists/${currentUser.uid}`), wishlist);
        } else {
            localStorage.setItem('greentech_wishlist', JSON.stringify(wishlist));
        }
    }, [wishlist, currentUser, loading]);

    const toggleWishlist = (productId) => {
        setWishlist(prevWishlist => {
            const isItemInWishlist = prevWishlist.includes(productId);
            if (isItemInWishlist) {
                return prevWishlist.filter(id => id !== productId);
            } else {
                return [...prevWishlist, productId];
            }
        });
    };

    const isInWishlist = (productId) => {
        return (wishlist || []).includes(productId);
    };

    const getWishlistCount = () => (wishlist || []).length;

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, getWishlistCount, loading }}>
            {children}
        </WishlistContext.Provider>
    );
};
