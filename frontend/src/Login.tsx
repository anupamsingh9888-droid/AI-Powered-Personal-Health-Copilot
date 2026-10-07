import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Activity, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Logo, Btn, cx, useL } from './ui'

export interface UserProfile {
  name: string
  email: string
  avatarChar: string
  role: string
  abhaId?: string
  age?: string
  gender?: string
  height?: string
  heightUnit?: string
  weight?: string
  weightUnit?: string
  bloodGroup?: string
  onboarded?: boolean
}

interface LoginProps {
  onLogin: (user: UserProfile) => void
  onSkip?: () => void
}

export function Login({ onLogin, onSkip }: LoginProps) {
  const L = useL()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('alex.rao@email.com')
  const [password, setPassword] = useState('••••••••••')
  const [name, setName] = useState('Alex Rao')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError(L('Please enter both email and password', 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें'))
      return
    }

    setIsLoading(true)
    setError(null)

    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false)
      const displayName = mode === 'signup' ? (name.trim() || 'Health User') : (email.includes('alex') ? 'Alex Rao' : email.split('@')[0])
      onLogin({
        name: displayName,
        email: email.trim(),
        avatarChar: displayName.charAt(0).toUpperCase(),
        role: 'Personal account',
        abhaId: '91-4820-1928-3341',
      })
    }, 600)
  }

  const handleDemoLogin = (demoName: string, demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('healthpass123')
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onLogin({
        name: demoName,
        email: demoEmail,
        avatarChar: demoName.charAt(0).toUpperCase(),
        role: 'Personal account',
        abhaId: '91-4820-1928-3341',
      })
    }, 400)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-200/35 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-200/25 rounded-full blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-white shadow-xl shadow-slate-200/60 rounded-2xl ring-1 ring-slate-200/80 mb-4 transition-transform hover:scale-105 duration-200">
            <Logo size={40} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            AI-Powered Personal Health Copilot
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-sm">
            {L(
              'Your private, intelligent companion for medical documents, lab trends, and health insights.',
              'मेडिकल दस्तावेज़ों, लैब रिपोर्ट और स्वास्थ्य अंतर्दृष्टि के लिए आपका व्यक्तिगत AI साथी।'
            )}
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-7 bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/70 rounded-3xl border border-slate-200/80">
          {/* Sign in / Sign up toggles */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null) }}
              className={cx(
                'flex-1 py-2 text-center rounded-lg transition-all duration-150',
                mode === 'signin' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {L('Sign In', 'साइन इन')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null) }}
              className={cx(
                'flex-1 py-2 text-center rounded-lg transition-all duration-150',
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {L('Create Account', 'नया खाता बनाएँ')}
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 anim-fade-up">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {L('Full Name', 'पूरा नाम')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rao"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {L('Email Address', 'ईमेल पता')}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {L('Password', 'पासवर्ड')}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link simulated. You can sign in directly.')}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    {L('Forgot?', 'भूल गए?')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="text-xs text-slate-600 font-medium">
                  {L('Remember this device', 'इस डिवाइस को याद रखें')}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white font-medium text-sm shadow-md shadow-slate-900/10 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>{mode === 'signin' ? L('Sign In to Copilot', 'कॉपायलट में साइन इन करें') : L('Create Health Profile', 'हेल्थ प्रोफ़ाइल बनाएँ')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              {L('Quick demo access', 'त्वरित डेमो एक्सेस')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('Alex Rao', 'alex.rao@email.com')}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-left transition flex items-center gap-2 group"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-500 text-white text-xs font-semibold shrink-0">
                  A
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-teal-700">Alex Rao</p>
                  <p className="text-[10px] text-slate-500 truncate">Patient Account</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Priya Sharma', 'priya.sharma@health.org')}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-left transition flex items-center gap-2 group"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500 text-white text-xs font-semibold shrink-0">
                  P
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-sky-700">Priya Sharma</p>
                  <p className="text-[10px] text-slate-500 truncate">Wellness Profile</p>
                </div>
              </button>
            </div>
          </div>

          {onSkip && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline underline-offset-4"
              >
                {L('Continue as guest preview →', 'अतिथि पूर्वावलोकन के रूप में जारी रखें →')}
              </button>
            </div>
          )}
        </div>

        {/* Security & Feature Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>256-bit Encrypted Health Vault</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
            <Sparkles size={14} className="text-violet-600" />
            <span>Explainable AI Grounding</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
            <Activity size={14} className="text-sky-600" />
            <span>FHIR / ABDM Interoperable</span>
          </div>
        </div>
      </div>
    </div>
  )
}
