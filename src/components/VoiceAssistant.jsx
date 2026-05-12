import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, X, Volume2, VolumeX, Key, Eye, EyeOff } from 'lucide-react'

// ── Navigation shortcuts (no API call needed) ─────────────────────────────────

const NAV_ROUTES = [
  { words: ['finance','budget','money','spending','allowance'], path: '/finance', name: 'Finance' },
  { words: ['task','tasks','todo','to do','to-do'],             path: '/tasks',   name: 'Tasks' },
  { words: ['note','notes'],                                    path: '/notes',   name: 'Notes' },
  { words: ['list','lists','games','anime','movies'],           path: '/lists',   name: 'Lists' },
  { words: ['cert','certs','certification'],                    path: '/certs',   name: 'Certifications' },
  { words: ['subscription','subscriptions'],                    path: '/subscriptions', name: 'Subscriptions' },
  { words: ['password','passwords','vault'],                    path: '/passwords', name: 'Passwords' },
  { words: ['place','places'],                                  path: '/places',  name: 'Places' },
  { words: ['dashboard','home'],                                path: '/dashboard', name: 'Dashboard' },
]

function tryNavigate(transcript, navigate) {
  const t = transcript.toLowerCase()
  if (!/\b(go to|open|take me to|show me|navigate to)\b/.test(t)) return null
  for (const r of NAV_ROUTES) {
    if (r.words.some(w => t.includes(w))) {
      navigate(r.path)
      return `Opening ${r.name}.`
    }
  }
  return null
}

// ── Build data context for Claude ─────────────────────────────────────────────

function getLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

function buildSystemPrompt() {
  const tasks   = getLS('mk-tasks', [])
  const expenses = getLS('mk-expenses', [])
  const subs    = getLS('mk-subscriptions', [])
  const certs   = getLS('mk-certs', [])
  const places  = getLS('mk-places', [])
  const lists   = getLS('mk-lists', { games: [], anime: [], movies: [] })
  const focus   = getLS('mk-daily-focus', '')

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const spent = expenses
    .filter(e => e.date?.startsWith(thisMonth))
    .reduce((s, e) => s + Number(e.amount || 0), 0)
  const remaining = 150 - spent

  const openTasks  = tasks.filter(t => !t.done)
  const doneTasks  = tasks.filter(t => t.done).length
  const highTasks  = openTasks.filter(t => t.priority === 'high')

  const activeSubs = subs.filter(s => s.active !== false)
  const subTotal   = activeSubs.reduce((s, sub) => s + Number(sub.amount || 0), 0)

  const certsDone  = certs.filter(c => c.status === 'done').length
  const certsIP    = certs.filter(c => c.status === 'in-progress')

  const wantVisit  = places.filter(p => !p.visited).length

  const lines = [
    `You are MKHUB, Mohammad's personal AI assistant built into his dashboard.`,
    `Keep all responses SHORT — 1 to 3 sentences max — because they will be read aloud.`,
    `Be direct, friendly, and personal. Call him Mohammad or just reply naturally.`,
    ``,
    `Today: ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`,
    focus ? `His focus for today: "${focus}"` : '',
    ``,
    `LIVE DATA:`,
    `- Budget: ${remaining.toFixed(0)} JOD left out of 150 JOD this month (spent ${spent.toFixed(2)} JOD so far)`,
    `- Tasks: ${openTasks.length} open, ${doneTasks} completed${highTasks.length > 0 ? ` — ${highTasks.length} high-priority: ${highTasks.slice(0,2).map(t => t.text).join('; ')}` : ''}`,
    `- Subscriptions: ${activeSubs.length} active, total ${subTotal.toFixed(2)} JOD/mo${activeSubs.length > 0 ? ` (${activeSubs.slice(0,4).map(s => s.name).join(', ')})` : ''}`,
    `- Certifications: ${certsDone} done, ${certsIP.length} in progress${certsIP.length > 0 ? ` — currently: ${certsIP[0].name} at ${certsIP[0].progress || 0}%` : ''}`,
    `- Places: ${wantVisit} to visit, ${places.filter(p => p.visited).length} already visited`,
    `- Lists: ${lists.games?.length || 0} games, ${lists.anime?.length || 0} anime, ${lists.movies?.length || 0} movies`,
  ].filter(Boolean).join('\n')

  return lines
}

// ── Claude API call ───────────────────────────────────────────────────────────

