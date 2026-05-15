import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, X, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Brain, Loader2,
} from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'

const ease = [0.22, 1, 0.36, 1]

const TOPIC_PRESETS = [
  { key: 'math',    label: 'Math',    icon: '📐' },
  { key: 'science', label: 'Science', icon: '🔬' },
  { key: 'history', label: 'History', icon: '🏛️' },
  { key: 'english', label: 'English', icon: '📝' },
  { key: 'geography', label: 'Geography', icon: '🌍' },
  { key: 'coding',  label: 'Coding',  icon: '💻' },
]

const FORMAT_OPTIONS = [
  { key: 'mcq',        label: 'Multiple choice' },
  { key: 'true_false', label: 'True / False' },
  { key: 'typed',      label: 'Typed answer' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function AiPractice() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('config') // config | loading | playing | result | gameover
  const [topic, setTopic] = useState('math')
  const [customTopic, setCustomTopic] = useState('')
  const [count, setCount] = useState(5)
  const [formats, setFormats] = useState(['mcq'])
  const [error, setError] = useState('')

  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [learner, setLearner] = useState(null)
  const [difficulty, setDifficulty] = useState('')
  const [selected, setSelected] = useState(null)
  const [typed, setTyped] = useState('')
  const [tfPick, setTfPick] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const startRef = useRef(null)

  const current = questions[idx]
  const accentColor = '#a78bfa'

  function toggleFormat(key) {
    setFormats(prev => prev.includes(key)
      ? (prev.length > 1 ? prev.filter(f => f !== key) : prev)
      : [...prev, key])
  }

  async function start() {
    setError('')
    const finalTopic = (customTopic.trim() || topic).trim()
    if (finalTopic.length < 2) return setError('Topic must be at least 2 chars')
    setPhase('loading')
    try {
      const res = await API.post('/ai/generate-questions/adaptive', {
        topic: finalTopic,
        count: Number(count) || 5,
        formats,
      })
      const list = Array.isArray(res.data?.questions) ? res.data.questions : []
      if (list.length === 0) {
        setError('AI returned no questions. Try a different topic.')
        setPhase('config')
        return
      }
      setQuestions(list)
      setLearner(res.data.learner)
      setDifficulty(res.data.difficulty || '')
      setIdx(0); setScore(0); setCorrectCount(0); setStreak(0); setSelected(null); setTyped(''); setTfPick(null); setFeedback(null)
      setPhase('playing')
      startRef.current = Date.now()
    } catch (err) {
      const code = err.response?.data?.code
      const msg = err.response?.data?.error || 'Failed to generate'
      if (code === 'AiConfigError') setError('AI service not configured (missing API key).')
      else if (code === 'AiTimeoutError') setError('AI took too long. Try again.')
      else if (code === 'UserFetchError') setError('Could not load your profile. Try again.')
      else setError(msg)
      setPhase('config')
    }
  }

  function evaluate(answer) {
    if (!current) return { correct: false, expected: '' }
    if (current.format === 'mcq') {
      return { correct: answer === current.answerIndex, expected: current.choices?.[current.answerIndex] }
    }
    if (current.format === 'true_false') {
      return { correct: answer === current.answer, expected: current.answer ? 'TRUE' : 'FALSE' }
    }
    if (current.format === 'typed') {
      const norm = s => (s || '').trim().toLowerCase()
      const t = norm(answer)
      const accepted = [current.answer, ...(current.acceptable || [])].map(norm)
      return { correct: t.length > 0 && accepted.includes(t), expected: current.answer }
    }
    return { correct: false, expected: '' }
  }

  function submit(answer) {
    if (feedback) return
    const value = answer !== undefined ? answer
      : current.format === 'mcq' ? selected
      : current.format === 'true_false' ? tfPick
      : typed
    const { correct, expected } = evaluate(value)
    const rt = Math.round((Date.now() - startRef.current) / 1000)
    const gained = correct ? Math.max(5, 20 - Math.min(15, rt)) : 0
    setFeedback({ correct, expected, explanation: current.explanation || '', gained })
    if (correct) { setScore(s => s + gained); setCorrectCount(c => c + 1); setStreak(s => s + 1) } else setStreak(0)
    setTimeout(next, 1600)
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setPhase('gameover')
      return
    }
    setIdx(i => i + 1)
    setSelected(null); setTyped(''); setTfPick(null); setFeedback(null)
    startRef.current = Date.now()
  }

  function restart() {
    setPhase('config'); setQuestions([]); setIdx(0); setScore(0); setCorrectCount(0); setStreak(0)
    setFeedback(null); setSelected(null); setTyped(''); setTfPick(null)
  }

  // ── CONFIG ──
  if (phase === 'config') {
    return (
      <div className="page-wrapper">
        <AnimatedBackground />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="card"
            style={{ maxWidth: 480, width: '100%', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${accentColor}15`, color: accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>AI Practice</h2>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Questions auto-calibrated to your level.
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '0.625rem 0.875rem', marginBottom: '1rem',
                background: 'rgba(239,68,68,0.08)', color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10,
                fontSize: '0.82rem',
              }}>
                {error}
              </div>
            )}

            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Topic
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.5rem 0 0.75rem' }}>
              {TOPIC_PRESETS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTopic(t.key); setCustomTopic('') }}
                  className={`btn ${topic === t.key && !customTopic ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem' }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <input
              className="input"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="…or type a custom topic (e.g. World War II)"
              maxLength={200}
              style={{ marginBottom: '1rem' }}
            />

            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Question count
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', margin: '0.5rem 0 1rem' }}>
              {[3, 5, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`btn ${count === n ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.85rem' }}
                >
                  {n}
                </button>
              ))}
            </div>

            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Question formats
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.5rem 0 1.25rem' }}>
              {FORMAT_OPTIONS.map(f => (
                <button
                  key={f.key}
                  onClick={() => toggleFormat(f.key)}
                  className={`btn ${formats.includes(f.key) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem' }}
                >
                  {formats.includes(f.key) ? '✓ ' : ''}{f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/games')} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={start} style={{ flex: 2 }}>
                <Sparkles size={16} /> Generate &amp; play
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <div className="page-wrapper">
        <AnimatedBackground />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            style={{ textAlign: 'center' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 56, height: 56, margin: '0 auto 1rem',
                borderRadius: 16, background: `${accentColor}15`,
                color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Loader2 size={26} />
            </motion.div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              AI is crafting your questions…
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── GAMEOVER ──
  if (phase === 'gameover') {
    const total = questions.length
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0
    return (
      <div className="page-wrapper">
        <AnimatedBackground />
        <div className="gameover-shell">
          <motion.div
            className="gameover-card"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease }}
          >
            <motion.div
              className="gameover-trophy"
              initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)`, color: 'white' }}
            >
              <Trophy size={36} />
            </motion.div>
            <h1 className="gameover-headline">Practice complete</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              AI Practice · {difficulty || 'adaptive'} difficulty
            </p>
            <div className="gameover-stats">
              <div className="gameover-stat">
                <div className="v" style={{ color: 'var(--accent-bright)' }}>{accuracy}%</div>
                <div className="l">Accuracy</div>
              </div>
              <div className="gameover-stat">
                <div className="v" style={{ color: 'var(--xp)' }}>{score}</div>
                <div className="l">Score</div>
              </div>
              <div className="gameover-stat">
                <div className="v" style={{ color: 'var(--success)' }}>{correctCount}/{total}</div>
                <div className="l">Correct</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={restart}>
                <RotateCcw size={16} /> New round
              </button>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => navigate('/games')}>
                Back to arcade
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── PLAYING ──
  if (!current) return null

  const q = current

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <div className="game-shell">
        <div className="game-hud">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/games')}>
            <X size={14} /> Quit
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {difficulty && (
              <span className="hud-chip" style={{ textTransform: 'capitalize' }}>
                {difficulty}
              </span>
            )}
            {learner && (
              <span className="hud-chip">L{learner.level} · {learner.xp} xp</span>
            )}
            <span className="hud-chip hud-chip-xp"><Sparkles size={12} /> {score}</span>
          </div>
        </div>

        <div className="game-progress">
          <div className="game-progress-head">
            <span className="mode-name"><Brain size={14} style={{ color: accentColor }} /> AI Practice</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1}/{questions.length}</span>
          </div>
          <div className="game-progress-bar">
            <div
              className="game-progress-fill"
              style={{
                width: `${((idx + 1) / questions.length) * 100}%`,
                background: `linear-gradient(90deg, ${accentColor}, #6366f1)`,
                boxShadow: `0 0 12px ${accentColor}40`,
              }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
            className="question-card"
          >
            {q.topic && <span className="q-subject">{q.topic}</span>}
            <div className="q-text">{q.prompt}</div>
          </motion.div>
        </AnimatePresence>

        {/* MCQ */}
        {q.format === 'mcq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {(q.choices || []).map((opt, i) => {
              const labels = ['A', 'B', 'C', 'D']
              let cls = ''
              if (feedback && selected === i) cls = feedback.correct ? 'correct' : 'wrong'
              if (feedback && !feedback.correct && i === q.answerIndex) cls = 'correct'
              return (
                <motion.button
                  key={i}
                  className={`option-btn ${cls}`}
                  onClick={() => { if (!feedback) { setSelected(i); submit(i) } }}
                  disabled={!!feedback}
                  whileHover={!feedback ? { x: 6 } : {}}
                  whileTap={!feedback ? { scale: 0.99 } : {}}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease }}
                >
                  <span className="option-label">{labels[i]}</span>
                  {opt}
                </motion.button>
              )
            })}
          </div>
        )}

        {/* TRUE/FALSE */}
        {q.format === 'true_false' && (
          <div className="tf-grid">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { if (!feedback) { setTfPick(true); submit(true) } }}
              disabled={!!feedback}
              className={`tf-btn tf-true ${feedback && q.answer === true ? 'correct' : ''}`}
            >
              <CheckCircle size={24} /> TRUE
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { if (!feedback) { setTfPick(false); submit(false) } }}
              disabled={!!feedback}
              className={`tf-btn tf-false ${feedback && q.answer === false ? 'correct' : ''}`}
            >
              <XCircle size={24} /> FALSE
            </motion.button>
          </div>
        )}

        {/* TYPED */}
        {q.format === 'typed' && (
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <input
              className="input"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit(typed)}
              placeholder="Type your answer…"
              disabled={!!feedback}
              style={{ fontSize: '1rem', textAlign: 'center' }}
              autoFocus
            />
            <button
              className="btn btn-primary"
              onClick={() => submit(typed)}
              disabled={!!feedback || !typed.trim()}
              aria-label="Submit answer"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        <AnimatePresence>
          {feedback && (
            <motion.div
              key="fb"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className={`feedback-toast ${feedback.correct ? 'correct' : 'wrong'}`}
            >
              {feedback.correct
                ? <><Sparkles size={16} /> Correct{streak > 1 ? ` · ${streak}x streak` : ''} {feedback.gained > 0 && `· +${feedback.gained}`}</>
                : <><XCircle size={16} /> Answer: {feedback.expected}</>}
            </motion.div>
          )}
        </AnimatePresence>

        {feedback?.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            style={{
              marginTop: '0.5rem', padding: '0.75rem 0.875rem',
              borderRadius: 10, fontSize: '0.82rem',
              background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.06)', lineHeight: 1.5,
            }}
          >
            {feedback.explanation}
          </motion.div>
        )}
      </div>
    </div>
  )
}
