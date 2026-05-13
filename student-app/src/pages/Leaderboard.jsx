import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import API from '../api'
import { Trophy, Zap, Medal } from 'lucide-react'

export default function Leaderboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    API.get('/users/leaderboard').then(r => setLeaders(r.data)).catch(() => {})
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1><Trophy size={24} style={{ display: 'inline', marginRight: 8 }} />Rankings</h1>
          <p>Top players across all subjects</p>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span style={{ width: 50 }}>Rank</span>
            <span style={{ flex: 1 }}>Player</span>
            <span style={{ width: 80, textAlign: 'right' }}>Level</span>
            <span style={{ width: 100, textAlign: 'right' }}>XP</span>
          </div>

          {leaders.map((p, i) => {
            const isYou = p.id === user.id
            const rank = i + 1
            return (
              <div key={p.id} className={`lb-row ${isYou ? 'is-you' : ''}`}
                style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <span className={`lb-rank ${rank <= 3 ? ['gold', 'silver', 'bronze'][rank - 1] : ''}`} style={{ width: 50 }}>
                  {rank <= 3 ? medals[rank - 1] : rank}
                </span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isYou ? 'var(--primary-dim)' : 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700, color: isYou ? 'var(--primary)' : 'var(--text-muted)',
                  }}>
                    {(p.display_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>
                      {p.display_name || 'Unknown'} {isYou && <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>(you)</span>}
                    </div>
                  </div>
                </div>
                <span className="level-badge" style={{ width: 80, textAlign: 'center' }}>Lv.{p.level || 1}</span>
                <span style={{ width: 100, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--xp)' }}>
                  <Zap size={12} style={{ display: 'inline' }} /> {(p.xp || 0).toLocaleString()}
                </span>
              </div>
            )
          })}

          {leaders.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No players yet. Be the first!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
