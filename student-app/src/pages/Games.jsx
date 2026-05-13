import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, BookOpen, Map, Swords, Clock, Star } from 'lucide-react'
import Navbar from '../components/Navbar'

const GAME_MODES = [
  { id: 'lightning_quiz', name: 'Lightning Quiz', desc: 'Answer fast! 30 seconds per question.', icon: <Zap size={32} className="text-yellow-400" />, color: 'from-yellow-900 to-gray-800' },
  { id: 'word_builder', name: 'Word Builder', desc: 'Build vocabulary with fill-in-the-blank.', icon: <BookOpen size={32} className="text-blue-400" />, color: 'from-blue-900 to-gray-800' },
  { id: 'quest_map', name: 'Quest Map', desc: 'Journey through levels of increasing difficulty.', icon: <Map size={32} className="text-green-400" />, color: 'from-green-900 to-gray-800' },
  { id: 'battle_mode', name: 'Battle Mode', desc: 'Compete against top scores in real time.', icon: <Swords size={32} className="text-red-400" />, color: 'from-red-900 to-gray-800' },
  { id: 'time_attack', name: 'Time Attack', desc: 'How many correct in 2 minutes?', icon: <Clock size={32} className="text-purple-400" />, color: 'from-purple-900 to-gray-800' },
  { id: 'daily_challenge', name: 'Daily Challenge', desc: 'One unique challenge per day for bonus XP.', icon: <Star size={32} className="text-orange-400" />, color: 'from-orange-900 to-gray-800' },
]

const SUBJECTS = ['All', 'math', 'science', 'english', 'general']

export default function Games() {
  const navigate = useNavigate()
  const [selectedSubject, setSelectedSubject] = useState('All')

  function play(mode) {
    const subject = selectedSubject === 'All' ? 'general' : selectedSubject
    navigate(`/games/play?mode=${mode}&subject=${subject}`)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-2">Game Lobby</h2>
        <p className="text-gray-400 mb-6">Pick a game mode and start earning XP!</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {SUBJECTS.map(s => (
            <button
              key={s} onClick={() => setSelectedSubject(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedSubject === s ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_MODES.map(mode => (
            <div key={mode.id} className={`bg-gradient-to-br ${mode.color} rounded-xl p-6 border border-gray-700 hover:border-gray-500 transition-all`}>
              <div className="mb-4">{mode.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{mode.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{mode.desc}</p>
              <button
                onClick={() => play(mode.id)}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Play
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
