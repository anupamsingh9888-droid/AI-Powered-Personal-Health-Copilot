import { createContext, useContext, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Check, CircleDashed, TriangleAlert, CircleAlert, Contrast as CircleHalf, Sparkles } from 'lucide-react'

export const cx = clsx

/* ---------- context ---------- */
export type Lang = 'en' | 'hi'
export const LangCtx = createContext<Lang>('en')
export const useL = () => {
  const lang = useContext(LangCtx)
  return (en: string, hi: string) => (lang === 'hi' ? hi : en)
}
export const ToastCtx = createContext<(msg: string, tone?: 'ok' | 'warn') => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export type EvidenceTarget = { kind: 'rx' | 'cbc'; region: string } | null
export const EvidenceCtx = createContext<(t: EvidenceTarget) => void>(() => {})
export const useEvidence = () => useContext(EvidenceCtx)

/* ---------- logo ---------- */
export function Logo({ size = 32, word = false, dark = false }: { size?: number; word?: boolean; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="HealthLens">
        <defs>
          <linearGradient id="hl-bg" x1="0" y1="0" x2="32" y2="32">
            <stop stopColor="#14325c" />
            <stop offset="1" stopColor="#0b1b33" />
          </linearGradient>
          <linearGradient id="hl-pulse" x1="6" y1="0" x2="26" y2="0">
            <stop stopColor="#5eead4" />
            <stop offset="1" stopColor="#7dd3fc" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#hl-bg)" />
        <path d="M4.5 16C8 10.6 11.6 8.4 16 8.4S24 10.6 27.5 16C24 21.4 20.4 23.6 16 23.6S8 21.4 4.5 16Z" stroke="white" strokeOpacity=".9" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9.5 16H13l1.6-3.6 2.8 7.2 1.6-3.6h3.5" stroke="url(#hl-pulse)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {word && (
        <span className={cx('font-display text-[19px] font-semibold tracking-tight', dark ? 'text-white' : 'text-foreground')}>
          Health<span className="text-teal-600">Lens</span>
        </span>
      )}
    </span>
  )
}

/* ---------- status + confidence ---------- */
export type Level = 'verified' | 'review' | 'verify'
export const levelOf = (c: number): Level => (c >= 85 ? 'verified' : c >= 60 ? 'review' : 'verify')

