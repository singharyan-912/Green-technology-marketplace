import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { database, ref, get } from '../firebase/config';
import Navbar from '../component/Navbar';
import '../index.css';

const Home = () => {
    const [aboutContent, setAboutContent] = useState(null);

    useEffect(() => {
        const fetchAbout = async () => {
            const aboutRef = ref(database, 'about');
            const snapshot = await get(aboutRef);
            if (snapshot.exists()) {
                setAboutContent(snapshot.val());
            }
        };
        fetchAbout();
    }, []);
    return (
        <div className="home-container">
            <Navbar />

            {/* Hero Section */}
            <header className="hero fade-in">
                <div className="container hero-layout">
                    <div className="hero-content">
                        <span className="hero-badge">Next-Gen Sustainability</span>
                        <h1>The Future of <span className="highlight">Green Tech</span> is Here.</h1>
                        <p>Join the world's most advanced marketplace for renewable energy Solutions, eco-friendly gadgets, and sustainable innovations.</p>

                        <div className="hero-actions">
                            <Link to="/signup" className="btn-primary">Get Started</Link>
                            <Link to="/customer" className="btn-secondary">Explore Marketplace</Link>
                        </div>

                        <div className="hero-stats">
                            <div className="stat">
                                <strong>10k+</strong>
                                <span>Active Users</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat">
                                <strong>5k+</strong>
                                <span>Verified Products</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="floating-card c1">🚀 Innovative</div>
                        <div className="floating-card c2">🌿 100% Eco</div>
                        <div className="glass-card">
                            <img src="https://therenewables.org/wp-content/uploads/2023/12/future-of-renewable-energy-green-technology-1024x585.jpg" alt="Eco Tech" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="features section fade-in">
                <div className="container">
                    <div className="section-header">
                        <h2>Why Choose GreenTech?</h2>
                        <p>We provide the tools and platform for a sustainable future.</p>
                    </div>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="f-icon">🔒</div>
                            <h3>Secure Trades</h3>
                            <p>Every transaction is protected and verified by our green-certified escrow system.</p>
                        </div>
                        <div className="feature-card">
                            <div className="f-icon">📊</div>
                            <h3>Eco Tracking</h3>
                            <p>Real-time analytics on your carbon footprint saved through each purchase.</p>
                        </div>
                        <div className="feature-card">
                            <div className="f-icon">⚡</div>
                            <h3>Fast Shipping</h3>
                            <p>Optimized logistics to ensure the lowest carbon emissions during delivery.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="about-section section fade-in">
                <div className="container about-grid">
                    <div className="about-image">
                        <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" alt="Our Office" />
                    </div>
                    <div className="about-content">
                        <span className="about-tag">About GreenTech</span>
                        <h2>Bridging the Gap Between <span className="highlight">Tech & Nature</span></h2>
                        <p>{aboutContent?.story || "Founded in 2024, GreenTech was born from a simple idea: that technology should preserve our planet, not deplete it. We've built a curated ecosystem where innovators and consumers meet to accelerate the world's transition to sustainable energy."}</p>
                        <p>Our marketplace carefully vets every product for its eco-score, ensuring that your purchases align with your values.</p>

                        <div className="impact-stats">
                            <div className="i-stat">
                                <h4>{aboutContent?.stats?.co2Saved || '450k+'}T</h4>
                                <span>Tons of CO2 Saved</span>
                            </div>
                            <div className="i-stat">
                                <h4>{aboutContent?.stats?.productsSold || '100%'}</h4>
                                <span>Products Sold</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                .home-container { min-height: 100vh; overflow-x: hidden; }
                
                .hero {
                    padding: 180px 0 100px;
                    background: radial-gradient(circle at top right, rgba(46, 204, 113, 0.05), transparent 40%),
                                radial-gradient(circle at bottom left, rgba(26, 188, 156, 0.05), transparent 40%);
                }

                .hero-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; }
                
                @media (max-width: 991px) {
                    .hero-layout { grid-template-columns: 1fr; text-align: center; }
                    .hero-actions { justify-content: center; }
                    .hero-stats { justify-content: center; }
                    .hero-visual { display: none; }
                }

                .hero-badge {
                    background: var(--primary-light);
                    color: var(--primary-dark);
                    padding: 6px 16px;
                    border-radius: var(--radius-full);
                    font-weight: 700;
                    font-size: 0.85rem;
                    display: inline-block;
                    margin-bottom: 24px;
                }

                .hero-content h1 { font-size: 4rem; margin-bottom: 24px; font-weight: 800; line-height: 1.1; }
                .hero-content .highlight { color: var(--primary); }
                .hero-content p { font-size: 1.2rem; color: var(--text-muted); margin-bottom: 40px; }

                .hero-actions { display: flex; gap: 20px; margin-bottom: 50px; }
                .btn-primary {
                    background: var(--primary);
                    color: white;
                    padding: 16px 32px;
                    border-radius: var(--radius-md);
                    font-weight: 700;
                    font-size: 1.1rem;
                    box-shadow: 0 10px 20px rgba(46, 204, 113, 0.2);
                }
                .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(46, 204, 113, 0.3); }

                .btn-secondary {
                    background: white;
                    color: var(--text-main);
                    padding: 16px 32px;
                    border-radius: var(--radius-md);
                    font-weight: 700;
                    font-size: 1.1rem;
                    border: 1px solid var(--border);
                }
                .btn-secondary:hover { background: var(--bg-body); border-color: var(--primary); }

                .hero-stats { display: flex; gap: 40px; align-items: center; }
                .stat { display: flex; flex-direction: column; }
                .stat strong { font-size: 2rem; color: var(--text-main); }
                .stat span { color: var(--text-muted); font-size: 0.9rem; font-weight: 500; }
                .stat-divider { width: 1px; height: 40px; background: var(--border); }

                /* Hero Visual */
                .hero-visual { position: relative; }
                .glass-card {
                    width: 400px;
                    height: 500px;
                    border-radius: 40px;
                    overflow: hidden;
                    border: 8px solid white;
                    box-shadow: var(--shadow-lg);
                    transform: rotate(3deg);
                }
                .glass-card img { width: 100%; height: 100%; object-fit: cover; }

                .floating-card {
                    position: absolute;
                    background: white;
                    padding: 12px 24px;
                    border-radius: 20px;
                    box-shadow: var(--shadow-md);
                    font-weight: 700;
                    font-size: 0.9rem;
                    z-index: 10;
                    animation: float 4s ease-in-out infinite;
                }
                .c1 { top: 20%; left: -40px; animation-delay: 0s; }
                .c2 { bottom: 20%; right: -20px; animation-delay: 2s; }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }

                /* Features */
                .section-header { text-align: center; margin-bottom: 60px; }
                .section-header h2 { font-size: 2.5rem; margin-bottom: 12px; }
                .section-header p { color: var(--text-muted); font-size: 1.1rem; }

                .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
                .feature-card {
                    background: white;
                    padding: 40px;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    transition: var(--transition);
                }
                .feature-card:hover { transform: translateY(-10px); border-color: var(--primary); box-shadow: var(--shadow-lg); }
                .f-icon { font-size: 3rem; margin-bottom: 24px; }
                .feature-card h3 { font-size: 1.4rem; margin-bottom: 16px; }
                .feature-card p { color: var(--text-muted); line-height: 1.7; }

                /* About Section */
                .about-section { background: white; position: relative; overflow: hidden; }
                .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
                @media (max-width: 991px) { .about-grid { grid-template-columns: 1fr; text-align: center; gap: 40px; } }
                
                .about-image { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-lg); height: 450px; }
                .about-image img { width: 100%; height: 100%; object-fit: cover; }
                
                .about-tag { color: var(--primary); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 12px; }
                .about-content h2 { font-size: 2.8rem; margin-bottom: 24px; }
                .about-content p { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 30px; line-height: 1.8; }
                
                .impact-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                .i-stat h4 { font-size: 1.8rem; color: var(--primary); margin-bottom: 4px; }
                .i-stat span { font-size: 0.9rem; color: var(--text-light); font-weight: 600; }
            `}</style>
        </div>
    );
};

export default Home;
