import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import API from '../api'
import { Zap, Flame, Trophy, Target, Gamepad2, TrendingUp, Calendar, Award, ChevronRight, Sparkles, Clock, Brain } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [tips, setTips] = useState([])
  const [badges, setBadges] = useState([])

  useEffect(() => {
    Promise.all([
      API.get(`/analytics/user/${user.id}/stats`).catch(() => ({ data: {} })),
      API.get(`/analytics/user/${user.id}/trends`).catch(() => ({ data: [] })),
      API.get(`/analytics/user/${user.id}/heatmap`).catch(() => ({ data: [] })),
      API.get(`/analytics/user/${user.id}/growth-tips`).catch(() => ({ data: [] })),
      API.get(`/users/${user.id}/badges`).catch(() => ({ data: [] })),
    ]).then(([s, t, h, g, b]) => {
      setStats(s.data)
      setTrends(t.data)
      setHeatmap(h.data)
      setTips(g.data)
      setBadges(b.data)
    })
  }, [])

  const xp = user.xp || 0
  const level = user.level || 1
  const xpInLevel = xp % 100
  const streak = user.streak_days || 0

  const statCards = [
    { icon: <Zap size={20} />, label: 'Total XP', value: xp.toLocaleString(), color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { icon: <Trophy size={20} />, label: 'Level', value: level, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: <Flame size={20} />, label: 'Streak', value: `${streak} days`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: <Target size={20} />, label: 'Accuracy', value: stats?.avg_accuracy ? `${Math.round(stats.avg_accuracy * 100)}%` : '—', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  ]

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        {/* Hero Welcome */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                Welcome back, {user.display_name || 'Player'} <span style={{ fontSize: '1.5rem' }}>👋</span>
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>Ready to level up? Your AI tutor has new challenges waiting.</p>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/games')} style={{ gap: '0.5rem' }}>
              <Gamepad2 size={20} /> Play Now
            </button>
          </div>
          {/* XP Progress Bar */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.375rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Level {level} Progress</span>
              <span style={{ color: 'var(--xp)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{xpInLevel}/100 XP</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${xpInLevel}%` }} />
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {statCards.map((s, i) => (
            <div key={i} className="card stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Engagement Chart */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Engagement Trend
            </h3>
            <div style={{ height: 180 }}>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <Line type="monotone" dataKey="engagement_score" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5', fontSize: '0.8rem' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Play more games to see your trend
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--xp)' }} /> Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { icon: <Gamepad2 size={18} />, label: 'Lightning Quiz', desc: '10 adaptive questions', path: '/games', color: 'var(--primary)' },
                { icon: <Brain size={18} />, label: 'Memory Match', desc: 'Match concepts to answers', path: '/games', color: 'var(--secondary)' },
                { icon: <Clock size={18} />, label: 'Speed Type', desc: 'Type answers against the clock', path: '/games', color: 'var(--warning)' },
              ].map((a, i) => (
                <div key={i} onClick={() => navigate(a.path)} className="card-clickable"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${a.color}15`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>{a.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Activity Heatmap */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} /> Activity
            </h3>
            <div className="heatmap-grid">
              {(heatmap.length > 0 ? heatmap.slice(-364) : Array(364).fill({ count: 0 })).map((d, i) => {
                const c = d.count || d.sessions_count || 0
                const level = c === 0 ? '' : c < 2 ? 'l1' : c < 4 ? 'l2' : c < 6 ? 'l3' : 'l4'
                return <div key={i} className={`heatmap-cell ${level}`} title={`${c} sessions`} />
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', justifyContent: 'flex-end' }}>
              Less
              {['', 'l1', 'l2', 'l3', 'l4'].map(l => <div key={l} className={`heatmap-cell ${l}`} style={{ width: 10, height: 10, borderRadius: 2 }} />)}
              More
            </div>
          </div>

          {/* Badges & Tips */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} style={{ color: 'var(--xp)' }} /> Badges & Tips
            </h3>
            {badges.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {badges.map((b, i) => (
                  <div key={i} style={{ padding: '0.375rem 0.75rem', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', color: 'var(--xp)' }}>
                    {b.icon || '🏆'} {b.name}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>No badges yet — keep playing!</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(Array.isArray(tips) ? tips : []).slice(0, 3).map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text)' }}>
                  <Sparkles size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
