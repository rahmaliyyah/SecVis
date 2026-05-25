import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { setAuth } from '../../utils/auth'

const C = {
  primary: '#003399',
  primaryLight: '#e8eef8',
  secondary: '#FF8800',
  border: '#e4e8f0',
  textMain: '#1a2340',
  textSub: '#7a85a0',
  bg: '#f4f6fb',
}

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
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
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .login-input {
          width: 100%; background: #fff; border: 1.5px solid ${C.border};
          border-radius: 8px; padding: 10px 14px; font-size: 13.5px;
          color: ${C.textMain}; outline: none; transition: border-color 0.15s; font-family: inherit;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: #c0c8d8; }
        .login-input:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px ${C.primaryLight}; }
        .login-btn {
          width: 100%; background: ${C.primary}; color: white; border: none;
          border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
          letter-spacing: 0.01em;
        }
        .login-btn:hover { background: #002277; }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '380px', padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Logo SecVis */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <img
              src="/images/logo-secvis.png"
              alt="SecVis"
              style={{ height: '60px', width: 'auto', objectFit: 'contain', display: 'block' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }}
            />
            <div style={{ display: 'none', fontSize: '24px', fontWeight: '700', color: C.primary, fontFamily: "'DM Mono', monospace" }}>SecVis</div>
        
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
            <span style={{ fontSize: '10px', color: C.textMuted, whiteSpace: 'nowrap' }}>powered by</span>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
          </div>

          {/* Logo Epson */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <img
              src="/images/logo-epson.png"
              alt="PT Indonesia Epson Industry"
              style={{ height: '45px', width: 'auto', objectFit: 'contain', display: 'block' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }}
            />
            <div style={{ display: 'none', fontSize: '13px', fontWeight: '700', color: C.primary }}>EPSON</div>
          
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', boxShadow: '0 4px 24px rgba(0,51,153,0.06)' }}>
          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', marginBottom: '18px' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: C.textSub, marginBottom: '7px', letterSpacing: '0.02em' }}>
                EMAIL
              </label>
              <input type="email" className="login-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@epson.co.id" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: C.textSub, marginBottom: '7px', letterSpacing: '0.02em' }}>
                PASSWORD
              </label>
              <input type="password" className="login-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
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