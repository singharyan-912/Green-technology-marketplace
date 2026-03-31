import React from 'react';

const LoadingSpinner = ({ message = "Loading sustainable goodness..." }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            width: '100%',
            padding: '40px'
        }}>
            <div className="spinner"></div>
            <p style={{
                marginTop: '20px',
                color: 'var(--text-muted)',
                fontWeight: '500',
                fontSize: '0.95rem'
            }}>
                {message}
            </p>
        </div>
    );
};

export default LoadingSpinner;
