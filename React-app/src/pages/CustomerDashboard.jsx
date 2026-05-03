import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { database, ref, get } from '../firebase/config';
import Navbar from '../component/Navbar';
import ProductCard from '../component/ProductCard';
import '../index.css';

// ── Trending suggestions shown when the search bar is focused but empty ───────
const TRENDING_TERMS = [
    { label: '☀️ Solar Charger',  query: 'Solar Charger' },
    { label: '🎋 Bamboo Products', query: 'Bamboo' },
    { label: '⚡ EV Accessories',  query: 'EV' },
    { label: '💧 Water Purifier',  query: 'Purifier' },
    { label: '🌬️ Wind Energy',     query: 'Wind' },
    { label: '♻️ Recycled Tech',   query: 'Recycled' },
];

// ── Skeleton card shown during the debounce / data-load window ────────────────
const SkeletonCard = () => (
    <div className="skeleton-card">
        <div className="skel-img skel-pulse" />
        <div className="skel-body">
            <div className="skel-line skel-pulse" style={{ width: '60%', height: 10 }} />
            <div className="skel-line skel-pulse" style={{ width: '90%', height: 16, marginTop: 8 }} />
            <div className="skel-line skel-pulse" style={{ width: '75%', height: 10, marginTop: 8 }} />
            <div className="skel-line skel-pulse" style={{ width: '60%', height: 10, marginTop: 6 }} />
            <div className="skel-footer">
                <div className="skel-line skel-pulse" style={{ width: '30%', height: 22 }} />
                <div className="skel-line skel-pulse" style={{ width: '28%', height: 32, borderRadius: 8 }} />
            </div>
        </div>
    </div>
);

