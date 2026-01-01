// js/admin.js
import { database, ref, onValue, update, remove, push, auth } from './firebase.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Selectors ---
    const sidebarNavLinks = document.querySelectorAll('.sidebar-nav ul li a');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    const adminProfileBtn = document.querySelector('.admin-profile');
    const adminProfileModal = document.getElementById('adminProfileModal');
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');

    // --- 1. Dynamic Auth & Profile Sync (Aryan Singh Logic) ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const adminRef = ref(database, `admin_profiles/${user.uid}`);
            onValue(adminRef, (snapshot) => {
                let data = snapshot.val();
                if (!data) {
                    // Fallback to general users node if specialized admin_profile doesn't exist
                    const userRef = ref(database, `users/${user.uid}`);
                    onValue(userRef, (userSnapshot) => {
                        const userData = userSnapshot.val();
                        if (userData) updateAdminUI(userData, user.email);
                    });
                } else {
                    updateAdminUI(data, user.email);
                }
            });
        } else {
            // Redirect to login if session is cleared
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = '../index.html';
            }
        }
    });

    function updateAdminUI(data, email) {
        const name = data.name || data.firstName || "Admin User";
        const initial = name.charAt(0).toUpperCase();

        // Update Header (The "Aryan Singh" part)
        const headerName = document.querySelector('.admin-profile span');
        if (headerName) headerName.textContent = name;

        // Update Modern Modal View
        const vAvatar = document.getElementById('viewAdminAvatar');
        const vName = document.getElementById('viewAdminName');
        const vEmail = document.getElementById('viewAdminEmail');
        const vPhone = document.getElementById('viewAdminPhone');
        const vAddress = document.getElementById('viewAdminAddress');

        if (vAvatar) vAvatar.textContent = initial;
        if (vName) vName.textContent = name;
        if (vEmail) vEmail.textContent = email;
        if (vPhone) vPhone.textContent = data.phone || "Not Set";
        if (vAddress) vAddress.textContent = data.address || "Not Set";

        // Fill Edit Form Fields
        const eName = document.getElementById('editAdminName');
        const eEmail = document.getElementById('editAdminEmail');
        const ePhone = document.getElementById('editAdminPhone');
        const eAddress = document.getElementById('editAdminAddress');
        if (eName) eName.value = name;
        if (eEmail) eEmail.value = email;
        if (ePhone) ePhone.value = data.phone || "";
        if (eAddress) eAddress.value = data.address || "";
    }

    // --- 2. Admin Modal Control Logic ---
    if (adminProfileBtn && adminProfileModal) {
        adminProfileBtn.onclick = () => adminProfileModal.style.display = 'flex';
    }

    const closeProfileView = document.getElementById('closeProfileView');
    if (closeProfileView) {
        closeProfileView.onclick = () => adminProfileModal.style.display = 'none';
    }

    const openEditProfileBtn = document.getElementById('openEditProfileBtn');
    if (openEditProfileBtn) {
        openEditProfileBtn.onclick = () => {
            adminProfileModal.style.display = 'none';
            editProfileModal.style.display = 'block';
        };
    }

    document.querySelectorAll('.close-modal, #cancelEditProfile, #closeProfileEdit').forEach(btn => {
        btn.onclick = () => {
            if (editProfileModal) editProfileModal.style.display = 'none';
            if (adminProfileModal) adminProfileModal.style.display = 'none';
        };
    });

    if (editProfileForm) {
        editProfileForm.onsubmit = (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if(!user) return;

            const updatedProfile = {
                name: document.getElementById('editAdminName').value,
                email: document.getElementById('editAdminEmail').value,
                phone: document.getElementById('editAdminPhone').value,
                address: document.getElementById('editAdminAddress').value
            };

            update(ref(database, `admin_profiles/${user.uid}`), updatedProfile)
                .then(() => {
                    alert("Profile updated!");
                    editProfileModal.style.display = 'none';
                })
                .catch(err => alert("Error: " + err.message));
        };
    }

    // --- 3. Logout Logic ---
    document.querySelectorAll('.logout-button').forEach(btn => {
        btn.onclick = () => {
            if(confirm("Are you sure you want to logout?")) {
                signOut(auth).then(() => {
                    window.location.href = '../index.html'; 
                });
            }
        };
    });

    // --- 4. Navigation & Section Loading ---
    sidebarNavLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const targetSectionId = link.dataset.section;
            if (targetSectionId && document.getElementById(targetSectionId)) {
                event.preventDefault();
                sidebarNavLinks.forEach(nav => nav.parentElement.classList.remove('active'));
                dashboardSections.forEach(section => section.classList.remove('active-section'));
                link.parentElement.classList.add('active');
                document.getElementById(targetSectionId).classList.add('active-section');
                loadSectionData(targetSectionId);
            } 
        });
    });

    function loadSectionData(sectionId) {
        switch(sectionId) {
            case 'dashboard': loadDashboardStats(); break;
            case 'user-management': loadUsers(); break;
            case 'product-listings': loadProducts(); break;
            case 'order-management': loadOrders(); break;
            case 'review-overview': loadReviews(); break;
            case 'system-settings': loadSystemSettings(); break;
        }
    }

    // Initial Load
    const activeSection = document.querySelector('.active-section');
    if (activeSection) loadSectionData(activeSection.id);
    else loadDashboardStats();

    const generateDisplayId = (key) => key ? key.substring(0, 6).toUpperCase() : 'N/A';

    // --- 5. Dashboard Overview Logic ---
    function loadDashboardStats() {
        onValue(ref(database, 'users'), (snap) => {
            if(document.getElementById('totalUsersCount'))
                document.getElementById('totalUsersCount').textContent = snap.size || 0;
        });
        onValue(ref(database, 'products'), (snap) => {
            let active = 0;
            snap.forEach(child => { if(child.val().status === 'approved') active++; });
            if(document.getElementById('activeListingsCount'))
                document.getElementById('activeListingsCount').textContent = active;
        });
        onValue(ref(database, 'orders'), (snap) => {
            let pending = 0;
            snap.forEach(child => { if(child.val().status === 'pending') pending++; });
            if(document.getElementById('pendingOrdersCount'))
                document.getElementById('pendingOrdersCount').textContent = pending;
        });
        onValue(ref(database, 'reviews'), (snap) => {
            if(document.getElementById('newReviewsCount'))
                document.getElementById('newReviewsCount').textContent = snap.size || 0;
        });
        loadDashboardRecentOrders();
        loadDashboardRecentUsers();
    }

    function loadDashboardRecentOrders() {
        const recentOrdersTable = document.getElementById('recentOrdersTable');
        if (!recentOrdersTable) return;
        onValue(ref(database, 'orders'), (snapshot) => {
            recentOrdersTable.innerHTML = '';
            let orders = [];
            snapshot.forEach(child => { orders.push({ key: child.key, ...child.val() }); });
            orders.reverse().slice(0, 5).forEach(o => {
                recentOrdersTable.innerHTML += `
                    <tr>
                        <td style="font-weight: 600;">${generateDisplayId(o.key)}</td>
                        <td>${o.customerName || 'N/A'}</td>
                        <td><span class="status-pill ${o.status === 'pending' ? 'status-pending' : 'status-active'}">${o.status}</span></td>
                        <td>$${parseFloat(o.totalAmount || o.total || 0).toFixed(2)}</td>
                    </tr>`;
            });
        });
    }

    function loadDashboardRecentUsers() {
        const newUsersList = document.getElementById('newUsersList');
        if (!newUsersList) return;
        onValue(ref(database, 'users'), (snapshot) => {
            newUsersList.innerHTML = '';
            let users = [];
            snapshot.forEach(child => { users.push(child.val()); });
            users.reverse().slice(0, 5).forEach(user => {
                const initial = (user.name || user.firstName) ? (user.name || user.firstName).charAt(0).toUpperCase() : '?';
                newUsersList.innerHTML += `
                    <li style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;">
                        <div style="background: var(--light-green); color: var(--primary-green); width: 35px; height: 35px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">${initial}</div>
                        <div>
                            <p style="margin: 0; font-weight: 600; font-size: 0.85rem;">${user.name || user.firstName || 'User'}</p>
                            <p style="margin: 0; font-size: 0.75rem; color: var(--text-muted);">${user.role || 'customer'}</p>
                        </div>
                    </li>`;
            });
        });
    }

    // --- 6. User Management Logic ---
    function loadUsers() {
        const userTableBody = document.getElementById('userTableBody');
        if (!userTableBody) return;
        onValue(ref(database, 'users'), (snapshot) => {
            userTableBody.innerHTML = '';
            snapshot.forEach((child) => {
                const user = child.val();
                const key = child.key;
                const status = user.status || 'active';
                const statusClass = status === 'active' ? 'status-active' : 'status-pending';
                userTableBody.innerHTML += `
                    <tr>
                        <td>${generateDisplayId(key)}</td>
                        <td>${user.name || user.firstName || 'N/A'}</td>
                        <td>${user.email || 'N/A'}</td>
                        <td>${user.role || 'customer'}</td>
                        <td><span class="status-pill ${statusClass}" style="cursor: pointer;" onclick="toggleUserStatus('${key}', '${status}')">${status}</span></td>
                        <td><button class="action-button" onclick="deleteItem('users', '${key}')"><i class="fas fa-trash-alt"></i></button></td>
                    </tr>`;
            });
        });

        // Add User Modal
        const addUserBtn = document.getElementById('addUserBtn');
        const userModal = document.getElementById('userModal');
        const addUserForm = document.getElementById('addUserForm');
        if (addUserBtn && userModal) {
            addUserBtn.onclick = () => userModal.style.display = 'block';
            document.querySelectorAll('.close-modal, #cancelUserBtn').forEach(el => el.onclick = () => userModal.style.display = 'none');
        }
        if (addUserForm) {
            addUserForm.onsubmit = (e) => {
                e.preventDefault();
                push(ref(database, 'users'), {
                    name: document.getElementById('newUserName').value,
                    email: document.getElementById('newUserEmail').value,
                    role: document.getElementById('newUserRole').value,
                    status: 'active'
                }).then(() => { alert("User Saved!"); userModal.style.display = 'none'; addUserForm.reset(); });
            };
        }
    }

   
    // --- 7. Product Listings Logic ---
    function loadProducts() {
        const approvedBody = document.getElementById('approvedProductsTableBody');
        const pendingBody = document.getElementById('pendingProductsTableBody');
        if (!approvedBody || !pendingBody) return;

        // 1. Fetch Users
        onValue(ref(database, 'users'), (userSnapshot) => {
            const usersData = userSnapshot.val() || {};

            // 2. Fetch Vendors (for Business Names)
            onValue(ref(database, 'vendors'), (vendorSnapshot) => {
                const vendorsData = vendorSnapshot.val() || {};

                // 3. Fetch Products
                onValue(ref(database, 'products'), (snapshot) => {
                    approvedBody.innerHTML = ''; 
                    pendingBody.innerHTML = '';
                    
                    snapshot.forEach((child) => {
                        const p = child.val(); 
                        const key = child.key;

                        // According to your JSON, your products are missing a seller ID field.
                        // The code looks for 'sellerId' or 'userId'. 
                        // You MUST add one of these to your product data in Firebase.
                        const sellerId = p.sellerId || p.userId || p.uid;
                        
                        let sellerDisplay = "N/A";

                        if (sellerId) {
                            // Check Vendors node first (for businessName)
                            if (vendorsData[sellerId] && vendorsData[sellerId].businessName) {
                                sellerDisplay = vendorsData[sellerId].businessName;
                            } 
                            // Fallback to Users node (firstName + lastName)
                            else if (usersData[sellerId]) {
                                const u = usersData[sellerId];
                                sellerDisplay = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || "Unknown Vendor";
                            }
                        }

                        const row = `
                            <tr>
                                <td>${generateDisplayId(key)}</td>
                                <td>${p.productName || p.name || 'Unnamed'}</td>
                                <td style="font-weight:600; color:#22c55e;">${sellerDisplay}</td>
                                <td>${p.category || 'N/A'}</td>
                                <td>
                                    ${p.status === 'pending' 
                                        ? `<button class="action-button approve-btn" onclick="updateStatus('products/${key}', 'approved')"><i class="fas fa-check"></i> Approve</button>` 
                                        : `<button class="action-button reject-btn" onclick="updateStatus('products/${key}', 'pending')"><i class="fas fa-times"></i> Suspend</button>`
                                    }
                                    <button class="action-button delete-btn" onclick="deleteItem('products', '${key}')"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>`;

                        if (p.status === 'approved') {
                            approvedBody.innerHTML += row;
                        } else {
                            pendingBody.innerHTML += row;
                        }
                    });
                });
            });
        });
    }
    // --- 8. Order Management Logic (With Filters) ---
    let allOrders = [];
    function loadOrders() {
        const orderTableBody = document.getElementById('orderTableBody');
        if (!orderTableBody) return;
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');

        onValue(ref(database, 'orders'), (snapshot) => {
            allOrders = [];
            snapshot.forEach((child) => { allOrders.push({ key: child.key, ...child.val() }); });
            renderFilteredOrders();
        });

        if (statusFilter) statusFilter.onchange = () => renderFilteredOrders();
        if (dateFilter) dateFilter.onchange = () => renderFilteredOrders();
    }

    function renderFilteredOrders() {
        const orderTableBody = document.getElementById('orderTableBody');
        const statusVal = document.getElementById('statusFilter')?.value || 'all';
        const dateVal = document.getElementById('dateFilter')?.value || '';

        const filtered = allOrders.filter(o => {
            const matchesStatus = (statusVal === 'all' || o.status === statusVal);
            const matchesDate = (dateVal === '' || o.orderDate === dateVal);
            return matchesStatus && matchesDate;
        });

        orderTableBody.innerHTML = filtered.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px;">No matching orders.</td></tr>' : '';
        filtered.forEach((o) => {
            orderTableBody.innerHTML += `<tr><td>${generateDisplayId(o.key)}</td><td>${o.customerName || 'N/A'}</td><td>$${parseFloat(o.totalAmount || o.total || 0).toFixed(2)}</td><td><span class="status-pill ${o.status === 'pending' ? 'status-pending' : 'status-active'}">${o.status}</span></td><td>${o.orderDate || 'N/A'}</td><td><button class="action-button" onclick="updateStatus('orders/${o.key}', 'Shipped')">Ship</button><button class="action-button delete-btn" onclick="deleteItem('orders', '${o.key}')"><i class="fas fa-trash"></i></button></td></tr>`;
        });
    }

    // --- 9. Review Overview Logic ---
    function loadReviews() {
        const reviewTableBody = document.getElementById('reviewTableBody');
        if (!reviewTableBody) return;
        onValue(ref(database, 'reviews'), (snapshot) => {
            reviewTableBody.innerHTML = '';
            snapshot.forEach((child) => {
                const r = child.val(); const key = child.key;
                const resHtml = r.adminResponded ? `<div style="margin-top:10px;padding:10px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:5px;font-size:0.85rem;"><strong style="color:#166534;display:block;margin-bottom:2px;">Admin Response:</strong>${r.adminResponse}</div>` : '';
                reviewTableBody.innerHTML += `<tr><td style="font-weight:600;">${r.productName || 'N/A'}</td><td>${r.customerName || 'N/A'}</td><td style="color:#f59e0b;">${'⭐'.repeat(r.rating || 0)}</td><td><div style="font-style:italic;">"${r.comment || 'N/A'}"</div>${resHtml}</td><td><button class="action-button" onclick="respondToReview('${key}')"><i class="fas fa-reply"></i></button><button class="action-button delete-btn" onclick="deleteItem('reviews', '${key}')"><i class="fas fa-trash"></i></button></td></tr>`;
            });
        });
    }

    // --- 10. System Settings Logic ---
    function loadSystemSettings() {
        const form = document.getElementById('generalSettingsForm');
        if (!form) return;
        onValue(ref(database, 'settings/general'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                document.getElementById('siteName').value = data.siteName || '';
                document.getElementById('contactEmail').value = data.contactEmail || '';
                document.getElementById('allowNewRegistrations').checked = data.allowNewRegistrations || false;
            }
        }, { onlyOnce: true });
        form.onsubmit = (e) => {
            e.preventDefault();
            update(ref(database, 'settings/general'), {
                siteName: document.getElementById('siteName').value,
                contactEmail: document.getElementById('contactEmail').value,
                allowNewRegistrations: document.getElementById('allowNewRegistrations').checked
            }).then(() => alert("Settings saved!"));
        };
    }

    // --- Global Helpers ---
    window.toggleUserStatus = (id, cur) => update(ref(database, `users/${id}`), { status: cur === 'active' ? 'inactive' : 'active' });
    window.updateStatus = (path, status) => update(ref(database, path), { status });
    window.deleteItem = (col, id) => { if (confirm(`Delete?`)) remove(ref(database, `${col}/${id}`)); };
    window.respondToReview = (id) => {
        const res = prompt("Enter response:");
        if (res && res.trim() !== "") update(ref(database, `reviews/${id}`), { adminResponse: res, adminResponded: true }).then(() => alert("Saved!"));
    };
});