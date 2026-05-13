import { useState } from 'react'
import Navbar from '../components/Navbar'
import API from '../api'
import { Save } from 'lucide-react'

export default function Profile() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}')
  const [form, setForm] = useState({
    display_name: stored.display_name || '',
    avatar_url: stored.avatar_url || '',
    lang: stored.lang || 'en'
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await API.put(`/users/${stored.id}/profile`, form)
      const updated = { ...stored, ...res.data }
      localStorage.setItem('user', JSON.stringify(updated))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Failed to save profile')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
          {saved && <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded mb-4 text-sm">Profile saved!</div>}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Avatar URL</label>
              <input
                value={form.avatar_url}
                onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                placeholder="https://example.com/avatar.png"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Language</label>
              <select
                value={form.lang}
                onChange={e => setForm(f => ({ ...f, lang: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-400"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="pa">Punjabi</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            <button type="submit" className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-6 py-2.5 rounded-lg">
              <Save size={16} /> Save Changes
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-gray-400 text-sm mb-3">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-300">{stored.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="text-gray-300 capitalize">{stored.role}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Level</span><span className="text-green-400">{stored.level}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">XP</span><span className="text-green-400">{stored.xp}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
