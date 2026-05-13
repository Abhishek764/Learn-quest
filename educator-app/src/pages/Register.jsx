import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', display_name: '', role: 'educator', lang: 'en' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:3000/auth/register', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md border border-purple-700/50">
        <h1 className="text-3xl font-bold text-purple-400 mb-2 text-center">Create Educator Account</h1>
        <p className="text-gray-400 text-center mb-8">Join LearnQuest as an educator</p>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input type="text" required value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-400"
              placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-400" />
          </div>
          <input type="hidden" value="educator" />
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Educator Account'}
          </button>
        </form>
        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
