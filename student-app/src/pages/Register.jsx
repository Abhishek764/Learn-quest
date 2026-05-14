import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { SignUp } from '@clerk/clerk-react'
import AuroraHero from '../components/AuroraHero'
import OnboardingTeaser from '../components/OnboardingTeaser'

const ease = [0.22, 1, 0.36, 1]

export default function Register() {
  return (
    <div className="auth-shell">
      <div className="auth-pane-form">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <Link to="/" className="brand-mark" aria-label="LearnQuest home">
            <span className="brand-mark-tile"><Zap size={20} /></span>
            <span className="brand-mark-text">LearnQuest</span>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            Start your quest.
          </motion.h1>
          <motion.p
            className="subtitle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
          >
            Sign up with Google or GitHub to begin learning.
          </motion.p>

          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
            appearance={{ elements: { rootBox: { width: '100%' }, card: { boxShadow: 'none', background: 'transparent' } } }}
          />

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55, ease }}
            style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}
          >
            Have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </motion.p>
        </motion.div>
      </div>

      <AuroraHero>
        <OnboardingTeaser />
      </AuroraHero>
    </div>
  )
}
