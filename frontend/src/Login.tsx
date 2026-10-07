import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Phone } from 'lucide-react'
import { Logo, cx, useL } from './ui'
import type { UserHealthProfile } from './types'

export type UserProfile = UserHealthProfile

interface LoginProps {
  onLogin: (user: UserHealthProfile) => void
  onSkip?: () => void
}

export function Login({ onLogin, onSkip }: LoginProps) {
  const L = useL()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [identifier, setIdentifier] = useState('alex.rao@email.com')
  const [password, setPassword] = useState('password123')
  const [name, setName] = useState('Alex Rao')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotSent, setForgotSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError(L('Please enter your email or mobile number', 'कृपया अपना ईमेल या मोबाइल नंबर दर्ज करें'))
      return
    }
    if (!password.trim() || password.length < 6) {
      setError(L('Password must be at least 6 characters long', 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए'))
      return
    }

    setIsLoading(true)
    setError(null)

    setTimeout(() => {
      setIsLoading(false)
      const displayName =
        mode === 'signup'
          ? name.trim() || 'Health User'
          : identifier.toLowerCase().includes('alex')
          ? 'Alex Rao'
          : identifier.includes('@')
          ? identifier.split('@')[0]
          : 'Alex Rao'

      onLogin({
        name: displayName,
        email: identifier.includes('@') ? identifier.trim() : `${displayName.toLowerCase().replace(/\s+/g, '')}@health.org`,
        avatarChar: displayName.charAt(0).toUpperCase(),
        role: 'Personal account',
        abhaId: '91-4820-1928-3341',
        age: '34',
        gender: 'Male',
        height: '178',
        heightUnit: 'cm',
        weight: '68',
        weightUnit: 'kg',
        bloodGroup: 'O+',
        onboarded: true,
      })
    }, 450)
  }

  const handleDemoLogin = (demoName: string, demoIdentifier: string) => {
    setIdentifier(demoIdentifier)
    setPassword('demopassword')
    setIsLoading(true)
    setError(null)

    setTimeout(() => {
      setIsLoading(false)
      onLogin({
        name: demoName,
        email: demoIdentifier,
        avatarChar: demoName.charAt(0).toUpperCase(),
        role: 'Personal account',
        abhaId: '91-4820-1928-3341',
        age: demoName === 'Alex Rao' ? '34' : '29',
        gender: demoName === 'Alex Rao' ? 'Male' : 'Female',
        height: demoName === 'Alex Rao' ? '178' : '165',
        heightUnit: 'cm',
        weight: demoName === 'Alex Rao' ? '68' : '58',
        weightUnit: 'kg',
        bloodGroup: demoName === 'Alex Rao' ? 'O+' : 'B+',
        onboarded: true,
      })
    }, 350)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900 relative">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-sky-200/25 rounded-full blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-white shadow-md shadow-slate-200/60 rounded-2xl ring-1 ring-slate-200/80 mb-3.5">
            <Logo size={42} word={false} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {L('Welcome to HealthCopilot', 'HealthCopilot में आपका स्वागत है')}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-sm leading-relaxed">
            {L(
              'Your simple assistant for understanding your health.',
              'आपके स्वास्थ्य को आसान भाषा में समझने के लिए आपका व्यक्तिगत सहायक।'
            )}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white py-7 px-6 sm:px-9 shadow-lg shadow-slate-200/60 rounded-3xl border border-slate-200/80">
          {/* Sign In / Create Account Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError(null)
                setForgotSent(false)
              }}
              className={cx(
                'flex-1 py-2 text-center rounded-lg transition-all cursor-pointer',
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {L('Sign In', 'साइन इन')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
                setForgotSent(false)
              }}
              className={cx(
                'flex-1 py-2 text-center rounded-lg transition-all cursor-pointer',
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {L('Create Account', 'नया खाता बनाएँ')}
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 anim-fade-up">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {forgotSent && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 anim-fade-up">
              <CheckCircle2 size={15} className="shrink-0 text-teal-600" />
              <span>{L('Password reset instructions sent. You can also try Demo login below.', 'पासवर्ड रीसेट निर्देश भेजे गए। आप नीचे डेमो से भी प्रवेश कर सकते हैं।')}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {L('Full Name', 'पूरा नाम')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rao"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {L('Email or Mobile Number', 'ईमेल या मोबाइल नंबर')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@email.com or +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {L('Password', 'पासवर्ड')}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSent(true)
                      setError(null)
                    }}
                    className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                  >
                    {L('Forgot password?', 'पासवर्ड भूल गए?')}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white font-bold text-sm shadow-sm transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>
                    {mode === 'signin'
                      ? L('Sign In to Dashboard', 'डैशबोर्ड में साइन इन करें')
                      : L('Create Health Account', 'खाता बनाएँ')}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Access */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {L('Try Demo Mode', 'डेमो मोड आज़माएँ')}
              </p>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                {L('Instant preview', 'तुरंत प्रवेश')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('Alex Rao', 'alex.rao@email.com')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-600 text-white text-xs font-bold shrink-0">
                  A
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-800">Alex Rao</p>
                  <p className="text-[10px] text-slate-500 truncate">Patient Account</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('Priya Sharma', 'priya.sharma@health.org')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-600 text-white text-xs font-bold shrink-0">
                  P
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-800">Priya Sharma</p>
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
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-4 cursor-pointer"
              >
                {L('Continue as guest →', 'अतिथि के रूप में जारी रखें →')}
              </button>
            </div>
          )}
        </div>

        {/* Security Reassurance Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>{L('Private & Encrypted Personal Health Vault', 'निजी और एन्क्रिप्टेड व्यक्तिगत स्वास्थ्य वॉल्ट')}</span>
        </p>
      </div>
    </div>
  )
}
