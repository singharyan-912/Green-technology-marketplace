import { database, ref, onValue, get, update, query, orderByChild, equalTo } from "./firebase.js";

const UID = "-OgvYYfaBh86oWu2W-Mc"; // Static for Aryan Singh
const USER_NAME = "Aryan Singh";

document.addEventListener('DOMContentLoaded', () => {
    initAccountModal();
    initHomeWishlistSync();
    initNewArrivals(); // Initializing product fetch
});

// REAL-TIME WISHLIST BADGE SYNC
function initHomeWishlistSync() {
    const wishlistCountBadge = document.getElementById('wishlist-count');
    const wishlistRef = ref(database, `wishlists/${UID}`);

    onValue(wishlistRef, (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        if (wishlistCountBadge) wishlistCountBadge.innerText = count;
    });

    const wishlistIcon = document.querySelector('img[alt="Wishlist"]')?.parentElement;
    if (wishlistIcon) {
        wishlistIcon.onclick = () => {
            window.location.href = "products-listing.html?view=wishlist";
        };
    }
}

/// 2. FETCH FOR NEW ARRIVALS (Links to the NEW product-details.html)
async function initNewArrivals() {
    const productsContainer = document.getElementById('new-arrivals-products');
    const productsRef = ref(database, 'products');

    try {
        const snapshot = await get(productsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            const productIds = Object.keys(data).slice(0, 4); // Get first 4 products
            
            let html = '';
            productIds.forEach(id => {
                const p = data[id];
                
                // Key checks for images, names, and prices
                const imgPath = p.imageUrl || p.image || p.imageURL || p.img || p.productImage || 'https://via.placeholder.com/300x200?text=No+Image';
                const prodName = p.name || p.productName || 'Eco Product';
                const prodPrice = p.price || '0.00';
                
                // FIXED SYNTAX BELOW: All HTML is inside ONE set of backticks
                html += `
                    <div class="product-card" onclick="window.location.href='product-details.html?id=${id}'" style="cursor:pointer">
                        <div class="product-img-container">
                            <img src="${imgPath}" alt="${prodName}" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Error'">
                        </div>
                        <h4 style="margin: 10px 0; font-size: 1rem; color: #333; font-weight:600;">${prodName}</h4>
                        <p style="color: #4CAF50; font-weight: bold; font-size: 1.1rem;">$${prodPrice}</p>
                    </div>
                `;
            });
            productsContainer.innerHTML = html;
        } else {
            productsContainer.innerHTML = '<p>No products available yet.</p>';
        }
    } catch (error) {
        console.error("Error loading arrivals:", error);
        productsContainer.innerHTML = '<p>Error loading products.</p>';
    }
}


