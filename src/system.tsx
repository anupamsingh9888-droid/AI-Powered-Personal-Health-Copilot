import { useState, type ReactNode } from 'react'
import { Check, CloudUpload, FileText, Inbox, RefreshCw, ScanLine, Sparkles, TriangleAlert, X, CircleAlert } from 'lucide-react'
import { Badge, Btn, Card, ConfBar, ConfRing, Eyebrow, Logo, PageHead, useToast } from './ui'

const Sec = ({ t, children }: { t: string; children: ReactNode }) => (
  <section className="mb-10">
    <Eyebrow className="mb-3">{t}</Eyebrow>
    {children}
  </section>
)

const swatches = [
  ['Navy', '#0b1b33', 'Text'], ['Trust blue', '#0f3057', 'Primary'], ['Sky', '#0284c7', 'Review'], ['Teal', '#0d9488', 'Healthy'],
  ['Amber', '#d97706', 'Attention'], ['Rose', '#e11d48', 'Critical'], ['Violet', '#7c3aed', 'AI'], ['Canvas', '#f6f8fa', 'Background'],
]

function State({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="grid h-36 place-items-center rounded-xl bg-slate-50/80 px-3 text-center">{children}</div>
      <p className="mt-3 text-sm font-medium">{name}</p>
    </Card>
  )
}

