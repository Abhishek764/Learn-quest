import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Zap, Brain, Keyboard, Clock, Shuffle, Crosshair, Lock, Star, ChevronRight, Users } from 'lucide-react'

const GAME_MODES = [
  {
    id: 'lightning_quiz',
    name: 'Lightning Quiz',
    description: 'Answer 10 AI-selected questions as fast as you can. Difficulty adapts in real-time.',
    icon: <Zap size={28} />,
    color: '#10b981',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
    border: 'rgba(16,185,129,0.25)',
    tag: 'CLASSIC',
    difficulty: 'Adaptive',
    time: '3-5 min',
    locked: false,
  },
  {
    id: 'memory_match',
    name: 'Memory Match',
    description: 'Flip cards to match questions with their correct answers. Tests recall & memory.',
    icon: <Brain size={28} />,
    color: '#8b5cf6',
    bg: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
    border: 'rgba(139,92,246,0.25)',
    tag: 'MEMORY',
    difficulty: 'Medium',
    time: '2-4 min',
    locked: false,
  },
  {
    id: 'speed_type',
    name: 'Speed Type',
    description: 'Type the correct answer before time runs out. Tests knowledge + typing speed.',
    icon: <Keyboard size={28} />,
    color: '#f59e0b',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
    border: 'rgba(245,158,11,0.25)',
    tag: 'SPEED',
    difficulty: 'Hard',
    time: '2-3 min',
    locked: false,
  },
  {
    id: 'true_false_blitz',
    name: 'True / False Blitz',
    description: 'Rapid-fire true or false statements. Swipe right for true, left for false.',
    icon: <Crosshair size={28} />,
    color: '#ec4899',
    bg: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))',
    border: 'rgba(236,72,153,0.25)',
    tag: 'BLITZ',
    difficulty: 'Easy-Medium',
    time: '1-2 min',
    locked: false,
  },
  {
    id: 'word_scramble',
    name: 'Word Scramble',
    description: 'Unscramble the letters to spell the answer. Hints reveal letters over time.',
    icon: <Shuffle size={28} />,
    color: '#06b6d4',
    bg: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
    border: 'rgba(6,182,212,0.25)',
    tag: 'PUZZLE',
    difficulty: 'Medium',
    time: '3-5 min',
    locked: false,
  },
  {
    id: 'boss_battle',
    name: 'Boss Battle',
    description: 'Face a concept boss. Answer increasingly harder questions to defeat it.',
    icon: <Star size={28} />,
    color: '#ef4444',
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
    border: 'rgba(239,68,68,0.25)',
    tag: 'BOSS',
    difficulty: 'Expert',
    time: '5-8 min',
    locked: true,
    unlockText: 'Reach Level 5',
  },
  {
    id: 'crew_quest',
    name: 'Crew Quest',
    description: 'Among Us-style multiplayer! Join a room with friends, complete tasks by answering questions. Race to finish first!',
    icon: <Users size={28} />,
    color: '#C5FF4D',
    bg: 'linear-gradient(135deg, rgba(197,255,77,0.15), rgba(197,255,77,0.05))',
    border: 'rgba(197,255,77,0.3)',
    tag: 'MULTIPLAYER',
    difficulty: 'Adaptive',
    time: '3-5 min',
    locked: false,
    isCrewQuest: true,
  },
]

const SUBJECTS = [
  { key: 'all', label: 'All Subjects', icon: '🎯' },
  { key: 'math', label: 'Math', icon: '📐' },
  { key: 'science', label: 'Science', icon: '🔬' },
  { key: 'english', label: 'English', icon: '📝' },
  { key: 'general', label: 'General', icon: '🌍' },
]

export default function Games() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('all')
  const [hoveredGame, setHoveredGame] = useState(null)

  function startGame(mode) {
    if (mode.locked) return
    if (mode.isCrewQuest) return navigate('/games/crew-quest')
    navigate(`/games/play?mode=${mode.id}&subject=${subject === 'all' ? '' : subject}`)
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1>🎮 Game Arcade</h1>
          <p>Choose a game mode and subject — AI adapts to your skill level</p>
        </div>

        {/* Subject Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {SUBJECTS.map(s => (
            <button key={s.key} onClick={() => setSubject(s.key)}
              className={`btn ${subject === s.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Game Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {GAME_MODES.map(mode => (
            <div
              key={mode.id}
              className="card card-clickable"
              onMouseEnter={() => setHoveredGame(mode.id)}
              onMouseLeave={() => setHoveredGame(null)}
              onClick={() => startGame(mode)}
              style={{
                background: mode.bg,
                borderColor: hoveredGame === mode.id ? mode.border : 'var(--border)',
                cursor: mode.locked ? 'not-allowed' : 'pointer',
                opacity: mode.locked ? 0.55 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Glow effect on hover */}
              {hoveredGame === mode.id && !mode.locked && (
                <div style={{
                  position: 'absolute', top: -50, right: -50,
                  width: 120, height: 120, borderRadius: '50%',
                  background: `${mode.color}15`,
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `${mode.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mode.color, flexShrink: 0,
                  boxShadow: hoveredGame === mode.id ? `0 0 20px ${mode.color}30` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {mode.locked ? <Lock size={24} /> : mode.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0 }}>{mode.name}</h3>
                    <span className="badge" style={{ background: `${mode.color}20`, color: mode.color, fontSize: '0.6rem' }}>
                      {mode.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.75rem', lineHeight: 1.5 }}>
                    {mode.locked ? mode.unlockText : mode.description}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>⚡ {mode.difficulty}</span>
                    <span>⏱ {mode.time}</span>
                  </div>
                </div>

                {!mode.locked && (
                  <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 8 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
