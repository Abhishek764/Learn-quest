import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Copy, Check, BookOpen, AlertCircle, Users } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AnimatedBackground from '../components/AnimatedBackground'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import GlareCard from '../components/reactbits/GlareCard'
import API from '../api'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease } }) }

const SUBJECTS = ['math', 'science', 'english', 'history', 'geography', 'art', 'general']

export default function Classes() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    try { const r = await API.get('/classes'); setClasses(r.data || []) } catch {}
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.subject.trim()) return
    setCreating(true); setError('')
    try {
      const r = await API.post('/classes', form)
      setClasses(prev => [r.data, ...prev])
      setShowModal(false)
      setForm({ name: '', subject: '', description: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create classroom')
    } finally {
      setCreating(false)
    }
  }

  function copyCode(code, e) {
    e?.stopPropagation()
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="edu-shell">
      <AnimatedBackground />
      <Sidebar />
      <main className="edu-main">
        <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeUp}>
          <div>
            <h1>Classrooms</h1>
            <p>Create rooms, share invite codes, watch students join in real time.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg">
            <Plus size={18} /> New classroom
          </button>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <span className="loading-spinner" style={{ display: 'inline-block' }} />
          </div>
        ) : classes.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <SpotlightCard spotlightColor="rgba(20,184,166,0.18)">
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{
                  width: 64, height: 64, margin: '0 auto 1.25rem',
                  borderRadius: 18, background: 'var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-bright)', border: '1px solid rgba(20,184,166,0.20)',
                }}>
                  <BookOpen size={28} />
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>No classrooms yet</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Start by creating your first classroom. Students join with a 6-character invite code.
                </p>
                <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg">
                  <Plus size={18} /> Create your first classroom
                </button>
              </div>
            </SpotlightCard>
          </motion.div>
        ) : (
          <div className="grid-3">
            {classes.map((c, i) => (
              <motion.div
                key={c.id}
                custom={i} initial="hidden" animate="visible" variants={fadeUp}
              >
                <GlareCard
                  onClick={() => navigate(`/classes/${c.id}`)}
                  style={{ cursor: 'pointer', padding: 0 }}
                >
                  <div style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--accent-dim)', color: 'var(--accent-bright)',
                        border: '1px solid rgba(20,184,166,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Users size={16} />
                      </div>
                      <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{c.subject}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '1.05rem', marginTop: '0.5rem' }}>{c.name}</div>
                    {c.description && (
                      <div style={{
                        fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.375rem',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{c.description}</div>
                    )}
                  </div>
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '0.875rem 1.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>Invite Code</div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.15em',
                        background: 'var(--accent-gradient)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>{c.invite_code}</div>
                    </div>
                    <button
                      onClick={(e) => copyCode(c.invite_code, e)}
                      className="icon-btn"
                      aria-label={`Copy invite code ${c.invite_code}`}
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {copied === c.invite_code
                        ? <Check size={15} style={{ color: 'var(--success)' }} />
                        : <Copy size={15} />}
                    </button>
                  </div>
                </GlareCard>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => { setShowModal(false); setError('') }}
          >
            <motion.div
              className="modal"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.35, ease }}
            >
              <div className="modal-head">
                <h3>Create new classroom</h3>
                <button onClick={() => { setShowModal(false); setError('') }} className="modal-close" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 0.875rem', marginBottom: '1rem',
                  background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.22)',
                  borderRadius: 10, color: 'var(--danger)', fontSize: '0.82rem',
                }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label htmlFor="cls_name" className="form-label">Classroom name</label>
                  <input
                    id="cls_name" className="input" required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Grade 9 Math"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cls_subject" className="form-label">Subject</label>
                  <select
                    id="cls_subject" className="select" required
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  >
                    <option value="">Select subject…</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="cls_desc" className="form-label">Description</label>
                  <textarea
                    id="cls_desc" className="textarea" rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optional. What is this classroom about?"
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.25rem' }}>
                  <button type="button" onClick={() => { setShowModal(false); setError('') }} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={creating} className="btn btn-primary" style={{ flex: 1 }}>
                    {creating ? <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <>Create classroom</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
