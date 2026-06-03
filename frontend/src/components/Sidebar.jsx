import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getUser, removeAuth, isAdmin } from '../utils/auth'

const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  violations: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  shifts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  cameras: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

// Design system colors
const C = {
  primary: '#003399',
  primaryLight: '#e8eef8',
  secondary: '#FF8800',
  bg: '#ffffff',
  border: '#e4e8f0',
  textMain: '#1a2340',
  textSub: '#7a85a0',
  textMuted: '#b0bac8',
}

export default function Sidebar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const user      = getUser()

  const handleLogout = () => { removeAuth(); navigate('/login') }

  const menus = [
    { path: '/dashboard', label: 'Dashboard',  icon: icons.dashboard  },
    { path: '/violations', label: 'Pelanggaran', icon: icons.violations },
    ...(isAdmin() ? [
      { path: '/shifts',  label: 'Shift',  icon: icons.shifts  },
      { path: '/cameras', label: 'Kamera', icon: icons.cameras },
    ] : []),
  ]

  const initials = user?.nama
    ? user.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  return (
    <div style={{
      width: '240px', minHeight: '100vh',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${C.border}`,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .sb-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13.5px; font-weight: 400;
          color: ${C.textSub}; text-decoration: none;
          transition: all 0.15s ease; letter-spacing: 0.01em;
        }
        .sb-link:hover { background: ${C.primaryLight}; color: ${C.primary}; }
        .sb-link.active { background: ${C.primaryLight}; color: ${C.primary}; font-weight: 600; }
        .sb-link.active .sb-icon { color: ${C.primary}; }
        .sb-icon { flex-shrink: 0; color: ${C.textMuted}; transition: color 0.15s; }
        .sb-link:hover .sb-icon { color: ${C.primary}; }
        .active-pip { width: 3px; height: 16px; background: ${C.primary}; border-radius: 0 2px 2px 0; position: absolute; left: 0; }
        .logout-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13.5px; font-weight: 400;
          color: ${C.textMuted}; background: none; border: none;
          cursor: pointer; width: 100%; text-align: left;
          transition: all 0.15s; font-family: inherit;
        }
        .logout-btn:hover { background: #fff0f0; color: #e53e3e; }
        .logout-btn:hover .lo-icon { color: #e53e3e; }
        .lo-icon { color: ${C.textMuted}; transition: color 0.15s; flex-shrink: 0; }
        .sec-lbl {
          font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: ${C.textMuted};
          padding: 0 12px; margin-bottom: 6px;
        }
      `}</style>

      {/* Brand */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img
            src="/images/logo-secvis.png"
            alt="SecVis"
            style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }}
          />
          <span style={{ display:'none', fontSize:'15px', fontWeight:'700', color:C.primary, fontFamily:"'DM Mono',monospace" }}>SecVis</span>
          <img
            src="/images/logo-epson.png"
            alt="Epson"
            style={{ height: '30px', width: 'auto', objectFit: 'contain', opacity: 0.7 }}
            onError={e => { e.target.style.display='none' }}
          />
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: C.primaryLight, border: `1.5px solid ${C.primary}20`,
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: C.primary,
            fontFamily: "'DM Mono', monospace", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: C.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nama}
            </div>
            <div style={{ fontSize: '11px', color: C.textSub, marginTop: '1px', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div className="sec-lbl">Menu</div>
        {menus.map((menu) => {
          const active = location.pathname === menu.path
          return (
            <div key={menu.path} style={{ position: 'relative' }}>
              {active && <div className="active-pip" />}
              <Link to={menu.path} className={`sb-link ${active ? 'active' : ''}`}>
                <span className="sb-icon">{menu.icon}</span>
                {menu.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: `1px solid ${C.border}`, background: '#fff', boxShadow: '0 -2px 8px rgba(0,0,0,0.06)', position: 'sticky', bottom: 0 }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '9px 12px',
          background: '#fff0f0', border: '1px solid #fecaca',
          borderRadius: '8px', cursor: 'pointer',
          fontSize: '13px', fontWeight: '600',
          color: '#dc2626', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.borderColor='#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background='#fff0f0'; e.currentTarget.style.borderColor='#fecaca' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}