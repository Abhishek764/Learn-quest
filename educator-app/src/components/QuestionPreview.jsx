import { Zap, Heart, X, Eye, CheckCircle, XCircle, ArrowRight, Brain } from 'lucide-react'

function PreviewFrame({ children, badge, mode }) {
  return (
    <div className="preview-frame">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div className="preview-label">
          <Eye size={11} /> Student preview · live
        </div>
        {badge && (
          <span style={{
            fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999,
            background: `${mode.color}15`, color: mode.color, border: `1px solid ${mode.color}30`,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{badge}</span>
        )}
      </div>

      {/* HUD common */}
      <div className="preview-hud">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <X size={10} /> Quit
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontFamily: 'JetBrains Mono', fontSize: '0.72rem', fontWeight: 600 }}>
            <Zap size={10} /> 240
          </span>
          <span style={{ display: 'inline-flex', gap: 3 }}>
            {[0, 1, 2].map(i => (
              <Heart key={i} size={10} fill="#ef4444" color="#ef4444" />
            ))}
          </span>
        </div>
      </div>

      {children}

      <div style={{
        marginTop: 10, padding: '8px 10px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 10,
        fontSize: '0.66rem', color: '#475569', textAlign: 'center',
      }}>
        ABOA adaptive engine will serve this in <span style={{ color: mode.color, fontWeight: 600 }}>{mode.name}</span>.
      </div>
    </div>
  )
}

function MCQPreview({ form, mode, badge }) {
  const text = (form.question_text || '').trim() || 'Your question text will appear here…'
  const options = [
    form.option_a || 'Option A',
    form.option_b || 'Option B',
    form.option_c || 'Option C',
    form.option_d || 'Option D',
  ]
  const correct = (form.correct_option || 'A').toUpperCase()
  const labels = ['A', 'B', 'C', 'D']
  const diff = form.difficulty <= 0.3 ? 'Easy' : form.difficulty <= 0.6 ? 'Medium' : 'Hard'

  return (
    <PreviewFrame badge={badge} mode={mode}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.10)', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{form.subject || 'subject'}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.10)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{diff}</span>
      </div>
      <div className="preview-question">{text}</div>
      {options.map((opt, i) => (
        <div key={i} className={`preview-opt ${labels[i] === correct ? 'correct' : ''}`}>
          <span className="preview-opt-label">{labels[i]}</span>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt}</span>
        </div>
      ))}
    </PreviewFrame>
  )
}

function TFPreview({ form, mode, badge }) {
  const stmt = (form.statement || form.question_text || '').trim() || 'Your statement will appear here…'
  const verdict = form.verdict !== false
  const diff = form.difficulty <= 0.3 ? 'Easy' : form.difficulty <= 0.6 ? 'Medium' : 'Hard'

  return (
    <PreviewFrame badge={badge} mode={mode}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: `${mode.color}15`, color: mode.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{form.subject || 'subject'}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.10)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{diff}</span>
      </div>
      <div className="preview-question">{stmt}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div style={{
          padding: '0.6rem 0.5rem', borderRadius: 12, textAlign: 'center',
          background: verdict ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${verdict ? 'rgba(16,185,129,0.30)' : 'rgba(255,255,255,0.06)'}`,
          color: verdict ? '#10b981' : '#94949e',
          fontWeight: 700, fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <CheckCircle size={14} /> TRUE
        </div>
        <div style={{
          padding: '0.6rem 0.5rem', borderRadius: 12, textAlign: 'center',
          background: !verdict ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${!verdict ? 'rgba(16,185,129,0.30)' : 'rgba(255,255,255,0.06)'}`,
          color: !verdict ? '#10b981' : '#94949e',
          fontWeight: 700, fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <XCircle size={14} /> FALSE
        </div>
      </div>
    </PreviewFrame>
  )
}

function TypedPreview({ form, mode, badge }) {
  const text = (form.question_text || '').trim() || 'Your question will appear here…'
  const answer = (form.answer || form.option_a || '').trim()
  const diff = form.difficulty <= 0.3 ? 'Easy' : form.difficulty <= 0.6 ? 'Medium' : 'Hard'

  return (
    <PreviewFrame badge={badge} mode={mode}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: `${mode.color}15`, color: mode.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{form.subject || 'subject'}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.10)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{diff}</span>
      </div>
      <div className="preview-question">{text}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          readOnly
          value={answer ? '' : ''}
          placeholder="Type your answer…"
          style={{
            flex: 1, padding: '0.55rem 0.75rem', borderRadius: 10,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#eeeef0', fontSize: '0.85rem',
            textAlign: 'center', fontFamily: 'inherit',
          }}
        />
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
        }}>
          <ArrowRight size={14} />
        </div>
      </div>
      {answer && (
        <div style={{ marginTop: 8, fontSize: '0.68rem', color: '#475569', textAlign: 'center' }}>
          Accepted answer: <span style={{ color: '#10b981', fontWeight: 600 }}>{answer}</span>
        </div>
      )}
    </PreviewFrame>
  )
}

