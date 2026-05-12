import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState, useEffect } from 'react'
import Sidebar from './components/shell/Sidebar'
import TopBar from './components/shell/TopBar'
import VoiceAssistant from './components/VoiceAssistant'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Lists from './pages/Lists'
import Certs from './pages/Certs'
import Subscriptions from './pages/Subscriptions'
import Passwords from './pages/Passwords'
import Places from './pages/Places'
import Login from './pages/Login'
import { Zap } from 'lucide-react'

function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(2,132,199,0.4)',
        animation: 'pulseGlowDot 1.2s ease-in-out infinite',
      }}>
        <Zap size={22} color="#fff" strokeWidth={2.5} />
      </div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
        {message}
      </p>
    </div>
  )
}

function AppShellInner() {
  const { user, loading, syncing } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setMobileNavOpen(false) }, [location.pathname])

  if (loading)  return <LoadingScreen message="INITIALIZING…" />
  if (syncing)  return <LoadingScreen message="SYNCING DATA…" />
  if (!user)    return <Login />

  return (
    <div className="app-layout">
      {mobileNavOpen && (
        <div className="mobile-overlay" onClick={() => setMobileNavOpen(false)} />
      )}
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="main-area">
        <TopBar onMenuOpen={() => setMobileNavOpen(true)} />
        <div className="content-area">
          <Routes>
            <Route path="/"             element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/finance"      element={<Finance />} />
            <Route path="/tasks"        element={<Tasks />} />
            <Route path="/notes"        element={<Notes />} />
            <Route path="/lists"        element={<Lists />} />
            <Route path="/certs"        element={<Certs />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/passwords"    element={<Passwords />} />
            <Route path="/places"       element={<Places />} />
          </Routes>
        </div>
      </div>
      <VoiceAssistant />
    </div>
  )
}

function AppShell() {
  return <AppShellInner />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
