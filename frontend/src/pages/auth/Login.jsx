import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { setAuth } from '../../utils/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      setAuth(res.data.data.token, res.data.data.user)
      navigate('/dashboard')
    } catch {
      setError('Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .login-input {
          width: 100%;
          background: #13151f;
          border: 1px solid #1e2130;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13.5px;
          color: #c8ccd8;
          outline: none;
          transition: border-color 0.15s ease;
          font-family: inherit;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: #2e3347; }
        .login-input:focus { border-color: #3d59a1; }
        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #3d59a1 0%, #7aa2f7 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 11px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.15s ease;
          letter-spacing: 0.01em;
        }
        .login-btn:hover { opacity: 0.9; }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '380px',
        padding: '0 20px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'linear-gradient(135deg, #3d59a1 0%, #7aa2f7 100%)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#c8ccd8', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.01em' }}>
            SecVis
          </div>
          <div style={{ fontSize: '12px', color: '#3e4455', marginTop: '4px' }}>
            Sistem Monitoring K3 · PT Epson Indonesia
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#13151f',
          border: '1px solid #1e2130',
          borderRadius: '14px',
          padding: '28px',
        }}>
          {error && (
            <div style={{
              background: '#1e1520',
              border: '1px solid #3d2030',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12.5px',
              color: '#f7768e',
              marginBottom: '18px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#5a6070', marginBottom: '7px', letterSpacing: '0.02em' }}>
                EMAIL
              </label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@epson.co.id"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#5a6070', marginBottom: '7px', letterSpacing: '0.02em' }}>
                PASSWORD
              </label>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: '4px' }}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}