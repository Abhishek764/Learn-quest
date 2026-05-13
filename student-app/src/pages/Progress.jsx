import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import API from '../api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

export default function Progress() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [trends, setTrends] = useState([])
  const [stats, setStats] = useState({})
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    if (!user.id) return
    API.get(`/analytics/user/${user.id}/trends`).then(r => setTrends(r.data)).catch(() => {})
    API.get(`/analytics/user/${user.id}/stats`).then(r => setStats(r.data)).catch(() => {})
    API.get(`/games/sessions/user/${user.id}`).then(r => setSessions(r.data || [])).catch(() => {})
  }, [user.id])

  // Group accuracy by subject
  const subjectAcc = sessions.reduce((acc, s) => {
    if (!s.subject || !s.total_questions) return acc
    if (!acc[s.subject]) acc[s.subject] = { correct: 0, total: 0 }
    acc[s.subject].correct += s.correct_answers || 0
    acc[s.subject].total += s.total_questions || 0
    return acc
  }, {})

  const subjectData = Object.entries(subjectAcc).map(([subject, v]) => ({
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    accuracy: Math.round((v.correct / v.total) * 100)
  }))

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Your Progress</h2>

        {/* Personal bests */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sessions', value: stats.total_sessions || 0, color: 'text-green-400' },
            { label: 'Avg Accuracy', value: `${Math.round((stats.avg_accuracy || 0) * 100)}%`, color: 'text-blue-400' },
            { label: 'Best Streak', value: `${stats.best_streak || 0} days`, color: 'text-orange-400' },
            { label: 'Fav Subject', value: stats.most_played_subject || 'None', color: 'text-purple-400' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Accuracy by subject */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Accuracy by Subject</h3>
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#fff' }} formatter={v => `${v}%`} />
                  <Bar dataKey="accuracy" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-40 flex items-center justify-center text-gray-500">No data yet</div>}
          </div>

          {/* Engagement over 30 days */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Engagement (30 days)</h3>
            {trends.filter(t => t.engagement_score > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis domain={[0, 1]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#fff' }} />
                  <Line type="monotone" dataKey="engagement_score" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-40 flex items-center justify-center text-gray-500">No data yet</div>}
          </div>
        </div>

        {/* Session history */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Session History</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No sessions yet. Play a game!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Mode</th>
                    <th className="text-left py-2">Subject</th>
                    <th className="text-left py-2">Accuracy</th>
                    <th className="text-left py-2">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 20).map(s => (
                    <tr key={s.id} className="border-b border-gray-700/50 text-gray-300 hover:bg-gray-700/30">
                      <td className="py-2">{new Date(s.started_at).toLocaleDateString()}</td>
                      <td className="py-2 capitalize">{(s.game_mode || '').replace(/_/g, ' ')}</td>
                      <td className="py-2 capitalize">{s.subject}</td>
                      <td className="py-2">{s.total_questions ? Math.round((s.correct_answers / s.total_questions) * 100) : 0}%</td>
                      <td className="py-2 text-green-400">+{s.xp_earned || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
