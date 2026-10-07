import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  User,
  Heart,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  Lock,
  Calendar,
  Layers,
  Activity,
  Droplets,
  Ruler,
  Weight
} from 'lucide-react'
import { Logo, Btn, cx, useL } from './ui'

export interface PersonalHealthData {
  fullName: string
  age: string
  gender: 'Male' | 'Female' | 'Prefer not to say' | ''
  height: string
  heightUnit: 'cm' | 'ft'
  weight: string
  weightUnit: 'kg' | 'lbs'
  bloodGroup: 'A+' | 'A−' | 'B+' | 'B−' | 'AB+' | 'AB−' | 'O+' | 'O−' | 'Unknown' | ''
}

interface OnboardingProps {
  initialName?: string
  onComplete: (data: PersonalHealthData) => void
  onSkip?: () => void
}

export function HealthOnboarding({ initialName = '', onComplete, onSkip }: OnboardingProps) {
  const L = useL()

  const [form, setForm] = useState<PersonalHealthData>({
    fullName: initialName || 'Alex Rao',
    age: '34',
    gender: 'Male',
    height: '178',
    heightUnit: 'cm',
    weight: '68',
    weightUnit: 'kg',
    bloodGroup: 'O+',
  })

  const [activeTip, setActiveTip] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Real-time BMI calculation for preview (delightful micro-feedback)
  const bmiCalc = useMemo(() => {
    const h = parseFloat(form.height)
    const w = parseFloat(form.weight)
    if (!h || !w || h <= 0 || w <= 0) return null

    let heightInMeters = form.heightUnit === 'cm' ? h / 100 : (h * 30.48) / 100
    let weightInKg = form.weightUnit === 'kg' ? w : w * 0.453592

    if (heightInMeters <= 0.5 || heightInMeters >= 2.5) return null
    const bmi = +(weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
    if (isNaN(bmi) || bmi <= 10 || bmi >= 60) return null

    let category = 'Normal'
    let color = 'text-teal-700'
    if (bmi < 18.5) { category = 'Underweight'; color = 'text-sky-700' }
    else if (bmi >= 25 && bmi < 30) { category = 'Overweight'; color = 'text-amber-700' }
    else if (bmi >= 30) { category = 'Elevated'; color = 'text-rose-700' }

    return { value: bmi, category, color }
  }, [form.height, form.heightUnit, form.weight, form.weightUnit])

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      onComplete(form)
    }, 350)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0b1b33] flex flex-col justify-between selection:bg-teal-100 selection:text-teal-900 antialiased">
      {/* Subtle calm ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 right-1/4 w-[600px] h-[360px] bg-gradient-to-b from-teal-500/[0.04] to-sky-400/[0.02] rounded-full blur-3xl transform -translate-y-1/2" />
        <div className="absolute bottom-0 left-10 w-[500px] h-[350px] bg-teal-600/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8 pb-4 flex items-center justify-between">
        {/* Top-left: Minimal HealthLens logo with eye/lens + pulse symbol */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3057] to-[#0b1b33] text-white shadow-xs ring-1 ring-slate-900/10">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="onb-pulse" x1="6" y1="0" x2="26" y2="0">
                    <stop stopColor="#5eead4" />
                    <stop offset="1" stopColor="#7dd3fc" />
                  </linearGradient>
                </defs>
                {/* Lens contour */}
                <path
                  d="M4.5 16C8 10.6 11.6 8.4 16 8.4S24 10.6 27.5 16C24 21.4 20.4 23.6 16 23.6S8 21.4 4.5 16Z"
                  stroke="white"
                  strokeOpacity=".9"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                {/* Pulse wave */}
                <path
                  d="M9.5 16H13l1.6-3.6 2.8 7.2 1.6-3.6h3.5"
                  stroke="url(#onb-pulse)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[17px] font-bold tracking-tight text-[#0f3057] leading-none">
                Health<span className="text-teal-600">Lens</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                AI Health Copilot
              </span>
            </div>
          </div>
        </div>

        {/* Top-right: Step 1 of 2 + 50% Progress indicator */}
        <div className="flex items-center gap-3.5">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-700 tracking-tight">Step 1 of 2</span>
            <span className="text-[11px] text-slate-600 hidden sm:inline">Baseline profile</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-200 overflow-hidden relative" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-[#0f3057] rounded-full transition-all duration-700 ease-out"
                style={{ width: '50%' }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-teal-800">50%</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-3xl mx-auto px-5 sm:px-8 py-6 flex-1 flex flex-col justify-center">
        {/* Headings and Intro */}
        <div className="text-center sm:text-left mb-8">
          <h1 className="font-display text-[28px] sm:text-[34px] font-bold text-[#0b1b33] tracking-tight leading-[1.2]">
            {L("Let's personalize your health experience", "आइए आपके स्वास्थ्य अनुभव को व्यक्तिगत बनाएँ")}
          </h1>
          <p className="mt-2.5 text-[15px] sm:text-[16px] text-slate-600 leading-relaxed max-w-2xl">
            {L(
              "Tell us a few basic details so HealthLens can organize your health information and give you more relevant insights.",
              "कुछ बुनियादी विवरण साझा करें ताकि HealthLens आपके मेडिकल दस्तावेज़ों को व्यवस्थित कर सके और सटीक संदर्भ प्रदान कर सके।"
            )}
          </p>

          {/* Privacy reassurance message */}
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/60 text-xs font-medium text-teal-900 shadow-2xs">
            <span className="text-teal-700" aria-hidden>🔒</span>
            <span>{L("Your health information is private and securely stored.", "आपकी स्वास्थ्य जानकारी निजी और सुरक्षित रूप से एन्क्रिप्टेड है।")}</span>
          </div>
        </div>

        {/* Section 1 — About You Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-9 shadow-sm shadow-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-7">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-[#0f3057]">
                <User size={17} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="font-display text-[19px] font-bold text-[#0b1b33] tracking-tight">
                  About You
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Core physiological context for laboratory references & prescriptions
                </p>
              </div>
            </div>

            {bmiCalc && (
              <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-slate-600 font-medium">Estimated BMI:</span>
                <span className="font-semibold text-slate-900">{bmiCalc.value}</span>
                <span className={cx('font-medium', bmiCalc.color)}>({bmiCalc.category})</span>
              </div>
            )}
          </div>

          <form onSubmit={handleNext} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Field 1: Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  1. Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[15px] font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100/70 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Field 2: Age */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  2. Age
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="125"
                    required
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="e.g. 20"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[15px] font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100/70 transition shadow-2xs"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600">
                    years
                  </span>
                </div>
              </div>

              {/* Field 3: Gender */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  3. Gender
                </label>
                <div className="relative">
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as PersonalHealthData['gender'] })}
                    className="w-full h-12 px-4 pr-10 rounded-xl border border-slate-200 text-[15px] font-medium text-slate-900 bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100/70 transition shadow-2xs appearance-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Field 4: Height */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  4. Height
                </label>
                <div className="flex rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100/70 transition">
                  <input
                    type="number"
                    min="30"
                    max="260"
                    step="0.5"
                    required
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    placeholder="e.g. 175"
                    className="w-full h-12 px-4 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <div className="flex items-center border-l border-slate-100 bg-slate-50 px-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 5: Weight */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  5. Weight
                </label>
                <div className="flex rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100/70 transition">
                  <input
                    type="number"
                    min="10"
                    max="350"
                    step="0.5"
                    required
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="e.g. 70"
                    className="w-full h-12 px-4 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <div className="flex items-center border-l border-slate-100 bg-slate-50 px-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 6: Blood Group */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  6. Blood Group
                </label>
                <div className="relative">
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value as PersonalHealthData['bloodGroup'] })}
                    className="w-full h-12 px-4 pr-10 rounded-xl border border-slate-200 text-[15px] font-medium text-slate-900 bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100/70 transition shadow-2xs appearance-none cursor-pointer"
                  >
                    <option value="A+">A+</option>
                    <option value="A−">A−</option>
                    <option value="B+">B+</option>
                    <option value="B−">B−</option>
                    <option value="AB+">AB+</option>
                    <option value="AB−">AB−</option>
                    <option value="O+">O+</option>
                    <option value="O−">O−</option>
                    <option value="Unknown">I don't know my blood group</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Helper info banner */}
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 p-4 border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
              <Sparkles size={16} className="text-teal-600 shrink-0 mt-0.5" />
              <span>
                These physiological parameters allow HealthLens to highlight reference ranges accurately on lab reports (like Hemoglobin, Creatinine, or Lipid profiles) and flag age/weight sensitive dosage alerts.
              </span>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              {onSkip ? (
                <button
                  type="button"
                  onClick={onSkip}
                  className="order-2 sm:order-1 text-xs font-semibold text-slate-600 hover:text-slate-800 underline underline-offset-4 cursor-pointer py-2"
                >
                  Skip for now, I'll complete this later
                </button>
              ) : (
                <span className="order-2 sm:order-1 text-xs text-slate-600">
                  You can update these anytime in Profile
                </span>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="order-1 sm:order-2 w-full sm:w-auto h-11 px-7 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f3057] hover:bg-[#0b2342] text-white font-medium text-sm shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
              >
                <span>Continue to Personalization</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer reassurance */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-5 py-6 text-center text-xs text-slate-600 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-teal-600" />
          HIPAA & ISO-aligned privacy standards
        </span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>ABDM & FHIR data format readiness</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>No diagnostic substitution</span>
      </footer>
    </div>
  )
}
