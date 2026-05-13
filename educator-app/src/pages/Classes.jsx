import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Copy, Check } from 'lucide-react'
import Navbar from '../components/Navbar'
import API from '../api'

export default function Classes() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    try {
      const r = await API.get('/classes')
      setClasses(r.data || [])
    } catch {}
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.subject.trim()) return
    setCreating(true)
    setError('')
    try {
      const r = await API.post('/classes', form)
      setClasses(prev => [r.data, ...prev])
      setShowModal(false)
      setForm({ name: '', subject: '', description: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create class')
    } finally {
      setCreating(false)
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const subjects = ['math', 'science', 'english', 'history', 'geography', 'art', 'general']

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Classes</h2>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus size={16} /> New Class
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg mb-4">No classes yet</div>
            <button onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Create Your First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(c => (
              <div key={c.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-purple-700/50 transition-colors">
                <div className="p-5 cursor-pointer" onClick={() => navigate(`/classes/${c.id}`)}>
                  <div className="font-semibold text-white text-lg mb-1">{c.name}</div>
                  <div className="text-gray-400 text-sm capitalize mb-3">{c.subject}</div>
                  {c.description && <div className="text-gray-500 text-xs line-clamp-2">{c.description}</div>}
                </div>
                <div className="border-t border-gray-700 px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Invite Code</div>
                    <div className="font-mono text-purple-400 font-bold tracking-widest">{c.invite_code}</div>
                  </div>
                  <button onClick={() => copyCode(c.invite_code)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded">
                    {copied === c.invite_code ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">Create New Class</h3>
              <button onClick={() => { setShowModal(false); setError('') }}
                className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {error && <div className="bg-red-900/40 border border-red-500 text-red-300 px-3 py-2 rounded text-sm mb-4">{error}</div>}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Class Name *</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  placeholder="e.g. Grade 9 Math" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subject *</label>
                <select required value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-400">
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-400 resize-none"
                  placeholder="Optional description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError('') }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
