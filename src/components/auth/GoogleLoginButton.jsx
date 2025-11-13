// src/components/auth/GoogleLoginButton.jsx

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const GoogleLoginButton = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    
    try {
      const idToken = credentialResponse.credential;
      console.log('🔑 Google token received');
      
      const result = await login(idToken);
      
      if (result.success) {
        console.log('✅ Login successful');
        navigate('/');
      } else {
        console.error('❌ Login failed:', result.message);
        alert(`Đăng nhập thất bại: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    console.error('❌ Google login failed');
    alert('Google login failed. Please try again.');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap={false}
      theme="outline"
      size="large"
    />
  );
};

export default GoogleLoginButton;