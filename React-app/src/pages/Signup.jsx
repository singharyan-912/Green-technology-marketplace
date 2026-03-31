import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, database, ref, set } from '../firebase/config';
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
