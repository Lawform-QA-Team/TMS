import React, { useState } from 'react';
import Login from '@tms/components/auth/Login';
import Register from '@tms/components/auth/Register';
import '@tms/components/auth/Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = () => {
    setIsLogin(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <div>
      {isLogin ? (
        <Login onSwitchToRegister={switchToRegister} />
      ) : (
        <Register onSwitchToLogin={switchToLogin} />
      )}
    </div>
  );
};

export default Auth;
