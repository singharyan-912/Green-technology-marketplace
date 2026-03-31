import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, database, ref, get } from '../firebase/config';
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
