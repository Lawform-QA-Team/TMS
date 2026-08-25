import { useState } from "react"
import { useAuth } from "@tms/contexts/AuthContext"
import "@tms/components/auth/Login.css"

export default function Page({ onSwitchToRegister }) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [twoFactorState, setTwoFactorState] = useState(null) // { tempToken }
  const [otpCode, setOtpCode] = useState('')

  const { login, guestLogin, verify2fa } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await login(formData.username, formData.password)

    if (result.success) {
      setError('')
    } else if (result.requires_2fa) {
      setTwoFactorState({ tempToken: result.temp_token })
    } else {
      setError(result.error)
    }

    setIsLoading(false)
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await verify2fa(twoFactorState.tempToken, otpCode)

    if (result.success) {
      setError('')
    } else {
      setError(result.error)
    }

    setIsLoading(false)
  }

  const handleGuestLogin = async () => {
    setIsLoading(true)
    setError('')

    const result = await guestLogin()
    
    if (result.success) {
      setError('')
    } else {
      setError(result.error)
    }
    
    setIsLoading(false)
  }

  // 2FA OTP 입력 화면
  if (twoFactorState) {
    return (
      <main className="login-page">
        <div className="login-wrapper">
          <header className="login-header">
            <div className="login-logo">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h1>2단계 인증</h1>
          </header>

          <div className="login-card">
            <form onSubmit={handleOtpSubmit} className="login-form">
              {error && <div className="regi-error">❌ {error}</div>}
              <p style={{ color: '#6c757d', fontSize: '0.9em', marginBottom: '8px' }}>
                인증 앱(Google Authenticator 등)의 6자리 코드를 입력하세요.
              </p>
              <div>
                <label htmlFor="otp" className="form-label">OTP 코드</label>
                <div className="input-wrapper">
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="6자리 코드 입력"
                    className="input-field input-field--loginid"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <div className="name-row">
                <button
                  type="button"
                  className="guest-btn"
                  onClick={() => { setTwoFactorState(null); setOtpCode(''); setError(''); }}
                  disabled={isLoading}
                >
                  취소
                </button>
                <button type="submit" disabled={isLoading || otpCode.length !== 6} className="submit-btn">
                  {isLoading ? <><span className="spinner" />{'확인 중...'}</> : '확인'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="login-page">
      <div className="login-wrapper">
        {/* Header */}
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
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <h1>로그인</h1>
        </header>

        {/* Card */}
        <div className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="regi-error">
                ❌ {error}
              </div>
            )}

            {/* ID */}
            <div>
              <label htmlFor="username" className="form-label">
                아이디
              </label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  required
                  autoComplete="username"
                  className="input-field input-field--loginid"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="input-field input-field--password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="name-row">
              {/* Guest */}
              <button 
                type="button" 
                className="guest-btn"
                onClick={handleGuestLogin}
                disabled={isLoading}
              >
                게스트 로그인
              </button>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="submit-btn">
                {isLoading ? (
                  <>
                    <span className="spinner" />
                    {"로그인 중..."}
                  </>
                ) : (
                  "로그인"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="login-footer">
          {"계정이 없으신가요? "}
          <button 
            type="button"
            className="regi-link"
            onClick={onSwitchToRegister}
            disabled={isLoading}
          >
            회원가입
          </button>
        </p>
      </div>
    </main>
  )
}