export function System() {
  const toast = useToast()
  const [modal, setModal] = useState(false)
  return (
    <div className="anim-fade-up mx-auto max-w-5xl">
      <PageHead title="Design System" sub="Colour roles, status language, confidence indicators and interaction states used across HealthLens." />

      <Sec t="Brand">
        <div className="flex flex-wrap items-center gap-8 rounded-2xl border border-slate-200 bg-white p-6">
          <Logo size={48} word />
          <Logo size={32} />
          <Logo size={20} />
          <div className="rounded-xl bg-[#0b1b33] px-4 py-3"><Logo size={28} word dark /></div>
        </div>
      </Sec>

      <Sec t="Colour roles · 8px spacing · 12–28px radii">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {swatches.map(([n, c, r]) => (
            <div key={n} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="h-14" style={{ background: c }} /><div className="p-3"><p className="text-sm font-medium">{n}</p><p className="text-xs text-slate-400">{r} · {c}</p></div></div>
          ))}
        </div>
      </Sec>

      <Sec t="Buttons">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-6">
          <Btn>Primary</Btn><Btn v="secondary">Secondary</Btn><Btn v="ghost">Ghost</Btn><Btn v="danger">Danger</Btn><Btn disabled>Disabled</Btn>
        </div>
      </Sec>

      <Sec t="Status badges">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-6">
          <Badge s="verified" /><Badge s="review" /><Badge s="verify" /><Badge s="attention" /><Badge s="critical" /><Badge s="ai" />
        </div>
      </Sec>

      <Sec t="Confidence indicators">
        <div className="grid gap-3 md:grid-cols-3">
          {[[92, 'High', '≥ 85%'], [72, 'Medium', '60–84%'], [41, 'Low', '< 60%']].map(([v, l, r]) => (
            <Card key={l as string} className="p-5">
              <div className="flex items-center justify-between"><ConfRing value={v as number} size={56} /><div className="text-right"><Badge s={v === 92 ? 'verified' : v === 72 ? 'review' : 'verify'} /><p className="mt-1 text-xs text-slate-400">{l as string} · {r as string}</p></div></div>
              <ConfBar value={v as number} className="mt-4" />
            </Card>
          ))}
        </div>
      </Sec>

      <Sec t="Feedback · toast, modal, tooltip">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6">
          <Btn v="secondary" onClick={() => toast('Document added to your record')}>Show toast</Btn>
          <Btn v="secondary" onClick={() => toast('We could not read that file', 'warn')}>Warning toast</Btn>
          <Btn v="secondary" onClick={() => setModal(true)}>Open modal</Btn>
          <span className="group relative"><span className="cursor-help rounded-full bg-violet-50 px-3 py-1.5 text-sm text-violet-700">Hover for tooltip</span>
            <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-52 -translate-x-1/2 rounded-lg bg-[#0b1b33] px-3 py-2 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">Confidence is how sure the AI is that it read this correctly.</span></span>
        </div>
      </Sec>

      <Sec t="Interaction states">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <State name="Upload · soft animated drop zone"><div className="w-full rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 py-6 text-sky-700"><CloudUpload className="anim-drift mx-auto" size={26} strokeWidth={1.4} /><p className="mt-2 text-sm font-medium">Release to upload</p></div></State>
          <State name="Uploading"><div className="w-full"><p className="mb-2 text-sm font-medium">prescription.jpg</p><div className="h-1.5 rounded-full bg-slate-200"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sky-500 to-teal-500" /></div><p className="mt-1.5 text-xs text-slate-400">64% · 1.2 MB</p></div></State>
          <State name="Processing · AI scanning"><div className="relative h-24 w-20 overflow-hidden rounded bg-white shadow ring-1 ring-slate-200"><div className="space-y-2 p-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-1.5 rounded bg-slate-200" />)}</div><div className="anim-scan absolute inset-x-0 h-8 -translate-y-full bg-gradient-to-b from-transparent to-sky-400/40"><div className="absolute inset-x-0 bottom-0 h-px bg-sky-400" /></div></div></State>
          <State name="Success"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-50"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path className="anim-check" d="M5 12.5l4.5 4.5L19 7.5" /></svg></span><p className="mt-2 text-sm font-medium">Added to your record</p></div></State>
          <State name="Verification required"><div className="anim-pulse-ring rounded-xl bg-amber-50 px-4 py-3 text-left ring-1 ring-amber-200"><p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900"><TriangleAlert size={14} />Please verify</p><p className="mt-0.5 text-xs text-amber-800/80">We could not read one medicine name.</p></div></State>
          <State name="Error · clear, not alarming"><div className="rounded-xl bg-white px-4 py-3 text-left ring-1 ring-slate-200"><p className="flex items-center gap-1.5 text-sm font-semibold"><CircleAlert size={14} className="text-rose-500" />That photo is a little blurry</p><p className="mt-0.5 text-xs text-slate-500">Try again in better light.</p><button className="mt-2 flex items-center gap-1 text-xs font-medium text-sky-700"><RefreshCw size={11} />Retake photo</button></div></State>
          <State name="Empty state"><div><Inbox className="mx-auto text-slate-300" size={30} strokeWidth={1.3} /><p className="mt-2 text-sm font-medium">No records yet</p><p className="text-xs text-slate-500">Upload your first document.</p></div></State>
          <State name="Document analyzed"><div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"><FileText className="text-slate-400" size={20} /><div className="text-left"><p className="text-sm font-medium">CBC Report</p><Badge s="verified" label="Analyzed" /></div></div></State>
          <State name="AI summary generated"><div className="w-full space-y-2 text-left"><Badge s="ai" /><div className="skeleton h-2 w-full rounded" /><div className="skeleton h-2 w-4/5 rounded" /><p className="flex items-center gap-1 text-xs text-violet-700"><Sparkles size={11} />Summary ready</p></div></State>
        </div>
      </Sec>

      <Sec t="Components">
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-5"><Eyebrow>Health card</Eyebrow><p className="mt-2 font-display text-4xl font-semibold">12</p><p className="text-sm text-slate-500">Documents analyzed</p></Card>
          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5"><Badge s="ai" /><p className="mt-3 text-sm leading-relaxed text-slate-700">AI insight block — always tinted violet and always labelled, so it is never mistaken for verified data.</p></Card>
          <Card className="flex items-center gap-4 p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50"><ScanLine size={18} /></span><div className="flex-1"><p className="font-medium">Timeline card</p><p className="text-xs text-slate-500">Date · type · status · view</p></div><Badge s="attention" /></Card>
          <Card className="p-5"><p className="font-display text-xl font-semibold">Medication card</p><p className="text-sm text-slate-500">500 mg · Twice daily · 5 days</p><ConfBar value={92} className="mt-3" /></Card>
        </div>
      </Sec>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="anim-fade-up relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <button onClick={() => setModal(false)} className="absolute right-4 top-4 text-slate-400"><X size={16} /></button>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-600"><Check size={20} /></span>
            <h3 className="mt-4 font-display text-xl font-semibold">Save to your record?</h3>
            <p className="mt-1 text-sm text-slate-500">Only verified fields are added.</p>
            <div className="mt-6 flex gap-2"><Btn className="flex-1" onClick={() => setModal(false)}>Save</Btn><Btn v="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Btn></div>
          </div>
        </div>
      )}
    </div>
  )
}
