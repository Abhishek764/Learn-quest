import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Games from './pages/Games'
import GamePlay from './pages/GamePlay'
import Progress from './pages/Progress'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import SkillTree from './pages/SkillTree'
import Quests from './pages/Quests'
import CrewQuest from './pages/CrewQuest'
import API, { setAuthTokenGetter } from './api'

function PrivateRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/login" replace /></SignedOut>
    </>
  )
}

function ClerkTokenBridge() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  setAuthTokenGetter(() => getToken())
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !user) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      return
    }
    const profile = {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      display_name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Player',
      avatar_url: user.imageUrl || '',
      role: user.publicMetadata?.role || 'student',
    }
    localStorage.setItem('user', JSON.stringify(profile))
    API.get('/users/me')
      .then(r => {
        if (r.data) localStorage.setItem('user', JSON.stringify({ ...profile, ...r.data }))
      })
      .catch(() => {})
  }, [isLoaded, isSignedIn, user])
  return null
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ClerkTokenBridge />
      <Routes>
        <Route path="/login/*" element={<Login />} />
        <Route path="/register/*" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/games" element={<PrivateRoute><Games /></PrivateRoute>} />
        <Route path="/games/play" element={<PrivateRoute><GamePlay /></PrivateRoute>} />
        <Route path="/games/crew-quest" element={<PrivateRoute><CrewQuest /></PrivateRoute>} />
        <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/skill-tree" element={<PrivateRoute><SkillTree /></PrivateRoute>} />
        <Route path="/quests" element={<PrivateRoute><Quests /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
