import React from 'react';

const EmptyState = ({ title = "No products found 🌱", message = "Check back later for more sustainable choices." }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border)',
            gridColumn: '1 / -1',
            width: '100%',
            maxWidth: '600px',
            margin: '40px auto'
        }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🌍</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--text-main)' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px' }}>{message}</p>
        </div>
    );
};

export default EmptyState;