function ScramblePreview({ form, mode, badge }) {
  const word = (form.word || form.option_a || 'EXAMPLE').toUpperCase().replace(/\s+/g, ' ')
  const hint = (form.question_text || form.hint || 'Unscramble').trim()
  // Deterministic scramble (not random — so preview stable)
  const chars = word.split('')
  const scrambled = chars.slice().reverse().join('')
  const diff = form.difficulty <= 0.3 ? 'Easy' : form.difficulty <= 0.6 ? 'Medium' : 'Hard'

  return (
    <PreviewFrame badge={badge} mode={mode}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: `${mode.color}15`, color: mode.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{form.subject || 'subject'}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.10)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{diff}</span>
      </div>
      <div className="preview-question" style={{ fontSize: '0.85rem' }}>{hint}</div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', margin: '4px 0 10px' }}>
        {scrambled.split('').map((ch, i) => (
          <div key={i} style={{
            width: 28, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0e0e14', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
            fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.95rem',
            color: mode.color,
          }}>{ch === ' ' ? '·' : ch}</div>
        ))}
      </div>
      <div style={{ fontSize: '0.65rem', color: '#475569', textAlign: 'center' }}>
        Correct: <span style={{ color: '#10b981', fontWeight: 600 }}>{word}</span>
      </div>
    </PreviewFrame>
  )
}

function MemoryPreview({ form, mode, badge }) {
  // Show 4 cards (1 question / 1 answer pair revealed + 2 face-down) to illustrate
  const q = (form.question_text || '').trim() || 'Question?'
  const correct = (form.correct_option || 'A').toUpperCase()
  const correctText = (form[`option_${correct.toLowerCase()}`] || '').trim() || 'Answer'

  return (
    <PreviewFrame badge={badge} mode={mode}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8,
      }}>
        <div style={{
          aspectRatio: '1', borderRadius: 10,
          background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)',
          padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', color: '#eeeef0', textAlign: 'center', lineHeight: 1.2,
          fontWeight: 500,
        }}>{q.slice(0, 28)}</div>
        <div style={{
          aspectRatio: '1', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', color: '#475569', fontWeight: 700,
        }}>?</div>
        <div style={{
          aspectRatio: '1', borderRadius: 10,
          background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.30)',
          padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', color: '#10b981', textAlign: 'center', fontWeight: 600,
        }}>{correctText.slice(0, 18)}</div>
        <div style={{
          aspectRatio: '1', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', color: '#475569', fontWeight: 700,
        }}>?</div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontSize: '0.68rem', color: '#94949e',
      }}>
        <Brain size={12} /> Match question with answer
      </div>
    </PreviewFrame>
  )
}

export default function QuestionPreview({ form, mode }) {
  const template = mode.template
  const badge = mode.name

  if (template === 'truefalse') return <TFPreview form={form} mode={mode} badge={badge} />
  if (template === 'typed')     return <TypedPreview form={form} mode={mode} badge={badge} />
  if (template === 'scramble')  return <ScramblePreview form={form} mode={mode} badge={badge} />
  if (template === 'memory')    return <MemoryPreview form={form} mode={mode} badge={badge} />
  return <MCQPreview form={form} mode={mode} badge={badge} />
}
