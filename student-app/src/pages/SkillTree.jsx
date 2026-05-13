import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import API from '../api'
import { Map, Lock, Star, Target, Loader } from 'lucide-react'

export default function SkillTree() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [data, setData] = useState(null)
  const [subject, setSubject] = useState('math')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTree() }, [subject])

  async function fetchTree() {
    setLoading(true)
    try {
      const res = await API.get(`/aboa/learner/${user.id}/skill-tree?subject=${subject}`)
      setData(res.data)
    } catch { setData({ nodes: [], edges: [] }) }
    setLoading(false)
  }

  const subjects = [
    { key: 'math', label: 'Math', icon: '📐' },
    { key: 'science', label: 'Science', icon: '🔬' },
    { key: 'english', label: 'English', icon: '📝' },
    { key: 'general', label: 'General', icon: '🌍' },
  ]

  function getMasteryColor(score) {
    if (score >= 0.8) return 'var(--xp)'
    if (score >= 0.5) return 'var(--primary)'
    if (score > 0) return 'var(--warning)'
    return 'var(--text-muted)'
  }

  function getMasteryLabel(score) {
    if (score >= 0.8) return 'Mastered'
    if (score >= 0.5) return 'Competent'
    if (score > 0) return 'Learning'
    return 'Not Started'
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1><Map size={24} style={{ display: 'inline', marginRight: 8 }} />Skill Tree</h1>
          <p>Your knowledge graph — master concepts to unlock new ones</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {subjects.map(s => (
            <button key={s.key} onClick={() => { setSubject(s.key); setSelected(null) }}
              className={`btn ${subject === s.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader size={32} className="loading-spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 600px' }}>
              <div className="card" style={{ padding: '2rem', minHeight: 400, position: 'relative' }}>
                {data?.nodes?.map(node => {
                  const x = (node.position_x + 3) * 80 + 40
                  const y = node.position_y * 90 + 40
                  const color = node.locked ? 'var(--text-muted)' : getMasteryColor(node.mastery_score)
                  const pct = Math.round((node.mastery_score || 0) * 100)

                  return (
                    <div key={node.id} onClick={() => !node.locked && setSelected(node)}
                      style={{
                        position: 'absolute', left: x, top: y,
                        width: 60, height: 60, borderRadius: '14px',
                        background: node.locked ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                        border: `2px solid ${selected?.id === node.id ? 'var(--primary)' : color}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: node.locked ? 'not-allowed' : 'pointer',
                        opacity: node.locked ? 0.4 : 1,
                        transition: 'all 0.2s',
                        boxShadow: selected?.id === node.id ? `0 0 20px ${color}40` : 'none',
                        transform: selected?.id === node.id ? 'scale(1.1)' : 'scale(1)',
                      }}>
                      <span style={{ fontSize: '1.25rem' }}>{node.locked ? '🔒' : node.icon}</span>
                      <span style={{ fontSize: '0.55rem', fontWeight: 600, color, marginTop: 2 }}>{pct}%</span>
                    </div>
                  )
                })}

                {data?.edges?.map((edge, i) => {
                  const from = data.nodes.find(n => n.id === edge.from_node_id)
                  const to = data.nodes.find(n => n.id === edge.to_node_id)
                  if (!from || !to) return null
                  const x1 = (from.position_x + 3) * 80 + 70
                  const y1 = from.position_y * 90 + 70
                  const x2 = (to.position_x + 3) * 80 + 70
                  const y2 = to.position_y * 90 + 70
                  return (
                    <svg key={i} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-hover)" strokeWidth={1.5} strokeDasharray="4 4" />
                    </svg>
                  )
                })}

                {(!data?.nodes || data.nodes.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    No concepts available for this subject yet.
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: '0 0 280px' }}>
              {selected ? (
                <div className="card" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>{selected.icon}</span>
                    <h3 style={{ marginTop: '0.5rem' }}>{selected.display_name}</h3>
                    <span className={`badge ${selected.mastery_score >= 0.8 ? 'badge-warning' : selected.mastery_score >= 0.5 ? 'badge-primary' : 'badge-secondary'}`} style={{ marginTop: '0.5rem' }}>
                      {getMasteryLabel(selected.mastery_score)}
                    </span>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mastery</span>
                      <span style={{ color: getMasteryColor(selected.mastery_score), fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {Math.round((selected.mastery_score || 0) * 100)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(selected.mastery_score || 0) * 100}%` }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Attempts</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-heading)' }}>{selected.attempts || 0}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Streak</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-heading)' }}>{selected.streak || 0} 🔥</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Confidence</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-heading)' }}>{Math.round((selected.confidence || 0) * 100)}%</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Status</div>
                      <div style={{ fontWeight: 600, color: getMasteryColor(selected.mastery_score) }}>{selected.status}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  <Target size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem' }}>Click a concept node to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
