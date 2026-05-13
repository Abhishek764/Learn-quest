import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, Activity, Target } from 'lucide-react'
import Navbar from '../components/Navbar'
import API from '../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      API.get('/users/leaderboard').then(r => setLeaderboard(r.data || [])).catch(() => {}),
      API.get(`/classes`).then(r => setClasses(r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  // Engagement distribution bins from leaderboard xp as proxy
  const bins = [
    { range: '0–20%', count: 0 }, { range: '20–40%', count: 0 },
    { range: '40–60%', count: 0 }, { range: '60–80%', count: 0 },
    { range: '80–100%', count: 0 },
  ]
  leaderboard.forEach(u => {
    const score = Math.min((u.xp || 0) / 500, 1)
    const bin = Math.min(Math.floor(score * 5), 4)
    bins[bin].count++
  })

  const totalStudents = leaderboard.filter(u => u.role === 'student').length
  const avgXp = leaderboard.length ? Math.round(leaderboard.reduce((s, u) => s + (u.xp || 0), 0) / leaderboard.length) : 0

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Educator Dashboard</h2>

        {/* Metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users size={20} className="text-purple-400" />, label: 'Total Students', value: totalStudents },
            { icon: <TrendingUp size={20} className="text-blue-400" />, label: 'Avg XP', value: avgXp },
            { icon: <Activity size={20} className="text-green-400" />, label: 'Active Users', value: leaderboard.length },
            { icon: <Target size={20} className="text-orange-400" />, label: 'Classes', value: classes.length },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-gray-400 text-sm">{s.label}</span></div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top 5 by XP */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Top 5 Students by XP</h3>
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-sm">No students yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Level</th>
                  <th className="text-right py-2">XP</th>
                </tr></thead>
                <tbody>
                  {leaderboard.slice(0, 5).map((s, i) => (
                    <tr key={s.id} className="border-b border-gray-700/50 text-gray-300">
                      <td className="py-2">{['🥇','🥈','🥉','4','5'][i]}</td>
                      <td className="py-2">{s.display_name}</td>
                      <td className="py-2">Lv {s.level}</td>
                      <td className="py-2 text-right text-purple-400 font-semibold">{s.xp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Engagement distribution */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">XP Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#fff' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class list */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Your Classes</h3>
            <button onClick={() => navigate('/classes')} className="text-purple-400 hover:text-purple-300 text-sm">View all →</button>
          </div>
          {classes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">No classes yet</p>
              <button onClick={() => navigate('/classes')} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm">Create Class</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {classes.slice(0, 6).map(c => (
                <div key={c.id} onClick={() => navigate(`/classes/${c.id}`)}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-gray-400 text-sm mt-1 capitalize">{c.subject}</div>
                  <div className="text-purple-400 text-xs mt-2 font-mono">{c.invite_code}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
