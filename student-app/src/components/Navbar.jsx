import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Trophy, BarChart2, User, Gamepad2, Home, Menu, X, Flame, Zap, Map } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const xp = user.xp || 0
  const level = user.level || 1
  const streak = user.streak_days || 0

  const links = [
    { to: '/dashboard', icon: <Home size={16} />, label: 'Home' },
    { to: '/games', icon: <Gamepad2 size={16} />, label: 'Play' },
    { to: '/skill-tree', icon: <Map size={16} />, label: 'Skills' },
    { to: '/progress', icon: <BarChart2 size={16} />, label: 'Progress' },
    { to: '/leaderboard', icon: <Trophy size={16} />, label: 'Rankings' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="flex items-center gap-md">
        <Link to="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <span className="brand-icon">⚡</span>
          LearnQuest
        </Link>
        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map(l => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={isActive(l.to) ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                {l.icon} {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-right">
        {streak > 0 && (
          <span className="streak-badge">
            <Flame size={14} /> {streak}
          </span>
        )}
        <span className="xp-badge">
          <Zap size={13} /> {xp.toLocaleString()} XP
        </span>
        <span className="level-badge">Lv.{level}</span>
        <Link to="/profile" style={{ color: 'var(--text-muted)', display: 'flex' }}>
          <User size={18} />
        </Link>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
          <LogOut size={18} />
        </button>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  )
}
