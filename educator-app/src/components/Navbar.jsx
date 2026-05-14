import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, BookOpen, Users, LayoutDashboard, GraduationCap, Menu, X } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [open, setOpen] = useState(false)

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const initial = (user.display_name || 'E').trim().charAt(0).toUpperCase()

  const links = [
    { to: '/dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
    { to: '/classes', icon: <Users size={15} />, label: 'Classes' },
    { to: '/content', icon: <BookOpen size={15} />, label: 'Content' },
  ]

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/dashboard" className="navbar-brand" aria-label="LearnQuest Educator home">
          <span className="brand-icon"><GraduationCap size={18} /></span>
          <span>LearnQuest</span>
          <span className="navbar-brand-suffix">Educator</span>
        </Link>
        <ul className="navbar-links hide-mobile" style={{ marginLeft: '0.5rem' }}>
          {links.map(l => (
            <li key={l.to}>
              <NavLink to={l.to} className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                {l.icon} {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-right">
        {user.display_name && (
          <div className="user-pill hide-mobile">
            <div className="user-avatar">{initial}</div>
            <span className="user-name">{user.display_name}</span>
          </div>
        )}
        <button onClick={logout} className="icon-btn" aria-label="Sign out" title="Sign out">
          <LogOut size={16} />
        </button>
        <button
          className="icon-btn"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
          style={{ display: 'none' }}
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: 'absolute', top: 64, left: 0, right: 0,
          background: 'rgba(7,9,12,0.95)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              {l.icon} {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
