import React from 'react';
import { useAuth } from '@tms/contexts/AuthContext';
import Auth from '@tms/components/auth/Auth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        🔄 로딩 중...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  // 게스트 사용자도 일반 사용자와 동일하게 처리

  return children;
};

export default ProtectedRoute;
