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

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getUser()

  const handleLogout = async () => {
    removeAuth()
    navigate('/login')
  }

  const menus = [
    { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { path: '/violations', label: 'Pelanggaran', icon: icons.violations },
    ...(isAdmin() ? [
      { path: '/shifts', label: 'Shift', icon: icons.shifts },
      { path: '/cameras', label: 'Kamera', icon: icons.cameras },
    ] : []),
  ]

  const initials = user?.nama
    ? user.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  return (
    <div style={{
      width: '240px',
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #1e2130',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 400;
          color: #5a6070;
          text-decoration: none;
          transition: all 0.15s ease;
          letter-spacing: 0.01em;
        }
        .sidebar-link:hover {
          background: #191c27;
          color: #c8ccd8;
        }
        .sidebar-link.active {
          background: #1a2035;
          color: #7aa2f7;
          font-weight: 500;
        }
        .sidebar-link.active .link-icon {
          color: #7aa2f7;
        }
        .link-icon {
          flex-shrink: 0;
          color: #3e4455;
          transition: color 0.15s ease;
        }
        .sidebar-link:hover .link-icon {
          color: #5a6070;
        }

        .active-pip {
          width: 3px;
          height: 16px;
          background: #7aa2f7;
          border-radius: 0 2px 2px 0;
          position: absolute;
          left: 0;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 400;
          color: #3e4455;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.15s ease;
          letter-spacing: 0.01em;
          font-family: inherit;
        }
        .logout-btn:hover {
          background: #1e1520;
          color: #f7768e;
        }
        .logout-btn:hover .logout-icon { color: #f7768e; }
        .logout-icon { color: #3e4455; transition: color 0.15s ease; flex-shrink: 0; }

        .section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2a2f3f;
          padding: 0 12px;
          margin-bottom: 6px;
        }
      `}</style>

      {/* Brand */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #1e2130' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #3d59a1 0%, #7aa2f7 100%)',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#c8ccd8', letterSpacing: '-0.01em', fontFamily: "'DM Mono', monospace" }}>
              SecVis
            </div>
            <div style={{ fontSize: '10.5px', color: '#2e3347', marginTop: '1px', fontWeight: '400' }}>
              PT Epson Indonesia
            </div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2130' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#1a2035',
            border: '1px solid #2a3558',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: '600', color: '#7aa2f7',
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#a0a8bc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nama}
            </div>
            <div style={{ fontSize: '10.5px', color: '#3e4455', marginTop: '1px', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div className="section-label">Menu</div>
        {menus.map((menu) => {
          const active = location.pathname === menu.path
          return (
            <div key={menu.path} style={{ position: 'relative' }}>
              {active && <div className="active-pip" />}
              <Link
                to={menu.path}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <span className="link-icon">{menu.icon}</span>
                {menu.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid #1e2130' }}>
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">{icons.logout}</span>
          Logout
        </button>
      </div>
    </div>
  )
}