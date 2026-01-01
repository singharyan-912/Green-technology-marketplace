import { database, ref, get, push, query, orderByChild, equalTo } from "./firebase.js";

// 1. Get Product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
let userRatingSelection = 0; // Stores the stars clicked in modal

document.addEventListener('DOMContentLoaded', () => {
    if (!productId) {
        window.location.href = 'customer.html';
        return;
    }
    loadProductDetails();
   
    setupButtonListeners();
    loadReviews(); // Fetch existing reviews
    initReviewModalLogic(); // Setup the "Rate Product" button and Modal
});

async function loadProductDetails() {
    const pRef = ref(database, `products/${productId}`);
    try {
        const snapshot = await get(pRef);
        if (snapshot.exists()) {
            const p = snapshot.val();
            
            // 1. UPDATE TEXT & BREADCRUMBS
            document.getElementById('p-name').innerText = p.name || p.productName || 'Eco Product';
            document.getElementById('breadcrumb-name').innerText = p.name || p.productName || 'Product';
            document.getElementById('p-price').innerText = `$${p.price || '0'}`;
            document.getElementById('p-desc').innerText = p.description || 'No description provided.';
            
            const cat = p.category || 'Electronics';
            document.getElementById('breadcrumb-cat').innerText = cat;

            // 2. IMAGE LOGIC (FIXES THE DISAPPEARING IMAGE)
            const gallery = document.getElementById('image-gallery');
            // Try all possible image keys
            const rawImage = p.imageUrl || p.image || p.productImage || p.img || p.imageURL;
            
            if (rawImage) {
                // If it's an array of images, loop through them; if not, show one.
                const images = Array.isArray(rawImage) ? rawImage : [rawImage];
                gallery.innerHTML = images.map(img => `<img src="${img}" alt="Product Image">`).join('');
            } else {
                gallery.innerHTML = `<img src="https://via.placeholder.com/500x600?text=No+Image+Found" alt="Placeholder">`;
            }

            // 3. LOAD SIMILAR
            loadSimilarProducts(cat);

        } else {
            console.error("No product found in database.");
        }
    } catch (err) { console.error("Error:", err); }
}

// --- 1. MODAL LOGIC (Open, Star Select, Submit) ---
function initReviewModalLogic() {
    const modal = document.getElementById('review-modal');
    const openBtn = document.getElementById('open-review-modal');
    const closeBtn = document.getElementById('close-review');
    const stars = document.querySelectorAll('.star-select');
    const submitBtn = document.getElementById('submit-review');

    // Open Modal
    openBtn.onclick = () => { modal.style.display = 'flex'; };

    // Close Modal
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

    // Star Click Logic
    stars.forEach(star => {
        star.onclick = () => {
            userRatingSelection = parseInt(star.dataset.value);
            stars.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.value) <= userRatingSelection);
            });
        };
    });

    // SUBMIT TO DATABASE
    submitBtn.onclick = async () => {
        const comment = document.getElementById('review-text').value.trim();
        
        if (userRatingSelection === 0) {
            alert("Please select a star rating!");
            return;
        }

        const reviewData = {
            productId: productId,
            rating: userRatingSelection,
            comment: comment || "Good product!",
            userName: "Verified Buyer", // You can replace this with actual login name later
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            timestamp: Date.now()
        };

        try {
            // Save to "reviews" section in Firebase
            await push(ref(database, `reviews/${productId}`), reviewData);
            alert("Thank you! Your review has been saved.");
            modal.style.display = 'none';
            // Clear inputs
            document.getElementById('review-text').value = '';
            stars.forEach(s => s.classList.remove('active'));
            userRatingSelection = 0;
            
            // Refresh reviews to show the new one
            loadReviews();
        } catch (error) {
            console.error("Database Error:", error);
            alert("Failed to save review.");
        }
    };
}

