import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'
import { Users, Play, Copy, Check, X, ArrowRight, Crown, Clock } from 'lucide-react'
import './CrewQuest.css'

const POLL_MS = 1500

export default function CrewQuest() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [phase, setPhase] = useState('menu') // menu, lobby, playing, taskview, results
  const [room, setRoom] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [subject, setSubject] = useState('all')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [selectedAns, setSelectedAns] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [timer, setTimer] = useState(180)
  const pollRef = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  // Poll room state
  useEffect(() => {
    if (!room?.code || phase === 'menu' || phase === 'results') return
    pollRef.current = setInterval(async () => {
      try {
        const r = await API.get(`/games/crew-quest/room/${room.code}`)
        setRoom(r.data)
        if (r.data.status === 'ended' && phase !== 'results') setPhase('results')
        if (r.data.status === 'playing' && phase === 'lobby') { setPhase('playing'); setTimer(r.data.timer || 180) }
      } catch {}
    }, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [room?.code, phase])

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { endGame(); return 0 } return t - 1 })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  async function createRoom() {
    setError('')
    try {
      const r = await API.post('/games/crew-quest/create', { host_id: user.id, host_name: user.display_name, subject, max_players: 8, rounds: 8, timer: 180 })
      setRoom(r.data)
      setPhase('lobby')
    } catch (e) { setError(e.response?.data?.error || 'Failed') }
  }

  async function joinRoom() {
    setError('')
    if (!joinCode.trim()) return setError('Enter a room code')
    try {
      const r = await API.post('/games/crew-quest/join', { room_code: joinCode.toUpperCase(), user_id: user.id, user_name: user.display_name })
      setRoom(r.data)
      setPhase('lobby')
    } catch (e) { setError(e.response?.data?.error || 'Room not found') }
  }

  async function toggleReady() {
    try {
      const r = await API.post('/games/crew-quest/ready', { room_code: room.code, user_id: user.id })
      setRoom(r.data)
    } catch {}
  }

  async function startGame() {
    try {
      const r = await API.post('/games/crew-quest/start', { room_code: room.code, user_id: user.id })
      setRoom(r.data)
      setPhase('playing')
      setTimer(r.data.timer || 180)
    } catch (e) { setError(e.response?.data?.error || 'Cannot start') }
  }

  function openTask(task) {
    if (task.completed) return
    setCurrentTask(task)
    setSelectedAns(null)
    setFeedback(null)
    setPhase('taskview')
    startRef.current = Date.now()
  }

  async function submitAnswer(idx) {
    if (feedback) return
    setSelectedAns(idx)
    const rt = Math.round((Date.now() - startRef.current) / 1000)
    try {
      const r = await API.post('/games/crew-quest/complete-task', { room_code: room.code, user_id: user.id, task_id: currentTask.id, answer: idx, response_time: rt })
      setFeedback(r.data)
      setRoom(r.data.room)
      setTimeout(() => { setPhase(r.data.game_ended ? 'results' : 'playing'); setCurrentTask(null) }, 1800)
    } catch {}
  }

  async function endGame() {
    clearInterval(timerRef.current)
    try { const r = await API.post('/games/crew-quest/end', { room_code: room.code }); setRoom(r.data) } catch {}
    setPhase('results')
  }

  function copyCode() { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const me = room?.players?.find(p => p.id === user.id)
  const isHost = room?.host_id === user.id
  const mins = Math.floor(timer / 60)
  const secs = timer % 60

  // ─── MENU ───
  if (phase === 'menu') return (
    <div className="cq-bg">
      <div className="cq-stars" />
      <div className="cq-menu">
        <div className="cq-logo">
          <div className="cq-crewmate" style={{ background: '#ef4444', width: 80, height: 100 }}>
            <div className="cq-visor" />
          </div>
          <h1 className="cq-title">CREW QUEST</h1>
          <p className="cq-sub">Among Us × Education</p>
        </div>

        {error && <div className="cq-error">{error}</div>}

        <div className="cq-menu-section">
          <label className="cq-label">Subject</label>
          <select className="cq-select" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="all">All Subjects</option>
            <option value="math">Math</option>
            <option value="science">Science</option>
            <option value="english">English</option>
            <option value="general">General Knowledge</option>
          </select>
          <button className="cq-btn cq-btn-create" onClick={createRoom}>
            <Play size={20} /> CREATE ROOM
          </button>
        </div>

        <div className="cq-divider"><span>OR</span></div>

        <div className="cq-menu-section">
          <label className="cq-label">Room Code</label>
          <input className="cq-input" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" maxLength={6} onKeyDown={e => e.key === 'Enter' && joinRoom()} />
          <button className="cq-btn cq-btn-join" onClick={joinRoom}>
            <Users size={20} /> JOIN ROOM
          </button>
        </div>

        <button className="cq-btn-back" onClick={() => navigate('/games')}>← Back to Arcade</button>
      </div>
    </div>
  )

  // ─── LOBBY ───
  if (phase === 'lobby') return (
    <div className="cq-bg">
      <div className="cq-stars" />
      <div className="cq-lobby">
        <div className="cq-lobby-header">
          <h1 className="cq-title" style={{ fontSize: '2rem' }}>LOBBY</h1>
          <div className="cq-code-box" onClick={copyCode}>
            <span className="cq-code">{room.code}</span>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </div>
          <p style={{ color: '#8b9cb6', fontSize: '0.8rem' }}>Share this code with friends</p>
        </div>

        <div className="cq-players-grid">
          {room.players.map(p => (
            <div key={p.id} className={`cq-player-card ${p.ready ? 'ready' : ''}`}>
              <div className="cq-crewmate" style={{ background: p.color, width: 50, height: 62 }}>
                <div className="cq-visor" />
              </div>
              <div className="cq-player-name">{p.name}</div>
              {p.is_host && <Crown size={14} style={{ color: '#fbbf24', marginTop: 2 }} />}
              <div className={`cq-ready-tag ${p.ready ? 'on' : ''}`}>{p.ready ? 'READY' : 'NOT READY'}</div>
            </div>
          ))}
          {Array(room.max_players - room.players.length).fill(0).map((_, i) => (
            <div key={`e${i}`} className="cq-player-card empty">
              <div className="cq-crewmate-empty">?</div>
              <div className="cq-player-name" style={{ color: '#3a4660' }}>Waiting...</div>
            </div>
          ))}
        </div>

        <div className="cq-lobby-footer">
          <button className="cq-btn cq-btn-ready" onClick={toggleReady}>
            {me?.ready ? '✓ READY' : 'CLICK WHEN READY'}
          </button>
          {isHost && (
            <button className="cq-btn cq-btn-start" onClick={startGame} disabled={room.players.length < 1}>
              <Play size={20} /> START GAME
            </button>
          )}
        </div>

        <button className="cq-btn-back" onClick={() => { API.post('/games/crew-quest/leave', { room_code: room.code, user_id: user.id }); setPhase('menu') }}>
          ← Leave Room
        </button>
      </div>
    </div>
  )

  // ─── TASK VIEW (answering question) ───
  if (phase === 'taskview' && currentTask) return (
    <div className="cq-bg">
      <div className="cq-task-modal">
        <div className="cq-task-header">
          <span className="cq-task-location">📍 {currentTask.location?.name || 'Ship'}</span>
          <button className="cq-close" onClick={() => { setPhase('playing'); setCurrentTask(null) }}><X size={20} /></button>
        </div>
        <div className="cq-task-question">{currentTask.question}</div>
        <div className="cq-task-options">
          {currentTask.options.map((opt, i) => {
            let cls = ''
            if (feedback && selectedAns === i) cls = feedback.correct ? 'correct' : 'wrong'
            if (feedback && !feedback.correct && i === currentTask.correct_option) cls = 'correct'
            return (
              <button key={i} className={`cq-option ${cls}`} onClick={() => submitAnswer(i)} disabled={!!feedback}>
                <span className="cq-opt-label">{'ABCD'[i]}</span> {opt}
              </button>
            )
          })}
        </div>
        {feedback && (
          <div className={`cq-feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
            {feedback.correct ? '✅ Task Complete! +XP' : `❌ ${feedback.explanation}`}
          </div>
        )}
      </div>
    </div>
  )

  // ─── RESULTS ───
  if (phase === 'results') {
    const sorted = [...(room?.players || [])].sort((a, b) => b.score - a.score)
    return (
      <div className="cq-bg">
        <div className="cq-stars" />
        <div className="cq-results">
          <h1 className="cq-title">GAME OVER</h1>
          <div className="cq-podium">
            {sorted.slice(0, 3).map((p, i) => (
              <div key={p.id} className={`cq-podium-place p${i + 1}`}>
                <div className="cq-crewmate" style={{ background: p.color, width: i === 0 ? 60 : 46, height: i === 0 ? 75 : 58 }}>
                  <div className="cq-visor" />
                </div>
                {i === 0 && <span style={{ fontSize: '1.5rem' }}>👑</span>}
                <div className="cq-player-name">{p.name}</div>
                <div className="cq-score-big">{p.score} pts</div>
                <div className="cq-tasks-done">{p.tasks_completed}/{p.tasks.length} tasks</div>
              </div>
            ))}
          </div>
          <div className="cq-full-scores">
            {sorted.map((p, i) => (
              <div key={p.id} className="cq-score-row">
                <span className="cq-rank">#{i + 1}</span>
                <div className="cq-crewmate-tiny" style={{ background: p.color }}><div className="cq-visor-tiny" /></div>
                <span className="cq-sname">{p.name}</span>
                <span className="cq-stasks">{p.tasks_completed}/{p.tasks.length}</span>
                <span className="cq-spts">{p.score} pts</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="cq-btn cq-btn-create" onClick={() => setPhase('menu')}>NEW GAME</button>
            <button className="cq-btn cq-btn-join" onClick={() => navigate('/games')}>ARCADE</button>
          </div>
        </div>
      </div>
    )
  }

  // ─── PLAYING (Ship Map) ───
  const myTasks = me?.tasks || []
  const completed = myTasks.filter(t => t.completed).length

  return (
    <div className="cq-bg">
      {/* HUD */}
      <div className="cq-hud">
        <div className="cq-hud-left">
          <div className="cq-crewmate-tiny" style={{ background: me?.color }}><div className="cq-visor-tiny" /></div>
          <span style={{ fontWeight: 700, color: '#fff' }}>{me?.name}</span>
          <span className="cq-badge-score">{me?.score} pts</span>
        </div>
        <div className="cq-hud-center">
          <Clock size={16} style={{ color: timer < 30 ? '#ef4444' : '#8b9cb6' }} />
          <span className="cq-timer" style={{ color: timer < 30 ? '#ef4444' : '#fff' }}>{mins}:{secs.toString().padStart(2, '0')}</span>
        </div>
        <div className="cq-hud-right">
          <span style={{ color: '#8b9cb6', fontSize: '0.8rem' }}>Tasks: {completed}/{myTasks.length}</span>
          {isHost && <button className="cq-btn-end" onClick={endGame}>END</button>}
        </div>
      </div>

      {/* Ship Map */}
      <div className="cq-ship">
        <div className="cq-ship-inner">
          {/* Ship hull SVG */}
          <svg viewBox="0 0 100 100" className="cq-ship-svg">
            <path d="M50 5 L85 20 L90 45 L85 70 L70 85 L30 85 L15 70 L10 45 L15 20 Z" fill="none" stroke="#2a3a5c" strokeWidth="0.5" />
            <line x1="50" y1="5" x2="50" y2="85" stroke="#1a2640" strokeWidth="0.3" />
            <line x1="15" y1="45" x2="85" y2="45" stroke="#1a2640" strokeWidth="0.3" />
          </svg>

          {/* Task nodes */}
          {myTasks.map(task => (
            <div key={task.id} className={`cq-task-node ${task.completed ? (task.correct ? 'done' : 'failed') : 'pending'}`}
              style={{ left: `${task.location.x}%`, top: `${task.location.y}%` }}
              onClick={() => openTask(task)}>
              <div className="cq-task-dot">{task.completed ? (task.correct ? '✓' : '✗') : '!'}</div>
              <div className="cq-task-label">{task.location.name}</div>
            </div>
          ))}

          {/* Other players on map */}
          {room?.players?.filter(p => p.id !== user.id).map(p => {
            const activeTask = p.tasks.find(t => !t.completed)
            const pos = activeTask?.location || { x: 50, y: 50 }
            return (
              <div key={p.id} className="cq-other-player" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <div className="cq-crewmate-map" style={{ background: p.color }}><div className="cq-visor-map" /></div>
                <div className="cq-player-tag">{p.crew_name} {p.tasks_completed}/{p.tasks.length}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Sidebar */}
      <div className="cq-sidebar">
        <h3 style={{ color: '#fff', margin: '0 0 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tasks</h3>
        {myTasks.map(task => (
          <div key={task.id} className={`cq-sidebar-task ${task.completed ? 'done' : ''}`} onClick={() => openTask(task)}>
            <span className={`cq-task-check ${task.completed ? (task.correct ? 'yes' : 'no') : ''}`}>
              {task.completed ? (task.correct ? '✓' : '✗') : '○'}
            </span>
            <span>{task.location.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
