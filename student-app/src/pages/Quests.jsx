import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import API from '../api'
import { Sword, Zap, Target, Loader, ChevronRight } from 'lucide-react'

export default function Quests() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [paths, setPaths] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get(`/aboa/learner/${user.id}/learning-paths`)
      .then(r => setPaths(r.data))
      .catch(() => setPaths([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1><Sword size={24} style={{ display: 'inline', marginRight: 8 }} />Quests</h1>
          <p>AI-generated learning paths targeting your weak areas</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader size={32} className="loading-spinner" />
          </div>
        ) : paths.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
            <h2 style={{ marginBottom: '0.5rem' }}>No Active Quests</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
              Play more games and the AI will generate personalized quests to help you master concepts you're struggling with.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paths.map(path => {
              const progress = path.total_stages > 0 ? (path.current_stage / path.total_stages) * 100 : 0
              const targets = JSON.parse(path.target_nodes || '[]')

              return (
                <div key={path.id} className="card card-clickable" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--radius)',
                    background: 'var(--secondary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', flexShrink: 0
                  }}>
                    <Target size={24} style={{ color: 'var(--secondary)' }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.25rem' }}>{path.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{path.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="progress-bar" style={{ flex: 1, maxWidth: 200 }}>
                        <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--secondary), #a78bfa)' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {path.current_stage}/{path.total_stages}
                      </span>
                      <span className="badge badge-warning">
                        <Zap size={10} /> {path.xp_reward} XP
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
