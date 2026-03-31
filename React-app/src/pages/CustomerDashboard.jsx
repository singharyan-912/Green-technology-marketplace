import React, { useEffect, useState, useMemo } from 'react';
import { database, ref, get } from '../firebase/config';
import Navbar from '../component/Navbar';
import ProductCard from '../component/ProductCard';
import '../index.css';

const CustomerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [minEcoScore, setMinEcoScore] = useState(0);
    const [maxPrice, setMaxPrice] = useState(20000);
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const productsRef = ref(database, 'products');
                const productsSnap = await get(productsRef);

                if (productsSnap.exists()) {
                    const data = productsSnap.val();
                    const productList = Object.keys(data).map(key => {
                        const p = data[key];
                        return {
                            id: key,
                            ...p,
                            displayName: p.productName || p.name || 'Eco Product',
                            displayPrice: p.price || '0.00',
                            displayCategory: p.category || 'Environmental',
                            displayEcoRating: p.ecoRating || '8',
                        };
                    });
                    setProducts(productList);
                } else {
                    setProducts([]);
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load products. Please try refreshing.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, []);

    // Dynamic categories derived from real product data
    const categories = useMemo(() => {
        const cats = products.map(p => p.displayCategory);
        return ['All', ...new Set(cats)];
    }, [products]);

    // Filtered products (memoized for performance)
    const filteredProducts = useMemo(() => {
        let result = products.filter(p => {
            const matchesCategory = selectedCategory === 'All' || p.displayCategory === selectedCategory;
            const matchesSearch = !searchQuery ||
                p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.displayCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const eco = parseFloat(p.displayEcoRating) || 0;
            const matchesEco = eco >= minEcoScore;
            
            const price = parseFloat(p.displayPrice) || 0;
            const matchesPrice = price <= maxPrice;

            return matchesCategory && matchesSearch && matchesEco && matchesPrice;
        });

        // Sorting
        if (sortBy === 'price-asc') {
            result.sort((a, b) => (parseFloat(a.displayPrice) || 0) - (parseFloat(b.displayPrice) || 0));
        } else if (sortBy === 'price-desc') {
            result.sort((a, b) => (parseFloat(b.displayPrice) || 0) - (parseFloat(a.displayPrice) || 0));
        } else if (sortBy === 'eco-desc') {
            result.sort((a, b) => (parseFloat(b.displayEcoRating) || 0) - (parseFloat(a.displayEcoRating) || 0));
        } else {
            // newest based on createdAt or ID fallback
            result.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
        }
        
        return result;
    }, [products, selectedCategory, searchQuery, minEcoScore, maxPrice, sortBy]);

    return (
        <div className="dashboard-container">
            <Navbar />

            <main className="container dashboard-main">
                {/* Header */}
                <div className="dashboard-header fade-in">
                    <span className="welcome-tag">Sustainable Marketplace</span>
                    <h1>Find the best <span className="highlight">Green Technology</span></h1>
                    <p>Join the revolution of eco-friendly and renewable energy solutions.</p>
                </div>

                {/* Filter & Search Bar */}
                <div className="filter-shelf fade-in">
                    <div className="search-box-large">
                        <span className="search-icon-l">🔍</span>
                        <input
                            type="text"
                            placeholder="What eco-tech are you looking for?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clear-search" onClick={() => setSearchQuery('')} title="Clear search">×</button>
                        )}
                    </div>

                    <div className="category-scroller">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`cat-chip ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Meta */}
                {!loading && !error && (
                    <div className="results-meta">
                        <span>
                            {filteredProducts.length > 0
                                ? `Showing ${filteredProducts.length} eco-friendly product${filteredProducts.length !== 1 ? 's' : ''}`
                                : ''}
                        </span>
                        {searchQuery && (
                            <span className="search-tag">
                                Results for: <strong>"{searchQuery}"</strong>
                                <button onClick={() => setSearchQuery('')}>×</button>
                            </span>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div className="content-layout">
                    {/* Sidebar */}
                    <aside className="filter-sidebar hide-mobile">
                        {(minEcoScore > 0 || maxPrice < 20000 || sortBy !== 'newest') && (
                            <button onClick={() => {setMinEcoScore(0); setMaxPrice(20000); setSortBy('newest')}} className="clear-filters-sidebar">
                                Clear All Filters
                            </button>
                        )}
                        <div className="sidebar-group">
                            <h4>Eco Rating</h4>
                            <div className="rating-filters">
                                <label><input type="radio" name="eco" checked={minEcoScore === 9} onChange={() => setMinEcoScore(9)} /> 9.0+ Excellent</label>
                                <label><input type="radio" name="eco" checked={minEcoScore === 8} onChange={() => setMinEcoScore(8)} /> 8.0+ Great</label>
                                <label><input type="radio" name="eco" checked={minEcoScore === 7} onChange={() => setMinEcoScore(7)} /> 7.0+ Good</label>
                                <label><input type="radio" name="eco" checked={minEcoScore === 0} onChange={() => setMinEcoScore(0)} /> Any Rating</label>
                            </div>
                        </div>
                        <div className="sidebar-group">
                            <h4>Max Price: ${maxPrice.toLocaleString()}</h4>
                            <input type="range" className="price-slider" min="0" max="20000" step="100" value={maxPrice} onChange={(e) => setMaxPrice(parseInt(e.target.value))} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                                <span>$0</span>
                                <span>$20k+</span>
                            </div>
                        </div>
                        <div className="sidebar-group">
                            <h4>Sort By</h4>
                            <div className="sort-options">
                                <button className={`sort-chip ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>✨ Newest Arrivals</button>
                                <button className={`sort-chip ${sortBy === 'price-asc' ? 'active' : ''}`} onClick={() => setSortBy('price-asc')}>💵 Price: Low to High</button>
                                <button className={`sort-chip ${sortBy === 'price-desc' ? 'active' : ''}`} onClick={() => setSortBy('price-desc')}>💎 Price: High to Low</button>
                                <button className={`sort-chip ${sortBy === 'eco-desc' ? 'active' : ''}`} onClick={() => setSortBy('eco-desc')}>🌿 Highest Eco Rating</button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Grid */}
                    <div className="main-content-area">
                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Loading eco-products...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <div className="error-icon">⚠️</div>
                                <h3>Something went wrong</h3>
                                <p>{error}</p>
                                <button className="retry-btn" onClick={() => window.location.reload()}>
                                    Retry
                                </button>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="products-grid-modern">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">🌱</div>
                                <h3>No products found</h3>
                                <p>
                                    {searchQuery
                                        ? `No results for "${searchQuery}". Try a different search.`
                                        : `No products found match your current filters.`}
                                </p>
                                <button className="retry-btn" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setMinEcoScore(0); setMaxPrice(20000); setSortBy('newest'); }}>
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                .dashboard-container { min-height: 100vh; background: #f8fafc; padding-bottom: 80px; }
                .dashboard-main { padding-top: 120px; }

                /* Header */
                .dashboard-header {
                    text-align: center;
                    max-width: 700px;
                    margin: 0 auto 48px;
                }

                .welcome-tag {
                    color: #10b981;
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    display: block;
                    margin-bottom: 12px;
                }

                .dashboard-header h1 { font-size: 2.8rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; line-height: 1.1; }
                .dashboard-header .highlight { color: #10b981; }
                .dashboard-header p { font-size: 1.05rem; color: #64748b; }

                /* Filter Shelf */
                .filter-shelf {
                    background: white;
                    padding: 20px 24px;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .search-box-large {
                    display: flex;
                    align-items: center;
                    background: #f8fafc;
                    padding: 12px 20px;
                    border-radius: 12px;
                    border: 1.5px solid transparent;
                    transition: all 0.2s;
                }

                .search-box-large:focus-within { border-color: #10b981; background: white; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
                .search-box-large input { border: none; background: transparent; outline: none; flex: 1; font-size: 0.95rem; color: #1e293b; }
                .search-icon-l { margin-right: 12px; font-size: 1.1rem; }

                .clear-search {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: #94a3b8;
                    cursor: pointer;
                    line-height: 1;
                }
                .clear-search:hover { color: #ef4444; }

                .category-scroller { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
                .category-scroller::-webkit-scrollbar { height: 3px; }
                .category-scroller::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

                .cat-chip {
                    white-space: nowrap;
                    padding: 8px 18px;
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .cat-chip:hover { border-color: #10b981; color: #10b981; }
                .cat-chip.active { background: #10b981; color: white; border-color: #10b981; box-shadow: 0 4px 12px rgba(16,185,129,0.25); }

                /* Results meta */
                .results-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.9rem;
                    color: #64748b;
                    margin-bottom: 24px;
                    padding: 0 4px;
                }

                .search-tag {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #f0fdf4;
                    color: #059669;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                }

                .search-tag button { background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #059669; }

                /* Layout */
                .content-layout { display: grid; grid-template-columns: 220px 1fr; gap: 32px; }

                @media (max-width: 991px) {
                    .content-layout { grid-template-columns: 1fr; }
                    .hide-mobile { display: none; }
                    .dashboard-main { padding-top: 110px; }
                    .dashboard-header h1 { font-size: 2rem; }
                }

                /* Sidebar */
                .filter-sidebar {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
                    height: fit-content;
                    position: sticky;
                    top: 100px;
                }

                .sidebar-group { margin-bottom: 28px; }
                .sidebar-group:last-child { margin-bottom: 0; }
                .sidebar-group h4 { font-size: 0.85rem; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; }
                .rating-filters { display: grid; gap: 10px; }
                .rating-filters label { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #475569; cursor: pointer; }
                .price-slider { width: 100%; accent-color: #10b981; }
                .sort-options { display: flex; flex-direction: column; gap: 8px; }
                .sort-chip { padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8rem; color: #475569; cursor: pointer; text-align: left; font-weight: 500; transition: all 0.2s; }
                .sort-chip:hover, .sort-chip.active { border-color: #10b981; color: #10b981; }
                .sort-chip.active { background: #f0fdf4; font-weight: 600; box-shadow: 0 2px 4px rgba(16,185,129,0.1); }
                .clear-filters-sidebar { width: 100%; border: none; background: #fee2e2; color: #ef4444; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; margin-bottom: 24px; transition: 0.2s; }
                .clear-filters-sidebar:hover { background: #fecaca; }

                /* Product Grid */
                .products-grid-modern {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 28px;
                }

                @media (max-width: 1100px) { .products-grid-modern { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 640px)  { .products-grid-modern { grid-template-columns: 1fr; gap: 20px; } }

                /* Loading State */
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    color: #64748b;
                }

                .loading-spinner {
                    width: 44px;
                    height: 44px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #10b981;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                /* Empty / Error States */
                .empty-state, .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    text-align: center;
                }

                .empty-icon, .error-icon { font-size: 3.5rem; margin-bottom: 16px; }
                .empty-state h3, .error-state h3 { font-size: 1.3rem; color: #0f172a; margin-bottom: 8px; }
                .empty-state p, .error-state p { color: #64748b; font-size: 0.95rem; margin-bottom: 24px; }

                .retry-btn {
                    padding: 10px 28px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .retry-btn:hover { background: #059669; }
            `}</style>
        </div>
    );
};

export default CustomerDashboard;
