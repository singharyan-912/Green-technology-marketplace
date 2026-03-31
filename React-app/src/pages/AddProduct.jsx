import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database, ref, push } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Navbar from '../component/Navbar';
import ProductCard from '../component/ProductCard';
import '../index.css';

const AddProduct = () => {
    const { currentUser } = useAuth();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Electronics');
    const [ecoRating, setEcoRating] = useState('8');
    const [imageUrl, setImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await push(ref(database, 'products'), {
                productName: name.trim(),
                price: parseFloat(price),
                category: category,
                ecoRating: parseInt(ecoRating),
                productImage: imageUrl.trim() || 'https://via.placeholder.com/300x200?text=Eco+Product',
                stock: 10,
                status: 'approved',
                userId: currentUser.uid,
                createdAt: new Date().toISOString()
            });

            alert('Product successfully added to the marketplace!');
            navigate('/vendor/dashboard');
        } catch (err) {
            console.error("Error adding product:", err);
            alert("Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare preview data
    const previewProduct = {
        id: 'preview',
        productName: name || 'Product Name',
        displayName: name || 'Product Name Preview',
        price: price || '0.00',
        displayPrice: price || '0.00',
        category: category,
        displayCategory: category,
        ecoRating: ecoRating,
        displayEcoRating: ecoRating,
        productImage: imageUrl || 'https://via.placeholder.com/300x200?text=Eco+Product',
        displayImage: imageUrl || 'https://via.placeholder.com/300x200?text=Eco+Product'
    };

    return (
        <div className="dashboard-container">
            <Navbar />
            
            <main className="container dashboard-main">
                <div className="add-product-layout fade-in">
                    {/* Form Section */}
                    <div className="form-card">
                        <div className="form-header">
                            <h1>Post New Technology</h1>
                            <p>Share your sustainable innovation with the world.</p>
                        </div>

                        <form onSubmit={handleAddProduct} className="add-product-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Solar Powered Charger" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price ($)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00" 
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select 
                                        value={category} 
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="select-modern"
                                    >
                                        <option value="Electronics">Electronics</option>
                                        <option value="Solar Energy">Solar Energy</option>
                                        <option value="Home Goods">Home Goods</option>
                                        <option value="Outdoor">Outdoor</option>
                                        <option value="Personal Care">Personal Care</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Eco Rating (1-10)</label>
                                    <div className="eco-input-wrapper">
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="10" 
                                            value={ecoRating} 
                                            onChange={(e) => setEcoRating(e.target.value)}
                                            className="eco-slider"
                                        />
                                        <span className="eco-value-display">🌿 {ecoRating}/10</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Product Image URL</label>
                                <input 
                                    type="url" 
                                    placeholder="https://images.unsplash.com/..." 
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                                <p className="input-hint">Use high-quality Unsplash URLs for best look.</p>
                            </div>

                            <button type="submit" className="submit-btn-full" disabled={isLoading}>
                                {isLoading ? <div className="spinner-small"></div> : 'Publish Product'}
                            </button>
                        </form>
                    </div>

                    {/* Preview Section */}
                    <div className="preview-side">
                        <div className="sticky-preview">
                            <h3 className="preview-title">Live Preview</h3>
                            <div className="preview-card-wrapper">
                                <ProductCard product={previewProduct} />
                            </div>
                            <div className="preview-tips">
                                <p><strong>💡 Pro Tip:</strong></p>
                                <p>High eco ratings (8+) get a special green glow on the marketplace.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .add-product-layout {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 50px;
                    align-items: flex-start;
                }

                @media (max-width: 991px) {
                    .add-product-layout { grid-template-columns: 1fr; }
                    .preview-side { order: -1; }
                }

                .form-card {
                    background: white;
                    padding: 40px;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    box-shadow: var(--shadow-md);
                }

                .form-header { margin-bottom: 32px; }
                .form-header h1 { font-size: 2rem; margin-bottom: 8px; }
                .form-header p { color: var(--text-muted); }

                .add-product-form { display: grid; gap: 24px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                @media (max-width: 576px) { .form-row { grid-template-columns: 1fr; } }

                .form-group { display: grid; gap: 8px; }
                .form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
                .form-group input, .select-modern {
                    padding: 12px 16px;
                    border-radius: var(--radius-md);
                    border: 1.5px solid var(--border);
                    background: var(--bg-body);
                    outline: none;
                    font-size: 0.95rem;
                }
                .form-group input:focus, .select-modern:focus { border-color: var(--primary); background: white; }

                .eco-input-wrapper { display: flex; align-items: center; gap: 15px; }
                .eco-slider { flex: 1; accent-color: var(--primary); }
                .eco-value-display { font-weight: 700; color: var(--primary-dark); font-size: 0.95rem; white-space: nowrap; }

                .input-hint { font-size: 0.75rem; color: var(--text-light); margin-top: -4px; }

                .submit-btn-full {
                    background: var(--primary);
                    color: white;
                    padding: 16px;
                    border-radius: var(--radius-md);
                    font-weight: 800;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 10px;
                    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
                }
                .submit-btn-full:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(46, 204, 113, 0.4); }

                /* Preview Side */
                .sticky-preview {
                    position: sticky;
                    top: 120px;
                }
                .preview-title { font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px; letter-spacing: 0.1em; }
                .preview-card-wrapper { transform: scale(1.05); transform-origin: top left; }
                .preview-tips {
                    margin-top: 40px;
                    padding: 20px;
                    background: #f0fdf4;
                    border: 1px solid #dcfce7;
                    border-radius: var(--radius-md);
                    font-size: 0.85rem;
                    color: #166534;
                }
            `}</style>
        </div>
    );
};

export default AddProduct;
