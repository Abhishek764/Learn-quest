import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Target, Calendar, Zap, Lightbulb, Play } from 'lucide-react'
import Navbar from '../components/Navbar'
import API from '../api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [heatmap, setHeatmap] = useState([])
  const [badges, setBadges] = useState([])
  const [trends, setTrends] = useState([])
  const [tips, setTips] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (!user.id) return
    API.get(`/analytics/user/${user.id}/heatmap`).then(r => setHeatmap(r.data)).catch(() => {})
    API.get(`/users/${user.id}/badges`).then(r => setBadges(r.data)).catch(() => {})
    API.get(`/analytics/user/${user.id}/trends`).then(r => setTrends(r.data.slice(-14))).catch(() => {})
    API.get(`/analytics/user/${user.id}/growth-tips`).then(r => setTips(r.data)).catch(() => {})
    API.get(`/analytics/user/${user.id}/stats`).then(r => setStats(r.data)).catch(() => {})
  }, [user.id])

  const weeks = []
  for (let i = 0; i < 52; i++) {
    weeks.push(heatmap.slice(i * 7, i * 7 + 7))
  }

  function heatColor(count) {
    if (!count) return '#1f2937'
    if (count >= 5) return '#059669'
    if (count >= 3) return '#10b981'
    if (count >= 1) return '#34d399'
    return '#1f2937'
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Welcome back, {user.display_name || 'Learner'} 👋</h2>
          <p className="text-gray-400 mt-1">Keep up the great work!</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Flame size={20} className="text-orange-400" />, label: 'Streak', value: `${user.streak_days || stats.best_streak || 0} days` },
            { icon: <Target size={20} className="text-blue-400" />, label: 'Accuracy', value: `${Math.round((stats.avg_accuracy || 0) * 100)}%` },
            { icon: <Calendar size={20} className="text-purple-400" />, label: 'Sessions', value: stats.total_sessions || 0 },
            { icon: <Zap size={20} className="text-green-400" />, label: 'Total XP', value: user.xp || stats.total_xp || 0 },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-gray-400 text-sm">{s.label}</span></div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Heatmap */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Activity Heatmap</h3>
            <div className="flex gap-1 overflow-x-auto">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day, di) => (
                    <div
                      key={di} title={`${day?.date}: ${day?.count || 0} sessions`}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: heatColor(day?.count) }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
              <span>Less</span>
              {['#1f2937','#34d399','#10b981','#059669'].map(c => (
                <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Start</h3>
              <p className="text-gray-400 text-sm mb-6">Jump into a game and start earning XP!</p>
            </div>
            <button
              onClick={() => navigate('/games')}
              className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Play size={18} /> Play Now
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Engagement trend */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Engagement Trend (14 days)</h3>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trends}>
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis domain={[0, 1]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#fff' }} />
                  <Line type="monotone" dataKey="engagement_score" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-500">Play some games to see your trend!</div>
            )}
          </div>

          {/* Badges */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Recent Badges</h3>
            {badges.length === 0 ? (
              <p className="text-gray-500 text-sm">No badges yet — keep playing!</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {badges.slice(0, 6).map(b => (
                  <div key={b.id} className="flex flex-col items-center gap-1 p-2 bg-gray-700 rounded-lg" title={b.description}>
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-xs text-gray-300 text-center">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Growth tips */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Lightbulb size={18} className="text-yellow-400" /> Growth Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(tips.length ? tips : [
              'Complete at least one session daily to build a streak.',
              'Focus on your weakest subject to improve overall accuracy.',
              'Use hints sparingly — trying first builds stronger memory.'
            ]).map((tip, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-4 flex gap-3">
                <Lightbulb size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
