// js/script.js
import { auth, app } from "./firebase.js"; 
import { getDatabase, ref, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginSubtitle = document.getElementById('loginSubtitle');
    const roleButtons = document.querySelectorAll('.role-selection .role-button');

    let selectedRole = 'customer'; 

    const database = getDatabase(app);
    const usersRef = ref(database, 'users');

    const updateRoleUI = (role) => {
        roleButtons.forEach(button => button.classList.remove('active'));
        const activeButton = document.querySelector(`.role-selection .role-button[data-role="${role}"]`);
        if (activeButton) activeButton.classList.add('active');

        switch (role) {
            case 'customer': loginSubtitle.textContent = 'Log in to your Customer account'; break;
            case 'vendor': loginSubtitle.textContent = 'Log in to your Vendor account'; break;
            case 'admin': loginSubtitle.textContent = 'Log in to your Admin account'; break;
            default: loginSubtitle.textContent = 'Log in to your account';
        }
        selectedRole = role;
    };

    updateRoleUI(selectedRole);

    roleButtons.forEach(button => {
        button.addEventListener('click', () => updateRoleUI(button.dataset.role));
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            // 1. First, verify the role in the Database
            const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
            const snapshot = await get(emailQuery);

            if (snapshot.exists()) {
                let foundRole = '';
                snapshot.forEach(child => { if(child.val().role === selectedRole) foundRole = selectedRole; });

                if (foundRole !== selectedRole) {
                    alert('Incorrect role selected for this account.');
                    return;
                }

                // 2. Actually Sign In via Firebase Auth (This starts the session for vendor.js)
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 3. Set Redirect Path
                let redirectPath = '';
                switch (selectedRole) {
                    case 'customer': redirectPath = 'customer_dashboard/customer.html'; break;
                    case 'vendor': redirectPath = 'vendor_dashboard/dashboard.html'; break;
                    case 'admin': redirectPath = 'admin/admin.html'; break;
                }

                localStorage.setItem('currentUser', JSON.stringify({ email: email, role: selectedRole }));
                alert(`Login successful! Redirecting...`);
                window.location.href = redirectPath;

            } else {
                alert('No account found with this email.');
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert('Login failed: ' + error.message);
        }
    });
});