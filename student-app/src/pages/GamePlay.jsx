import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Heart, X, CheckCircle, XCircle, ArrowRight, Sparkles, RotateCcw,
  Brain, Keyboard, Crosshair, Shuffle, Star, Flame, Trophy,
} from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'

const ease = [0.22, 1, 0.36, 1]

const MODES = {
  lightning_quiz:   { name: 'Lightning Quiz',  icon: Zap,      color: '#6366f1' },
  memory_match:     { name: 'Memory Match',    icon: Brain,    color: '#8b5cf6' },
  speed_type:       { name: 'Speed Type',      icon: Keyboard, color: '#f59e0b' },
  true_false_blitz: { name: 'True / False',    icon: Crosshair,color: '#ec4899' },
  word_scramble:    { name: 'Word Scramble',   icon: Shuffle,  color: '#22d3ee' },
  boss_battle:      { name: 'Boss Battle',     icon: Star,     color: '#ef4444' },
}

function findCorrectFromHints(q) {
  if (!q?.hint_eliminated) return 0
  const allIdx = [0, 1, 2, 3]
  const notElim = allIdx.filter(i => !q.hint_eliminated.includes(i))
  return notElim[0]
}

function shuffleString(s) {
  const arr = s.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

export default function GamePlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') || 'lightning_quiz'
  const subject = params.get('subject') || ''
  const modeCfg = MODES[mode] || MODES.lightning_quiz
  const ModeIcon = modeCfg.icon

  const [phase, setPhase] = useState('loading')
  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [questionNum, setQuestionNum] = useState(0)
  const [totalQ, setTotalQ] = useState(10)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [timer, setTimer] = useState(30)
  const [timerMax, setTimerMax] = useState(30)
  const [feedback, setFeedback] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [xpGained, setXpGained] = useState(0)
  const [streak, setStreak] = useState(0)
  const [gameStats, setGameStats] = useState(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const [memCards, setMemCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [memMoves, setMemMoves] = useState(0)

  const [scrambled, setScrambled] = useState('')
  const [typedAnswer, setTypedAnswer] = useState('')

  const [tfStatement, setTfStatement] = useState('')
  const [tfCorrectAnswer, setTfCorrectAnswer] = useState(true)

  useEffect(() => { startSession() }, [])

  useEffect(() => {
    if (phase !== 'playing' || mode === 'memory_match') return
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, questionNum])

  async function startSession() {
    try {
      const res = await API.post('/games/sessions/start', {
        subject: subject || undefined,
        game_mode: mode,
      })
      setSessionId(res.data.session_id)
      if (mode === 'memory_match') await loadMemoryCards(res.data.session_id)
      else await loadQuestion(res.data.session_id)
    } catch {
      navigate('/games')
    }
  }

  async function loadQuestion(sid) {
    try {
      const res = await API.get(`/games/sessions/${sid}/next-question`, { params: { mode } })
      const q = res.data
      setQuestion(q)
      setQuestionNum(q.question_number || questionNum + 1)
      setTotalQ(q.total_questions || 10)
      setSelectedAnswer(null)
      setFeedback(null)
      const max = mode === 'true_false_blitz' ? 10 : mode === 'speed_type' ? 20 : 30
      setTimer(max); setTimerMax(max)
      startTimeRef.current = Date.now()
      setPhase('playing')

      if (mode === 'word_scramble') {
        const correct = q.options[findCorrectFromHints(q)] || 'answer'
        setScrambled(shuffleString(correct))
        setTypedAnswer('')
      }
      if (mode === 'true_false_blitz') {
        const isTrue = Math.random() > 0.4
        if (isTrue) {
          setTfStatement(`${q.content} → ${q.options[findCorrectFromHints(q)]}`)
          setTfCorrectAnswer(true)
        } else {
          const wrongIdx = q.hint_eliminated?.[0] ?? 0
          setTfStatement(`${q.content} → ${q.options[wrongIdx]}`)
          setTfCorrectAnswer(false)
        }
      }
    } catch {
      await endSession(sid)
    }
  }

  async function loadMemoryCards(sid) {
    try {
      const cards = []
      for (let i = 0; i < 6; i++) {
        const res = await API.get(`/games/sessions/${sid}/next-question`, { params: { mode } })
        const q = res.data
        const correct = q.options[findCorrectFromHints(q)]
        cards.push(
          { id: `q${i}`, type: 'question', text: q.content, pairId: i, qId: q.id, correctOption: findCorrectFromHints(q) },
          { id: `a${i}`, type: 'answer', text: correct, pairId: i, qId: q.id, correctOption: findCorrectFromHints(q) }
        )
      }
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]]
      }
      setMemCards(cards); setFlipped([]); setMatched([]); setMemMoves(0)
      setPhase('playing')
      startTimeRef.current = Date.now()
    } catch {
      navigate('/games')
    }
  }

  function handleTimeout() {
    setLives(l => l - 1)
    setFeedback({ correct: false, explanation: 'Time ran out!' })
    setPhase('result')
    if (lives <= 1) setTimeout(() => endSession(sessionId), 1500)
    else setTimeout(() => loadQuestion(sessionId), 1800)
  }

  async function submitAnswer(answerIdx) {
    if (feedback) return
    clearInterval(timerRef.current)
    setSelectedAnswer(answerIdx)
    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000)
    try {
      const res = await API.post(`/games/sessions/${sessionId}/answer`, {
        question_id: question.id, answer: answerIdx, response_time_sec: responseTime, hint_used: false,
      })
      const isCorrect = res.data.correct
      setFeedback({ correct: isCorrect, explanation: res.data.explanation || '' })
      if (isCorrect) {
        setScore(s => s + Math.round(res.data.xp_gained || 10))
        setXpGained(x => x + (res.data.xp_gained || 10))
        setStreak(s => s + 1)
      } else {
        setLives(l => l - 1); setStreak(0)
      }
      setPhase('result')
      if (!isCorrect && lives <= 1) setTimeout(() => endSession(sessionId), 1800)
      else if (questionNum >= totalQ) setTimeout(() => endSession(sessionId), 1800)
      else setTimeout(() => loadQuestion(sessionId), 1800)
    } catch {}
  }

  async function submitTrueFalse(answer) {
    if (feedback) return
    clearInterval(timerRef.current)
    const isCorrect = answer === tfCorrectAnswer
    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000)
    try {
      await API.post(`/games/sessions/${sessionId}/answer`, {
        question_id: question.id,
        answer: isCorrect ? findCorrectFromHints(question) : question.hint_eliminated?.[0] || 0,
        response_time_sec: responseTime, hint_used: false,
      })
    } catch {}
    setFeedback({ correct: isCorrect, explanation: isCorrect ? 'Correct' : 'Wrong' })
    if (isCorrect) { setScore(s => s + 15); setXpGained(x => x + 15); setStreak(s => s + 1) }
    else { setLives(l => l - 1); setStreak(0) }
    setPhase('result')
    if (!isCorrect && lives <= 1) setTimeout(() => endSession(sessionId), 1500)
    else if (questionNum >= totalQ) setTimeout(() => endSession(sessionId), 1500)
    else setTimeout(() => loadQuestion(sessionId), 1500)
  }

  async function submitTypedAnswer() {
    if (feedback) return
    clearInterval(timerRef.current)
    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000)
    const matchIdx = question.options.findIndex(o => o.toLowerCase().trim() === typedAnswer.toLowerCase().trim())
    const correctIdx = findCorrectFromHints(question)
    const isCorrect = matchIdx === correctIdx
    try {
      await API.post(`/games/sessions/${sessionId}/answer`, {
        question_id: question.id, answer: matchIdx >= 0 ? matchIdx : 99, response_time_sec: responseTime,
      })
    } catch {}
    setFeedback({ correct: isCorrect, explanation: isCorrect ? 'Perfect' : `Answer: ${question.options[correctIdx]}` })
    if (isCorrect) { setScore(s => s + 20); setXpGained(x => x + 20); setStreak(s => s + 1) }
    else { setLives(l => l - 1); setStreak(0) }
    setPhase('result')
    if (!isCorrect && lives <= 1) setTimeout(() => endSession(sessionId), 1500)
    else if (questionNum >= totalQ) setTimeout(() => endSession(sessionId), 1500)
    else setTimeout(() => loadQuestion(sessionId), 1500)
  }

  function flipMemCard(idx) {
    if (flipped.length === 2 || matched.includes(memCards[idx].pairId) || flipped.includes(idx)) return
    const newFlipped = [...flipped, idx]
    setFlipped(newFlipped)
    if (newFlipped.length === 2) {
      setMemMoves(m => m + 1)
      const [a, b] = newFlipped
      if (memCards[a].pairId === memCards[b].pairId && memCards[a].type !== memCards[b].type) {
        setMatched(m => [...m, memCards[a].pairId])
        setScore(s => s + 25)
        setXpGained(x => x + 25)
        setTimeout(() => setFlipped([]), 500)
        if (matched.length + 1 >= 6) setTimeout(() => endSession(sessionId), 1500)
      } else {
        setTimeout(() => setFlipped([]), 1000)
      }
    }
  }

  async function endSession(sid) {
    try {
      const res = await API.post(`/games/sessions/${sid}/end`)
      setGameStats(res.data)
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      if (u.id) {
        const userRes = await API.get(`/users/${u.id}/profile`)
        if (userRes.data) localStorage.setItem('user', JSON.stringify(userRes.data))
      }
    } catch {}
    setPhase('gameover')
  }

  function restart() {
    setPhase('loading'); setScore(0); setLives(3); setXpGained(0); setStreak(0); setQuestionNum(0)
    setFeedback(null); setQuestion(null); setGameStats(null)
    startSession()
  }

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <div className="page-wrapper">
        <AnimatedBackground />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              width: 64, height: 64, margin: '0 auto 1rem',
              borderRadius: 18, background: `${modeCfg.color}15`,
              border: `1px solid ${modeCfg.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: modeCfg.color,
            }}>
              <ModeIcon size={28} />
            </div>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem', width: 28, height: 28 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              AI preparing your <span style={{ color: modeCfg.color, fontWeight: 600 }}>{modeCfg.name}</span>…
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── GAME OVER ──
  if (phase === 'gameover') {
    const accuracy = gameStats ? Math.round((gameStats.correct_answers / Math.max(gameStats.total_questions, 1)) * 100) : 0
    const tier = accuracy >= 80 ? { label: 'Outstanding', icon: <Trophy size={36} />, color: '#fbbf24' }
              : accuracy >= 50 ? { label: 'Solid run',   icon: <Sparkles size={36} />, color: 'var(--accent-bright)' }
              :                  { label: 'Keep going',  icon: <Flame size={36} />, color: '#f59e0b' }

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
              style={{ background: `linear-gradient(135deg, ${tier.color}, ${modeCfg.color})`, color: 'white' }}
            >
              {tier.icon}
            </motion.div>

            <motion.h1
              className="gameover-headline"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease }}
            >
              {tier.label}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}
            >
              {modeCfg.name} complete
            </motion.p>

            <div className="gameover-stats">
              {[
                { v: `${accuracy}%`, l: 'Accuracy', c: 'var(--accent-bright)' },
                { v: `+${xpGained}`, l: 'XP earned', c: 'var(--xp)' },
                { v: `${gameStats?.correct_answers || 0}/${gameStats?.total_questions || 0}`, l: 'Correct', c: 'var(--success)' },
              ].map((s, i) => (
                <motion.div
                  key={i} className="gameover-stat"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 + i * 0.08, ease }}
                >
                  <div className="v" style={{ color: s.c }}>{s.v}</div>
                  <div className="l">{s.l}</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              style={{ display: 'flex', gap: '0.625rem' }}
            >
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={restart}>
                <RotateCcw size={16} /> Play again
              </button>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => navigate('/games')}>
                Back to arcade
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── MEMORY MATCH MODE ──
  if (mode === 'memory_match') {
    return (
      <div className="page-wrapper">
        <AnimatedBackground />
        <div className="game-shell">
          <div className="game-hud">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/games')}>
              <X size={14} /> Quit
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="hud-chip">Moves {memMoves}</span>
              <span className="hud-chip hud-chip-xp"><Zap size={12} /> {score}</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            style={{ textAlign: 'center', marginBottom: '1.5rem' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.85rem', borderRadius: 999,
              background: `${modeCfg.color}12`, color: modeCfg.color,
              border: `1px solid ${modeCfg.color}25`,
              fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              <Brain size={13} /> Memory match
            </div>
            <div style={{ marginTop: '0.625rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {matched.length}/6 pairs matched
            </div>
          </motion.div>

          <div className="mem-grid">
            {memCards.map((card, i) => {
              const isFlipped = flipped.includes(i)
              const isMatched = matched.includes(card.pairId)
              return (
                <div
                  key={i}
                  className={`mem-card ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
                  onClick={() => flipMemCard(i)}
                >
                  <div className="mem-face mem-face-back">?</div>
                  <div className="mem-face mem-face-front">{card.text}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN GAME HUD ──
  const timerPct = Math.max(0, (timer / timerMax) * 100)
  const timerColor = timer <= 5 ? 'var(--danger)' : timer <= 10 ? 'var(--warning)' : modeCfg.color
  const correctIdx = question ? findCorrectFromHints(question) : 0

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <div className="game-shell">
        {/* HUD */}
        <div className="game-hud">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/games')}>
            <X size={14} /> Quit
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="hud-chip hud-chip-xp"><Zap size={12} /> {score}</span>
            <AnimatePresence>
              {streak > 1 && (
                <motion.span
                  key="streak"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="hud-chip hud-chip-streak"
                >
                  <Flame size={12} /> {streak}x
                </motion.span>
              )}
            </AnimatePresence>
            <div className="hud-chip hud-lives" aria-label={`${lives} lives remaining`}>
              {Array(3).fill(0).map((_, i) => (
                <Heart
                  key={i} size={14}
                  fill={i < lives ? '#ef4444' : 'transparent'}
                  color={i < lives ? '#ef4444' : 'var(--text-muted)'}
                  strokeWidth={2}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="game-progress">
          <div className="game-progress-head">
            <span className="mode-name"><ModeIcon size={14} style={{ color: modeCfg.color }} /> {modeCfg.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{questionNum}/{totalQ}</span>
          </div>
          <div className="game-progress-bar">
            <div
              className="game-progress-fill"
              style={{
                width: `${(questionNum / totalQ) * 100}%`,
                background: `linear-gradient(90deg, ${modeCfg.color}, ${modeCfg.color}cc)`,
                boxShadow: `0 0 12px ${modeCfg.color}40`,
              }}
            />
          </div>
        </div>

        {/* Timer */}
        <div
          className={`timer-ring ${timer <= 5 ? 'urgent' : ''}`}
          style={{
            ['--timer-color']: timerColor,
            ['--timer-pct']: `${timerPct}%`,
          }}
        >
          <div className="timer-ring-inner" style={{ color: timerColor }}>{timer}</div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionNum}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
            className="question-card"
          >
            {question?.subject && <span className="q-subject">{question.subject}</span>}
            <div className="q-text">{mode === 'true_false_blitz' ? tfStatement : question?.content}</div>
          </motion.div>
        </AnimatePresence>

        {/* TRUE/FALSE */}
        {mode === 'true_false_blitz' && (
          <div className="tf-grid">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => submitTrueFalse(true)} disabled={!!feedback}
              className={`tf-btn tf-true ${feedback && tfCorrectAnswer ? 'correct' : feedback && !tfCorrectAnswer && false ? '' : ''}`}
            >
              <CheckCircle size={24} /> TRUE
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => submitTrueFalse(false)} disabled={!!feedback}
              className={`tf-btn tf-false ${feedback && !tfCorrectAnswer ? 'correct' : ''}`}
            >
              <XCircle size={24} /> FALSE
            </motion.button>
          </div>
        )}

        {/* SPEED TYPE / WORD SCRAMBLE */}
        {(mode === 'speed_type' || mode === 'word_scramble') && (
          <div>
            {mode === 'word_scramble' && (
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '0.625rem' }}>
                  Unscramble
                </p>
                <div className="scramble-row">
                  {scrambled.split('').map((ch, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, rotate: -10 }}
                      animate={{ opacity: 1, y: 0, rotate: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.04, ease }}
                      className="scramble-tile"
                      style={{ color: modeCfg.color }}
                    >
                      {ch === ' ' ? '·' : ch}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <input
                className="input"
                value={typedAnswer}
                onChange={e => setTypedAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitTypedAnswer()}
                placeholder="Type your answer…"
                disabled={!!feedback}
                style={{ fontSize: '1rem', textAlign: 'center' }}
                autoFocus
              />
              <button
                className="btn btn-primary"
                onClick={submitTypedAnswer}
                disabled={!!feedback || !typedAnswer}
                aria-label="Submit answer"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* MCQ */}
        {(mode === 'lightning_quiz' || mode === 'boss_battle') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {(question?.options || []).map((opt, i) => {
              const labels = ['A', 'B', 'C', 'D']
              let cls = ''
              if (feedback && selectedAnswer === i) cls = feedback.correct ? 'correct' : 'wrong'
              if (feedback && !feedback.correct && i === correctIdx) cls = 'correct'
              return (
                <motion.button
                  key={i}
                  className={`option-btn ${cls}`}
                  onClick={() => submitAnswer(i)}
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

        {/* Feedback */}
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
                ? <><Sparkles size={16} /> Correct{streak > 1 ? ` · ${streak}x streak` : ''}</>
                : <><XCircle size={16} /> {feedback.explanation || 'Wrong'}</>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
