import { Link, NavLink, useNavigate } from 'react-router-dom'
import { GraduationCap, LayoutDashboard, Users, BookOpen, LogOut, Sparkles } from 'lucide-react'

export default function Sidebar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const initial = (user.display_name || 'E').trim().charAt(0).toUpperCase()

  const links = [
    { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Overview' },
    { to: '/classes',   icon: <Users size={16} />,           label: 'Classrooms' },
    { to: '/content',   icon: <BookOpen size={16} />,        label: 'Question Bank' },
  ]

  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="sidebar-brand" aria-label="LearnQuest Educator home">
        <span className="sidebar-brand-tile"><GraduationCap size={18} /></span>
        <div>
          <div className="sidebar-brand-text">LearnQuest</div>
          <div className="sidebar-brand-sub">Educator</div>
        </div>
      </Link>

      <div className="sidebar-section-label">Workspace</div>
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          {l.icon} {l.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.display_name || 'Teacher'}</div>
            <div className="sidebar-user-role">{user.role || 'educator'}</div>
          </div>
        </div>
        <button onClick={logout} className="sidebar-link" style={{ cursor: 'pointer', width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  )
}
