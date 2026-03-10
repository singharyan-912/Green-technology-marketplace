// js/signup.js
import { auth, app } from "./firebase.js"; 
import { getDatabase, ref, set, update, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const signupSubtitle = document.getElementById('signupSubtitle');
    const roleButtons = document.querySelectorAll('.role-selection .role-button');

    let selectedSignupRole = 'customer'; 
    const database = getDatabase(app);

    const updateSignupRoleUI = (role) => {
        roleButtons.forEach(button => button.classList.remove('active'));
        const activeButton = document.querySelector(`.role-selection .role-button[data-role="${role}"]`);
        if (activeButton) activeButton.classList.add('active');

        switch (role) {
            case 'customer': signupSubtitle.textContent = 'Register as a Customer'; break;
            case 'vendor': signupSubtitle.textContent = 'Register as a Vendor'; break;
            case 'admin': signupSubtitle.textContent = 'Register as an Admin'; break;
            default: signupSubtitle.textContent = 'Create Your Account';
        }
        selectedSignupRole = role;
    };

    updateSignupRoleUI(selectedSignupRole);

    roleButtons.forEach(button => {
        button.addEventListener('click', () => updateSignupRoleUI(button.dataset.role));
    });

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const signupEmail = document.getElementById('signupEmail').value;
        const signupPassword = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (signupPassword !== confirmPassword) { alert('Passwords do not match!'); return; }
        if (signupPassword.length < 6) { alert('Password must be at least 6 characters.'); return; }

        try {
            // 1. Create User in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
            const user = userCredential.user;

            // 2. Save User Data to 'users' node using their UID
            const userData = {
                firstName, lastName,
                email: signupEmail,
                role: selectedSignupRole,
                createdAt: new Date().toISOString()
            };
            await set(ref(database, `users/${user.uid}`), userData);

            // 3. If Vendor, also initialize the 'vendors' node for the dashboard profile
            if (selectedSignupRole === 'vendor') {
                await set(ref(database, `vendors/${user.uid}`), {
                    businessName: `${firstName}'s Store`,
                    category: "Green Technology",
                    email: signupEmail
                });
            }

            alert(`Account created successfully as ${selectedSignupRole}!`);
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Signup Error:", error);
            alert('Signup failed: ' + error.message);
        }
    });
});