import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Trophy, BarChart2, User, Gamepad2, Home, Menu, X, Flame, Zap, Map, Sword } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClerk } from '@clerk/clerk-react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const { signOut } = useClerk()

  async function logout() {
    await signOut()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const xp = user.xp || 0
  const level = user.level || 1
  const streak = user.streak_days || 0

  const links = [
    { to: '/dashboard', icon: <Home size={15} />, label: 'Home' },
    { to: '/games', icon: <Gamepad2 size={15} />, label: 'Play' },
    { to: '/skill-tree', icon: <Map size={15} />, label: 'Skills' },
    { to: '/progress', icon: <BarChart2 size={15} />, label: 'Progress' },
    { to: '/leaderboard', icon: <Trophy size={15} />, label: 'Rankings' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <motion.span className="brand-icon" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            ⚡
          </motion.span>
          LearnQuest
        </Link>
        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map(l => (
            <li key={l.to} style={{ listStyle: 'none' }}>
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
          <motion.span className="streak-badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Flame size={13} /> {streak}
          </motion.span>
        )}
        <motion.span className="xp-badge" whileHover={{ scale: 1.05 }}>
          <Zap size={12} /> {xp.toLocaleString()} XP
        </motion.span>
        <motion.span className="level-badge" whileHover={{ scale: 1.05 }}>
          Lv.{level}
        </motion.span>
        <Link to="/profile" style={{ color: 'var(--text-muted)', display: 'flex', transition: 'color 0.2s' }}>
          <User size={18} />
        </Link>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', transition: 'color 0.2s' }}>
          <LogOut size={18} />
        </button>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  )
}
