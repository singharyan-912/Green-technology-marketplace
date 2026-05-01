import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, database, ref, set, get, GoogleAuthProvider, signInWithPopup } from '../firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import '../assets/css/auth.css';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('customer');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError("Passwords do not match.");
        }
        if (password.length < 6) {
            return setError("Password must be at least 6 characters.");
        }

        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;

            // Set displayName from email prefix so avatar/greeting works
            const displayName = email.split('@')[0];
            await updateProfile(user, { displayName });

            await set(ref(database, `users/${user.uid}`), {
                uid: user.uid,
                email: email.trim(),
                name: displayName,
                role: role,
                createdAt: new Date().toISOString(),
            });

            // Redirect based on role
            switch (role) {
                case 'customer': navigate('/customer'); break;
                case 'vendor': navigate('/vendor/dashboard'); break;
                case 'admin': navigate('/admin/dashboard'); break;
                default: navigate('/');
            }
        } catch (err) {
            const code = err.code || '';
            if (code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please sign in instead.');
            } else if (code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger password.');
            } else if (code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (code === 'auth/network-request-failed') {
                setError('Network error. Please check your internet connection.');
            } else {
                setError('Account creation failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ── Google Sign-up ──────────────────────────────────────────────────────────
    const handleGoogleSignup = async () => {
        setError('');
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user record already exists (returning user)
            const snapshot = await get(ref(database, `users/${user.uid}`));

            if (!snapshot.exists()) {
                // New user – persist with the currently selected Account Type
                await set(ref(database, `users/${user.uid}`), {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email.split('@')[0],
                    role: role,
                    createdAt: new Date().toISOString(),
                    photoURL: user.photoURL || '',
                });
            }

            // Determine redirect role (existing record wins)
            const redirectRole = snapshot.exists() ? snapshot.val().role : role;
            switch (redirectRole) {
                case 'vendor': navigate('/vendor/dashboard'); break;
                case 'admin': navigate('/admin/dashboard'); break;
                default: navigate('/customer');
            }
        } catch (err) {
            const code = err.code || '';
            if (code === 'auth/popup-blocked') {
                setError('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
            } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                setError('Google sign-in was cancelled. Please try again.');
            } else if (code === 'auth/network-request-failed') {
                setError('Network error. Please check your internet connection.');
            } else {
                setError('Google sign-in failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-split">
                {/* Left Side: Visual */}
                <div className="auth-visual-side signup-bg">
                    <div className="overlay"></div>
                    <div className="visual-content">
                        <div className="brand-badge"><i className="fas fa-leaf"></i> Join the Movement</div>
                        <h1>Start your journey today.</h1>
                        <p>Join a global community of innovators and eco-responsible citizens building a greener planet.</p>
                        
                        <div className="feature-list">
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Buy & Sell Sustainable Technology</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Verified Eco-Impact Ratings</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Secure, Encrypted Transactions</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="auth-form-side">
                    <div className="form-wrapper">
                        <div className="form-header">
                            <h2 className="title">Create Account</h2>
                            <p className="subtitle">Join the eco-marketplace and make a difference.</p>
                        </div>

                        {error && (
                            <div className="error-alert">
                                <i className="fas fa-exclamation-triangle"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="auth-form-modern">
                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-container">
                                    <i className="fas fa-envelope"></i>
                                    <input 
                                        type="email" 
                                        placeholder="name@company.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Password</label>
                                    <div className="input-container">
                                        <i className="fas fa-lock"></i>
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            placeholder="••••••••" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required 
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(p => !p)}
                                            tabIndex={-1}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <div className="input-container">
                                        <i className="fas fa-shield-alt"></i>
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            placeholder="••••••••" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Account Type</label>
                                <div className="input-container">
                                    <i className="fas fa-user-tag"></i>
                                    <select 
                                        value={role} 
                                        onChange={(e) => setRole(e.target.value)}
                                        className="select-modern"
                                    >
                                        <option value="customer">Customer (Buyer)</option>
                                        <option value="vendor">Vendor (Seller)</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <div className="spinner-small"></div>
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Get Started</span>
                                        <i className="fas fa-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* ── OR divider + Google button ── */}
                        <div className="auth-divider">
                            <span className="divider-line"></span>
                            <span className="divider-text">OR</span>
                            <span className="divider-line"></span>
                        </div>

                        <button
                            type="button"
                            className="google-btn"
                            onClick={handleGoogleSignup}
                            disabled={isLoading}
                        >
                            {/* Official Google "G" SVG icon */}
                            <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                <path fill="none" d="M0 0h48v48H0z"/>
                            </svg>
                            <span>Continue with Google</span>
                        </button>

                        <p className="footer-text">
                            Already have an account? <Link to="/login" className="link">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
