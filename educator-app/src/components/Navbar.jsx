import { Link, useNavigate } from 'react-router-dom'
import { LogOut, BookOpen, Users, LayoutDashboard, GraduationCap } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-purple-400 font-bold text-xl flex items-center gap-2">
          <GraduationCap size={22} /> LearnQuest Educator
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link to="/dashboard" className="text-gray-300 hover:text-white flex items-center gap-1"><LayoutDashboard size={14} /> Dashboard</Link>
          <Link to="/classes" className="text-gray-300 hover:text-white flex items-center gap-1"><Users size={14} /> Classes</Link>
          <Link to="/content" className="text-gray-300 hover:text-white flex items-center gap-1"><BookOpen size={14} /> Content</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm">{user.display_name}</span>
        <button onClick={logout} className="text-gray-400 hover:text-red-400"><LogOut size={18} /></button>
      </div>
    </nav>
  )
}
