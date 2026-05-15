import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import { Zap, Brain, Keyboard, Clock, Shuffle, Crosshair, Lock, Star, ChevronRight, Users, Sparkles } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease } }) }

const GAME_MODES = [
  { id: 'ai_practice', name: 'AI Practice', description: 'Gemini generates fresh questions calibrated to your level & XP. Pick a topic, play, learn.', icon: <Sparkles size={26} />, color: '#a78bfa', tag: 'AI · ADAPTIVE', difficulty: 'Your level', time: '2-5 min', locked: false, isAiPractice: true },
  { id: 'crew_quest', name: 'Crew Quest', description: 'Among Us-style multiplayer! Join a room, complete tasks by answering questions. Race to finish first!', icon: <Users size={26} />, color: '#22d3ee', tag: 'MULTIPLAYER', difficulty: 'Adaptive', time: '3-5 min', locked: false, isCrewQuest: true },
  { id: 'lightning_quiz', name: 'Lightning Quiz', description: 'Answer 10 AI-selected questions. Difficulty adapts in real-time to your level.', icon: <Zap size={26} />, color: '#6366f1', tag: 'CLASSIC', difficulty: 'Adaptive', time: '3-5 min', locked: false },
  { id: 'memory_match', name: 'Memory Match', description: 'Flip cards to match questions with answers. Tests recall & memory.', icon: <Brain size={26} />, color: '#8b5cf6', tag: 'MEMORY', difficulty: 'Medium', time: '2-4 min', locked: false },
  { id: 'speed_type', name: 'Speed Type', description: 'Type the correct answer before time runs out. Tests knowledge + speed.', icon: <Keyboard size={26} />, color: '#f59e0b', tag: 'SPEED', difficulty: 'Hard', time: '2-3 min', locked: false },
  { id: 'true_false_blitz', name: 'True / False Blitz', description: 'Rapid-fire true or false statements. Quick reflexes needed.', icon: <Crosshair size={26} />, color: '#ec4899', tag: 'BLITZ', difficulty: 'Easy-Medium', time: '1-2 min', locked: false },
  { id: 'word_scramble', name: 'Word Scramble', description: 'Unscramble letters to spell the answer. Hints reveal over time.', icon: <Shuffle size={26} />, color: '#10b981', tag: 'PUZZLE', difficulty: 'Medium', time: '3-5 min', locked: false },
  { id: 'boss_battle', name: 'Boss Battle', description: 'Face a concept boss. Answer increasingly harder questions to defeat it.', icon: <Star size={26} />, color: '#ef4444', tag: 'BOSS', difficulty: 'Expert', time: '5-8 min', locked: true, unlockText: 'Reach Level 5' },
]

const SUBJECTS = [
  { key: 'all', label: 'All', icon: '🎯' },
  { key: 'math', label: 'Math', icon: '📐' },
  { key: 'science', label: 'Science', icon: '🔬' },
  { key: 'english', label: 'English', icon: '📝' },
  { key: 'general', label: 'General', icon: '🌍' },
]

export default function Games() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('all')

  function startGame(mode) {
    if (mode.locked) return
    if (mode.isAiPractice) return navigate('/games/ai-practice')
    if (mode.isCrewQuest) return navigate('/games/crew-quest')
    navigate(`/games/play?mode=${mode.id}&subject=${subject === 'all' ? '' : subject}`)
  }

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content">
        <motion.div className="page-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <h1>🎮 Game Arcade</h1>
          <p>Choose your challenge — AI adapts to your skill level</p>
        </motion.div>

        {/* Subject pills */}
        <motion.div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          {SUBJECTS.map(s => (
            <motion.button key={s.key} onClick={() => setSubject(s.key)}
              className={`btn ${subject === s.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem' }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              {s.icon} {s.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Game Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {GAME_MODES.map((mode, i) => (
            <motion.div key={mode.id} className="card card-clickable" onClick={() => startGame(mode)}
              custom={i} initial="hidden" animate="visible" variants={fadeUp}
              whileHover={!mode.locked ? { y: -6, boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 30px ${mode.color}15` } : {}}
              style={{ cursor: mode.locked ? 'not-allowed' : 'pointer', opacity: mode.locked ? 0.45 : 1, position: 'relative', overflow: 'hidden' }}>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
                <motion.div whileHover={{ scale: 1.1 }} style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${mode.color}10`, border: `1px solid ${mode.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mode.color, flexShrink: 0,
                }}>
                  {mode.locked ? <Lock size={22} /> : mode.icon}
                </motion.div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0 }}>{mode.name}</h3>
                    <span className="badge" style={{ background: `${mode.color}12`, color: mode.color, fontSize: '0.55rem' }}>{mode.tag}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.75rem', lineHeight: 1.5 }}>
                    {mode.locked ? mode.unlockText : mode.description}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>⚡ {mode.difficulty}</span>
                    <span>⏱ {mode.time}</span>
                  </div>
                </div>

                {!mode.locked && <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
