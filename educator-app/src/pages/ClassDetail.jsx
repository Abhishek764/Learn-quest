import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Copy, Check, Download } from 'lucide-react'
import Navbar from '../components/Navbar'
import API from '../api'

export default function ClassDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cls, setCls] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    try {
      const [cRes, mRes] = await Promise.all([
        API.get(`/classes/${id}`),
        API.get(`/classes/${id}/members`),
      ])
      setCls(cRes.data)
      setMembers(mRes.data || [])
    } catch {}
    setLoading(false)
  }

  function copyCode() {
    if (!cls) return
    navigator.clipboard.writeText(cls.invite_code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function exportCSV() {
    if (!members.length) return
    const header = 'Name,XP,Level,Accuracy,Sessions'
    const rows = members.map(m =>
      `"${m.display_name}",${m.xp || 0},${m.level || 1},${m.avg_accuracy != null ? (m.avg_accuracy * 100).toFixed(1) + '%' : 'N/A'},${m.sessions || 0}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cls?.name || 'class'}-members.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="text-center py-16 text-gray-400">Loading...</div>
    </div>
  )

  if (!cls) return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="text-center py-16 text-gray-400">Class not found.</div>
    </div>
  )

  const avgXp = members.length ? Math.round(members.reduce((s, m) => s + (m.xp || 0), 0) / members.length) : 0
  const maxXp = members.length ? Math.max(...members.map(m => m.xp || 0)) : 500

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <button onClick={() => navigate('/classes')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Classes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{cls.name}</h2>
            <div className="text-gray-400 text-sm capitalize mt-1">{cls.subject}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 flex items-center gap-3">
              <div>
                <div className="text-gray-500 text-xs">Invite Code</div>
                <div className="font-mono text-purple-400 font-bold tracking-widest">{cls.invite_code}</div>
              </div>
              <button onClick={copyCode} className="text-gray-400 hover:text-white transition-colors">
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
            <button onClick={exportCSV} disabled={!members.length}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: <Users size={18} className="text-purple-400" />, label: 'Members', value: members.length },
            { icon: <span className="text-blue-400 font-bold text-sm">XP</span>, label: 'Avg XP', value: avgXp },
            { icon: <span className="text-green-400 font-bold text-sm">LV</span>, label: 'Top XP', value: maxXp },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-gray-400 text-xs">{s.label}</span></div>
              <div className="text-xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Member list */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Members ({members.length})</h3>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">No students yet</div>
              <div className="text-gray-600 text-sm">Share invite code <span className="font-mono text-purple-400">{cls.invite_code}</span> with your students</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 bg-gray-700/30">
                    <th className="text-left px-6 py-3">Rank</th>
                    <th className="text-left px-6 py-3">Name</th>
                    <th className="text-left px-6 py-3">Level</th>
                    <th className="text-left px-6 py-3">XP Progress</th>
                    <th className="text-right px-6 py-3">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {[...members].sort((a, b) => (b.xp || 0) - (a.xp || 0)).map((m, i) => {
                    const pct = maxXp > 0 ? Math.round(((m.xp || 0) / maxXp) * 100) : 0
                    return (
                      <tr key={m.id} className="border-t border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-3 text-gray-400">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </td>
                        <td className="px-6 py-3 text-white font-medium">{m.display_name}</td>
                        <td className="px-6 py-3 text-gray-300">Lv {m.level || 1}</td>
                        <td className="px-6 py-3 w-48">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-gray-500 text-xs w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right text-purple-400 font-semibold">{m.xp || 0}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