const CustomerDashboard = () => {
    const [products, setProducts]               = useState([]);
    const [loading, setLoading]                 = useState(true);
    const [error, setError]                     = useState(null);

    // searchInput  → what the user has typed right now (instant)
    // searchQuery  → committed query used for filtering (after debounce)
    const [searchInput, setSearchInput]         = useState('');
    const [searchQuery, setSearchQuery]         = useState('');
    const [isSearching, setIsSearching]         = useState(false); // skeleton window
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [minEcoScore, setMinEcoScore]           = useState(0);
    const [maxPrice, setMaxPrice]                 = useState(20000);
    const [sortBy, setSortBy]                     = useState('newest');

    const location = useLocation();
    const debounceRef  = useRef(null);
    const searchBoxRef = useRef(null);

    // ── Pre-fill search from URL query parameter ─────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlQuery = params.get('q');
        if (urlQuery) {
            setSearchInput(urlQuery);
            setSearchQuery(urlQuery);
            setShowSuggestions(false);
        }
    }, [location.search]);

    // ── Fetch products once on mount ─────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const productsRef  = ref(database, 'products');
                const productsSnap = await get(productsRef);

                if (productsSnap.exists()) {
                    const data = productsSnap.val();
                    const productList = Object.keys(data).map(key => {
                        const p = data[key];
                        return {
                            id: key,
                            ...p,
                            displayName:      p.productName || p.name || 'Eco Product',
                            displayPrice:     p.price       || '0.00',
                            displayCategory:  p.category    || 'Environmental',
                            displayEcoRating: p.ecoRating   || '8',
                        };
                    });
                    setProducts(productList);
                } else {
                    setProducts([]);
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load products. Please try refreshing.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, []);

    // ── Debounced search input handler ───────────────────────────────────────
    const handleSearchChange = useCallback((e) => {
        const val = e.target.value;
        setSearchInput(val);
        setShowSuggestions(false);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (val.trim()) {
            setIsSearching(true);
            debounceRef.current = setTimeout(() => {
                setSearchQuery(val.trim());
                setIsSearching(false);
            }, 350);
        } else {
            setIsSearching(false);
            setSearchQuery('');
        }
    }, []);

    // Apply a trending suggestion immediately
    const applyTrending = useCallback((term) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSearchInput(term);
        setSearchQuery(term);
        setIsSearching(false);
        setShowSuggestions(false);
    }, []);

    // Full clear
    const clearSearch = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSearchInput('');
        setSearchQuery('');
        setIsSearching(false);
        setShowSuggestions(false);
    }, []);

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Dynamic categories ───────────────────────────────────────────────────
    const categories = useMemo(() => {
        const cats = products.map(p => p.displayCategory);
        return ['All', ...new Set(cats)];
    }, [products]);

    // ── Filtered + sorted products (Fuzzy Token Search) ──────────────────────
    const filteredProducts = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        const tokens = q.split(/\s+/).filter(t => t.length > 0);

        let result = products.filter(p => {
            const matchesCategory = selectedCategory === 'All' || p.displayCategory === selectedCategory;
            
            // If no search query, match all that fit other filters
            if (!q) return matchesCategory && (parseFloat(p.displayEcoRating) || 0) >= minEcoScore && (parseFloat(p.displayPrice) || 0) <= maxPrice;

            // Tokenized match: every token in search query must appear somewhere in name, category, or description
            const searchSource = `${p.displayName} ${p.displayCategory} ${p.description || ''}`.toLowerCase();
            const matchesSearch = tokens.every(token => searchSource.includes(token));

            const eco   = parseFloat(p.displayEcoRating) || 0;
            const price = parseFloat(p.displayPrice)     || 0;

            return matchesCategory && matchesSearch && eco >= minEcoScore && price <= maxPrice;
        });

        if (sortBy === 'price-asc')  result.sort((a, b) => (parseFloat(a.displayPrice) || 0) - (parseFloat(b.displayPrice) || 0));
        else if (sortBy === 'price-desc') result.sort((a, b) => (parseFloat(b.displayPrice) || 0) - (parseFloat(a.displayPrice) || 0));
        else if (sortBy === 'eco-desc')   result.sort((a, b) => (parseFloat(b.displayEcoRating) || 0) - (parseFloat(a.displayEcoRating) || 0));
        else result.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

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
                    <div className="search-box-large" ref={searchBoxRef}>
                        <span className="search-icon-l">{isSearching ? '⏳' : '🔍'}</span>
                        <input
                            id="marketplace-search"
                            type="text"
                            placeholder="What eco-tech are you looking for?"
                            value={searchInput}
                            onChange={handleSearchChange}
                            onFocus={() => { if (!searchInput) setShowSuggestions(true); }}
                            autoComplete="off"
                        />
                        {searchInput && (
                            <button className="clear-search" onClick={clearSearch} title="Clear search">×</button>
                        )}

                        {/* ── Trending suggestions dropdown ──────────────────── */}
                        {showSuggestions && (
                            <div className="suggestions-dropdown fade-in">
                                <p className="sugg-label">🔥 Trending Eco-Tech</p>
                                {TRENDING_TERMS.map((t) => (
                                    <button
                                        key={t.query}
                                        className="sugg-item"
                                        onMouseDown={(e) => { e.preventDefault(); applyTrending(t.query); }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
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
                {!loading && !error && !isSearching && (
                    <div className="results-meta">
                        <span>
                            {filteredProducts.length > 0
                                ? `Showing ${filteredProducts.length} eco-friendly product${filteredProducts.length !== 1 ? 's' : ''}`
                                : ''}
                        </span>
                        {searchQuery && (
                            <span className="search-tag">
                                Results for: <strong>"{searchQuery}"</strong>
                                <button onClick={clearSearch}>×</button>
                            </span>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div className="content-layout">
                    {/* Sidebar */}
                    <aside className="filter-sidebar hide-mobile">
                        {(minEcoScore > 0 || maxPrice < 20000 || sortBy !== 'newest') && (
                            <button onClick={() => { setMinEcoScore(0); setMaxPrice(20000); setSortBy('newest'); }} className="clear-filters-sidebar">
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
                                <button className={`sort-chip ${sortBy === 'newest'     ? 'active' : ''}`} onClick={() => setSortBy('newest')}>✨ Newest Arrivals</button>
                                <button className={`sort-chip ${sortBy === 'price-asc'  ? 'active' : ''}`} onClick={() => setSortBy('price-asc')}>💵 Price: Low to High</button>
                                <button className={`sort-chip ${sortBy === 'price-desc' ? 'active' : ''}`} onClick={() => setSortBy('price-desc')}>💎 Price: High to Low</button>
                                <button className={`sort-chip ${sortBy === 'eco-desc'   ? 'active' : ''}`} onClick={() => setSortBy('eco-desc')}>🌿 Highest Eco Rating</button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Grid */}
                    <div className="main-content-area">
                        {loading ? (
                            /* Initial page load skeletons */
                            <div className="products-grid-modern">
                                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <div className="error-icon">⚠️</div>
                                <h3>Something went wrong</h3>
                                <p>{error}</p>
                                <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
                            </div>
                        ) : isSearching ? (
                            /* Search Ghost: skeleton during the 350ms debounce window */
                            <div className="products-grid-modern">
                                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="products-grid-modern">
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        searchQuery={searchQuery}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* ── Unique "No Eco-Tech Found" empty state ─────── */
                            <div className="eco-empty-state">
                                <div className="eco-empty-art">
                                    <div className="eco-empty-orb" />
                                    <div className="eco-empty-icon">🌿</div>
                                    <div className="eco-empty-ring" />
                                </div>
                                <h3 className="eco-empty-title">No Eco-Tech Found</h3>
                                <p className="eco-empty-sub">
                                    {searchQuery
                                        ? <>The green jungle has no results for <strong>"{searchQuery}"</strong>. Try a broader search or explore trending terms below.</>
                                        : 'No products match your current filters. Try adjusting your criteria.'}
                                </p>
                                {searchQuery && (
                                    <div className="eco-empty-suggest">
                                        {TRENDING_TERMS.slice(0, 4).map(t => (
                                            <button key={t.query} className="eco-sugg-pill" onClick={() => applyTrending(t.query)}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <button
                                    className="retry-btn"
                                    onClick={() => { clearSearch(); setSelectedCategory('All'); setMinEcoScore(0); setMaxPrice(20000); setSortBy('newest'); }}
                                >
                                    Reset All Filters
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
                    position: relative;
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

                /* ── Trending suggestions dropdown ── */
                .suggestions-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1.5px solid #d1fae5;
                    border-radius: 14px;
                    box-shadow: 0 8px 24px rgba(16,185,129,0.12);
                    padding: 12px;
                    z-index: 200;
                }

                .sugg-label {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #10b981;
                    padding: 0 8px 8px;
                    display: block;
                }

                .sugg-item {
                    display: block;
                    width: 100%;
                    text-align: left;
                    padding: 9px 14px;
                    border-radius: 8px;
                    font-size: 0.88rem;
                    color: #1e293b;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                    background: none;
                    border: none;
                    font-family: inherit;
                }
                .sugg-item:hover {
                    background: #f0fdf4;
                    color: #059669;
                    transform: translateX(4px);
                }

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
                    font-family: inherit;
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
                .sort-chip { padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8rem; color: #475569; cursor: pointer; text-align: left; font-weight: 500; transition: all 0.2s; font-family: inherit; }
                .sort-chip:hover, .sort-chip.active { border-color: #10b981; color: #10b981; }
                .sort-chip.active { background: #f0fdf4; font-weight: 600; box-shadow: 0 2px 4px rgba(16,185,129,0.1); }
                .clear-filters-sidebar { width: 100%; border: none; background: #fee2e2; color: #ef4444; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; margin-bottom: 24px; transition: 0.2s; font-family: inherit; }
                .clear-filters-sidebar:hover { background: #fecaca; }

                /* Product Grid */
                .products-grid-modern {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 28px;
                }

                @media (max-width: 1100px) { .products-grid-modern { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 640px)  { .products-grid-modern { grid-template-columns: 1fr; gap: 20px; } }

                /* Error State */
                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    text-align: center;
                }
                .error-icon { font-size: 3.5rem; margin-bottom: 16px; }
                .error-state h3 { font-size: 1.3rem; color: #0f172a; margin-bottom: 8px; }
                .error-state p  { color: #64748b; font-size: 0.95rem; margin-bottom: 24px; }

                .retry-btn {
                    padding: 10px 28px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .retry-btn:hover { background: #059669; transform: translateY(-1px); }

                /* ── Skeleton cards ───────────────────────────────────────── */
                .skeleton-card {
                    background: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid #f1f5f9;
                }

                .skel-img { height: 240px; width: 100%; display: block; }
                .skel-body { padding: 20px; }
                .skel-line { border-radius: 6px; display: block; }

                .skel-footer {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 14px;
                    border-top: 1px solid #f1f5f9;
                }

                @keyframes pulse-green {
                    0%, 100% { background-color: #f0fdf4; }
                    50%       { background-color: #dcfce7; }
                }
                .skel-pulse { animation: pulse-green 1.4s ease-in-out infinite; }

                /* ── Unique "No Eco-Tech Found" empty state ───────────────── */
                .eco-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 60px 20px 80px;
                    text-align: center;
                }

                .eco-empty-art {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin-bottom: 28px;
                }

                .eco-empty-orb {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    position: absolute;
                    top: 0; left: 0;
                    animation: eco-breathe 3s ease-in-out infinite;
                }

                .eco-empty-ring {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    border: 3px dashed #6ee7b7;
                    position: absolute;
                    top: 0; left: 0;
                    animation: eco-spin-slow 8s linear infinite;
                }

                .eco-empty-icon {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 3rem;
                    z-index: 2;
                    animation: eco-float 3s ease-in-out infinite;
                }

                @keyframes eco-breathe {
                    0%, 100% { transform: scale(1); }
                    50%       { transform: scale(1.06); }
                }
                @keyframes eco-spin-slow {
                    to { transform: rotate(360deg); }
                }
                @keyframes eco-float {
                    0%, 100% { transform: translate(-50%, -50%) translateY(0); }
                    50%       { transform: translate(-50%, -50%) translateY(-6px); }
                }

                .eco-empty-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 10px;
                }

                .eco-empty-sub {
                    color: #64748b;
                    font-size: 0.95rem;
                    max-width: 400px;
                    line-height: 1.7;
                    margin-bottom: 24px;
                }

                .eco-empty-suggest {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 28px;
                }

                .eco-sugg-pill {
                    padding: 7px 16px;
                    background: #f0fdf4;
                    border: 1.5px solid #a7f3d0;
                    border-radius: 50px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: #059669;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .eco-sugg-pill:hover {
                    background: #10b981;
                    color: white;
                    border-color: #10b981;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16,185,129,0.25);
                }

                /* ── Search text highlight (applied in ProductCard) ── */
                .search-highlight {
                    background: linear-gradient(120deg, #bbf7d0 0%, #6ee7b7 100%);
                    color: #065f46;
                    border-radius: 3px;
                    padding: 0 2px;
                    font-style: normal;
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
};

export default CustomerDashboard;
