import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getUser, removeAuth, isAdmin } from '../utils/auth'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getUser()

  const handleLogout = async () => {
    removeAuth()
    navigate('/login')
  }

  const menus = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/violations', label: 'Pelanggaran', icon: '⚠️' },
    ...(isAdmin() ? [
      { path: '/shifts', label: 'Shift', icon: '🕐' },
      { path: '/cameras', label: 'Kamera', icon: '📷' },
    ] : []),
  ]

  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">SecVis</h1>
        <p className="text-gray-400 text-xs mt-1">PT Epson Indonesia</p>
      </div>
      <div className="p-4 border-b border-gray-700">
        <p className="text-sm font-medium">{user?.nama}</p>
        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menus.map((menu) => (
          <Link
            key={menu.path}
            to={menu.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              location.pathname === menu.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{menu.icon}</span>
            {menu.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  )
}