const statusMap = {
  verified: { label: 'Verified', sub: 'High confidence', cls: 'bg-teal-50 text-teal-700 ring-teal-600/15', icon: Check, bar: '#0d9488' },
  review: { label: 'Review', sub: 'Medium confidence', cls: 'bg-sky-50 text-sky-700 ring-sky-600/15', icon: CircleHalf, bar: '#0284c7' },
  verify: { label: 'Needs verification', sub: 'Low confidence', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', icon: TriangleAlert, bar: '#d97706' },
  attention: { label: 'Attention', sub: '', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', icon: CircleAlert, bar: '#d97706' },
  critical: { label: 'Critical', sub: '', cls: 'bg-rose-50 text-rose-700 ring-rose-600/20', icon: CircleAlert, bar: '#e11d48' },
  ai: { label: 'AI generated', sub: '', cls: 'bg-violet-50 text-violet-700 ring-violet-600/15', icon: Sparkles, bar: '#7c3aed' },
  neutral: { label: 'Recorded', sub: '', cls: 'bg-slate-100 text-slate-600 ring-slate-500/10', icon: CircleDashed, bar: '#64748b' },
} as const
export type StatusKey = keyof typeof statusMap

export function Badge({ s, label, className }: { s: StatusKey; label?: string; className?: string }) {
  const m = statusMap[s]
  const Icon = m.icon
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset whitespace-nowrap', m.cls, className)}>
      <Icon size={12} strokeWidth={2.4} />
      {label ?? m.label}
    </span>
  )
}

export function ConfRing({ value, size = 44 }: { value: number; size?: number }) {
  const lv = levelOf(value)
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${value}% confidence`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8edf3" strokeWidth="3.5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={statusMap[lv].bar} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  )
}

export function ConfBar({ value, className }: { value: number; className?: string }) {
  const lv = levelOf(value)
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: statusMap[lv].bar }} />
      </div>
      <span className="w-9 text-right text-xs font-medium tabular-nums text-slate-600">{value}%</span>
    </div>
  )
}

/* ---------- buttons / cards ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { v?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'; sm?: boolean }
export function Btn({ v = 'primary', sm, className, ...p }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[.98] disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500'
  const vs = {
    primary: 'bg-[#0f3057] text-white shadow-sm hover:bg-[#0b2547] hover:shadow-md',
    secondary: 'bg-white text-foreground ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100',
    ai: 'bg-white/80 text-violet-800 ring-1 ring-inset ring-violet-200 hover:bg-white backdrop-blur',
  }
  return <button {...p} className={cx(base, vs[v], sm ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm', className)} />
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]', className)}>{children}</div>
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-[11px] font-semibold uppercase tracking-[.09em] text-slate-400', className)}>{children}</p>
}

export function PageHead({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="font-display text-[30px] font-semibold leading-tight tracking-[-.02em] text-foreground md:text-[38px]">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{sub}</p>
      </div>
      {children}
    </div>
  )
}

/* ---------- document mockups ---------- */
export type Region = { l: number; t: number; w: number; h: number }
export const RX_REGIONS: Record<string, Region> = {
  med1: { l: 10, t: 33, w: 44, h: 8 },
  dose1: { l: 56, t: 33, w: 24, h: 8 },
  freq1: { l: 10, t: 43, w: 28, h: 8 },
  dur1: { l: 41, t: 43, w: 28, h: 8 },
  inst1: { l: 10, t: 53, w: 36, h: 8 },
  med2: { l: 10, t: 63, w: 40, h: 9 },
  dose2: { l: 54, t: 63, w: 26, h: 9 },
}
export const CBC_REGIONS: Record<string, Region> = {
  hb: { l: 5, t: 40.5, w: 90, h: 7 },
}

export function DocPaper({ kind, active, tint = {}, onPick, showAll = true }: { kind: 'rx' | 'cbc'; active?: string | null; tint?: Record<string, Level>; onPick?: (id: string) => void; showAll?: boolean }) {
  const regions = kind === 'rx' ? RX_REGIONS : CBC_REGIONS
  const hand = (top: number, left: number, size: number, text: string, extra = '') => (
    <span className={cx('absolute whitespace-nowrap font-hand text-slate-700', extra)} style={{ top: `${top}%`, left: `${left}%`, fontSize: `${size}cqw`, lineHeight: 1 }}>{text}</span>
  )
  const small = (top: number, left: number, size: number, text: string, extra = '') => (
    <span className={cx('absolute whitespace-nowrap', extra)} style={{ top: `${top}%`, left: `${left}%`, fontSize: `${size}cqw`, lineHeight: 1 }}>{text}</span>
  )
  return (
    <div className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-[3px] bg-[#fdfdfb] shadow-[0_8px_30px_rgba(15,23,42,.10)] ring-1 ring-slate-200" style={{ containerType: 'inline-size' }}>
      {kind === 'rx' ? (
        <>
          {small(4.5, 8, 4.4, 'Dr. R. Menon, MBBS, MD', 'font-semibold text-slate-800 font-display')}
          {small(9.5, 8, 2.6, 'Sunrise Family Clinic · Reg. No. 48213', 'text-slate-400')}
          <div className="absolute left-[8%] right-[8%] top-[14%] h-px bg-slate-300" />
          {hand(16.5, 8, 5, 'Name: Alex Rao      Age: 34      Date: 04/10/26')}
          <div className="absolute left-[8%] right-[8%] top-[25%] h-px bg-slate-200" />
          {small(27, 8, 8, 'Rx', 'font-display italic text-slate-500')}
          {hand(34, 12, 6.4, 'Cap. Amoxicillin')}
          {hand(34, 58, 6.4, '500 mg')}
          {hand(44, 12, 6.4, '1 – 0 – 1')}
          {hand(44, 43, 6.4, '× 5 days')}
          {hand(54, 12, 6.4, 'after meals')}
          {hand(64.5, 12, 6.8, 'T. Lvmpz', 'blur-[.7px] -rotate-2 tracking-[.2em] opacity-60')}
          {hand(64.5, 56, 6.4, '10 mg', 'opacity-80')}
          <svg className="absolute bottom-[8%] right-[10%] w-[30%]" viewBox="0 0 120 40" fill="none"><path d="M4 28C20 4 26 36 40 16s14 14 28-6 12 20 24 4 12 8 24-4" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" /></svg>
          {small(90, 8, 2.4, 'Not valid for medico-legal purposes', 'text-slate-400')}
        </>
      ) : (
        <>
          <div className="absolute inset-x-0 top-0 h-[10%] bg-[#0f3057]" />
          {small(3.4, 6, 4.6, 'Meridian Diagnostics', 'font-semibold text-white font-display')}
          {small(7, 6, 2.3, 'NABL accredited · Lab ID MD-20418', 'text-sky-200')}
          {small(13, 6, 4.4, 'COMPLETE BLOOD COUNT (CBC)', 'font-semibold tracking-wide text-slate-800')}
          {small(19, 6, 2.8, 'Patient: Alex Rao   ·   34 / M   ·   Collected: 07 Oct 2026', 'text-slate-500')}
          {small(23, 6, 2.8, 'Referred by: Dr. R. Menon', 'text-slate-500')}
          <div className="absolute left-[5%] right-[5%] top-[31%] h-px bg-slate-300" />
          {small(33, 7, 2.5, 'TEST', 'font-semibold tracking-wider text-slate-400')}
          {small(33, 42, 2.5, 'RESULT', 'font-semibold tracking-wider text-slate-400')}
          {small(33, 60, 2.5, 'UNIT', 'font-semibold tracking-wider text-slate-400')}
          {small(33, 76, 2.5, 'REFERENCE', 'font-semibold tracking-wider text-slate-400')}
          {[
            ['Hemoglobin', '10.8  L', 'g/dL', '12.0 – 15.5', 43],
            ['RBC count', '4.1', 'mill/µL', '3.9 – 5.0', 51],
            ['WBC count', '7.2', '10³/µL', '4.0 – 11.0', 58],
            ['Platelets', '245', '10³/µL', '150 – 400', 65],
            ['Hematocrit', '36.2', '%', '36 – 46', 72],
          ].map(([a, b, c, d, t]) => (
            <div key={a as string}>
              {small(t as number, 7, 3.3, a as string, 'text-slate-700')}
              {small(t as number, 42, 3.3, b as string, cx('font-semibold', (b as string).includes('L') ? 'text-amber-700' : 'text-slate-800'))}
              {small(t as number, 60, 3, c as string, 'text-slate-500')}
              {small(t as number, 76, 3, d as string, 'text-slate-500')}
            </div>
          ))}
          <div className="absolute left-[5%] right-[5%] top-[79%] h-px bg-slate-200" />
          {small(82, 6, 2.5, 'End of report · Results relate to the sample tested.', 'text-slate-400')}
        </>
      )}
      {Object.entries(regions).map(([id, r]) => {
        const isActive = active === id
        const lv = tint[id]
        const color = lv === 'verify' ? 'border-amber-500 bg-amber-400/15' : lv === 'review' ? 'border-sky-500 bg-sky-400/10' : 'border-teal-500 bg-teal-400/10'
        if (!isActive && !showAll) return null
        return (
          <button
            key={id}
            onClick={() => onPick?.(id)}
            aria-label={`Region ${id}`}
            className={cx('absolute rounded-md border transition-all duration-300', isActive ? cx('border-2 ring-4 ring-violet-400/25', lv === 'verify' ? 'border-amber-500 bg-amber-400/25' : 'border-violet-500 bg-violet-400/20') : cx(color, 'opacity-70 hover:opacity-100'))}
            style={{ left: `${r.l}%`, top: `${r.t}%`, width: `${r.w}%`, height: `${r.h}%` }}
          />
        )
      })}
    </div>
  )
}
