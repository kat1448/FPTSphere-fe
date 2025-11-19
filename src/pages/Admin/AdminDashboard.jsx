import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  return (
    <div style={{
      minHeight: '80vh',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <div style={{
          fontSize: '5rem',
          marginBottom: '1rem'
        }}>
          🚧
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#667eea',
          marginBottom: '1rem'
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Coming Soon
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 2rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1d4ed8';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2563eb';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;