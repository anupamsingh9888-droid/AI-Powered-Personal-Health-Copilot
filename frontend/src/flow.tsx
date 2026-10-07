import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Camera, Check, ChevronRight, CloudUpload, FileText, FlaskConical, Hospital, Maximize2, Minus, Plus, ScanLine, ShieldCheck, Sparkles, Stethoscope, X, FileSearch } from 'lucide-react'
import { Badge, Btn, Card, ConfBar, ConfRing, DocPaper, Eyebrow, PageHead, cx, levelOf, useEvidence, useL, useToast, CBC_REGIONS, RX_REGIONS, type EvidenceTarget, type Level } from './ui'

/* ================= Evidence drawer ================= */
const EVIDENCE: Record<string, { label: string; value: string; doc: string; date: string; conf: number; why: string; kind: 'rx' | 'cbc' }> = {
  hb: { label: 'Hemoglobin', value: '10.8 g/dL', doc: 'CBC Report', date: '07 Oct 2026', conf: 97, kind: 'cbc', why: 'Detected from the laboratory result section of the uploaded report. The value sits in the “Result” column of the Hemoglobin row, beside the unit g/dL and a reference range of 12.0 – 15.5.' },
  med1: { label: 'Medication', value: 'Amoxicillin', doc: 'Prescription', date: '04 Oct 2026', conf: 92, kind: 'rx', why: 'Read from the first line under the Rx symbol. The word matches a known drug name with a “Cap.” prefix.' },
  dose1: { label: 'Dosage', value: '500 mg', doc: 'Prescription', date: '04 Oct 2026', conf: 96, kind: 'rx', why: 'A number followed by a mass unit, directly after the medication name on the same line.' },
  freq1: { label: 'Frequency', value: 'Twice daily', doc: 'Prescription', date: '04 Oct 2026', conf: 78, kind: 'rx', why: 'Handwritten “1 – 0 – 1” is a common shorthand for morning – noon – night, read as twice daily. Worth a quick check.' },
  dur1: { label: 'Duration', value: '5 days', doc: 'Prescription', date: '04 Oct 2026', conf: 94, kind: 'rx', why: 'Read from “× 5 days”, which follows the frequency on the same line.' },
  inst1: { label: 'Instructions', value: 'After meals', doc: 'Prescription', date: '04 Oct 2026', conf: 91, kind: 'rx', why: 'Free-text instruction on the line below the dosing schedule.' },
  med2: { label: 'Medication', value: '[Unclear handwriting]', doc: 'Prescription', date: '04 Oct 2026', conf: 41, kind: 'rx', why: 'The handwriting in this region could not be read reliably, so HealthLens did not guess a medicine name.' },
  dose2: { label: 'Dosage', value: '10 mg', doc: 'Prescription', date: '04 Oct 2026', conf: 68, kind: 'rx', why: 'Digits are legible, but they belong to a medicine that is still unconfirmed.' },
}

