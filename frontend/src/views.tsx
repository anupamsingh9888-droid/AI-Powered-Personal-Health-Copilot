import { useMemo, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, FileText, FlaskConical, Hospital, Pill, Search, ShieldCheck, Sparkles, Stethoscope, TrendingUp, Activity, FolderOpen, Link2, Info, Database, Layers } from 'lucide-react'
import { Badge, Btn, Card, ConfBar, ConfRing, DocPaper, Eyebrow, PageHead, cx, useEvidence, useL, type StatusKey } from './ui'

export type Go = (v: string) => void

/* ================= Home ================= */
const snapshot = [
  { k: 'Health records', v: '12', s: 'Documents analyzed', i: FolderOpen, t: '+3 this month', c: 'text-sky-600 bg-sky-50', d: [3, 4, 4, 6, 7, 9, 12] },
  { k: 'Medications', v: '4', s: 'Currently active', i: Pill, t: '1 new', c: 'text-teal-600 bg-teal-50', d: [2, 2, 3, 3, 3, 4, 4] },
  { k: 'Reports', v: '3', s: 'Recent reports', i: FlaskConical, t: 'Last: 3 days ago', c: 'text-violet-600 bg-violet-50', d: [1, 1, 2, 2, 2, 3, 3] },
  { k: 'Health events', v: '8', s: 'This year', i: Activity, t: '+2 vs last quarter', c: 'text-amber-600 bg-amber-50', d: [1, 2, 2, 4, 5, 6, 8] },
]

function Spark({ d }: { d: number[] }) {
  const max = Math.max(...d)
  const pts = d.map((v, i) => `${(i / (d.length - 1)) * 80},${26 - (v / max) * 22}`).join(' ')
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none"><polyline points={pts} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="80" cy={26 - (d[d.length - 1] / max) * 22} r="2.5" fill="#0d9488" /></svg>
  )
}

const activity: { date: string; type: string; title: string; note: string; s: StatusKey; sl: string; i: typeof FileText }[] = [
  { date: 'OCT 07', type: 'Blood Test', title: 'CBC Report', note: '1 item needs attention', s: 'attention', sl: 'Attention', i: FlaskConical },
  { date: 'OCT 04', type: 'Prescription', title: '3 medications extracted', note: 'Dr. R. Menon', s: 'verified', sl: 'Verified', i: Pill },
  { date: 'SEP 28', type: 'Doctor Visit', title: 'Prescription uploaded', note: 'Sunrise Family Clinic', s: 'neutral', sl: 'Recorded', i: Stethoscope },
  { date: 'SEP 12', type: 'Discharge Summary', title: 'Hospital visit recorded', note: 'City General Hospital', s: 'neutral', sl: 'Recorded', i: Hospital },
]

