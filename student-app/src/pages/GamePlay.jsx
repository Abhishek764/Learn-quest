import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Timer, Lightbulb, X } from 'lucide-react'
import API from '../api'

const TOTAL_QUESTIONS = 10

export default function GamePlay() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'lightning_quiz'
  const subject = searchParams.get('subject') || 'general'

  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [hintUsed, setHintUsed] = useState(false)
  const [questionNum, setQuestionNum] = useState(0)
  const [totalXp, setTotalXp] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const [answering, setAnswering] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())

  useEffect(() => {
    startSession()
  }, [])

  async function startSession() {
    try {
      const res = await API.post('/games/sessions/start', { game_mode: mode, subject })
      setSessionId(res.data.session_id)
      await loadQuestion(res.data.session_id)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadQuestion(sid) {
    setLoading(true)
    setSelected(null)
    setResult(null)
    setHintUsed(false)
    setTimeLeft(30)
    setStartTime(Date.now())
    try {
      const res = await API.get(`/games/sessions/${sid || sessionId}/next-question`)
      setQuestion(res.data)
      setQuestionNum(res.data.question_number || questionNum + 1)
    } catch {
      // no more questions
      await endSession(sid || sessionId)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!question || selected !== null || gameOver) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          handleAnswer(-1) // timeout
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [question, selected, gameOver])

  async function handleAnswer(answerIndex) {
    if (answering || selected !== null) return
    setAnswering(true)
    setSelected(answerIndex)

    const responseTime = (Date.now() - startTime) / 1000

    try {
      const res = await API.post(`/games/sessions/${sessionId}/answer`, {
        question_id: question.id,
        answer: answerIndex,
        hint_used: hintUsed,
        response_time_sec: responseTime
      })
      setResult(res.data)
      if (res.data.correct) setCorrectCount(c => c + 1)
      setTotalXp(xp => xp + (res.data.xp_gained || 0))

      if (questionNum >= TOTAL_QUESTIONS) {
        setTimeout(() => endSession(sessionId), 1500)
      } else {
        setTimeout(() => {
          setAnswering(false)
          loadQuestion(sessionId)
        }, 1500)
      }
    } catch (err) {
      setAnswering(false)
    }
  }

  async function endSession(sid) {
    try {
      await API.post(`/games/sessions/${sid}/end`)
    } catch {}
    setGameOver(true)
  }

  function optionStyle(idx) {
    if (selected === null) return 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-white'
    if (result && idx === result.correct_option) return 'bg-green-700 border-green-500 text-white'
    if (idx === selected && result && !result.correct) return 'bg-red-800 border-red-500 text-white'
    return 'bg-gray-700 border-gray-600 text-gray-400'
  }

  if (gameOver) {
    const accuracy = questionNum > 0 ? Math.round((correctCount / questionNum) * 100) : 0
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="bg-gray-700 rounded-xl p-3"><div className="text-green-400 text-xl font-bold">{correctCount}/{questionNum}</div><div className="text-gray-400 text-xs">Score</div></div>
            <div className="bg-gray-700 rounded-xl p-3"><div className="text-blue-400 text-xl font-bold">{accuracy}%</div><div className="text-gray-400 text-xs">Accuracy</div></div>
            <div className="bg-gray-700 rounded-xl p-3"><div className="text-yellow-400 text-xl font-bold">+{totalXp}</div><div className="text-gray-400 text-xs">XP</div></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()} className="flex-1 bg-green-500 hover:bg-green-400 text-white py-2.5 rounded-xl font-semibold">Play Again</button>
            <button onClick={() => navigate('/games')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-semibold">Back to Lobby</button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-green-400 text-xl">Loading question...</div></div>
  }

  const options = question?.options || []
  const timerPct = (timeLeft / 30) * 100

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{questionNum}/{TOTAL_QUESTIONS}</span>
            <div className="flex items-center gap-1.5 text-yellow-400 font-semibold"><span>⚡</span>{totalXp} XP</div>
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
            <Timer size={18} />{timeLeft}s
          </div>
          <button onClick={() => navigate('/games')} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>

        {/* Timer bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
          <div className={`h-2 rounded-full transition-all ${timeLeft <= 10 ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${timerPct}%` }} />
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full capitalize">{question?.subject}</span>
            <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">Difficulty: {Math.round((question?.difficulty || 0.5) * 100)}%</span>
          </div>
          <p className="text-white text-lg font-medium">{question?.content}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
              className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${optionStyle(idx)}`}
            >
              <span className="text-gray-400 text-sm mr-2">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          ))}
        </div>

        {/* Hint + explanation */}
        <div className="flex items-center justify-between">
          {!hintUsed && selected === null && (
            <button
              onClick={() => setHintUsed(true)}
              className="flex items-center gap-1.5 text-yellow-400 text-sm hover:text-yellow-300"
            >
              <Lightbulb size={16} /> Use Hint (-5 XP)
            </button>
          )}
          {hintUsed && <div className="text-yellow-400 text-sm flex items-center gap-1"><Lightbulb size={14} /> Hint active</div>}
          {result && (
            <div className={`text-sm px-3 py-1.5 rounded-lg ${result.correct ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {result.correct ? `✓ Correct! +${result.xp_gained} XP` : `✗ ${result.explanation || 'Wrong answer'}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