export function EvidenceDrawer({ target, onClose }: { target: EvidenceTarget; onClose: () => void }) {
  if (!target) return null
  const e = EVIDENCE[target.region]
  const regions = e.kind === 'cbc' ? CBC_REGIONS : RX_REGIONS
  const r = regions[target.region]
  const cx0 = r.l + r.w / 2
  const cy0 = r.t + r.h / 2
  const lv = levelOf(e.conf)
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="AI evidence">
      <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="anim-slide-in relative flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-600"><ScanLine size={15} /></span>
            <span className="font-display text-[15px] font-semibold">AI Evidence</span>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="space-y-6 p-6">
          <div>
            <Eyebrow>Extracted value</Eyebrow>
            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="font-display text-[30px] font-semibold leading-tight tracking-tight">
                <span className="text-slate-400">{e.label}:</span> {e.value}
              </p>
              <ConfRing value={e.conf} size={52} />
            </div>
            <div className="mt-3 flex items-center gap-2"><Badge s={lv} /><span className="text-xs text-slate-400">{lv === 'verified' ? 'High' : lv === 'review' ? 'Medium' : 'Low'} confidence</span></div>
          </div>

          <div className="flex gap-6 rounded-xl bg-slate-50 p-4">
            <div><Eyebrow>Source</Eyebrow><p className="mt-1 text-sm font-medium">{e.doc}</p></div>
            <div><Eyebrow>Date</Eyebrow><p className="mt-1 text-sm font-medium">{e.date}</p></div>
          </div>

          <div>
            <Eyebrow className="mb-2">Evidence in the original document</Eyebrow>
            <div className="relative aspect-[2/1] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
              <div className="absolute left-0 top-0 w-[200%] transition-transform duration-700" style={{ transform: `translate(${25 - cx0}%, ${9.375 - cy0}%)` }}>
                <DocPaper kind={e.kind} active={target.region} tint={{ [target.region]: lv }} showAll={false} />
              </div>
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur">Highlighted region</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-[12px] font-medium text-slate-600">
            {['Document', 'Text read', 'Field found', 'Value'].map((s, i, a) => (
              <span key={s} className="flex items-center gap-2">
                <span className={cx('grid h-5 w-5 place-items-center rounded-full text-[10px]', i === a.length - 1 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500')}>{i === a.length - 1 ? <Check size={11} /> : i + 1}</span>
                {s}
                {i < a.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
              </span>
            ))}
          </div>

          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-white p-4">
            <div className="mb-1.5 flex items-center gap-2"><Sparkles size={14} className="text-violet-600" /><p className="text-sm font-semibold text-violet-900">Why was this extracted?</p></div>
            <p className="text-sm leading-relaxed text-slate-600">{e.why}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ================= Documents flow ================= */
const docTypes = [
  { t: 'Prescription', d: 'Handwritten or printed', i: Stethoscope, c: 'text-sky-600 bg-sky-50' },
  { t: 'Lab Report', d: 'Blood, urine and more', i: FlaskConical, c: 'text-teal-600 bg-teal-50' },
  { t: 'Diagnostic Report', d: 'Scans and imaging', i: FileSearch, c: 'text-violet-600 bg-violet-50' },
  { t: 'Discharge Summary', d: 'Hospital visits', i: Hospital, c: 'text-amber-600 bg-amber-50' },
]

export function Documents() {
  const [phase, setPhase] = useState<'upload' | 'uploading' | 'processing' | 'review'>('upload')
  const [drag, setDrag] = useState(false)
  const [pct, setPct] = useState(0)
  const L = useL()

  useEffect(() => {
    if (phase !== 'uploading') return
    setPct(0)
    const id = setInterval(() => setPct((p) => (p >= 100 ? 100 : p + 8)), 90)
    return () => clearInterval(id)
  }, [phase])
  useEffect(() => {
    if (phase === 'uploading' && pct >= 100) setPhase('processing')
  }, [pct, phase])

  if (phase === 'processing') return <Processing onDone={() => setPhase('review')} />
  if (phase === 'review') return <Extraction onReset={() => setPhase('upload')} />

  return (
    <div className="anim-fade-up mx-auto max-w-4xl">
      <PageHead title={L('Add to your health record', 'अपने स्वास्थ्य रिकॉर्ड में जोड़ें')} sub={L('Upload a prescription, laboratory report, diagnostic report, or discharge summary.', 'प्रिस्क्रिप्शन, लैब रिपोर्ट, डायग्नोस्टिक रिपोर्ट या डिस्चार्ज सारांश अपलोड करें।')} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); setPhase('uploading') }}
        className={cx('relative overflow-hidden rounded-[28px] border-2 border-dashed px-6 py-16 text-center transition-all duration-300 md:py-20', drag ? 'scale-[1.01] border-sky-400 bg-sky-50/60' : 'border-slate-300/80 bg-white hover:border-slate-400')}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(14,165,233,.07),transparent)]" />
        {phase === 'uploading' ? (
          <div className="relative mx-auto max-w-xs">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-600"><FileText size={28} strokeWidth={1.5} /></div>
            <p className="font-display text-xl font-semibold">Uploading prescription.jpg</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all" style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-xs tabular-nums text-slate-400">{Math.min(pct, 100)}% · 1.8 MB</p>
          </div>
        ) : (
          <div className="relative">
            <div className={cx('mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-sky-50 to-teal-50 text-sky-700 ring-1 ring-sky-100', drag ? '' : 'anim-drift')}>
              <CloudUpload size={34} strokeWidth={1.4} />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{drag ? 'Release to upload' : L('Drop your document here', 'अपना दस्तावेज़ यहाँ छोड़ें')}</h2>
            <p className="mt-2 text-slate-500">
              {L('or', 'या')}{' '}
              <button onClick={() => setPhase('uploading')} className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 hover:decoration-sky-600">{L('choose a file', 'फ़ाइल चुनें')}</button>
            </p>
            <p className="mt-5 text-xs font-medium tracking-wide text-slate-400">PDF · JPG · PNG</p>
            <div className="mt-6 flex justify-center">
              <Btn v="secondary" onClick={() => setPhase('uploading')}><Camera size={16} />{L('Take a photo', 'फ़ोटो लें')}</Btn>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <Eyebrow className="mb-3">Supported documents</Eyebrow>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {docTypes.map((d) => (
            <button key={d.t} onClick={() => setPhase('uploading')} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <span className={cx('mb-4 grid h-10 w-10 place-items-center rounded-xl', d.c)}><d.i size={19} strokeWidth={1.7} /></span>
              <p className="text-sm font-semibold">{d.t}</p>
              <p className="mt-0.5 text-xs text-slate-500">{d.d}</p>
            </button>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={14} className="text-teal-600" />Documents are processed to build your record. Try any option above to see the full demo.</p>
      </div>
    </div>
  )
}

/* ================= Processing ================= */
const steps = ['Document recognized', 'Text extracted', 'Medical information identified', 'Validating extracted data', 'Creating health record']

function Processing({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= steps.length) return
    const id = setTimeout(() => setN((x) => x + 1), 1300)
    return () => clearTimeout(id)
  }, [n])
  const done = n >= steps.length
  return (
    <div className="anim-fade-up mx-auto grid max-w-5xl gap-8 md:grid-cols-[minmax(0,360px)_1fr] md:gap-12">
      <div>
        <div className="relative">
          <DocPaper kind="rx" showAll={false} />
          {!done && (
            <div className="anim-scan pointer-events-none absolute inset-x-0 h-16 -translate-y-full bg-gradient-to-b from-transparent via-sky-400/20 to-sky-400/40">
              <div className="absolute inset-x-0 bottom-0 h-px bg-sky-400 shadow-[0_0_14px_3px_rgba(56,189,248,.7)]" />
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">prescription_04oct.jpg · 1.8 MB</p>
      </div>

      <div className="flex flex-col justify-center">
        <div className="mb-1 flex items-center gap-2"><Badge s="ai" /></div>
        <h1 className="font-display text-[32px] font-semibold tracking-tight md:text-[38px]">{done ? 'Your document is ready' : 'Understanding your document…'}</h1>
        <p className="mt-2 text-slate-500">{done ? 'Review what was found before it is added to your record.' : 'This usually takes a few seconds.'}</p>

        <ol className="mt-7 space-y-1">
          {steps.map((s, i) => {
            const state = i < n ? 'done' : i === n ? 'active' : 'todo'
            return (
              <li key={s} className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500', state === 'active' && 'bg-violet-50/70')}>
                <span className={cx('grid h-6 w-6 place-items-center rounded-full text-white transition-all', state === 'done' && 'bg-teal-600', state === 'active' && 'bg-violet-600 anim-pulse-ring', state === 'todo' && 'bg-slate-200')}>
                  {state === 'done' ? <Check size={13} strokeWidth={3} /> : state === 'active' ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                </span>
                <span className={cx('text-[15px]', state === 'todo' ? 'text-slate-400' : 'font-medium text-foreground')}>{s}</span>
              </li>
            )
          })}
        </ol>

        <Card className="mt-6 overflow-hidden p-5">
          <svg viewBox="0 0 440 110" className="w-full" aria-hidden>
            <defs><linearGradient id="g1" x1="0" x2="1"><stop stopColor="#0ea5e9" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
            {[22, 40, 58, 76, 94].map((y, i) => (
              <rect key={y} x="10" y={y - 3} width={[70, 54, 62, 40, 58][i]} height="5" rx="2.5" fill="#cbd5e1" />
            ))}
            {[22, 40, 58, 76, 94].map((y, i) => (
              <path key={y} d={`M84 ${y} C 150 ${y}, 150 ${[30, 50, 70][i % 3] + 5}, 214 55`} fill="none" stroke="url(#g1)" strokeWidth="1.3" strokeDasharray="4 4" className="anim-flow" opacity=".7" />
            ))}
            <circle cx="224" cy="55" r="16" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1.5" />
            <circle cx="224" cy="55" r="6" fill="#8b5cf6" className="anim-drift" />
            {[18, 46, 74].map((y, i) => (
              <g key={y}>
                <path d={`M240 55 C 280 55, 290 ${y + 10}, 320 ${y + 10}`} fill="none" stroke="url(#g1)" strokeWidth="1.3" strokeDasharray="4 4" className="anim-flow" opacity=".7" />
                <rect x="320" y={y} width="108" height="20" rx="10" fill={i === 2 && n < 4 ? '#fffbeb' : '#f0fdfa'} stroke={i === 2 && n < 4 ? '#fcd34d' : '#99f6e4'} />
                <text x="334" y={y + 14} fontSize="10" fontWeight="600" fill="#334155">{['Medication', 'Dosage', 'Frequency'][i]}</text>
                <text x="414" y={y + 14} fontSize="10" textAnchor="end" fill="#64748b">{[92, 96, 78][i]}%</text>
              </g>
            ))}
          </svg>
          <p className="mt-1 flex justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400"><span>Handwriting</span><span>Understanding</span><span>Structured data</span></p>
        </Card>

        {done && <Btn className="mt-6 self-start anim-fade-up" onClick={onDone}>Review extracted information<ArrowRight size={16} /></Btn>}
      </div>
    </div>
  )
}

/* ================= Extraction + verification ================= */
type Field = { id: string; group: number; label: string; value: string; conf: number; userVerified?: boolean }
const initial: Field[] = [
  { id: 'med1', group: 1, label: 'Medication', value: 'Amoxicillin', conf: 92 },
  { id: 'dose1', group: 1, label: 'Dosage', value: '500 mg', conf: 96 },
  { id: 'freq1', group: 1, label: 'Frequency', value: 'Twice daily', conf: 78 },
  { id: 'dur1', group: 1, label: 'Duration', value: '5 days', conf: 94 },
  { id: 'inst1', group: 1, label: 'Instructions', value: 'After meals', conf: 91 },
  { id: 'med2', group: 2, label: 'Medication', value: '[Unclear handwriting]', conf: 41 },
  { id: 'dose2', group: 2, label: 'Dosage', value: '10 mg', conf: 68 },
]

function Extraction({ onReset }: { onReset: () => void }) {
  const [fields, setFields] = useState(initial)
  const [active, setActive] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [zoom, setZoom] = useState(1)
  const openEvidence = useEvidence()
  const toast = useToast()
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  const lvl = (f: Field): Level => (f.userVerified ? 'verified' : levelOf(f.conf))
  const tint = Object.fromEntries(fields.map((f) => [f.id, lvl(f)])) as Record<string, Level>
  const open = fields.filter((f) => lvl(f) !== 'verified')
  const needs = fields.filter((f) => lvl(f) === 'verify').length

  const pick = (id: string) => {
    setActive(id)
    refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  const confirm = (id: string, value?: string) => {
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, value: value || f.value, conf: 100, userVerified: true } : f)))
    setVerifying(null)
    setDraft('')
    toast('Confirmed by you — marked as user-verified')
  }

  return (
    <div className="anim-fade-up">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <button onClick={onReset} className="mb-2 text-xs font-medium text-slate-400 hover:text-slate-600">← Add another document</button>
          <h1 className="font-display text-[28px] font-semibold tracking-tight md:text-[34px]">Review your prescription</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Dr. R. Menon · 04 Oct 2026</span>
            <span className="text-slate-300">·</span>
            <Badge s="verified" label={`${fields.filter((f) => lvl(f) === 'verified').length} verified`} />
            <Badge s="review" label={`${fields.filter((f) => lvl(f) === 'review').length} to review`} />
            {needs > 0 && <Badge s="verify" label={`${needs} needs verification`} />}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Btn disabled={needs > 0} onClick={() => toast('Saved to your health record')}><ShieldCheck size={16} />Save to health record</Btn>
          {needs > 0 && <span className="text-xs text-amber-700">Verify the highlighted item to continue</span>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* document */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium"><FileText size={15} className="text-slate-400" />Original document</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Zoom out"><Minus size={15} /></button>
                <span className="w-11 text-center text-xs font-medium tabular-nums text-slate-500">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Zoom in"><Plus size={15} /></button>
                <button onClick={() => setZoom(1)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fit"><Maximize2 size={14} /></button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto bg-slate-100/70 p-5">
              <div className="mx-auto transition-all duration-300" style={{ width: `${zoom * 100}%` }}>
                <DocPaper kind="rx" active={active} tint={tint} onPick={(id) => pick(id)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border border-teal-500 bg-teal-400/20" />Verified</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border border-sky-500 bg-sky-400/20" />Review</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border border-amber-500 bg-amber-400/20" />Needs verification</span>
            </div>
          </Card>
        </div>

        {/* extracted */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Sparkles size={16} className="text-violet-600" /><h2 className="font-display text-lg font-semibold">AI Extracted Information</h2></div>
            <Badge s="ai" />
          </div>
          <div className="space-y-6">
            {[1, 2].map((g) => (
              <div key={g}>
                <Eyebrow className="mb-2">Medication {g}</Eyebrow>
                <div className="space-y-2.5">
                  {fields.filter((f) => f.group === g).map((f) => {
                    const lv = lvl(f)
                    const isActive = active === f.id
                    const unclear = f.value.startsWith('[')
                    return (
                      <div
                        key={f.id}
                        ref={(el) => { refs.current[f.id] = el }}
                        onClick={() => setActive(f.id)}
                        className={cx('cursor-pointer rounded-2xl border bg-white p-4 transition-all duration-300', isActive ? 'border-violet-300 shadow-[0_0_0_4px_rgba(139,92,246,.08)]' : 'border-slate-200 hover:border-slate-300', lv === 'verify' && !isActive && 'border-amber-300 bg-amber-50/30')}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Eyebrow>{f.label}</Eyebrow>
                            <p className={cx('mt-1 font-display text-[22px] font-semibold leading-tight tracking-tight', unclear && 'font-normal italic text-amber-700')}>{f.value}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Badge s={lv} label={f.userVerified ? 'Verified by you' : undefined} />
                            <span className="text-[11px] text-slate-400">{f.userVerified ? 'Confirmed against document' : lv === 'verified' ? 'High confidence' : lv === 'review' ? 'Medium confidence' : 'Low confidence'}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <ConfBar value={f.conf} className="flex-1" />
                          <button onClick={(e) => { e.stopPropagation(); setActive(f.id); openEvidence({ kind: 'rx', region: f.id }) }} className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"><FileSearch size={13} />Evidence</button>
                        </div>

                        {lv === 'verify' && verifying !== f.id && (
                          <Btn sm className="mt-3 bg-amber-500 text-white shadow-none hover:bg-amber-600" onClick={(e) => { e.stopPropagation(); setActive(f.id); setVerifying(f.id) }}>Verify against document</Btn>
                        )}
                        {lv === 'review' && (
                          <div className="mt-3 flex gap-2">
                            <Btn sm v="secondary" onClick={(e) => { e.stopPropagation(); confirm(f.id) }}><Check size={14} />Looks right</Btn>
                            <Btn sm v="ghost" onClick={(e) => { e.stopPropagation(); setActive(f.id); setVerifying(f.id) }}>Edit</Btn>
                          </div>
                        )}
                        {verifying === f.id && (
                          <div className="anim-fade-up mt-3 rounded-xl bg-amber-50 p-3" onClick={(e) => e.stopPropagation()}>
                            <p className="mb-2 text-[13px] text-amber-900">We highlighted this line on the document. Enter what you can read — we will not guess.</p>
                            <div className="flex flex-wrap gap-2">
                              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={f.label === 'Medication' ? 'Medicine name' : f.value} className="h-9 min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                              <Btn sm disabled={!draft.trim() && f.value.startsWith('[')} onClick={() => confirm(f.id, draft.trim())}>Confirm</Btn>
                              <Btn sm v="ghost" onClick={() => setVerifying(null)}>Cancel</Btn>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
            <Sparkles size={13} className="mt-0.5 shrink-0 text-violet-500" />
            HealthLens never fills in uncertain medical details on its own. Anything below high confidence waits for your confirmation.
          </p>
          {open.length === 0 && <p className="mt-3 text-sm font-medium text-teal-700">All fields confirmed — ready to save.</p>}
        </div>
      </div>
    </div>
  )
}
