import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../api'
import { Zap, Heart, Clock, X, CheckCircle, XCircle, ArrowRight, Sparkles, RotateCcw } from 'lucide-react'

export default function GamePlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') || 'lightning_quiz'
  const subject = params.get('subject') || ''

  const [phase, setPhase] = useState('loading') // loading, playing, result, gameover
  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [questionNum, setQuestionNum] = useState(0)
  const [totalQ, setTotalQ] = useState(10)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [timer, setTimer] = useState(30)
  const [timerMax, setTimerMax] = useState(30)
  const [feedback, setFeedback] = useState(null) // { correct, explanation }
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [xpGained, setXpGained] = useState(0)
  const [streak, setStreak] = useState(0)
  const [gameStats, setGameStats] = useState(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Memory Match state
  const [memCards, setMemCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [memMoves, setMemMoves] = useState(0)

  // Word Scramble state
  const [scrambled, setScrambled] = useState('')
  const [typedAnswer, setTypedAnswer] = useState('')

  // True/False state
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
      const res = await API.post('/games/sessions/start', { subject: subject || undefined })
      setSessionId(res.data.session_id)
      if (mode === 'memory_match') {
        await loadMemoryCards(res.data.session_id)
      } else {
        await loadQuestion(res.data.session_id)
      }
    } catch (err) {
      console.error(err)
      navigate('/games')
    }
  }

  async function loadQuestion(sid) {
    try {
      const res = await API.get(`/games/sessions/${sid}/next-question`)
      const q = res.data
      setQuestion(q)
      setQuestionNum(q.question_number || questionNum + 1)
      setTotalQ(q.total_questions || 10)
      setSelectedAnswer(null)
      setFeedback(null)
      setTimer(mode === 'true_false_blitz' ? 10 : mode === 'speed_type' ? 20 : 30)
      setTimerMax(mode === 'true_false_blitz' ? 10 : mode === 'speed_type' ? 20 : 30)
      startTimeRef.current = Date.now()
      setPhase('playing')

      if (mode === 'word_scramble') {
        const answer = (q.options[q.hint_eliminated ? q.hint_eliminated[0] === q.correct_option ? 1 : 0 : 0] || 'answer')
        const correct = q.options[0] // We show the question, user types answer
        setScrambled(shuffleWord(correct))
        setTypedAnswer('')
      }
      if (mode === 'true_false_blitz') {
        const isTrue = Math.random() > 0.4
        if (isTrue) {
          setTfStatement(`${q.content} → ${q.options[q.hint_eliminated ? findCorrectFromHints(q) : 0]}`)
          setTfCorrectAnswer(true)
        } else {
          const wrongIdx = q.hint_eliminated ? q.hint_eliminated[0] : (q.hint_eliminated?.[0] ?? 0)
          setTfStatement(`${q.content} → ${q.options[wrongIdx]}`)
          setTfCorrectAnswer(false)
        }
      }
    } catch {
      await endSession(sid)
    }
  }

  function findCorrectFromHints(q) {
    const allIdx = [0, 1, 2, 3]
    const notElim = allIdx.filter(i => !q.hint_eliminated.includes(i))
    return notElim[0]
  }

  async function loadMemoryCards(sid) {
    try {
      const cards = []
      for (let i = 0; i < 6; i++) {
        const res = await API.get(`/games/sessions/${sid}/next-question`)
        const q = res.data
        const correct = q.options[findCorrectFromHints(q)]
        cards.push(
          { id: `q${i}`, type: 'question', text: q.content, pairId: i, qId: q.id, correctOption: findCorrectFromHints(q) },
          { id: `a${i}`, type: 'answer', text: correct, pairId: i, qId: q.id, correctOption: findCorrectFromHints(q) }
        )
      }
      // Shuffle
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]]
      }
      setMemCards(cards)
      setFlipped([])
      setMatched([])
      setMemMoves(0)
      setPhase('playing')
      startTimeRef.current = Date.now()
    } catch {
      navigate('/games')
    }
  }

  function shuffleWord(word) {
    const arr = word.split('')
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.join('')
  }

  function handleTimeout() {
    setLives(l => l - 1)
    setFeedback({ correct: false, explanation: 'Time ran out!' })
    setPhase('result')
    if (lives <= 1) setTimeout(() => endSession(sessionId), 1500)
    else setTimeout(() => loadQuestion(sessionId), 2000)
  }

  async function submitAnswer(answerIdx) {
    if (feedback) return
    clearInterval(timerRef.current)
    setSelectedAnswer(answerIdx)
    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000)

    try {
      const res = await API.post(`/games/sessions/${sessionId}/answer`, {
        question_id: question.id,
        answer: answerIdx,
        response_time_sec: responseTime,
        hint_used: false,
      })

      const isCorrect = res.data.correct
      setFeedback({
        correct: isCorrect,
        explanation: res.data.explanation || '',
      })

      if (isCorrect) {
        setScore(s => s + Math.round(res.data.xp_gained || 10))
        setXpGained(x => x + (res.data.xp_gained || 10))
        setStreak(s => s + 1)
      } else {
        setLives(l => l - 1)
        setStreak(0)
      }

      setPhase('result')

      if (!isCorrect && lives <= 1) {
        setTimeout(() => endSession(sessionId), 2000)
      } else if (questionNum >= totalQ) {
        setTimeout(() => endSession(sessionId), 2000)
      } else {
        setTimeout(() => loadQuestion(sessionId), 2000)
      }
    } catch (err) {
      console.error(err)
    }
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
        response_time_sec: responseTime,
        hint_used: false,
      })
    } catch {}

    setFeedback({ correct: isCorrect, explanation: isCorrect ? 'Correct!' : 'Wrong!' })
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
    // Check if typed answer matches any option
    const matchIdx = question.options.findIndex(o => o.toLowerCase().trim() === typedAnswer.toLowerCase().trim())
    const correctIdx = findCorrectFromHints(question)
    const isCorrect = matchIdx === correctIdx

    try {
      await API.post(`/games/sessions/${sessionId}/answer`, {
        question_id: question.id,
        answer: matchIdx >= 0 ? matchIdx : 99,
        response_time_sec: responseTime,
      })
    } catch {}

    setFeedback({ correct: isCorrect, explanation: isCorrect ? 'Perfect!' : `Answer: ${question.options[correctIdx]}` })
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
      // Refresh user data
      const userRes = await API.get(`/users/${JSON.parse(localStorage.getItem('user') || '{}').id}/profile`)
      if (userRes.data) localStorage.setItem('user', JSON.stringify(userRes.data))
    } catch {}
    setPhase('gameover')
  }

  const modeConfig = {
    lightning_quiz: { color: '#10b981', name: 'Lightning Quiz', icon: '⚡' },
    memory_match: { color: '#8b5cf6', name: 'Memory Match', icon: '🧠' },
    speed_type: { color: '#f59e0b', name: 'Speed Type', icon: '⌨️' },
    true_false_blitz: { color: '#ec4899', name: 'True/False Blitz', icon: '🎯' },
    word_scramble: { color: '#06b6d4', name: 'Word Scramble', icon: '🔀' },
    boss_battle: { color: '#ef4444', name: 'Boss Battle', icon: '⚔️' },
  }
  const mc = modeConfig[mode] || modeConfig.lightning_quiz

  // ── GAME OVER SCREEN ──
  if (phase === 'gameover') {
    const accuracy = gameStats ? Math.round((gameStats.correct_answers / Math.max(gameStats.total_questions, 1)) * 100) : 0
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '2.5rem', animation: 'fadeSlideUp 0.5s ease both' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{accuracy >= 70 ? '🏆' : accuracy >= 40 ? '💪' : '📚'}</div>
          <h1 style={{ marginBottom: '0.25rem' }}>{accuracy >= 70 ? 'Amazing!' : accuracy >= 40 ? 'Good Try!' : 'Keep Practicing!'}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{mc.name} Complete</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card card" style={{ padding: '1rem' }}>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-card card" style={{ padding: '1rem' }}>
              <div className="stat-value" style={{ color: 'var(--xp)' }}>+{xpGained}</div>
              <div className="stat-label">XP Earned</div>
            </div>
            <div className="stat-card card" style={{ padding: '1rem' }}>
              <div className="stat-value" style={{ color: 'var(--secondary)' }}>{gameStats?.correct_answers || 0}/{gameStats?.total_questions || 0}</div>
              <div className="stat-label">Correct</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => { setPhase('loading'); setScore(0); setLives(3); setXpGained(0); setStreak(0); setQuestionNum(0); startSession() }}>
              <RotateCcw size={18} /> Play Again
            </button>
            <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => navigate('/games')}>
              Back to Arcade
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem', width: 48, height: 48 }} />
          <p style={{ color: 'var(--text-muted)' }}>AI is preparing your challenge...</p>
        </div>
      </div>
    )
  }

  // ── MEMORY MATCH MODE ──
  if (mode === 'memory_match') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* HUD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/games')}><X size={16} /> Quit</button>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Moves: {memMoves}</span>
              <span className="badge badge-primary">{matched.length}/6 Matched</span>
            </div>
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: mc.color }}>{mc.icon} {mc.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {memCards.map((card, i) => {
              const isFlipped = flipped.includes(i) || matched.includes(card.pairId)
              const isMatched = matched.includes(card.pairId)
              return (
                <div key={i} onClick={() => flipMemCard(i)}
                  style={{
                    aspectRatio: '1', borderRadius: 'var(--radius)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.75rem', textAlign: 'center',
                    fontSize: card.type === 'question' ? '0.7rem' : '0.8rem',
                    fontWeight: card.type === 'answer' ? 600 : 400,
                    cursor: isFlipped ? 'default' : 'pointer',
                    transition: 'all 0.3s',
                    transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(0deg)',
                    background: isMatched ? 'var(--primary-dim)' : isFlipped ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    border: `2px solid ${isMatched ? 'var(--primary)' : isFlipped ? 'var(--border-hover)' : 'var(--border)'}`,
                    color: isFlipped ? 'var(--text-heading)' : 'var(--text-muted)',
                    boxShadow: isMatched ? '0 0 15px var(--primary-glow)' : 'none',
                  }}>
                  {isFlipped ? card.text : '?'}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN GAME HUD ──
  const timerPct = (timer / timerMax) * 100
  const timerColor = timer <= 5 ? 'var(--danger)' : timer <= 10 ? 'var(--warning)' : 'var(--primary)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Top HUD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/games')}><X size={16} /> Quit</button>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className="xp-badge"><Zap size={12} /> {score}</span>
            {streak > 1 && <span className="streak-badge" style={{ animation: 'correctPulse 0.5s ease' }}>🔥 {streak}x</span>}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {Array(3).fill(0).map((_, i) => (
                <Heart key={i} size={16} fill={i < lives ? '#ef4444' : 'none'} color={i < lives ? '#ef4444' : 'var(--text-muted)'} />
              ))}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            <span>{mc.icon} {mc.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{questionNum}/{totalQ}</span>
          </div>
          <div className="progress-bar" style={{ height: 4 }}>
            <div className="progress-fill" style={{ width: `${(questionNum / totalQ) * 100}%`, background: mc.color }} />
          </div>
        </div>

        {/* Timer */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: `3px solid ${timerColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700,
            color: timerColor,
            boxShadow: timer <= 5 ? `0 0 20px ${timerColor}40` : 'none',
            animation: timer <= 5 ? 'correctPulse 0.5s ease infinite' : 'none',
          }}>
            {timer}
          </div>
        </div>

        {/* Question */}
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
          {question?.subject && <span className="badge badge-secondary" style={{ marginBottom: '0.75rem' }}>{question.subject}</span>}
          <h2 style={{ fontSize: '1.25rem', lineHeight: 1.5 }}>{question?.content}</h2>
        </div>

        {/* TRUE/FALSE MODE */}
        {mode === 'true_false_blitz' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-heading)' }}>{tfStatement}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button className={`option-btn ${feedback?.correct === true && true === tfCorrectAnswer ? 'correct' : feedback?.correct === false && true !== tfCorrectAnswer ? '' : ''}`}
                onClick={() => submitTrueFalse(true)} disabled={!!feedback}
                style={{ justifyContent: 'center', background: feedback && tfCorrectAnswer ? 'var(--primary-dim)' : undefined, borderColor: feedback && tfCorrectAnswer ? 'var(--primary)' : undefined }}>
                <CheckCircle size={20} /> TRUE
              </button>
              <button className={`option-btn`}
                onClick={() => submitTrueFalse(false)} disabled={!!feedback}
                style={{ justifyContent: 'center', background: feedback && !tfCorrectAnswer ? 'var(--primary-dim)' : undefined, borderColor: feedback && !tfCorrectAnswer ? 'var(--primary)' : undefined }}>
                <XCircle size={20} /> FALSE
              </button>
            </div>
          </div>
        )}

        {/* SPEED TYPE / WORD SCRAMBLE */}
        {(mode === 'speed_type' || mode === 'word_scramble') && (
          <div style={{ marginBottom: '1.5rem' }}>
            {mode === 'word_scramble' && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Unscramble:</p>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.2em', color: mc.color }}>
                  {scrambled}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input className="input" value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitTypedAnswer()}
                placeholder="Type your answer..." disabled={!!feedback}
                style={{ fontSize: '1.1rem', textAlign: 'center' }} autoFocus />
              <button className="btn btn-primary" onClick={submitTypedAnswer} disabled={!!feedback || !typedAnswer}>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* MCQ OPTIONS (Lightning Quiz / Boss Battle) */}
        {(mode === 'lightning_quiz' || mode === 'boss_battle') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {(question?.options || []).map((opt, i) => {
              const labels = ['A', 'B', 'C', 'D']
              let cls = ''
              if (feedback && selectedAnswer === i) cls = feedback.correct ? 'correct' : 'wrong'
              if (feedback && !feedback.correct && i === findCorrectFromHints(question)) cls = 'correct'

              return (
                <button key={i} className={`option-btn ${cls}`} onClick={() => submitAnswer(i)} disabled={!!feedback}>
                  <span className="option-label">{labels[i]}</span>
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* Feedback Toast */}
        {feedback && (
          <div className="card" style={{
            marginTop: '1.25rem', textAlign: 'center', padding: '1rem',
            background: feedback.correct ? 'var(--primary-dim)' : 'var(--danger-dim)',
            borderColor: feedback.correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            animation: 'fadeSlideUp 0.3s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, color: feedback.correct ? 'var(--primary)' : 'var(--danger)' }}>
              {feedback.correct ? <><Sparkles size={18} /> Correct! +{streak > 1 ? `${streak}x bonus` : 'XP'}</> : <><XCircle size={18} /> {feedback.explanation}</>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
