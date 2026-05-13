import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import API from '../api'
import { Trophy } from 'lucide-react'

export default function Leaderboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    API.get('/users/leaderboard').then(r => setLeaders(r.data || [])).catch(() => {})
  }, [])

  const rankColors = ['text-yellow-400', 'text-gray-400', 'text-orange-400']

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={24} className="text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Global Leaderboard</h2>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {leaders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No players yet. Be the first!</div>
          ) : leaders.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 px-6 py-4 border-b border-gray-700/50 hover:bg-gray-700/30 ${p.id === user.id ? 'bg-green-900/20 border-l-2 border-l-green-400' : ''}`}
            >
              <div className={`w-8 text-center font-bold ${rankColors[i] || 'text-gray-500'}`}>
                {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full object-cover" /> : (p.display_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{p.display_name || 'Unknown'} {p.id === user.id && <span className="text-xs text-green-400">(you)</span>}</div>
                <div className="text-gray-400 text-xs">Level {p.level}</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">{p.xp} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
