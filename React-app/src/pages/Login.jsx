import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, database, ref, get, GoogleAuthProvider, signInWithPopup } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import '../assets/css/auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;

            // Fetch role from RTDB
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);
            
            let role = 'customer';
            if (snapshot.exists()) {
                role = snapshot.val().role;
            } else {
                // Email fallback for legacy accounts
                const allUsersRef = ref(database, 'users');
                const allUsersSnap = await get(allUsersRef);
                if (allUsersSnap.exists()) {
                    const users = allUsersSnap.val();
                    const foundKey = Object.keys(users).find(key => users[key].email === email.trim());
                    if (foundKey) role = users[foundKey].role;
                }
            }

            // Redirect based on role
            switch (role) {
                case 'customer': navigate('/customer'); break;
                case 'vendor': navigate('/vendor/dashboard'); break;
                case 'admin': navigate('/admin/dashboard'); break;
                default: navigate('/');
            }
        } catch (err) {
            // Firebase Auth v10+ uses 'auth/invalid-credential' for both
            // wrong password and unknown email (security best practice)
            const code = err.code || '';
            if (
                code === 'auth/invalid-credential' ||
                code === 'auth/user-not-found' ||
                code === 'auth/wrong-password' ||
                code === 'auth/invalid-email'
            ) {
                setError('Invalid email or password. Please try again.');
            } else if (code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later or reset your password.');
            } else if (code === 'auth/network-request-failed') {
                setError('Network error. Please check your internet connection.');
            } else {
                setError('Sign in failed. Please check your credentials and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ── Google Sign-in ───────────────────────────────────────────────────────────
    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Fetch role from RTDB
            const snapshot = await get(ref(database, `users/${user.uid}`));
            let role = 'customer';
            if (snapshot.exists()) {
                role = snapshot.val().role;
            }

            // Redirect based on role
            switch (role) {
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
                <div className="auth-visual-side login-bg">
                    <div className="overlay"></div>
                    <div className="visual-content">
                        <div className="brand-badge"><i className="fas fa-seedling"></i> GreenTech Ecosystem</div>
                        <h1>Welcome Back.</h1>
                        <p>Access your personalized dashboard to manage technologies, track sales, and monitor your environmental impact.</p>
                        
                        <div className="stat-pills">
                            <div className="pill">
                                <span>10k+</span>
                                <label>Eco Products</label>
                            </div>
                            <div className="pill">
                                <span>50k+</span>
                                <label>CO2 Saved (Tons)</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="auth-form-side">
                    <div className="form-wrapper">
                        <div className="form-header">
                            <h2 className="title">Sign In</h2>
                            <p className="subtitle">Enter your credentials to manage your eco-impact.</p>
                        </div>

                        {error && (
                            <div className="error-alert">
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="auth-form-modern">
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
                                <div className="form-extra">
                                    <Link to="#" className="forgot-pass">Forgot password?</Link>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <div className="spinner-small"></div>
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <i className="fas fa-sign-in-alt"></i>
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
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
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
                            New here? <Link to="/signup" className="link">Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
