import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import API from '../api'
import { BarChart2, TrendingUp, Target, Clock, Brain } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'

export default function Progress() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stats, setStats] = useState({})
  const [trends, setTrends] = useState([])
  const [mastery, setMastery] = useState([])

  useEffect(() => {
    Promise.all([
      API.get(`/analytics/user/${user.id}/stats`).catch(() => ({ data: {} })),
      API.get(`/analytics/user/${user.id}/trends`).catch(() => ({ data: [] })),
      API.get(`/aboa/learner/${user.id}/mastery`).catch(() => ({ data: [] })),
    ]).then(([s, t, m]) => {
      setStats(s.data)
      setTrends(t.data)
      setMastery(m.data)
    })
  }, [])

  const subjects = {}
  mastery.forEach(m => {
    if (!subjects[m.subject]) subjects[m.subject] = []
    subjects[m.subject].push(m)
  })

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1><BarChart2 size={24} style={{ display: 'inline', marginRight: 8 }} />Progress</h1>
          <p>Your learning analytics powered by AI</p>
        </div>

        {/* Stats Row */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Sessions', value: stats.total_sessions || 0, icon: <Clock size={18} />, color: 'var(--primary)' },
            { label: 'Avg Accuracy', value: stats.avg_accuracy ? `${Math.round(stats.avg_accuracy * 100)}%` : '—', icon: <Target size={18} />, color: 'var(--secondary)' },
            { label: 'Concepts Tracked', value: mastery.length, icon: <Brain size={18} />, color: 'var(--warning)' },
            { label: 'Avg Engagement', value: stats.avg_engagement ? `${Math.round(stats.avg_engagement * 100)}%` : '—', icon: <TrendingUp size={18} />, color: 'var(--xp)' },
          ].map((s, i) => (
            <div key={i} className="card stat-card">
              <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Engagement Trend */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>📈 Engagement Over Time</h3>
            <div style={{ height: 200 }}>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <XAxis dataKey="date" tick={{ fill: '#55556a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#55556a', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                    <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5', fontSize: '0.8rem' }} />
                    <Line type="monotone" dataKey="engagement_score" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Play more to see trends
                </div>
              )}
            </div>
          </div>

          {/* Mastery by Subject */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>🧠 Concept Mastery</h3>
            {Object.keys(subjects).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(subjects).map(([subj, concepts]) => {
                  const avg = concepts.reduce((s, c) => s + (c.mastery_score || 0), 0) / concepts.length
                  return (
                    <div key={subj}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-heading)' }}>{subj}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{Math.round(avg * 100)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${avg * 100}%` }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {concepts.length} concepts tracked
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                Play games to start tracking mastery
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
