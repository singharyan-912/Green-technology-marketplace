import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#f8fafc',
            gap: '16px',
        }}>
            <div style={{
                width: '44px', height: '44px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>
                Verifying session…
            </span>
        </div>
    );

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        // Redirection logic based on role if trying to access unauthorized area
        switch (userRole) {
            case 'customer': return <Navigate to="/customer" replace />;
            case 'vendor': return <Navigate to="/vendor/dashboard" replace />;
            case 'admin': return <Navigate to="/admin/dashboard" replace />;
            default: return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
