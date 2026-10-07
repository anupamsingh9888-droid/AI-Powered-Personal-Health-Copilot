import { useEffect, useState, useMemo } from 'react'
import {
  Bell,
  CircleHelp,
  FileText,
  House,
  Pill,
  Search,
  Settings,
  UserRound,
  Clock,
  Check,
  TriangleAlert,
  ChevronDown,
  LogOut,
  LogIn,
  Sparkles,
  MessageSquareHeart,
  Activity,
  Calendar,
  X,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { Logo, LangCtx, ToastCtx, EvidenceCtx, cx, type Lang, type EvidenceTarget } from './ui'
import { Home, Timeline, Summary, Medications, Profile } from './views'
import { Documents, EvidenceDrawer } from './flow'
import { Login, type UserProfile } from './Login'
import { HealthOnboarding, type PersonalHealthData } from './HealthOnboarding'
import { HealthChat } from './HealthChat'
import { Conditions } from './Conditions'
import { Appointments } from './Appointments'
import {
  INITIAL_CONDITIONS,
  INITIAL_MEDICATIONS,
  DOCTORS,
  INITIAL_APPOINTMENTS,
  INITIAL_ALERTS,
} from './data/healthData'
import type { ConditionInfo, Appointment, MedicationItem, HealthAlert, HealthConditionId } from './types'

const nav = [
  { id: 'home', en: 'Dashboard', hi: 'डैशबोर्ड', i: House },
  { id: 'chat', en: 'AI Health Chat', hi: 'AI स्वास्थ्य चैट', i: MessageSquareHeart },
  { id: 'conditions', en: 'Health Conditions', hi: 'स्वास्थ्य स्थितियाँ', i: Activity },
  { id: 'appointments', en: 'Doctor Appointments', hi: 'डॉक्टर अपॉइंटमेंट्स', i: Calendar },
  { id: 'timeline', en: 'Health Timeline', hi: 'स्वास्थ्य टाइमलाइन', i: Clock },
  { id: 'documents', en: 'Documents', hi: 'दस्तावेज़', i: FileText },
  { id: 'medications', en: 'Medications', hi: 'दवाएँ', i: Pill },
  { id: 'profile', en: 'Health Profile', hi: 'स्वास्थ्य प्रोफ़ाइल', i: UserRound },
]

const mobileNav = [
  nav[0], // Dashboard
  nav[1], // AI Chat
  nav[2], // Health Conditions
  nav[3], // Appointments
  nav[7], // Profile
]

export default function App() {
  const [view, setView] = useState('home')
  const [lang, setLang] = useState<Lang>('en')
  const [evidence, setEvidence] = useState<EvidenceTarget>(null)
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'warn'; k: number } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Unified Health State
  const [conditions, setConditions] = useState<ConditionInfo[]>(INITIAL_CONDITIONS)
  const [selectedConditionId, setSelectedConditionId] = useState<HealthConditionId | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS)
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS)
  const [alerts, setAlerts] = useState<HealthAlert[]>(INITIAL_ALERTS)
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('')

  // Global Header Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  // Auth state with local storage persistence
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('health_copilot_user')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      name: 'Alex Rao',
      email: 'alex.rao@email.com',
      avatarChar: 'A',
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
    }
  })

  // Whether user is in explicit login view
  const [showLoginModal, setShowLoginModal] = useState(false)
  // Whether user is in onboarding flow
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view, selectedConditionId])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(id)
  }, [toast])

  const handleLoginSuccess = (profile: UserProfile) => {
    const needsOnboarding = !profile.onboarded
    setUser(profile)
    try {
      localStorage.setItem('health_copilot_user', JSON.stringify(profile))
    } catch {}
    setShowLoginModal(false)

    if (needsOnboarding) {
      setShowOnboarding(true)
    } else {
      setToast({ msg: `Welcome back, ${profile.name}! HealthCopilot is ready.`, tone: 'ok', k: Date.now() })
    }
  }

  const handleOnboardingComplete = (data: PersonalHealthData) => {
    if (!user) return
    const updatedUser: UserProfile = {
      ...user,
      name: data.fullName || user.name,
      avatarChar: (data.fullName || user.name).charAt(0).toUpperCase(),
      age: data.age,
      gender: data.gender,
      height: data.height,
      heightUnit: data.heightUnit,
      weight: data.weight,
      weightUnit: data.weightUnit,
      bloodGroup: data.bloodGroup,
      onboarded: true,
    }

    setUser(updatedUser)
    try {
      localStorage.setItem('health_copilot_user', JSON.stringify(updatedUser))
    } catch {}
    setShowOnboarding(false)
    setToast({ msg: `Profile personalized for ${updatedUser.name}! Dashboard updated.`, tone: 'ok', k: Date.now() })
  }

  const handleLogout = () => {
    setUser(null)
    try {
      localStorage.removeItem('health_copilot_user')
    } catch {}
    setUserMenuOpen(false)
    setShowOnboarding(false)
    setShowLoginModal(true)
    setToast({ msg: 'Signed out successfully', tone: 'ok', k: Date.now() })
  }

  // Medication interactive Taken / Skip / Reset tracking
  const handleMedicationStatusChange = (id: string, action: 'taken' | 'skip' | 'reset') => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        if (action === 'taken') {
          return { ...m, takenToday: true, skippedToday: false }
        } else if (action === 'skip') {
          return { ...m, takenToday: false, skippedToday: true }
        } else if (action === 'reset') {
          return { ...m, takenToday: false, skippedToday: false }
        }
        return m
      })
    )
  }

  // Appointment booking & management
  const handleBookAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      ...aptData,
    }
    setAppointments((prev) => [newApt, ...prev])
    // Update dashboard alert
    setAlerts((prev) => [
      {
        id: `alt-${Date.now()}`,
        title: `Appointment with ${newApt.doctorName}`,
        titleHi: `${newApt.doctorName} के साथ अपॉइंटमेंट`,
        description: `${newApt.date} at ${newApt.time} · ${newApt.clinic}`,
        descriptionHi: `${newApt.date} को ${newApt.time} पर · ${newApt.clinic}`,
        type: 'appointment',
        actionLabel: 'View appointment',
        actionView: 'appointments',
      },
      ...prev.filter((a) => a.type !== 'appointment'),
    ])
  }

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    setAlerts((prev) => prev.filter((a) => a.type !== 'appointment'))
    setToast({ msg: 'Appointment cancelled.', tone: 'ok', k: Date.now() })
  }

  const handleToggleReminder = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, hasReminder: !a.hasReminder } : a))
    )
    setToast({ msg: 'Reminder preferences updated.', tone: 'ok', k: Date.now() })
  }

  // Route to AI chat with a pre-loaded question
  const handleAskAiWithPrompt = (prompt: string) => {
    setChatInitialPrompt(prompt)
    setView('chat')
  }

  // Route to Doctor consultation with pre-filtered specialty
  const handleBookDoctorWithSpecialty = (specialty?: string) => {
    setView('appointments')
  }

  // Global search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const results: { title: string; category: string; targetView: string; extra?: any }[] = []

    // Search conditions
    conditions.forEach((c) => {
      if (c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)) {
        results.push({
          title: c.title,
          category: 'Health Condition',
          targetView: 'conditions',
          extra: c.id,
        })
      }
    })

    // Search medications
    medications.forEach((m) => {
      if (m.name.toLowerCase().includes(q) || m.instructions.toLowerCase().includes(q)) {
        results.push({
          title: `${m.name} ${m.dose}`,
          category: 'Medication',
          targetView: 'medications',
        })
      }
    })

    // Search doctors
    DOCTORS.forEach((d) => {
      if (d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)) {
        results.push({
          title: `${d.name} (${d.specialty})`,
          category: 'Doctor',
          targetView: 'appointments',
        })
      }
    })

    // Search reports & timeline
    if ('complete blood count cbc hemoglobin'.includes(q)) {
      results.push({
        title: 'CBC Blood Test (Meridian Diagnostics)',
        category: 'Lab Report',
        targetView: 'summary',
      })
    }
    if ('prescription amoxicillin pantoprazole'.includes(q)) {
      results.push({
        title: 'Prescription by Dr. R. Menon (04 Oct)',
        category: 'Prescription Document',
        targetView: 'documents',
      })
    }

    return results
  }, [searchQuery, conditions, medications])

  // Custom navigation dispatcher supporting views and sub-routes
  const navigateTo = (viewId: string, extra?: any) => {
    if (viewId === 'conditions') {
      if (extra && extra.conditionId) {
        setSelectedConditionId(extra.conditionId)
      } else {
        setSelectedConditionId(null)
      }
      setView('conditions')
    } else if (viewId === 'chat' && extra && extra.prompt) {
      setChatInitialPrompt(extra.prompt)
      setView('chat')
    } else {
      setView(viewId)
    }
  }

  // If user is logged out or requested login view
  if (!user || showLoginModal) {
    return (
      <LangCtx.Provider value={lang}>
        <Login
          onLogin={handleLoginSuccess}
          onSkip={user ? () => setShowLoginModal(false) : undefined}
        />
      </LangCtx.Provider>
    )
  }

  // Personal Health Profile onboarding screen
  if (showOnboarding) {
    return (
      <LangCtx.Provider value={lang}>
        <HealthOnboarding
          initialName={user.name}
          onComplete={handleOnboardingComplete}
          onSkip={() => setShowOnboarding(false)}
        />
      </LangCtx.Provider>
    )
  }

  const pages: Record<string, React.ReactNode> = {
    home: (
      <Home
        go={navigateTo}
        user={user}
        conditions={conditions}
        appointments={appointments}
        medications={medications}
        alerts={alerts}
        onMedicationStatusChange={handleMedicationStatusChange}
        onQuickAskAi={handleAskAiWithPrompt}
      />
    ),
    chat: (
      <HealthChat
        userName={user?.name ? user.name.split(' ')[0] : 'Alex'}
        initialPrompt={chatInitialPrompt}
      />
    ),
    conditions: (
      <Conditions
        conditions={conditions}
        selectedConditionId={selectedConditionId}
        onSelectCondition={setSelectedConditionId}
        onAskAi={handleAskAiWithPrompt}
        onBookDoctor={handleBookDoctorWithSpecialty}
      />
    ),
    appointments: (
      <Appointments
        doctors={DOCTORS}
        appointments={appointments}
        onBookAppointment={handleBookAppointment}
        onCancelAppointment={handleCancelAppointment}
        onToggleReminder={handleToggleReminder}
      />
    ),
    timeline: (
      <Timeline
        onAskAi={handleAskAiWithPrompt}
        onGoCondition={(condId) => {
          setSelectedConditionId(condId as HealthConditionId)
          setView('conditions')
        }}
      />
    ),
    documents: <Documents />,
    medications: (
      <Medications
        medications={medications}
        onMedicationStatusChange={handleMedicationStatusChange}
        onNavigate={setView}
      />
    ),
    profile: (
      <Profile
        user={user}
        onLogout={handleLogout}
        onUpdateUser={(updated) => {
          setUser(updated)
          try {
            localStorage.setItem('health_copilot_user', JSON.stringify(updated))
          } catch {}
        }}
      />
    ),
    summary: <Summary />,
  }

  const label = (n: { en: string; hi: string }) => (lang === 'hi' ? n.hi : n.en)

  return (
    <LangCtx.Provider value={lang}>
      <ToastCtx.Provider value={(msg, tone = 'ok') => setToast({ msg, tone, k: Date.now() })}>
        <EvidenceCtx.Provider value={setEvidence}>
          <div className="min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar Navigation */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-slate-200/70 bg-white/85 px-4 py-6 backdrop-blur-xl lg:flex">
              <div className="mb-8 px-2">
                <Logo word size={34} />
              </div>

              <nav className="space-y-1">
                {nav.map((n) => {
                  const on = view === n.id
                  return (
                    <button
                      key={n.id}
                      onClick={() => navigateTo(n.id)}
                      className={cx(
                        'group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-all cursor-pointer',
                        on
                          ? 'bg-[#0f3057] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <n.i size={18} strokeWidth={on ? 2 : 1.7} />
                      <span>{label(n)}</span>
                    </button>
                  )
                })}
              </nav>

              <div className="mt-auto space-y-1 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <LogIn size={16} strokeWidth={1.7} />
                  <span>{lang === 'hi' ? 'खाता बदलें' : 'Switch Account'}</span>
                </button>
                <button
                  onClick={() => navigateTo('profile')}
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <Settings size={16} strokeWidth={1.7} />
                  <span>{lang === 'hi' ? 'सेटिंग्स' : 'Settings'}</span>
                </button>

                {/* User menu avatar button */}
                <div className="relative mt-3">
                  <div
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 cursor-pointer hover:bg-slate-100 transition border border-slate-100"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-teal-500 text-sm font-bold text-white shadow-xs shrink-0">
                      {user.avatarChar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="truncate text-[10.5px] text-slate-400">{user.role}</p>
                    </div>
                    <ChevronDown
                      size={14}
                      className={cx('text-slate-400 transition-transform', userMenuOpen && 'rotate-180')}
                    />
                  </div>

                  {userMenuOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl space-y-1 anim-fade-up z-50">
                      <button
                        onClick={() => {
                          navigateTo('profile')
                          setUserMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <UserRound size={14} /> Profile & Records
                      </button>
                      <button
                        onClick={() => {
                          setShowOnboarding(true)
                          setUserMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles size={14} /> Personalize Health Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Area */}
            <div className="lg:pl-[260px]">
              {/* Header Bar */}
              <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/60 bg-background/85 px-4 backdrop-blur-xl md:px-8">
                <div className="lg:hidden">
                  <Logo word size={30} />
                </div>

                {/* Global Search with Dropdown Results */}
                <div className="relative ml-auto hidden w-80 md:block">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSearchOpen(true)
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder={lang === 'hi' ? 'दस्तावेज़, दवा या डॉक्टर खोजें…' : 'Search reports, meds, doctors…'}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-xs font-medium outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSearchOpen(false)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {searchOpen && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 space-y-1 anim-fade-up max-h-72 overflow-y-auto">
                      {searchResults.length === 0 ? (
                        <p className="text-xs text-slate-500 p-3 text-center">
                          {lang === 'hi' ? 'कोई मेल नहीं मिला' : 'No matching health records found'}
                        </p>
                      ) : (
                        searchResults.map((res, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (res.targetView === 'conditions' && res.extra) {
                                setSelectedConditionId(res.extra)
                              }
                              setView(res.targetView)
                              setSearchOpen(false)
                              setSearchQuery('')
                            }}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{res.title}</p>
                              <p className="text-[10px] text-teal-700 font-semibold">{res.category}</p>
                            </div>
                            <ArrowRight size={13} className="text-slate-400" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Language Switcher */}
                <div
                  className="ml-auto flex rounded-xl bg-slate-100 p-0.5 text-[12px] font-bold md:ml-0"
                  role="group"
                  aria-label="Language selection"
                >
                  {([['en', 'EN'], ['hi', 'हिंदी']] as const).map(([k, t]) => (
                    <button
                      key={k}
                      onClick={() => setLang(k)}
                      className={cx(
                        'h-8 rounded-[10px] px-3 transition-all cursor-pointer',
                        lang === k ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Notifications Bell */}
                <button
                  onClick={() => {
                    setToast({
                      msg: `You have ${alerts.length} health alerts and reminders.`,
                      tone: 'ok',
                      k: Date.now(),
                    })
                  }}
                  className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell size={18} strokeWidth={1.7} />
                  {alerts.length > 0 && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" />
                  )}
                </button>

                {/* User avatar indicator */}
                <button
                  onClick={() => setShowLoginModal(true)}
                  title={`Signed in as ${user.name} - Click to switch`}
                  className="hidden h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-teal-500 text-xs font-bold text-white shadow-2xs hover:ring-2 hover:ring-teal-400/50 transition md:grid cursor-pointer"
                >
                  {user.avatarChar}
                </button>
              </header>

              {/* Main Content Area */}
              <main className="px-4 pb-28 pt-7 md:px-8 md:pt-9 lg:pb-16">{pages[view]}</main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed inset-x-3 bottom-3 z-30 flex rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl lg:hidden">
              {mobileNav.map((n) => {
                const on = view === n.id
                return (
                  <button
                    key={n.id}
                    onClick={() => navigateTo(n.id)}
                    className={cx(
                      'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10.5px] font-bold transition-all cursor-pointer',
                      on ? 'bg-[#0f3057] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    <n.i size={18} strokeWidth={on ? 2 : 1.7} />
                    <span className="truncate max-w-[64px]">{label(n)}</span>
                  </button>
                )
              })}
            </nav>

            {/* Global Toast */}
            {toast && (
              <div
                key={toast.k}
                className="anim-fade-up fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl bg-[#0b1b33] px-4.5 py-3 text-xs sm:text-sm font-semibold text-white shadow-2xl lg:bottom-8 max-w-[90vw]"
              >
                <span
                  className={cx(
                    'grid h-5 w-5 place-items-center rounded-full shrink-0',
                    toast.tone === 'ok' ? 'bg-teal-500 text-white' : 'bg-amber-500 text-white'
                  )}
                >
                  {toast.tone === 'ok' ? <Check size={12} strokeWidth={3} /> : <TriangleAlert size={11} />}
                </span>
                <span>{toast.msg}</span>
              </div>
            )}

            {/* Original Document / Evidence Drawer */}
            <EvidenceDrawer target={evidence} onClose={() => setEvidence(null)} />
          </div>
        </EvidenceCtx.Provider>
      </ToastCtx.Provider>
    </LangCtx.Provider>
  )
}
