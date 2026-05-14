import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CheckCircle, AlertCircle, BookOpen, Sparkles,
  Zap, Brain, Keyboard, Crosshair, Shuffle, Star, Users, Trash2,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AnimatedBackground from '../components/AnimatedBackground'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import GlareCard from '../components/reactbits/GlareCard'
import QuestionPreview from '../components/QuestionPreview'
import API from '../api'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.45, ease } }) }

const SUBJECTS = ['math', 'science', 'english', 'history', 'geography', 'art', 'general']
const DIFFICULTIES = [
  { label: 'Easy', value: 0.2 },
  { label: 'Medium', value: 0.5 },
  { label: 'Hard', value: 0.8 },
]

const MODES = [
  { id: 'lightning_quiz',   name: 'Lightning Quiz', template: 'mcq',       icon: Zap,       color: '#6366f1', desc: '10 MCQ · 30s timer · adaptive', bestFor: 'Concept checks, recall, definitions' },
  { id: 'memory_match',     name: 'Memory Match',   template: 'memory',    icon: Brain,     color: '#8b5cf6', desc: 'Pair card-flip · 6 pairs',       bestFor: 'Associations: term ↔ definition' },
  { id: 'speed_type',       name: 'Speed Type',     template: 'typed',     icon: Keyboard,  color: '#f59e0b', desc: 'Type answer · 20s timer',         bestFor: 'Short factual answers, vocabulary' },
  { id: 'true_false_blitz', name: 'True / False',   template: 'truefalse', icon: Crosshair, color: '#ec4899', desc: 'Rapid-fire · 10s timer',          bestFor: 'Fact verification, common errors' },
  { id: 'word_scramble',    name: 'Word Scramble',  template: 'scramble',  icon: Shuffle,   color: '#22d3ee', desc: 'Unscramble letters',              bestFor: 'Vocabulary, spelling, key terms' },
  { id: 'boss_battle',      name: 'Boss Battle',    template: 'mcq',       icon: Star,      color: '#ef4444', desc: 'Progressive MCQ · Lv 5 unlock',   bestFor: 'Mastery checks, hard problems' },
  { id: 'crew_quest',       name: 'Crew Quest',     template: 'mcq',       icon: Users,     color: '#10b981', desc: 'Multiplayer co-op · 2–8 players', bestFor: 'Team rooms, collaborative recall' },
]

