import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

const TABS = [
  { id: 'proximos', label: 'Próximos' },
  { id: 'pasado',   label: 'Pasado'   },
  { id: 'resumen',  label: 'Resumen'  },
]

export default function Navbar({ user, activeTab, onTabChange, dark, onToggleDark, lastUpdated }) {
  const minutesAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 60_000)
    : null

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-navy-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">W</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight hidden sm:block">
            WeSpeak
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Last updated */}
          {minutesAgo !== null && (
            <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {minutesAgo === 0 ? 'Actualizado ahora' : `Actualizado hace ${minutesAgo}m`}
            </span>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            title="Cambiar tema"
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            )}
          </button>

          {/* User avatar */}
          {user && (
            <div className="group relative">
              <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-6 h-6 rounded-full ring-1 ring-slate-200 dark:ring-slate-600"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden md:block text-xs text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-navy-700 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