async function askClaude(apiKey, transcript) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 180,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: transcript }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || 'I got an empty response.'
}

// ── Speech synthesis ──────────────────────────────────────────────────────────

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = 1.05
  utt.pitch = 1
  utt.volume = 1
  const voices = window.speechSynthesis.getVoices()
  const voice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
                voices.find(v => v.lang.startsWith('en'))
  if (voice) utt.voice = voice
  window.speechSynthesis.speak(utt)
}

// ── API Key setup panel ───────────────────────────────────────────────────────

function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)

  const save = () => {
    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      alert('That doesn\'t look like a valid Anthropic API key (should start with sk-ant-)')
      return
    }
    localStorage.setItem('mk-claude-apikey', trimmed)
    onSave(trimmed)
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <Key size={14} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
          Connect AI
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
        MKHUB uses Claude AI to answer your questions. Paste your Anthropic API key below — it's stored only in your browser.
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
        Get a free key at console.anthropic.com
      </p>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          className="input"
          type={show ? 'text' : 'password'}
          placeholder="sk-ant-api03-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          style={{ width: '100%', paddingRight: 36, boxSizing: 'border-box', fontFamily: 'var(--font-mono)', fontSize: 11 }}
        />
        <button
          onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={save}>
        Save & Connect
      </button>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoiceAssistant() {
  const navigate   = useNavigate()
  const [open, setOpen]           = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim]     = useState('')
  const [answer, setAnswer]       = useState('')
  const [status, setStatus]       = useState('idle') // idle | listening | thinking | answered | error
  const [muted, setMuted]         = useState(false)
  const [supported, setSupported] = useState(true)
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem('mk-claude-apikey') || '')
  const [errorMsg, setErrorMsg]   = useState('')

  const recognitionRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setSupported(false); return }

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setStatus('listening')
      setTranscript('')
      setInterim('')
      setAnswer('')
      setErrorMsg('')
    }

    recognition.onresult = (e) => {
      let final = ''
      let interimText = ''
      for (const result of e.results) {
        if (result.isFinal) final += result[0].transcript
        else interimText += result[0].transcript
      }
      if (final) setTranscript(prev => prev + final)
      setInterim(interimText)
    }

    recognition.onend = () => {
      setInterim('')
      setListening(false)
    }

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setErrorMsg('Microphone access denied. Please allow microphone in browser settings.')
      } else if (e.error !== 'aborted') {
        setErrorMsg(`Mic error: ${e.error}`)
      }
      setStatus('error')
      setListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  // Process transcript when listening stops
  useEffect(() => {
    const fullText = transcript.trim()
    if (listening || !fullText || status !== 'listening') return

    setStatus('thinking')

    // Quick nav — no API call
    const navResult = tryNavigate(fullText, navigate)
    if (navResult) {
      setAnswer(navResult)
      setStatus('answered')
      if (!muted) speak(navResult)
      return
    }

    // No API key — show setup
    if (!apiKey) {
      setStatus('idle')
      return
    }

    // Ask Claude
    askClaude(apiKey, fullText)
      .then(text => {
        setAnswer(text)
        setStatus('answered')
        if (!muted) speak(text)
      })
      .catch(err => {
        const msg = err.message.includes('401') || err.message.includes('authentication')
          ? 'Invalid API key. Check it in settings.'
          : `Error: ${err.message}`
        setErrorMsg(msg)
        setStatus('error')
      })
  }, [listening, transcript, status, muted, navigate, apiKey])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return
    window.speechSynthesis?.cancel()
    setListening(true)
    setOpen(true)
    setStatus('listening')
    setTranscript('')
    setInterim('')
    setAnswer('')
    setErrorMsg('')
    try { recognitionRef.current.start() }
    catch { setListening(false) }
  }, [listening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop()
    }
  }, [listening])

  const close = () => {
    window.speechSynthesis?.cancel()
    if (listening) recognitionRef.current?.stop()
    setOpen(false)
    setListening(false)
    setStatus('idle')
    setTranscript('')
    setInterim('')
    setAnswer('')
    setErrorMsg('')
  }

  const clearKey = () => {
    localStorage.removeItem('mk-claude-apikey')
    setApiKey('')
  }

  if (!supported) return null

  const displayTranscript = transcript + interim
  const needsKey = !apiKey && status !== 'listening' && status !== 'thinking'

  return (
    <>
      {open && (
        <div className="voice-panel">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                background: status === 'listening' ? '#ef4444'
                  : status === 'answered'  ? 'var(--success)'
                  : status === 'error'     ? 'var(--danger)'
                  : status === 'thinking'  ? 'var(--warning)'
                  : 'var(--accent)',
                boxShadow: status === 'listening' ? '0 0 8px #ef4444' : 'none',
                animation: status === 'listening' ? 'pulseGlowDot 0.7s ease-in-out infinite' : 'none',
              }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {status === 'idle'      && 'MKHUB Assistant'}
                {status === 'listening' && 'Listening…'}
                {status === 'thinking'  && 'Thinking…'}
                {status === 'answered'  && 'MKHUB'}
                {status === 'error'     && 'Error'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {apiKey && (
                <button
                  className="btn-icon"
                  style={{ width: 26, height: 26 }}
                  onClick={clearKey}
                  title="Remove API key"
                >
                  <Key size={11} />
                </button>
              )}
              <button
                className="btn-icon"
                style={{ width: 26, height: 26 }}
                onClick={() => setMuted(m => !m)}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
              <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={close}>
                <X size={12} />
              </button>
            </div>
          </div>

          {/* API key setup (first-time use) */}
          {needsKey && !transcript && !answer && (
            <ApiKeySetup onSave={k => setApiKey(k)} />
          )}

          {/* Listening: wave + live transcript */}
          {status === 'listening' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div className="voice-wave">
                  {[22, 36, 52, 36, 22].map((h, i) => (
                    <div key={i} className="voice-wave-bar" style={{ height: h }} />
                  ))}
                </div>
              </div>
              {displayTranscript && (
                <div style={{
                  background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 10,
                  minHeight: 38,
                }}>
                  <span style={{ fontSize: 13, color: transcript ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {transcript}
                    {interim && <span style={{ color: 'var(--text-muted)' }}>{interim}</span>}
                  </span>
                </div>
              )}
              {!displayTranscript && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>
                  Speak now…
                </p>
              )}
            </>
          )}

          {/* Thinking */}
          {status === 'thinking' && (
            <>
              <div style={{
                background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px', marginBottom: 12,
              }}>
                <div className="label" style={{ marginBottom: 4 }}>You said</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{transcript}"</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <div className="animate-spin" style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid var(--border-bright)',
                  borderTopColor: 'var(--accent)', flexShrink: 0,
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  Asking Claude…
                </span>
              </div>
            </>
          )}

          {/* Answer */}
          {status === 'answered' && (
            <>
              {transcript && (
                <div style={{
                  background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '9px 12px', marginBottom: 10,
                }}>
                  <div className="label" style={{ marginBottom: 3 }}>You said</div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{transcript}"</p>
                </div>
              )}
              <div style={{
                background: 'rgba(2,132,199,0.06)',
                border: '1px solid rgba(2,132,199,0.22)',
                borderRadius: 8, padding: '12px 14px',
                animation: 'fadeUp 0.25s ease',
              }}>
                <div className="label" style={{ color: 'var(--accent)', marginBottom: 6 }}>MKHUB</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {answer}
                </p>
              </div>
            </>
          )}

          {/* Error */}
          {status === 'error' && errorMsg && (
            <div style={{
              background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 8, padding: '10px 12px', marginBottom: 10,
            }}>
              <p style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.5 }}>{errorMsg}</p>
            </div>
          )}

          {/* Idle hint (with key set) */}
          {status === 'idle' && apiKey && !transcript && !answer && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 }}>
                Ask me anything about your data.
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', opacity: 0.7 }}>
                "What's my budget?" · "Any high priority tasks?" · "Go to finance"
              </p>
            </div>
          )}

          {/* Mic button */}
          {(apiKey || status === 'listening') && (
            <div style={{ marginTop: 14 }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 6 }}
                onClick={listening ? stopListening : startListening}
              >
                {listening
                  ? <><MicOff size={13} /> Stop</>
                  : <><Mic size={13} /> {status === 'answered' ? 'Ask again' : 'Ask something'}</>
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating mic button */}
      <button
        className={`voice-fab${listening ? ' listening' : ''}`}
        onClick={listening ? stopListening : (open ? startListening : () => setOpen(true))}
        title="Voice Assistant"
      >
        {listening
          ? <MicOff size={20} color="#fff" />
          : <Mic size={20} color="#fff" />
        }
      </button>
    </>
  )
}