export function Home({ go, user }: { go: Go; user?: { name: string } }) {
  const L = useL()
  const ev = useEvidence()
  const userName = user?.name ? user.name.split(' ')[0] : 'Alex'
  return (
    <div className="anim-fade-up mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-.025em] md:text-[44px]">
          {L(`Good morning, ${userName}`, `सुप्रभात, ${userName}`)}
        </h1>
        <p className="mt-2 text-[16px] text-slate-500">{L("Here's what's happening with your health.", 'आपके स्वास्थ्य की ताज़ा जानकारी।')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {snapshot.map((c) => (
          <Card key={c.k} className="group p-4 transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5">
            <div className="flex items-center justify-between">
              <span className={cx('grid h-8 w-8 place-items-center rounded-lg', c.c)}><c.i size={16} strokeWidth={1.8} /></span>
              <Spark d={c.d} />
            </div>
            <Eyebrow className="mt-4">{c.k}</Eyebrow>
            <p className="mt-1 font-display text-[42px] font-semibold leading-none tracking-tight tabular-nums">{c.v}</p>
            <p className="mt-1.5 text-[13px] text-slate-500">{c.s}</p>
            <p className="mt-3 flex items-center gap-1 text-[11.5px] font-medium text-teal-700"><TrendingUp size={12} />{c.t}</p>
          </Card>
        ))}
      </div>

      {/* AI insight */}
      <section className="relative overflow-hidden rounded-[28px] border border-violet-200/60 bg-gradient-to-br from-[#f3f0ff] via-[#eef4ff] to-[#eefbf8] p-6 md:p-9">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[1.35fr_1fr]">
          <div>
            <div className="flex items-center gap-2"><Badge s="ai" /><span className="text-xs text-slate-500">Based on 3 records · Updated today</span></div>
            <h2 className="mt-4 font-display text-[28px] font-semibold tracking-tight md:text-[34px]">{L('Your Health Insight', 'आपकी स्वास्थ्य अंतर्दृष्टि')}</h2>
            <p className="mt-3 text-[16px] leading-[1.7] text-slate-700 md:text-[17px]">
              Your recent records show that your blood test was completed 3 days ago. One value is outside the reference range shown on the report and may be worth discussing with your healthcare professional.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Btn onClick={() => go('chat')}>{L('Ask Health Copilot', 'हेल्थ कॉपायलट से पूछें')}<ArrowRight size={16} /></Btn>
              <Btn v="secondary" onClick={() => go('summary')}>{L('View detailed insight', 'विस्तृत जानकारी देखें')}</Btn>
              <button onClick={() => ev({ kind: 'cbc', region: 'hb' })} className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-800 hover:underline"><Link2 size={14} />See source evidence</button>
            </div>
          </div>
          <div className="space-y-2.5 self-center">
            {[
              [Check, '3 records analyzed', 'text-teal-700 bg-teal-100'],
              [Info, '1 item needs attention', 'text-amber-700 bg-amber-100'],
              [ShieldCheck, 'No medication conflicts detected in uploaded records', 'text-teal-700 bg-teal-100'],
            ].map(([I, t, c]) => {
              const Icon = I as typeof Check
              return (
                <div key={t as string} className="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm font-medium ring-1 ring-white backdrop-blur">
                  <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full', c as string)}><Icon size={13} strokeWidth={2.6} /></span>{t as string}
                </div>
              )
            })}
          </div>
        </div>
        <p className="relative mt-7 flex items-center gap-2 border-t border-violet-200/50 pt-4 text-xs text-slate-500"><Sparkles size={13} className="text-violet-500" />AI helps you understand your records — it does not diagnose or prescribe.</p>
      </section>

      {/* trust pipeline */}
      <Card className="overflow-hidden p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <Eyebrow>How HealthLens earns your trust</Eyebrow>
            <h2 className="mt-1 font-display text-[22px] font-semibold tracking-tight">Every value traces back to your document</h2>
          </div>
          <button onClick={() => ev({ kind: 'cbc', region: 'hb' })} className="text-sm font-medium text-sky-700 hover:underline">Open evidence →</button>
        </div>
        <div className="grid items-stretch gap-3 md:grid-cols-[1.1fr_auto_1fr_auto_1fr_auto_1fr]">
          {[
            { n: '1 · Document', body: (
              <div className="relative h-24 overflow-hidden rounded-lg ring-1 ring-slate-200"><div className="absolute left-0 top-0 w-[220%]" style={{ transform: 'translate(-12%, -34%)' }}><DocPaper kind="cbc" active="hb" tint={{ hb: 'verified' }} showAll={false} /></div></div>) },
            { n: '2 · Extraction', body: (<div className="grid h-24 content-center rounded-lg bg-slate-50 px-4"><p className="text-xs text-slate-400">Hemoglobin</p><p className="font-display text-2xl font-semibold">10.8 <span className="text-sm font-normal text-slate-400">g/dL</span></p></div>) },
            { n: '3 · Confidence', body: (<div className="flex h-24 items-center gap-3 rounded-lg bg-slate-50 px-4"><ConfRing value={97} size={56} /><div><Badge s="verified" /><p className="mt-1 text-[11px] text-slate-400">High confidence</p></div></div>) },
            { n: '4 · Verified data', body: (<div className="grid h-24 content-center rounded-lg bg-teal-50/70 px-4 ring-1 ring-teal-100"><p className="flex items-center gap-1.5 text-sm font-semibold text-teal-800"><ShieldCheck size={15} />Added to record</p><p className="mt-0.5 text-xs text-teal-700/80">Observation · 07 Oct 2026</p></div>) },
          ].map((s, i, a) => (
            <div key={s.n} className="contents">
              <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.n}</p>{s.body}</div>
              {i < a.length - 1 && <div className="hidden items-center md:flex"><ArrowRight size={16} className="mt-5 text-slate-300" /></div>}
            </div>
          ))}
        </div>
      </Card>

      {/* activity */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[22px] font-semibold tracking-tight">Recent health activity</h2>
          <button onClick={() => go('timeline')} className="text-sm font-medium text-sky-700 hover:underline">Full timeline →</button>
        </div>
        <div className="relative space-y-3 pl-8">
          <div className="absolute bottom-6 left-[9px] top-6 w-px bg-gradient-to-b from-sky-300 via-slate-200 to-slate-100" />
          {activity.map((a, i) => (
            <div key={a.date} className="relative">
              <span className={cx('absolute -left-8 top-6 grid h-[19px] w-[19px] place-items-center rounded-full bg-white ring-2', a.s === 'attention' ? 'ring-amber-400' : a.s === 'verified' ? 'ring-teal-500' : 'ring-slate-300')}>
                <span className={cx('h-2 w-2 rounded-full', a.s === 'attention' ? 'bg-amber-400' : a.s === 'verified' ? 'bg-teal-500' : 'bg-slate-300')} />
              </span>
              <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 transition-all hover:shadow-md md:px-5">
                <div className="w-16 shrink-0"><p className="font-display text-[15px] font-semibold tracking-wide">{a.date}</p><p className="text-[11px] text-slate-400">2026</p></div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-600"><a.i size={18} strokeWidth={1.6} /></span>
                <div className="min-w-[160px] flex-1"><Eyebrow>{a.type}</Eyebrow><p className="font-medium">{a.title}</p><p className="text-[13px] text-slate-500">{a.note}</p></div>
                <Badge s={a.s} label={a.sl} />
                <Btn v="secondary" sm onClick={() => (i === 0 ? go('summary') : go('timeline'))}>View</Btn>
              </Card>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ================= Timeline ================= */
type Ev = { id: string; month: string; day: string; type: 'report' | 'prescription' | 'visit'; title: string; sub: string; s: StatusKey; sl: string; provider: string; meds: string[]; obs: string[]; cond: string[]; vals: [string, string, boolean?][] }
const events: Ev[] = [
  { id: 'e1', month: 'October', day: '07', type: 'report', title: 'CBC Blood Test', sub: 'Meridian Diagnostics', s: 'attention', sl: '1 item needs attention', provider: 'Meridian Diagnostics · ref. Dr. R. Menon', meds: [], obs: ['Hemoglobin below the reference range shown on the report', 'Other counts within range'], cond: [], vals: [['Hemoglobin', '10.8 g/dL', true], ['WBC', '7.2 ×10³/µL'], ['Platelets', '245 ×10³/µL']] },
  { id: 'e2', month: 'October', day: '04', type: 'prescription', title: 'Prescription', sub: '3 medications extracted', s: 'verified', sl: 'Verified', provider: 'Dr. R. Menon · Sunrise Family Clinic', meds: ['Amoxicillin 500 mg · twice daily · 5 days', 'Pantoprazole 40 mg · once daily', 'Vitamin D3 60,000 IU · weekly'], obs: ['Take Amoxicillin after meals'], cond: ['Upper respiratory infection'], vals: [] },
  { id: 'e3', month: 'September', day: '28', type: 'visit', title: 'Doctor Visit', sub: 'Prescription uploaded', s: 'neutral', sl: 'Recorded', provider: 'Dr. R. Menon · Sunrise Family Clinic', meds: ['Pantoprazole 40 mg'], obs: ['Follow-up advised in 2 weeks'], cond: ['Acid reflux'], vals: [['Blood pressure', '118/76 mmHg'], ['Weight', '64 kg']] },
  { id: 'e4', month: 'September', day: '12', type: 'visit', title: 'Discharge Summary', sub: 'Hospital visit recorded', s: 'neutral', sl: 'Recorded', provider: 'City General Hospital', meds: ['Paracetamol 650 mg · as needed'], obs: ['Admitted 2 days for observation', 'Discharged in stable condition'], cond: ['Viral fever'], vals: [['Temperature at discharge', '98.4 °F']] },
]
const filters = ['All', 'Reports', 'Prescriptions', 'Visits', 'Medications']
const evIcon = { report: FlaskConical, prescription: Pill, visit: Hospital }

export function Timeline() {
  const [f, setF] = useState('All')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>('e1')
  const ev = useEvidence()
  const L = useL()
  const list = useMemo(
    () =>
      events.filter((e) => {
        const okF = f === 'All' || (f === 'Reports' && e.type === 'report') || (f === 'Prescriptions' && e.type === 'prescription') || (f === 'Visits' && e.type === 'visit') || (f === 'Medications' && e.meds.length > 0)
        const hay = JSON.stringify(e).toLowerCase()
        return okF && hay.includes(q.toLowerCase())
      }),
    [f, q],
  )
  const months = [...new Set(list.map((e) => e.month))]
  return (
    <div className="anim-fade-up mx-auto max-w-3xl">
      <PageHead title={L('Your Health Journey', 'आपकी स्वास्थ्य यात्रा')} sub={L('Everything important from your medical records, organized chronologically.', 'आपके मेडिकल रिकॉर्ड की हर ज़रूरी बात, तारीख़ के क्रम में।')} />
      <div className="mb-8 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your health records…" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-[15px] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((x) => (
            <button key={x} onClick={() => setF(x)} className={cx('h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-all', f === x ? 'bg-[#0f3057] text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50')}>{x}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="grid place-items-center px-6 py-16 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Search size={22} strokeWidth={1.5} /></span>
          <p className="font-display text-lg font-semibold">Nothing matches yet</p>
          <p className="mt-1 text-sm text-slate-500">Try a different filter or search term.</p>
        </Card>
      ) : (
        <>
          <p className="mb-4 font-display text-[44px] font-semibold leading-none tracking-tight text-slate-300">2026</p>
          {months.map((m) => (
            <div key={m} className="mb-8">
              <Eyebrow className="mb-4 pl-10">{m}</Eyebrow>
              <div className="relative space-y-4">
                <div className="absolute bottom-0 left-[15px] top-0 w-px bg-slate-200" />
                {list.filter((e) => e.month === m).map((e) => {
                  const Icon = evIcon[e.type]
                  const isOpen = open === e.id
                  return (
                    <div key={e.id} className="relative flex gap-4">
                      <div className="relative z-10 flex w-8 shrink-0 flex-col items-center pt-5">
                        <span className={cx('grid h-8 w-8 place-items-center rounded-full bg-white ring-2', e.s === 'attention' ? 'text-amber-600 ring-amber-300' : e.s === 'verified' ? 'text-teal-600 ring-teal-300' : 'text-slate-500 ring-slate-200')}><Icon size={14} strokeWidth={2} /></span>
                      </div>
                      <Card className={cx('flex-1 overflow-hidden transition-shadow', isOpen && 'shadow-lg')}>
                        <button onClick={() => setOpen(isOpen ? null : e.id)} className="flex w-full items-center gap-4 p-4 text-left md:px-5">
                          <span className="w-9 text-center font-display text-[26px] font-semibold leading-none tabular-nums">{e.day}</span>
                          <div className="min-w-0 flex-1"><p className="font-semibold">{e.title}</p><p className="truncate text-[13px] text-slate-500">{e.sub}</p></div>
                          <Badge s={e.s} label={e.sl} className="hidden sm:inline-flex" />
                          <ChevronDown size={18} className={cx('shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                        </button>
                        {isOpen && (
                          <div className="anim-fade-up grid gap-5 border-t border-slate-100 bg-slate-50/50 p-5 text-sm sm:grid-cols-2">
                            <div><Eyebrow>Document</Eyebrow><p className="mt-1 font-medium">{e.title}</p></div>
                            <div><Eyebrow>Date</Eyebrow><p className="mt-1 font-medium">{e.day} {e.month} 2026</p></div>
                            <div className="sm:col-span-2"><Eyebrow>Doctor / Provider</Eyebrow><p className="mt-1 font-medium">{e.provider}</p></div>
                            {e.vals.length > 0 && (
                              <div className="sm:col-span-2">
                                <Eyebrow className="mb-2">Important values</Eyebrow>
                                <div className="flex flex-wrap gap-2">
                                  {e.vals.map(([k, v, flag]) => (
                                    <button key={k} onClick={() => flag && ev({ kind: 'cbc', region: 'hb' })} className={cx('rounded-xl bg-white px-3.5 py-2 text-left ring-1 ring-inset', flag ? 'ring-amber-300 hover:bg-amber-50' : 'cursor-default ring-slate-200')}>
                                      <span className="block text-[11px] text-slate-400">{k}</span><span className="font-display text-[17px] font-semibold">{v}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {e.meds.length > 0 && <div className="sm:col-span-2"><Eyebrow>Medications</Eyebrow><ul className="mt-1 space-y-1">{e.meds.map((x) => <li key={x} className="flex items-center gap-2"><Pill size={13} className="text-teal-600" />{x}</li>)}</ul></div>}
                            <div><Eyebrow>Observations</Eyebrow><ul className="mt-1 space-y-1 text-slate-600">{e.obs.map((x) => <li key={x}>· {x}</li>)}</ul></div>
                            <div><Eyebrow>Conditions mentioned</Eyebrow><p className="mt-1 text-slate-600">{e.cond.length ? e.cond.join(', ') : 'None mentioned'}</p></div>
                            <div className="flex gap-2 sm:col-span-2"><Btn sm v="secondary" onClick={() => ev({ kind: e.type === 'report' ? 'cbc' : 'rx', region: e.type === 'report' ? 'hb' : 'med1' })}>View source</Btn></div>
                          </div>
                        )}
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

/* ================= Summary ================= */
export function Summary() {
  const L = useL()
  const ev = useEvidence()
  const qs = [
    ['Should I repeat this test?', 'क्या मुझे यह जाँच दोबारा करानी चाहिए?'],
    ['Could any of my current medications affect this result?', 'क्या मेरी मौजूदा दवाएँ इस परिणाम को प्रभावित कर सकती हैं?'],
    ['What should I monitor before my next visit?', 'अगली मुलाकात से पहले मुझे किन बातों पर नज़र रखनी चाहिए?'],
    ['Is there other information from my history I should share?', 'क्या मेरे इतिहास की कोई और जानकारी मुझे बतानी चाहिए?'],
  ]
  return (
    <div className="anim-fade-up mx-auto max-w-3xl">
      <div className="mb-3"><Badge s="ai" /></div>
      <PageHead title={L('Your Health, Simplified', 'आपकी स्वास्थ्य जानकारी, आसान भाषा में')} sub={L('Understand what your records say — without medical jargon.', 'बिना मेडिकल शब्दजाल के समझें कि आपके रिकॉर्ड क्या कहते हैं।')} />
      <div className="space-y-5">
        <Card className="p-6 md:p-8">
          <Eyebrow>{L("What's new", 'क्या नया है')}</Eyebrow>
          <p className="mt-3 text-[18px] leading-[1.7] text-slate-700">{L('Your blood test (CBC) was added 3 days ago. Three medications from your 4 October prescription were recorded, and none of them conflict with each other in your uploaded records.', '3 दिन पहले आपकी रक्त जाँच (CBC) की रिपोर्ट जोड़ी गई। 4 अक्टूबर की पर्ची से 3 दवाएँ दर्ज की गईं, और आपके अपलोड किए रिकॉर्ड में इनमें कोई टकराव नहीं मिला।')}</p>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-6 md:p-8">
            <Eyebrow>{L('Important observations', 'महत्वपूर्ण अवलोकन')}</Eyebrow>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm text-slate-500">Hemoglobin</p>
                <p className="font-display text-[56px] font-semibold leading-none tracking-tight">10.8 <span className="text-xl font-normal text-slate-400">g/dL</span></p>
                <p className="mt-2 text-sm text-slate-500">Reference range on report: 12.0 – 15.5 g/dL</p>
              </div>
              <div className="w-56">
                <div className="relative h-2 rounded-full bg-gradient-to-r from-amber-200 via-teal-200 to-teal-200">
                  <span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white bg-amber-500 shadow" style={{ left: '14%' }} />
                  <span className="absolute -top-0.5 h-3 rounded-sm border-x border-teal-600/40" style={{ left: '35%', width: '45%' }} />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>Lower</span><span>Reference</span><span>Higher</span></div>
              </div>
            </div>
            <p className="mt-6 text-[18px] leading-[1.7]">{L('Your hemoglobin value is below the reference range shown on this report.', 'इस रिपोर्ट में आपका हीमोग्लोबिन मान संदर्भ सीमा से कम दिखाया गया है।')}</p>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-sm md:px-8">
            <span className="flex items-center gap-2 text-slate-500"><FileText size={14} />CBC Report · 07 Oct 2026</span>
            <button onClick={() => ev({ kind: 'cbc', region: 'hb' })} className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline">See in document<ArrowUpRight size={14} /></button>
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold">{L('What does this mean?', 'इसका क्या मतलब है?')}</h3>
            <p className="mt-3 leading-[1.75] text-slate-600">{L('Hemoglobin is a protein in your blood that carries oxygen around your body. Your report lists 10.8 g/dL, while the range printed on the report is 12.0 – 15.5 g/dL.', 'हीमोग्लोबिन रक्त में एक प्रोटीन है जो पूरे शरीर में ऑक्सीजन पहुँचाता है। आपकी रिपोर्ट में 10.8 g/dL लिखा है, जबकि रिपोर्ट में छपी सीमा 12.0 – 15.5 g/dL है।')}</p>
          </Card>
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold">{L('Why might this matter?', 'यह क्यों मायने रख सकता है?')}</h3>
            <p className="mt-3 leading-[1.75] text-slate-600">{L('Values outside a reference range can have many explanations, and one report cannot show the reason. Your healthcare professional can put it in context with your full history.', 'संदर्भ सीमा से बाहर के मान कई कारणों से हो सकते हैं, और एक रिपोर्ट से कारण नहीं पता चलता। आपका स्वास्थ्य विशेषज्ञ आपके पूरे इतिहास के साथ इसे समझा सकता है।')}</p>
          </Card>
        </div>

        <Card className="p-6 md:p-8">
          <h3 className="font-display text-xl font-semibold">{L('Questions to discuss with your healthcare professional', 'अपने स्वास्थ्य विशेषज्ञ से पूछने के सवाल')}</h3>
          <ul className="mt-5 divide-y divide-slate-100">
            {qs.map(([en, hi], i) => (
              <li key={en} className="flex items-start gap-4 py-3.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700">{i + 1}</span>
                <p className="text-[16px] leading-relaxed">{L(en, hi)}</p>
              </li>
            ))}
          </ul>
        </Card>

        <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-slate-400"><Sparkles size={13} className="mt-0.5 shrink-0 text-violet-400" />{L('AI helps you understand your records — it does not diagnose or prescribe. Do not change any medication based on this page.', 'AI आपके रिकॉर्ड समझने में मदद करता है — यह निदान या दवा नहीं बताता। इस पृष्ठ के आधार पर कोई दवा न बदलें।')}</p>
      </div>
    </div>
  )
}

/* ================= Medications ================= */
const meds = [
  { n: 'Amoxicillin', dose: '500 mg', freq: 'Twice daily', dur: '5 days', ins: 'After meals', src: 'Prescription · 04 Oct', conf: 92, status: 'Active', rx: 'med1' },
  { n: 'Pantoprazole', dose: '40 mg', freq: 'Once daily', dur: '14 days', ins: 'Before breakfast', src: 'Prescription · 04 Oct', conf: 95, status: 'Active', rx: 'dose1' },
  { n: 'Vitamin D3', dose: '60,000 IU', freq: 'Weekly', dur: '8 weeks', ins: 'With a meal', src: 'Prescription · 04 Oct', conf: 89, status: 'Active', rx: 'dur1' },
  { n: 'Paracetamol', dose: '650 mg', freq: 'As needed', dur: '—', ins: 'Not more than 4 times a day', src: 'Discharge · 12 Sep', conf: 87, status: 'Active', rx: 'inst1' },
]

export function Medications() {
  const ev = useEvidence()
  const L = useL()
  return (
    <div className="anim-fade-up mx-auto max-w-5xl">
      <PageHead title={L('Medications', 'दवाएँ')} sub="Taken from your uploaded prescriptions. Always follow your doctor's instructions.">
        <div className="flex gap-2"><Badge s="verified" label="4 active" /><Badge s="verify" label="1 awaiting verification" /></div>
      </PageHead>
      <div className="mb-4 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><Pill size={18} /></span>
        <div className="flex-1"><p className="text-sm font-semibold text-amber-900">One medicine from 04 Oct could not be read</p><p className="text-[13px] text-amber-800/80">It is not in your list until you confirm it against the document.</p></div>
        <Btn sm className="bg-amber-500 text-white shadow-none hover:bg-amber-600" onClick={() => ev({ kind: 'rx', region: 'med2' })}>Verify</Btn>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {meds.map((m) => (
          <Card key={m.n} className="p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-teal-50 to-sky-50 text-teal-700 ring-1 ring-teal-100"><Pill size={20} strokeWidth={1.6} /></span>
                <div><p className="font-display text-[22px] font-semibold leading-tight tracking-tight">{m.n}</p><p className="text-sm text-slate-500">{m.dose}</p></div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" />{m.status}</span>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-4 text-sm">
              <div><Eyebrow>Frequency</Eyebrow><dd className="mt-1 font-medium">{m.freq}</dd></div>
              <div><Eyebrow>Duration</Eyebrow><dd className="mt-1 font-medium">{m.dur}</dd></div>
              <div><Eyebrow>Instructions</Eyebrow><dd className="mt-1 font-medium">{m.ins}</dd></div>
            </dl>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="w-40"><p className="mb-1 text-[11px] text-slate-400">Extraction confidence</p><ConfBar value={m.conf} /></div>
              <div className="text-right"><p className="mb-1 text-[11px] text-slate-400">{m.src}</p><Btn sm v="secondary" onClick={() => ev({ kind: 'rx', region: m.rx })}>View source</Btn></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ================= Profile ================= */
export function Profile({ user, onLogout }: { user?: { name: string; email: string; avatarChar: string; abhaId?: string; age?: string; gender?: string; height?: string; heightUnit?: string; weight?: string; weightUnit?: string; bloodGroup?: string }; onLogout?: () => void }) {
  const L = useL()
  const currentName = user?.name || 'Alex Rao'
  const currentEmail = user?.email || 'alex.rao@email.com'
  const currentAvatar = user?.avatarChar || currentName.charAt(0)
  const currentAbha = user?.abhaId || '91-4820-1928-3341'
  const currentAge = user?.age || '34'
  const currentGender = user?.gender || 'Male'
  const currentHeight = user?.height ? `${user.height} ${user.heightUnit || 'cm'}` : '178 cm'
  const currentWeight = user?.weight ? `${user.weight} ${user.weightUnit || 'kg'}` : '68 kg'
  const currentBloodGroup = user?.bloodGroup || 'O positive'

  const res = [
    ['Patient', 'Name, birth date, blood group', 1],
    ['MedicationRequest', 'Prescribed medicines', 4],
    ['Observation', 'Lab values and measurements', 18],
    ['Condition', 'Conditions mentioned', 3],
    ['DiagnosticReport', 'Lab and imaging reports', 3],
  ] as const
  return (
    <div className="anim-fade-up mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHead title={L('Health Profile', 'स्वास्थ्य प्रोफ़ाइल')} sub="Your personal details and everything AI Copilot has structured from your documents." />
        {onLogout && (
          <Btn v="secondary" sm onClick={onLogout} className="text-slate-600 hover:text-rose-600 hover:border-rose-200">
            {L('Sign Out', 'साइन आउट')}
          </Btn>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-teal-500 font-display text-2xl font-semibold text-white">{currentAvatar}</span>
            <div><p className="font-display text-xl font-semibold">{currentName}</p><p className="text-sm text-slate-500">{currentEmail}</p></div>
          </div>
          <Eyebrow className="mb-3">Personal & Physiological Profile</Eyebrow>
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ['Name', currentName],
              ['Age', `${currentAge} years`],
              ['Gender', currentGender],
              ['Height', currentHeight],
              ['Weight', currentWeight],
              ['Blood group', currentBloodGroup],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card className="p-6">
          <Eyebrow className="mb-3">Health records</Eyebrow>
          <div className="grid grid-cols-2 gap-3">
            {[['Conditions', '3', Activity], ['Medications', '4', Pill], ['Observations', '18', FlaskConical], ['Diagnostic reports', '3', FileText]].map(([k, v, I]) => {
              const Icon = I as typeof Pill
              return (
                <div key={k as string} className="rounded-xl bg-slate-50 p-4"><Icon size={16} className="text-slate-400" /><p className="mt-3 font-display text-3xl font-semibold tabular-nums">{v as string}</p><p className="text-[13px] text-slate-500">{k as string}</p></div>
              )
            })}
          </div>
        </Card>
      </div>

      <section className="relative overflow-hidden rounded-[28px] bg-[#0b1b33] p-6 text-white md:p-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><span className="rounded-full bg-teal-400/15 px-2.5 py-0.5 text-[11.5px] font-medium text-teal-300 ring-1 ring-inset ring-teal-300/30">FHIR-aligned</span></div>
            <h2 className="mt-3 font-display text-[28px] font-semibold tracking-tight">ABDM-ready Health Profile</h2>
            <p className="mt-1 text-sm text-slate-400">ABHA ID (mock) <span className="ml-2 rounded-md bg-white/10 px-2 py-1 font-mono text-[13px] tracking-wider text-white">XX-XXXX-XXXX-XXXX</span></p>
          </div>
        </div>
        <div className="relative mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <ol className="space-y-1">
            {[[FileText, 'Medical Documents'], [Database, 'Structured Health Data'], [Layers, 'FHIR-style Resources'], [ShieldCheck, 'ABDM-ready Profile']].map(([I, t], i, a) => {
              const Icon = I as typeof FileText
              return (
                <li key={t as string}>
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10"><Icon size={16} className="text-teal-300" /><span className="text-sm font-medium">{t as string}</span></div>
                  {i < a.length - 1 && <ArrowDown size={14} className="mx-auto my-1 text-slate-500" />}
                </li>
              )
            })}
          </ol>
          <div className="space-y-2">
            {res.map(([n, d, c]) => (
              <div key={n} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <div><p className="font-mono text-[13px] text-sky-200">{n}</p><p className="text-xs text-slate-400">{d}</p></div>
                <span className="font-display text-xl font-semibold tabular-nums">{c}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative mt-7 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-400"><Info size={13} />Architecture designed for ABDM interoperability. Not an active ABDM integration.</p>
      </section>
    </div>
  )
}