// 3. UPDATE: initAccountModal to include logout listener
function initAccountModal() {
    const modal = document.getElementById('user-modal-overlay');
    const closeBtn = document.getElementById('close-modal');

    // Profile button in header
    if(document.getElementById('btn-profile')) {
        document.getElementById('btn-profile').onclick = () => {
            modal.style.display = 'flex';
            switchTab('tab-profile', renderProfile);
        };
    }

    // Sidebar navigation
    document.getElementById('tab-profile').onclick = () => switchTab('tab-profile', renderProfile);
    document.getElementById('tab-orders').onclick = () => switchTab('tab-orders', renderOrders);
    document.getElementById('tab-reviews').onclick = () => switchTab('tab-reviews', renderReviews);

    // FIX: Add Logout listener for both header and modal
    document.querySelectorAll('.logout-link').forEach(el => {
        el.onclick = (e) => {
            e.preventDefault();
            handleLogout();
        };
    });

    if(closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
}

// 1. UPDATE: Change renderProfile function to match new CSS
async function renderProfile() {
    const content = document.getElementById('dashboard-content');
    const snap = await get(ref(database, `users/${UID}`));
    const user = snap.val();

    content.innerHTML = `
        <div class="content-header">Account Information</div>
        <div class="info-row">
            <div class="info-label">FIRST NAME</div>
            <div class="info-value"><input type="text" id="ef-name" value="${user.firstName || ''}"></div>
        </div>
        <div class="info-row">
            <div class="info-label">LAST NAME</div>
            <div class="info-value"><input type="text" id="el-name" value="${user.lastName || ''}"></div>
        </div>
        <div class="info-row">
            <div class="info-label">EMAIL ADDRESS</div>
            <div class="info-value"><input type="text" value="${user.email}" disabled></div>
        </div>
        <button class="green-btn" id="save-profile">SAVE CHANGES</button>
    `;

    document.getElementById('save-profile').onclick = async () => {
        const btn = document.getElementById('save-profile');
        const originalText = btn.innerText;
        btn.innerText = "SAVING...";
        try {
            await update(ref(database, `users/${UID}`), {
                firstName: document.getElementById('ef-name').value,
                lastName: document.getElementById('el-name').value
            });
            alert("Profile successfully updated!");
        } catch (e) {
            alert("Update failed.");
        }
        btn.innerText = originalText;
    };
}

// DASHBOARD: RENDER ORDERS
async function renderOrders() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = '<div class="content-header">My Orders</div><p>Loading...</p>';

    const q = query(ref(database, 'orders'), orderByChild('customerName'), equalTo(USER_NAME));
    const snap = await get(q);

    let html = '<div class="content-header">My Orders</div>';
    if (snap.exists()) {
        snap.forEach(child => {
            const o = child.val();
            html += `
                <div class="item-card">
                    <div>
                        <strong style="display:block">Order #${child.key.slice(-6).toUpperCase()}</strong>
                        <span style="font-size:12px; color:#666">${o.items}</span>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700; margin-bottom:5px">$${o.total}</div>
                        <span class="badge-status ${o.status === 'Fulfilled' ? 'status-fulfilled' : 'status-pending'}">${o.status}</span>
                    </div>
                </div>`;
        });
    } else {
        html += '<div class="empty-state"><p>No orders yet.</p></div>';
    }
    content.innerHTML = html;
}

// DASHBOARD: RENDER REVIEWS
async function renderReviews() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = '<div class="content-header">My Reviews</div><p>Loading...</p>';

    const q = query(ref(database, 'reviews'), orderByChild('userId'), equalTo('customer123'));
    const snap = await get(q);

    let html = '<div class="content-header">My Reviews</div>';
    if (snap.exists()) {
        snap.forEach(child => {
            const r = child.val();
            html += `
                <div class="item-card" style="flex-direction:column; align-items:flex-start">
                    <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:10px">
                        <span>${"⭐".repeat(r.rating)}</span>
                        <span style="font-size:11px; color:#999">${new Date(r.date).toLocaleDateString()}</span>
                    </div>
                    <p style="font-size:14px; margin:0">"${r.comment}"</p>
                </div>`;
        });
    } else {
        html += '<div class="empty-state"><p>No reviews yet.</p></div>';
    }
    content.innerHTML = html;
}
// --- Add this function to your customer.js ---
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length < 2) return;

    let currentSlide = 0;

    setInterval(() => {
        // Hide current slide
        slides[currentSlide].classList.remove('active');
        
        // Calculate next slide index
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Show next slide
        slides[currentSlide].classList.add('active');
    }, 6000); // Swaps every 6 seconds
}

// --- Update your existing DOMContentLoaded listener ---
document.addEventListener('DOMContentLoaded', () => {
    initAccountModal();
    initHomeWishlistSync();
    initNewArrivals();
    initHeroSlider(); // <--- CALL THE SLIDER HERE
});
// 2. NEW: Logout Logic
function handleLogout() {
    // If you use Firebase Auth: signOut(auth);
    // For now, redirect to login/index page
    if(confirm("Are you sure you want to logout?")) {
        window.location.href = "../index.html"; 
    }
}
function switchTab(tabId, renderFn) {
    // Remove active class from all sidebar items
    document.querySelectorAll('.modal-sidebar li').forEach(li => li.classList.remove('active'));
    // Add active class to the clicked item
    document.getElementById(tabId).classList.add('active');
    // Execute the render function (renderProfile, renderOrders, etc.)
    renderFn();
}