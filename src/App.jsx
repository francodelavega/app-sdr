import { useState, useEffect, useMemo } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { useTheme } from './hooks/useTheme'
import { useOpportunities, buildLivesMap } from './hooks/useOpportunities'
import LoginPage from './components/LoginPage'
import Navbar from './components/Navbar'
import SummaryCards from './components/SummaryCards'
import ProximosTab from './components/ProximosTab'
import PasadoTab from './components/PasadoTab'
import ResumenTab from './components/ResumenTab'

export default function App() {
  const { dark, toggle }                      = useTheme()
  const [user, setUser]                       = useState(undefined)
  const [activeTab, setActiveTab]             = useState('proximos')
  const [proximosFilter, setProximosFilter]   = useState(null)
  const [pasadoFilter, setPasadoFilter]       = useState(null)
  const { appointments, preDemoTotal, loading, error, lastUpdated, refresh } = useOpportunities()

  const livesMap = useMemo(() => buildLivesMap(appointments), [appointments])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u && u.email?.endsWith('@wespeak.pro')) {
        setUser(u)
      } else {
        setUser(null)
        if (u) auth.signOut()
      }
    })
    return unsub
  }, [])

  function handleCardClick(cardId) {
    if (cardId === 'today') {
      setProximosFilter('hoy')
      setActiveTab('proximos')
    } else if (cardId === 'week') {
      setProximosFilter('7dias')
      setActiveTab('proximos')
    } else if (cardId === 'noshow') {
      setPasadoFilter('7d')
      setActiveTab('pasado')
    }
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dark={dark}
        onToggleDark={toggle}
        lastUpdated={lastUpdated}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Error al cargar datos: {error}
            </div>
            <button
              onClick={refresh}
              className="text-xs font-medium text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        <SummaryCards
          appointments={appointments}
          preDemoTotal={preDemoTotal}
          loading={loading}
          onCardClick={handleCardClick}
        />

        {activeTab === 'proximos' && (
          <ProximosTab appointments={appointments} loading={loading} jumpFilter={proximosFilter} livesMap={livesMap} />
        )}
        {activeTab === 'pasado' && (
          <PasadoTab appointments={appointments} loading={loading} jumpFilter={pasadoFilter} livesMap={livesMap} />
        )}
        {activeTab === 'resumen' && (
          <ResumenTab appointments={appointments} preDemoTotal={preDemoTotal} loading={loading} />
        )}
      </main>
    </div>
  )
}