// --- 2. LOAD & SHOW TOP 2 REVIEWS ---
async function loadReviews() {
    const rRef = ref(database, `reviews/${productId}`);
    try {
        const snapshot = await get(rRef);
        const reviewsList = document.getElementById('reviews-list');
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            const reviewsArray = Object.values(data);
            
            // Logic for Summary Bars & Average
            let totalRating = 0;
            let dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            reviewsArray.forEach(r => {
                totalRating += r.rating;
                dist[r.rating]++;
            });

            const count = reviewsArray.length;
            const avg = (totalRating / count).toFixed(1);

            // Update Header Stats
            document.getElementById('p-big-rating').innerText = avg;
            document.getElementById('p-rating').innerText = avg;
            document.getElementById('p-verified-count').innerText = `${count} Verified Buyers`;
            document.getElementById('p-reviews-count').innerText = count;

            // Update Progress Bars
            for (let i = 1; i <= 5; i++) {
                const percentage = (dist[i] / count) * 100;
                document.getElementById(`bar-${i}`).style.width = `${percentage}%`;
                document.getElementById(`count-${i}`).innerText = dist[i];
            }

            // SHOW ONLY TOP 2 REVIEWS (Newest first)
            const top2 = reviewsArray.sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);
            
            let html = '';
            top2.forEach(r => {
                html += `
                    <div class="user-review">
                        <div class="review-badge">${r.rating} ★</div>
                        <p style="font-weight:600; margin-bottom:5px;">${r.comment}</p>
                        <p style="font-size:12px; color:#696b79;">${r.userName} | ${r.date}</p>
                    </div>`;
            });
            reviewsList.innerHTML = html;

        } else {
            reviewsList.innerHTML = '<p style="color:#999; padding: 20px 0;">No reviews yet. Be the first to review!</p>';
        }
    } catch (error) {
        console.error("Error loading reviews:", error);
    }
}

async function loadSimilarProducts(category) {
    const sRef = ref(database, 'products');
    const q = query(sRef, orderByChild('category'), equalTo(category));

    try {
        const snapshot = await get(q);
        const grid = document.getElementById('similar-grid');
        let html = '';
        let count = 0;

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const p = child.val();
                
                // Only show other products (not the current one)
                if (child.key !== productId && count < 5) {
                    
                    // 1. Check ALL possible keys (matching your main function logic)
                    let rawImg = p.imageUrl || p.image || p.productImage || p.img || p.imageURL;
                    
                    // 2. Handle Arrays: If it's an array, take the first image [0]
                    let simImg = Array.isArray(rawImg) ? rawImg[0] : rawImg;
                    
                    // 3. Fallback if no image exists
                    if (!simImg) simImg = 'https://via.placeholder.com/150';

                    html += `
                        <div class="product-card" onclick="window.location.href='product-details.html?id=${child.key}'" style="cursor:pointer">
                            <div class="product-img-container">
                                <img src="${simImg}" alt="${p.name}">
                            </div>
                            <div class="product-info">
                                <h4 style="font-size:14px; margin:10px 0;">${p.name || 'Eco Item'}</h4>
                                <p style="color:#4CAF50; font-weight:bold;">$${p.price || '0'}</p>
                            </div>
                        </div>`;
                    count++;
                }
            });
            grid.innerHTML = html;
        } else {
            grid.innerHTML = '<p>No similar items found in this category.</p>';
        }
    } catch (e) { 
        console.error("Similar Products Error:", e); 
    }
}

// 5. Button Click Handlers (Placeholders)
function setupButtonListeners() {
    document.getElementById('add-to-bag').onclick = () => {
        const selectedSize = document.querySelector('.size-btn.active');
        if (!selectedSize) {
            alert("Please select a size first!");
            return;
        }
        alert("Product added to your bag!");
        // Add your Cart logic here
    };

    document.getElementById('add-to-wishlist').onclick = () => {
        alert("Added to wishlist!");
        if (wishData[heart.dataset.id]) heart.classList.add('active');
            else heart.classList.remove('active');
        // Add your Wishlist logic here
    };
}