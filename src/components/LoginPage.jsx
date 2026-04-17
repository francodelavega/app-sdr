import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

export default function LoginPage() {
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError(null)
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const email  = result.user.email || ''
      if (!email.endsWith('@wespeak.pro')) {
        await auth.signOut()
        setError(`Acceso denegado. Solo se permiten cuentas @wespeak.pro. (Intentaste con: ${email})`)
      }
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Error al iniciar sesión. Intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-navy-800 to-slate-900">
      <div className="w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl tracking-tight">W</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                WeSpeak
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Setter Dashboard
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
              Inicia sesión con tu cuenta de Google de WeSpeak para continuar.
            </p>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-navy-600 border border-slate-200 dark:border-slate-600 rounded-xl px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-500 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loading ? 'Iniciando sesión…' : 'Continuar con Google'}
            </button>

            {error && (
              <div className="w-full rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300 text-center animate-fade-in">
                {error}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Solo para uso interno de WeSpeak · @wespeak.pro
          </p>
        </div>
      </div>
    </div>
  )
}
