import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'
import { Users, Play, Copy, Check, X, Crown, Clock } from 'lucide-react'
import './CrewQuest.css'

const POLL_MS = 1500
const COLORS = ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#f97316','#e2e8f0','#92400e']

function Crewmate({ color, size = 'md' }) {
  return (
    <div className={`crewmate crewmate-${size}`}>
      <div className="crewmate-body" style={{ background: color }}>
        <div className="crewmate-backpack" style={{ background: color }} />
        <div className="crewmate-leg-r" style={{ background: color }} />
      </div>
    </div>
  )
}

export default function CrewQuest() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [phase, setPhase] = useState('menu')
  const [room, setRoom] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [subject, setSubject] = useState('all')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [selectedAns, setSelectedAns] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [timer, setTimer] = useState(180)
  const [showShhh, setShowShhh] = useState(false)
  const pollRef = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!room?.code || phase === 'menu' || phase === 'results') return
    pollRef.current = setInterval(async () => {
      try {
        const r = await API.get(`/games/crew-quest/room/${room.code}`)
        setRoom(r.data)
        if (r.data.status === 'ended' && phase !== 'results') setPhase('results')
        if (r.data.status === 'playing' && phase === 'lobby') { setShowShhh(true); setTimeout(() => { setShowShhh(false); setPhase('playing'); setTimer(r.data.timer || 180) }, 3000) }
      } catch {}
    }, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [room?.code, phase])

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => setTimer(t => { if (t <= 1) { endGame(); return 0 } return t - 1 }), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  async function createRoom() {
    setError('')
    try {
      const r = await API.post('/games/crew-quest/create', { host_id: user.id, host_name: user.display_name, subject, max_players: 8, rounds: 8, timer: 180 })
      setRoom(r.data); setPhase('lobby')
    } catch (e) { setError(e.response?.data?.error || 'Failed') }
  }

  async function joinRoom() {
    setError('')
    if (!joinCode.trim()) return setError('Enter a room code')
    try {
      const r = await API.post('/games/crew-quest/join', { room_code: joinCode.toUpperCase(), user_id: user.id, user_name: user.display_name })
      setRoom(r.data); setPhase('lobby')
    } catch (e) { setError(e.response?.data?.error || 'Room not found') }
  }

  async function toggleReady() {
    try { const r = await API.post('/games/crew-quest/ready', { room_code: room.code, user_id: user.id }); setRoom(r.data) } catch {}
  }

  async function startGame() {
    try {
      const r = await API.post('/games/crew-quest/start', { room_code: room.code, user_id: user.id })
      setRoom(r.data); setShowShhh(true)
      setTimeout(() => { setShowShhh(false); setPhase('playing'); setTimer(r.data.timer || 180) }, 3000)
    } catch (e) { setError(e.response?.data?.error || 'Cannot start') }
  }

  function openTask(task) { if (task.completed) return; setCurrentTask(task); setSelectedAns(null); setFeedback(null); setPhase('taskview'); startRef.current = Date.now() }

  async function submitAnswer(idx) {
    if (feedback) return; setSelectedAns(idx)
    const rt = Math.round((Date.now() - startRef.current) / 1000)
    try {
      const r = await API.post('/games/crew-quest/complete-task', { room_code: room.code, user_id: user.id, task_id: currentTask.id, answer: idx, response_time: rt })
      setFeedback(r.data); setRoom(r.data.room)
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

  // ── SHHH Screen ──
  if (showShhh) return (
    <div className="cq-shhh"><h1>SHHHHH!</h1><p style={{ color: '#4a5580', marginTop: '1rem', fontSize: '0.9rem' }}>Tasks are being assigned...</p></div>
  )

  // ── MENU ──
  if (phase === 'menu') return (
    <div className="cq-bg">
      <div className="cq-stars" />
      <div className="cq-menu">
        <div className="cq-logo">
          <Crewmate color="#ef4444" size="xl" />
          <h1 className="cq-title">CREW QUEST</h1>
          <p className="cq-sub">Complete Tasks • Answer Questions • Win</p>
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
          <button className="cq-btn cq-btn-create" onClick={createRoom}><Play size={20} /> HOST GAME</button>
        </div>
        <div className="cq-divider">— OR JOIN —</div>
        <div className="cq-menu-section">
          <label className="cq-label">Room Code</label>
          <input className="cq-input" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="CODE" maxLength={6} onKeyDown={e => e.key === 'Enter' && joinRoom()} />
          <button className="cq-btn cq-btn-join" onClick={joinRoom}><Users size={20} /> JOIN</button>
        </div>
        <button className="cq-btn-back" onClick={() => navigate('/games')}>← Back to Arcade</button>
      </div>
    </div>
  )

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <div className="cq-bg">
      <div className="cq-stars" />
      <div className="cq-lobby">
        <div className="cq-lobby-header">
          <h1 className="cq-title" style={{ fontSize: '2.25rem' }}>LOBBY</h1>
          <div className="cq-code-box" onClick={copyCode}>
            <span className="cq-code">{room.code}</span>
            {copied ? <Check size={18} color="#22c55e" /> : <Copy size={18} color="#4a5580" />}
          </div>
          <p style={{ color: '#4a5580', fontSize: '0.8rem' }}>Share this code with friends to join</p>
        </div>
        <div className="cq-players-grid">
          {room.players.map((p, i) => (
            <div key={p.id} className={`cq-player-card ${p.ready ? 'ready' : ''}`}>
              <Crewmate color={COLORS[i % COLORS.length]} size="lg" />
              <div className="cq-player-name">{p.name}</div>
              {p.is_host && <Crown size={14} style={{ color: '#fbbf24' }} />}
              <div className={`cq-ready-tag ${p.ready ? 'on' : ''}`}>{p.ready ? '✓ READY' : 'NOT READY'}</div>
            </div>
          ))}
          {Array(room.max_players - room.players.length).fill(0).map((_, i) => (
            <div key={`e${i}`} className="cq-player-card empty">
              <div style={{ width: 56, height: 70, borderRadius: '45% 45% 20% 20%', border: '2px dashed #1c2040', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c2040', fontSize: '1.5rem' }}>?</div>
              <div className="cq-player-name" style={{ color: '#1c2040' }}>Waiting...</div>
            </div>
          ))}
        </div>
        <div className="cq-lobby-footer">
          <button className="cq-btn-ready" onClick={toggleReady}>{me?.ready ? '✓ READY' : 'READY UP'}</button>
          {isHost && <button className="cq-btn-start" onClick={startGame}><Play size={18} /> START</button>}
        </div>
        <button className="cq-btn-back" onClick={() => { API.post('/games/crew-quest/leave', { room_code: room.code, user_id: user.id }); setPhase('menu') }}>← Leave Room</button>
      </div>
    </div>
  )

  // ── TASK VIEW ──
  if (phase === 'taskview' && currentTask) return (
    <div className="cq-bg">
      <div className="cq-task-modal">
        <div className="cq-task-header">
          <span className="cq-task-location">📍 {currentTask.location?.name}</span>
          <button className="cq-close" onClick={() => { setPhase('playing'); setCurrentTask(null) }}><X size={22} /></button>
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
        {feedback && <div className={`cq-feedback ${feedback.correct ? 'correct' : 'wrong'}`}>{feedback.correct ? '✅ Task Complete!' : `❌ ${feedback.explanation}`}</div>}
      </div>
    </div>
  )

  // ── RESULTS ──
  if (phase === 'results') {
    const sorted = [...(room?.players || [])].sort((a, b) => b.score - a.score)
    return (
      <div className="cq-bg">
        <div className="cq-stars" />
        <div className="cq-results">
          <h1 className="cq-title" style={{ fontSize: '2.5rem' }}>VICTORY</h1>
          <p style={{ color: '#4a5580', marginBottom: '1rem' }}>Game Complete</p>
          <div className="cq-podium">
            {sorted.slice(0, 3).map((p, i) => (
              <div key={p.id} className={`cq-podium-place p${i + 1}`}>
                <Crewmate color={COLORS[room.players.findIndex(pl => pl.id === p.id) % COLORS.length]} size={i === 0 ? 'lg' : 'md'} />
                {i === 0 && <span style={{ fontSize: '1.75rem' }}>👑</span>}
                <div className="cq-player-name">{p.name}</div>
                <div className="cq-score-big">{p.score}</div>
                <div className="cq-tasks-done">{p.tasks_completed}/{p.tasks.length} tasks</div>
              </div>
            ))}
          </div>
          <div className="cq-full-scores">
            {sorted.map((p, i) => (
              <div key={p.id} className="cq-score-row">
                <span className="cq-rank">#{i + 1}</span>
                <Crewmate color={COLORS[room.players.findIndex(pl => pl.id === p.id) % COLORS.length]} size="xs" />
                <span className="cq-sname">{p.name}</span>
                <span className="cq-stasks">{p.tasks_completed}/{p.tasks.length}</span>
                <span className="cq-spts">{p.score} pts</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button className="cq-btn cq-btn-create" style={{ width: 'auto', padding: '0.875rem 2rem' }} onClick={() => setPhase('menu')}>NEW GAME</button>
            <button className="cq-btn cq-btn-join" style={{ width: 'auto', padding: '0.875rem 2rem' }} onClick={() => navigate('/games')}>ARCADE</button>
          </div>
        </div>
      </div>
    )
  }

  // ── PLAYING (Ship Map) ──
  const myTasks = me?.tasks || []
  const completed = myTasks.filter(t => t.completed).length
  const taskBarPct = (completed / Math.max(myTasks.length, 1)) * 100

  return (
    <div className="cq-bg">
      <div className="cq-hud">
        <div className="cq-hud-left">
          <Crewmate color={COLORS[room?.players?.findIndex(p => p.id === user.id) % COLORS.length] || '#ef4444'} size="xs" />
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{me?.name}</span>
          <span className="cq-badge-score">{me?.score} pts</span>
        </div>
        <div className="cq-hud-center">
          {/* Task progress bar */}
          <div style={{ width: 200, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: 6, background: '#1c2040', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${taskBarPct}%`, height: '100%', background: '#22c55e', borderRadius: 3, transition: 'width 0.5s ease', boxShadow: '0 0 8px rgba(34,197,94,0.3)' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#4a5580', fontFamily: "'JetBrains Mono', monospace" }}>{completed}/{myTasks.length}</span>
          </div>
        </div>
        <div className="cq-hud-right">
          <Clock size={16} style={{ color: timer < 30 ? '#ef4444' : '#4a5580' }} />
          <span className="cq-timer" style={{ color: timer < 30 ? '#ef4444' : '#fff' }}>{mins}:{secs.toString().padStart(2, '0')}</span>
          {isHost && <button className="cq-btn-end" onClick={endGame}>END</button>}
        </div>
      </div>

      {/* Ship Map */}
      <div className="cq-ship">
        <div className="cq-ship-inner">
          <svg viewBox="0 0 140 100" className="cq-ship-svg">
            {/* The Skeld hull outline */}
            <path d="M70 5 L100 10 L115 18 L125 30 L130 50 L125 70 L115 82 L100 90 L70 95 L40 90 L25 82 L15 70 L10 50 L15 30 L25 18 L40 10 Z" fill="none" stroke="#1c2040" strokeWidth="0.6" />
            {/* Internal rooms */}
            <rect x="55" y="8" width="30" height="18" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="70" y="19" textAnchor="middle" fill="#1c2040" fontSize="3" fontWeight="700">CAFETERIA</text>
            <rect x="95" y="15" width="25" height="15" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="107" y="24" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">NAV</text>
            <rect x="95" y="40" width="25" height="18" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="107" y="51" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">WEAPONS</text>
            <rect x="80" y="65" width="25" height="18" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="92" y="76" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">SHIELDS</text>
            <rect x="50" y="55" width="25" height="15" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="62" y="64" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">COMMS</text>
            <rect x="30" y="65" width="22" height="18" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="41" y="76" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">STORAGE</text>
            <rect x="15" y="42" width="22" height="18" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="26" y="53" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">ELECTRIC</text>
            <rect x="20" y="18" width="22" height="16" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="31" y="28" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">MEDBAY</text>
            <rect x="50" y="35" width="25" height="15" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="62" y="44" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">ADMIN</text>
            <rect x="12" y="32" width="15" height="14" rx="3" fill="none" stroke="#141830" strokeWidth="0.4" />
            <text x="19" y="41" textAnchor="middle" fill="#1c2040" fontSize="2.5" fontWeight="700">REACTOR</text>
            {/* Corridors */}
            <line x1="70" y1="26" x2="70" y2="35" stroke="#141830" strokeWidth="0.3" />
            <line x1="85" y1="17" x2="95" y2="20" stroke="#141830" strokeWidth="0.3" />
            <line x1="95" y1="30" x2="95" y2="40" stroke="#141830" strokeWidth="0.3" />
            <line x1="55" y1="17" x2="42" y2="22" stroke="#141830" strokeWidth="0.3" />
            <line x1="37" y1="34" x2="37" y2="42" stroke="#141830" strokeWidth="0.3" />
          </svg>

          {/* Task nodes */}
          {myTasks.map(task => (
            <div key={task.id} className={`cq-task-node ${task.completed ? (task.correct ? 'done' : 'failed') : 'pending'}`}
              style={{ left: `${task.location.x}%`, top: `${task.location.y}%` }} onClick={() => openTask(task)}>
              <div className="cq-task-dot">{task.completed ? (task.correct ? '✓' : '✗') : '!'}</div>
              <div className="cq-task-label">{task.location.name}</div>
            </div>
          ))}

          {/* Other players */}
          {room?.players?.filter(p => p.id !== user.id).map((p, i) => {
            const activeTask = p.tasks.find(t => !t.completed)
            const pos = activeTask?.location || { x: 50, y: 50 }
            return (
              <div key={p.id} className="cq-other-player" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <Crewmate color={COLORS[room.players.findIndex(pl => pl.id === p.id) % COLORS.length]} size="sm" />
                <div className="cq-player-tag">{p.crew_name} {p.tasks_completed}/{p.tasks.length}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="cq-sidebar">
        <h3>Tasks</h3>
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
