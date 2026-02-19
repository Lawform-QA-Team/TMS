import React, { useState } from 'react';
import { useAuth } from '@tms/contexts/AuthContext';
import '@tms/components/auth/Login.css';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName
    };

    const result = await register(userData);
    
    if (result.success) {
      setSuccess(result.message);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
      });
      
      // 3초 후 로그인 화면으로 전환
      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <main className="login-page">
      <div className="login-wrapper">
        <header className="login-header">
          <div className="login-logo">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
          <h1>회원가입</h1>
        </header>

        <div className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="regi-error">❌ {error}</div>
            )}

            {success && (
              <div className="regi-success">✅ {success}</div>
            )}

            <div className="name-row">
              <div>
                <label htmlFor="lastName" className="form-label">성</label>
                <div className="input-wrapper">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="성을 입력하세요"
                    className="input-field"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="firstName" className="form-label">이름</label>
                <div className="input-wrapper">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="이름을 입력하세요"
                    className="input-field"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="form-label">아이디</label>
              <div className="input-wrapper">
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  required
                  autoComplete="username"
                  className="input-field"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="form-label">이메일</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  required
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">비밀번호</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요 (8자 이상)"
                  required
                  className="input-field input-field--password2"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">비밀번호 확인</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  className="input-field input-field--password2"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="toggle-password"
                  aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span className="spinner" />
                  {'가입 중...'}
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>
        </div>

        <p className="login-footer">
          {'이미 계정이 있으신가요? '}
          <button
            type="button"
            className="regi-link"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            로그인
          </button>
        </p>
      </div>
    </main>
  );
};

export default Register;
