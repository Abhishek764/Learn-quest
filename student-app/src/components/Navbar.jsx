import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Trophy, BarChart2, User, Gamepad2, Home } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const xp = user.xp || 0
  const level = user.level || 1
  const xpInLevel = xp % 100
  const xpNeeded = 100

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-green-400 font-bold text-xl flex items-center gap-2">
          <Gamepad2 size={22} /> LearnQuest
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link to="/dashboard" className="text-gray-300 hover:text-white flex items-center gap-1"><Home size={14} /> Home</Link>
          <Link to="/games" className="text-gray-300 hover:text-white flex items-center gap-1"><Gamepad2 size={14} /> Games</Link>
          <Link to="/progress" className="text-gray-300 hover:text-white flex items-center gap-1"><BarChart2 size={14} /> Progress</Link>
          <Link to="/leaderboard" className="text-gray-300 hover:text-white flex items-center gap-1"><Trophy size={14} /> Leaderboard</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-gray-400">Level {level}</span>
          <div className="w-32 bg-gray-700 rounded-full h-2 mt-1">
            <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${(xpInLevel / xpNeeded) * 100}%` }} />
          </div>
          <span className="text-xs text-green-400">{xp} XP</span>
        </div>
        <Link to="/profile" className="text-gray-300 hover:text-white"><User size={18} /></Link>
        <button onClick={logout} className="text-gray-400 hover:text-red-400"><LogOut size={18} /></button>
      </div>
    </nav>
  )
}
