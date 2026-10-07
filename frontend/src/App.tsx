import { useEffect, useState } from 'react'
import { Bell, CircleHelp, FileText, House, Pill, Search, Settings, Palette, UserRound, Clock, Check, TriangleAlert, ChevronDown } from 'lucide-react'
import { Logo, LangCtx, ToastCtx, EvidenceCtx, cx, type Lang, type EvidenceTarget } from './ui'
import { Home, Timeline, Summary, Medications, Profile } from './views'
import { Documents, EvidenceDrawer } from './flow'
import { System } from './system'

const nav = [
  { id: 'home', en: 'Home', hi: 'होम', i: House },
  { id: 'timeline', en: 'Health Timeline', hi: 'स्वास्थ्य टाइमलाइन', i: Clock },
  { id: 'documents', en: 'Documents', hi: 'दस्तावेज़', i: FileText },
  { id: 'medications', en: 'Medications', hi: 'दवाएँ', i: Pill },
  { id: 'profile', en: 'Health Profile', hi: 'स्वास्थ्य प्रोफ़ाइल', i: UserRound },
]
const mobileNav = [nav[0], { ...nav[1], en: 'Timeline', hi: 'टाइमलाइन' }, nav[2], { ...nav[4], en: 'Profile', hi: 'प्रोफ़ाइल' }]

export default function App() {
  const [view, setView] = useState('home')
  const [lang, setLang] = useState<Lang>('en')
  const [evidence, setEvidence] = useState<EvidenceTarget>(null)
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'warn'; k: number } | null>(null)

  useEffect(() => { window.scrollTo({ top: 0 }) }, [view])
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(id)
  }, [toast])

  const pages: Record<string, React.ReactNode> = {
    home: <Home go={setView} />,
    timeline: <Timeline />,
    documents: <Documents />,
    medications: <Medications />,
    profile: <Profile />,
    summary: <Summary />,
    system: <System />,
  }
  const label = (n: { en: string; hi: string }) => (lang === 'hi' ? n.hi : n.en)

  return (
    <LangCtx.Provider value={lang}>
      <ToastCtx.Provider value={(msg, tone = 'ok') => setToast({ msg, tone, k: Date.now() })}>
        <EvidenceCtx.Provider value={setEvidence}>
          <div className="min-h-screen bg-background text-foreground">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-slate-200/70 bg-white/80 px-4 py-6 backdrop-blur-xl lg:flex">
              <div className="mb-8 px-2"><Logo word size={34} /></div>
              <nav className="space-y-1">
                {nav.map((n) => {
                  const on = view === n.id
                  return (
                    <button key={n.id} onClick={() => setView(n.id)} className={cx('group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[14.5px] transition-all', on ? 'bg-[#0f3057] font-medium text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}>
                      <n.i size={18} strokeWidth={on ? 2 : 1.7} />{label(n)}
                    </button>
                  )
                })}
              </nav>
              <div className="mt-auto space-y-1 border-t border-slate-100 pt-4">
                <button onClick={() => setView('system')} className={cx('flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm', view === 'system' ? 'bg-slate-100 font-medium' : 'text-slate-500 hover:bg-slate-100')}><Palette size={17} strokeWidth={1.7} />Design system</button>
                <button className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-slate-500 hover:bg-slate-100"><Settings size={17} strokeWidth={1.7} />Settings</button>
                <button className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-slate-500 hover:bg-slate-100"><CircleHelp size={17} strokeWidth={1.7} />Help</button>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-teal-500 text-sm font-semibold text-white">A</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Alex Rao</p><p className="truncate text-[11px] text-slate-400">Personal account</p></div>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>
            </aside>

            <div className="lg:pl-[248px]">
              <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/60 bg-background/80 px-4 backdrop-blur-xl md:px-8">
                <div className="lg:hidden"><Logo size={30} /></div>
                <div className="relative ml-auto hidden w-72 md:block">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input placeholder="Search your health records…" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                </div>
                <div className="ml-auto flex rounded-xl bg-slate-100 p-0.5 text-[13px] font-medium md:ml-0" role="group" aria-label="Language">
                  {([['en', 'EN'], ['hi', 'हिंदी']] as const).map(([k, t]) => (
                    <button key={k} onClick={() => setLang(k)} className={cx('h-8 rounded-[10px] px-3 transition-all', lang === k ? 'bg-white text-foreground shadow-sm' : 'text-slate-500')}>{t}</button>
                  ))}
                </div>
                <button className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100" aria-label="Notifications"><Bell size={18} strokeWidth={1.7} /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" /></button>
                <span className="hidden h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-teal-500 text-sm font-semibold text-white md:grid">A</span>
              </header>

              <main className="px-4 pb-28 pt-8 md:px-8 md:pt-10 lg:pb-16">{pages[view]}</main>
            </div>

            <nav className="fixed inset-x-3 bottom-3 z-30 flex rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-xl backdrop-blur-xl lg:hidden">
              {mobileNav.map((n) => {
                const on = view === n.id
                return (
                  <button key={n.id} onClick={() => setView(n.id)} className={cx('flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-all', on ? 'bg-[#0f3057] text-white' : 'text-slate-500')}>
                    <n.i size={19} strokeWidth={on ? 2 : 1.7} />{label(n)}
                  </button>
                )
              })}
            </nav>

            {toast && (
              <div key={toast.k} className="anim-fade-up fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl bg-[#0b1b33] px-4 py-3 text-sm font-medium text-white shadow-2xl lg:bottom-8">
                <span className={cx('grid h-5 w-5 place-items-center rounded-full', toast.tone === 'ok' ? 'bg-teal-500' : 'bg-amber-500')}>{toast.tone === 'ok' ? <Check size={12} strokeWidth={3} /> : <TriangleAlert size={11} />}</span>
                {toast.msg}
              </div>
            )}
            <EvidenceDrawer target={evidence} onClose={() => setEvidence(null)} />
          </div>
        </EvidenceCtx.Provider>
      </ToastCtx.Provider>
    </LangCtx.Provider>
  )
}
