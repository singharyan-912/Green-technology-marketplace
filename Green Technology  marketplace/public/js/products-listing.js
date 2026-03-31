import { database, ref, onValue, update, remove } from "./firebase.js";

// --- GLOBAL STATE ---
let allProducts = [];
let filteredProducts = [];
let currentSort = 'relevance';
const USER_ID = "-OgvYYfaBh86oWu2W-Mc"; // Static UID for Aryan Singh

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('search') || "";
    const viewParam = params.get('view');
    
    const searchInput = document.getElementById('main-search-input');
    const searchBtn = document.getElementById('search-trigger');
    const priceRange = document.getElementById('price-range');
    const priceVal = document.getElementById('price-val');
    const applyBtn = document.getElementById('apply-filters-btn');

    // Set initial UI
    if(searchQuery) {
        searchInput.value = searchQuery;
        document.getElementById('breadcrumb-current').innerText = searchQuery;
    }

    // 1. Fetch All Products once
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            allProducts = Object.keys(data).map(key => ({ 
                id: key, 
                ...data[key],
                rating: 4.0 
            }));
            
            // Check if we should show wishlist immediately
            if (viewParam === 'wishlist') {
                showWishlistOnly();
            } else {
                applyAllFilters();
            }
            initWishlistHeaderLogic(); // Sync Badge
        }
    });

    // 2. Sorting Event Listeners
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSort = e.target.dataset.sort;
            sortAndRender();
        });
    });

    // 3. Price Range Real-time Label ($ Formatting)
    priceRange.addEventListener('input', (e) => {
        const formattedPrice = Number(e.target.value).toLocaleString('en-US');
        priceVal.innerText = `$${formattedPrice}`;
    });

    // 4. Apply Filters Button
    applyBtn.addEventListener('click', applyAllFilters);

    // 5. Search Re-trigger
    const executeSearch = () => {
        const q = searchInput.value.trim();
        window.location.href = `products-listing.html?search=${encodeURIComponent(q)}`;
    };
    if(searchBtn) searchBtn.onclick = executeSearch;
    if(searchInput) searchInput.onkeypress = (e) => { if(e.key === 'Enter') executeSearch(); };
});

function applyAllFilters() {
    const searchQuery = new URLSearchParams(window.location.search).get('search')?.toLowerCase() || "";
    const maxPrice = parseInt(document.getElementById('price-range').value);
    const ratingEl = document.querySelector('.filter-rating:checked');
    const minRating = ratingEl ? parseInt(ratingEl.value) : 0;
    const selectedCats = Array.from(document.querySelectorAll('.filter-cat:checked')).map(cb => cb.value);

    filteredProducts = allProducts.filter(p => {
        const matchesSearch = !searchQuery || 
                             p.productName.toLowerCase().includes(searchQuery) || 
                             (p.category && p.category.toLowerCase().includes(searchQuery));
        const matchesPrice = p.price <= maxPrice;
        const matchesRating = p.rating >= minRating;
        const matchesCat = selectedCats.length === 0 || selectedCats.includes(p.category);
        return matchesSearch && matchesPrice && matchesRating && matchesCat;
    });

    const formattedMax = maxPrice.toLocaleString('en-US');
    document.getElementById('search-status-text').innerText = 
        searchQuery ? `Showing results for "${searchQuery}" up to $${formattedMax}` : `All Products up to $${formattedMax}`;

    sortAndRender();
}

function showWishlistOnly() {
    const wishlistRef = ref(database, `wishlists/${USER_ID}`);
    onValue(wishlistRef, (snapshot) => {
        const wishData = snapshot.val() || {};
        const wishIds = Object.keys(wishData);
        filteredProducts = allProducts.filter(p => wishIds.includes(p.id));
        document.getElementById('search-status-text').innerText = `My Wishlist (${filteredProducts.length})`;
        document.getElementById('breadcrumb-current').innerText = "Wishlist";
        sortAndRender();
    }, { onlyOnce: true });
}

function sortAndRender() {
    if (currentSort === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else {
        filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
    }
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('listing-results-grid');
    if(!grid) return;
    grid.innerHTML = '';

    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div class="no-results">No products found.</div>';
        return;
    }

    filteredProducts.forEach(p => {
        const fakeOldPrice = Math.floor(p.price * 1.4);
        grid.innerHTML += `
            <!-- ADDED onclick HERE -->
           <div class="listing-card" onclick="window.location.href='product-details.html?id=${p.id}'" style="cursor:pointer">
                <div class="wishlist-heart" data-id="${p.id}">❤</div>
                <div class="img-container">
                    <img src="${p.imageURL}" alt="${p.productName}">
                </div>
                <div class="product-details">
                    <h4 class="p-name">${p.productName}</h4>
                    <p class="p-category">${p.category || 'Eco-Friendly'}</p>
                    <div class="rating-row">
                        <span class="rating-badge">${p.rating} ★</span>
                        <span class="rating-count">(2,105)</span>
                    </div>
                    <div class="price-row">
                        <span class="current-price">$${p.price.toLocaleString('en-US')}</span>
                        <span class="old-price">$${fakeOldPrice.toLocaleString('en-US')}</span>
                        <span class="discount-percent">40% off</span>
                    </div>
                    <p class="hot-deal-tag">Hot Deal</p>
                </div>
            </div>
        `;
    });
    setupWishlistListeners();
}

async function setupWishlistListeners() {
    const hearts = document.querySelectorAll('.wishlist-heart');
    const wishlistRef = ref(database, `wishlists/${USER_ID}`);
    
    onValue(wishlistRef, (snapshot) => {
        const wishData = snapshot.val() || {};
        hearts.forEach(heart => {
            if (wishData[heart.dataset.id]) heart.classList.add('active');
            else heart.classList.remove('active');
        });
    }, { onlyOnce: true });

    hearts.forEach(heart => {
        heart.onclick = async (e) => {
            e.stopPropagation();
            const productId = heart.dataset.id;
            const product = allProducts.find(p => p.id === productId);
            
            if (!heart.classList.contains('active')) {
                const wishlistData = { productName: product.productName, price: product.price, imageURL: product.imageURL, addedDate: new Date().toISOString() };
                await update(ref(database, `wishlists/${USER_ID}/${productId}`), wishlistData);
                heart.classList.add('active');
            } else {
                await remove(ref(database, `wishlists/${USER_ID}/${productId}`));
                heart.classList.remove('active');
            }
        };
    });
}

function initWishlistHeaderLogic() {
    const wishlistCountBadge = document.getElementById('wishlist-count');
    const wishlistTrigger = document.getElementById('wishlist-trigger');
    const wishlistRef = ref(database, `wishlists/${USER_ID}`);

    onValue(wishlistRef, (snapshot) => {
        const wishData = snapshot.val() || {};
        const count = Object.keys(wishData).length;
        if (wishlistCountBadge) wishlistCountBadge.innerText = count;
    });

    if (wishlistTrigger) {
        wishlistTrigger.onclick = showWishlistOnly;
    }
}