function makeBlank(template) {
  const base = { subject: 'math', difficulty: 0.5, target_mode: '' }
  if (template === 'truefalse') return { ...base, statement: '', verdict: true }
  if (template === 'typed')     return { ...base, question_text: '', answer: '', distractor_1: '', distractor_2: '', distractor_3: '' }
  if (template === 'scramble')  return { ...base, question_text: 'Unscramble:', word: '' }
  if (template === 'memory')    return { ...base, pairs: Array(6).fill(null).map(() => ({ question: '', answer: '' })) }
  // mcq
  return { ...base, question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
}

function buildPayload(form, mode) {
  const template = mode.template
  const meta = { target_mode: mode.id }

  if (template === 'truefalse') {
    return {
      question_text: form.statement || '',
      option_a: 'True',
      option_b: 'False',
      option_c: '—',
      option_d: '—',
      correct_option: form.verdict ? 'A' : 'B',
      subject: form.subject,
      difficulty: form.difficulty,
      ...meta,
    }
  }
  if (template === 'typed') {
    const ans = (form.answer || '').trim()
    const d1 = (form.distractor_1 || '').trim() || (ans + '?')
    const d2 = (form.distractor_2 || '').trim() || ans.split('').reverse().join('')
    const d3 = (form.distractor_3 || '').trim() || ans.toUpperCase()
    return {
      question_text: form.question_text || '',
      option_a: ans,
      option_b: d1,
      option_c: d2,
      option_d: d3,
      correct_option: 'A',
      subject: form.subject,
      difficulty: form.difficulty,
      ...meta,
    }
  }
  if (template === 'scramble') {
    const w = (form.word || '').trim()
    return {
      question_text: form.question_text || 'Unscramble:',
      option_a: w,
      option_b: w.split('').reverse().join(''),
      option_c: w.toUpperCase(),
      option_d: w.toLowerCase(),
      correct_option: 'A',
      subject: form.subject,
      difficulty: form.difficulty,
      ...meta,
    }
  }
  // mcq
  return {
    question_text: form.question_text || '',
    option_a: form.option_a || '',
    option_b: form.option_b || '',
    option_c: form.option_c || '',
    option_d: form.option_d || '',
    correct_option: (form.correct_option || 'A').toUpperCase(),
    subject: form.subject,
    difficulty: form.difficulty,
    ...meta,
  }
}

// Memory match authors 6 pairs at once → emits 6 MCQ payloads where opt_a is the correct answer
function buildMemoryPayloads(form, mode) {
  const meta = { target_mode: mode.id, subject: form.subject, difficulty: form.difficulty }
  const pairs = (form.pairs || []).filter(p => p.question?.trim() && p.answer?.trim())
  return pairs.map(p => ({
    ...meta,
    question_text: p.question.trim(),
    option_a: p.answer.trim(),
    option_b: '—',
    option_c: '—',
    option_d: '—',
    correct_option: 'A',
  }))
}

function validate(form, mode) {
  if (!form.subject) return 'Pick a subject'
  if (mode.template === 'truefalse') {
    if (!form.statement?.trim()) return 'Statement is required'
    if (form.statement.trim().length < 5) return 'Statement is too short'
    return null
  }
  if (mode.template === 'typed') {
    if (!form.question_text?.trim()) return 'Question is required'
    if (!form.answer?.trim()) return 'Answer is required'
    if (form.answer.length > 40) return 'Keep the answer short (under 40 chars) — students type it'
    return null
  }
  if (mode.template === 'scramble') {
    if (!form.word?.trim()) return 'Word or phrase is required'
    if (form.word.length > 24) return 'Keep it short (≤ 24 chars) — too long is hard to unscramble'
    return null
  }
  if (mode.template === 'memory') {
    const filled = (form.pairs || []).filter(p => p.question?.trim() && p.answer?.trim())
    if (filled.length < 2) return 'Author at least 2 complete pairs'
    return null
  }
  // mcq
  if (!form.question_text?.trim()) return 'Question is required'
  for (const opt of ['a', 'b', 'c', 'd']) {
    if (!form[`option_${opt}`]?.trim()) return `Option ${opt.toUpperCase()} is required`
  }
  return null
}

function diffMeta(d) {
  if (d <= 0.3) return { label: 'Easy', color: 'var(--success)', bg: 'var(--success-dim)' }
  if (d <= 0.6) return { label: 'Medium', color: 'var(--amber)', bg: 'var(--amber-dim)' }
  return { label: 'Hard', color: 'var(--danger)', bg: 'var(--danger-dim)' }
}

export default function Content() {
  const [modeId, setModeId] = useState('lightning_quiz')
  const mode = useMemo(() => MODES.find(m => m.id === modeId) || MODES[0], [modeId])

  const [form, setForm] = useState(() => makeBlank(MODES[0].template))
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchQuestions() }, [])

  // Switch mode → reset form to that template's blank
  function switchMode(m) {
    setModeId(m.id)
    setForm(prev => {
      // preserve shared fields
      const next = makeBlank(m.template)
      next.subject = prev.subject || 'math'
      next.difficulty = prev.difficulty ?? 0.5
      return next
    })
    setError('')
  }

  async function fetchQuestions() {
    try { const r = await API.get('/games/questions'); setQuestions(r.data || []) } catch {}
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate(form, mode)
    if (err) { setError(err); return }
    setSaving(true); setError('')
    try {
      if (mode.template === 'memory') {
        const payloads = buildMemoryPayloads(form, mode)
        const created = []
        for (const p of payloads) {
          const r = await API.post('/games/questions', p)
          created.push(r.data)
        }
        setQuestions(prev => [...created.reverse(), ...prev])
      } else {
        const payload = buildPayload(form, mode)
        const r = await API.post('/games/questions', payload)
        setQuestions(prev => [r.data, ...prev])
      }
      setForm(makeBlank(mode.template))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all' ? questions : questions.filter(q => q.subject === filter)

  return (
    <div className="edu-shell">
      <AnimatedBackground />
      <Sidebar />
      <main className="edu-main">
        <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeUp}>
          <div>
            <h1>Question bank</h1>
            <p>Pick a game mode, fill the form, hit publish — your students see it in their next session.</p>
          </div>
          <div className="badge badge-success" style={{ padding: '0.4rem 0.75rem' }}>
            <Sparkles size={12} /> {questions.length} live
          </div>
        </motion.div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem', marginBottom: '1.25rem',
                background: 'var(--success-dim)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 12, color: 'var(--success)', fontSize: '0.85rem',
              }}
            >
              <CheckCircle size={16} /> Published to <strong style={{ marginLeft: 4 }}>{mode.name}</strong>. Students will see it next session.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode picker */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp}
          style={{ marginBottom: '1.5rem' }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '0.75rem' }}>
            Step 1 · Pick a game
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}>
            {MODES.map(m => {
              const Icon = m.icon
              const active = m.id === modeId
              return (
                <GlareCard
                  key={m.id}
                  onClick={() => switchMode(m)}
                  glareColor={`${m.color}40`}
                  style={{
                    cursor: 'pointer',
                    borderColor: active ? `${m.color}50` : 'var(--border)',
                    background: active
                      ? `linear-gradient(135deg, ${m.color}12, ${m.color}04 60%, transparent)`
                      : 'var(--bg-card)',
                    boxShadow: active ? `0 0 24px ${m.color}25, inset 0 1px 0 rgba(255,255,255,0.06)` : 'none',
                  }}
                >
                  <div style={{ padding: '0.25rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${m.color}15`, color: m.color,
                        border: `1px solid ${m.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={17} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                      </div>
                      {active && (
                        <CheckCircle size={16} style={{ color: m.color, flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{
                      paddingTop: '0.5rem', borderTop: '1px solid var(--border)',
                      fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4,
                    }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>Best for:</span> {m.bestFor}
                    </div>
                  </div>
                </GlareCard>
              )
            })}
          </div>
        </motion.div>

        {/* Author + preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}>
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <SpotlightCard spotlightColor={`${mode.color}25`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                    Step 2 · Author for {mode.name}
                  </div>
                  <h3 style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {(() => { const I = mode.icon; return <I size={16} style={{ color: mode.color }} /> })()}
                    {mode.template === 'truefalse' ? 'Statement & verdict'
                      : mode.template === 'typed'  ? 'Question & accepted answer'
                      : mode.template === 'scramble' ? 'Word & hint'
                      : mode.template === 'memory' ? 'Question & matching answer pair'
                      : 'Question & 4 options'}
                  </h3>
                </div>
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

              <form onSubmit={handleSubmit}>
                {/* Shared: subject + difficulty */}
                <div className="grid-2" style={{ marginBottom: '0.875rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="q_subject" className="form-label">Subject</label>
                    <select
                      id="q_subject" className="select"
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="q_diff" className="form-label">Difficulty</label>
                    <select
                      id="q_diff" className="select"
                      value={form.difficulty}
                      onChange={e => setForm(f => ({ ...f, difficulty: parseFloat(e.target.value) }))}
                    >
                      {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Template-specific fields */}
                {mode.template === 'truefalse' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="tf_stmt" className="form-label">Statement</label>
                      <textarea
                        id="tf_stmt" className="textarea" rows={3} required
                        value={form.statement || ''}
                        onChange={e => setForm(f => ({ ...f, statement: e.target.value }))}
                        placeholder="e.g. The mitochondria is the powerhouse of the cell."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Verdict</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          { v: true,  label: 'True',  c: 'var(--success)' },
                          { v: false, label: 'False', c: 'var(--danger)'  },
                        ].map(opt => {
                          const active = form.verdict === opt.v
                          return (
                            <button
                              key={opt.label} type="button"
                              onClick={() => setForm(f => ({ ...f, verdict: opt.v }))}
                              style={{
                                flex: 1, padding: '0.7rem', borderRadius: 12,
                                background: active ? `${opt.c}15` : 'var(--bg-input)',
                                border: `1px solid ${active ? opt.c : 'var(--border)'}`,
                                color: active ? opt.c : 'var(--text)',
                                fontWeight: 700, fontSize: '0.92rem',
                                cursor: 'pointer', transition: 'all 200ms var(--ease-premium)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              }}
                            >
                              {opt.v ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {mode.template === 'typed' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="tp_q" className="form-label">Question</label>
                      <textarea
                        id="tp_q" className="textarea" rows={2} required
                        value={form.question_text || ''}
                        onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                        placeholder="e.g. What is the chemical symbol for gold?"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="tp_a" className="form-label">Accepted answer (case-insensitive)</label>
                      <input
                        id="tp_a" type="text" required className="input"
                        value={form.answer || ''}
                        onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                        placeholder="Au"
                        maxLength={40}
                      />
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Keep short — students type this against a 20-second timer.
                      </div>
                    </div>
                  </>
                )}

                {mode.template === 'scramble' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="sc_hint" className="form-label">Hint / prompt</label>
                      <input
                        id="sc_hint" type="text" className="input"
                        value={form.question_text || ''}
                        onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                        placeholder="Unscramble: largest planet in our solar system"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sc_word" className="form-label">Word or phrase to unscramble</label>
                      <input
                        id="sc_word" type="text" required className="input"
                        value={form.word || ''}
                        onChange={e => setForm(f => ({ ...f, word: e.target.value }))}
                        placeholder="JUPITER"
                        maxLength={24}
                        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.10em', textTransform: 'uppercase' }}
                      />
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Keep ≤ 24 chars. Letters will be shuffled for the student.
                      </div>
                    </div>
                  </>
                )}

                {(mode.template === 'mcq' || mode.template === 'memory') && (
                  <>
                    <div className="form-group">
                      <label htmlFor="q_text" className="form-label">
                        {mode.template === 'memory' ? 'Question (card side A)' : 'Question'}
                      </label>
                      <textarea
                        id="q_text" className="textarea" rows={3} required
                        value={form.question_text || ''}
                        onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                        placeholder="e.g. What is the capital of France?"
                      />
                    </div>

                    <div className="grid-2">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className="form-group">
                          <label htmlFor={`q_opt_${opt}`} className="form-label">
                            {mode.template === 'memory' && form.correct_option === opt
                              ? `Option ${opt} · card side B`
                              : `Option ${opt}`}
                          </label>
                          <input
                            id={`q_opt_${opt}`} type="text" required className="input"
                            value={form[`option_${opt.toLowerCase()}`] || ''}
                            onChange={e => setForm(f => ({ ...f, [`option_${opt.toLowerCase()}`]: e.target.value }))}
                            placeholder={`Option ${opt}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="form-group" style={{ marginTop: '0.25rem' }}>
                      <label className="form-label">Correct answer</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['A', 'B', 'C', 'D'].map(opt => {
                          const active = form.correct_option === opt
                          return (
                            <button
                              key={opt} type="button"
                              onClick={() => setForm(f => ({ ...f, correct_option: opt }))}
                              style={{
                                flex: 1, padding: '0.65rem', borderRadius: 10,
                                background: active ? 'var(--success-dim)' : 'var(--bg-input)',
                                border: `1px solid ${active ? 'rgba(16,185,129,0.45)' : 'var(--border)'}`,
                                color: active ? 'var(--success)' : 'var(--text)',
                                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem',
                                cursor: 'pointer', transition: 'all 200ms var(--ease-premium)',
                              }}
                            >{opt}</button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setForm(makeBlank(mode.template))}
                    className="btn btn-secondary" style={{ flex: 1 }}
                  >
                    <Trash2 size={14} /> Reset
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
                    {saving
                      ? <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      : <><Sparkles size={15} /> Publish to {mode.name}</>}
                  </button>
                </div>
              </form>
            </SpotlightCard>
          </motion.div>

          <motion.div
            key={modeId} // re-mount preview when mode changes
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.05 }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '0.75rem' }}>
              Step 3 · See what students see
            </div>
            <QuestionPreview form={form} mode={mode} />
          </motion.div>
        </div>

        {/* Existing questions */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          style={{ marginBottom: '0.75rem' }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '0.5rem' }}>
            Published bank
          </div>
          <div className="pill-group">
            {['all', ...SUBJECTS].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`pill ${filter === s ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <span className="loading-spinner" style={{ display: 'inline-block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <SpotlightCard spotlightColor="rgba(20,184,166,0.16)">
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{
                width: 60, height: 60, margin: '0 auto 1rem',
                borderRadius: 16, background: 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-bright)', border: '1px solid rgba(20,184,166,0.20)',
              }}>
                <BookOpen size={24} />
              </div>
              <h3 style={{ marginBottom: '0.375rem' }}>
                No questions {filter !== 'all' ? `for ${filter}` : 'yet'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Use the author panel above to publish your first question.
              </p>
            </div>
          </SpotlightCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((q, i) => {
              const d = diffMeta(q.difficulty)
              return (
                <motion.div
                  key={q.id}
                  custom={i} initial="hidden" animate="visible" variants={fadeUp}
                >
                  <GlareCard glareColor="rgba(20,184,166,0.14)">
                    <div style={{ padding: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.875rem' }}>
                        <div style={{ color: 'var(--text-heading)', fontWeight: 500, fontSize: '0.98rem', lineHeight: 1.4 }}>
                          {q.question_text}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{q.subject}</span>
                          <span className="badge" style={{ background: d.bg, color: d.color }}>{d.label}</span>
                        </div>
                      </div>
                      <div className="grid-2" style={{ gap: '0.5rem' }}>
                        {['A', 'B', 'C', 'D'].map(opt => {
                          const correct = q.correct_option === opt
                          return (
                            <div key={opt} style={{
                              display: 'flex', alignItems: 'center', gap: '0.625rem',
                              padding: '0.5rem 0.75rem', borderRadius: 10,
                              background: correct ? 'var(--success-dim)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${correct ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                              fontSize: '0.85rem',
                              color: correct ? 'var(--success)' : 'var(--text)',
                            }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: 6,
                                background: correct ? 'rgba(16,185,129,0.20)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${correct ? 'rgba(16,185,129,0.35)' : 'var(--border)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.7rem',
                                flexShrink: 0,
                              }}>{opt}</span>
                              {q[`option_${opt.toLowerCase()}`]}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </GlareCard>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
