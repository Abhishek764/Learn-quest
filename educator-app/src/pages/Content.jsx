import { useState, useEffect } from 'react'
import { Plus, X, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import API from '../api'

const SUBJECTS = ['math', 'science', 'english', 'history', 'geography', 'art', 'general']
const DIFFICULTIES = [
  { label: 'Easy', value: 0.2 },
  { label: 'Medium', value: 0.5 },
  { label: 'Hard', value: 0.8 },
]

const blank = {
  question_text: '',
  subject: 'math',
  difficulty: 0.5,
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
}

export default function Content() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...blank })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchQuestions() }, [])

  async function fetchQuestions() {
    try {
      const r = await API.get('/games/questions')
      setQuestions(r.data || [])
    } catch {}
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { question_text, option_a, option_b, option_c, option_d } = form
    if (!question_text.trim() || !option_a.trim() || !option_b.trim() || !option_c.trim() || !option_d.trim()) {
      setError('All fields required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const r = await API.post('/games/questions', form)
      setQuestions(prev => [r.data, ...prev])
      setForm({ ...blank })
      setShowForm(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all' ? questions : questions.filter(q => q.subject === filter)

  const diffLabel = d => d <= 0.3 ? 'Easy' : d <= 0.6 ? 'Medium' : 'Hard'
  const diffColor = d => d <= 0.3 ? 'text-green-400' : d <= 0.6 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Content Library</h2>
          <button onClick={() => { setShowForm(true); setError('') }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus size={16} /> Add Question
          </button>
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4 text-sm">
            <CheckCircle size={16} /> Question added successfully!
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {['all', ...SUBJECTS].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${filter === s ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Question list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No questions {filter !== 'all' ? `for ${filter}` : 'yet'}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q, i) => (
              <div key={q.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-3">{q.question_text}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${q.correct_option === opt ? 'bg-green-900/30 border border-green-700 text-green-300' : 'bg-gray-700/50 text-gray-400'}`}>
                          <span className="font-mono font-bold text-xs">{opt}.</span>
                          {q[`option_${opt.toLowerCase()}`]}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-gray-400 text-xs capitalize mb-1">{q.subject}</div>
                    <div className={`text-xs font-semibold ${diffColor(q.difficulty)}`}>{diffLabel(q.difficulty)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">New Question</h3>
              <button onClick={() => { setShowForm(false); setError('') }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {error && <div className="bg-red-900/40 border border-red-500 text-red-300 px-3 py-2 rounded text-sm mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Question *</label>
                <textarea required value={form.question_text} rows={3}
                  onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-400 resize-none"
                  placeholder="Enter your question..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Subject</label>
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-purple-400">
                    {SUBJECTS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-purple-400">
                    {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt}>
                  <label className="block text-sm text-gray-400 mb-1">Option {opt} *</label>
                  <input type="text" required value={form[`option_${opt.toLowerCase()}`]}
                    onChange={e => setForm(f => ({ ...f, [`option_${opt.toLowerCase()}`]: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-400"
                    placeholder={`Option ${opt}`} />
                </div>
              ))}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Correct Answer</label>
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button key={opt} type="button" onClick={() => setForm(f => ({ ...f, correct_option: opt }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-mono font-bold transition-colors ${form.correct_option === opt ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setError('') }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
