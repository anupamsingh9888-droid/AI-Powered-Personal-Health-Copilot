import { useState, useEffect } from 'react'
import {
  Droplets,
  Activity,
  Heart,
  FlaskConical,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  FileText,
  Pill,
  TrendingUp,
  Info,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Upload,
  Clock,
  ChevronRight,
  Utensils,
} from 'lucide-react'
import { Btn, Card, Eyebrow, PageHead, cx, useL, useEvidence, useToast } from './ui'
import type { ConditionInfo, HealthConditionId } from './types'
import { PersonalizedRecommendations } from './components/PersonalizedRecommendations'

interface ConditionsProps {
  conditions: ConditionInfo[]
  selectedConditionId?: HealthConditionId | null
  onSelectCondition?: (id: HealthConditionId | null) => void
  onAskAi: (prompt: string) => void
  onBookDoctor: (specialty?: string) => void
  hasRecords?: boolean
  onNavigate?: (viewId: string, extra?: any) => void
}

type ConditionStatusType = 'normal' | 'attention' | 'urgent' | 'no_data'

function getNormalizedStatus(status?: string): ConditionStatusType {
  if (!status || status === 'no_data') return 'no_data'
  if (status === 'urgent' || status === 'critical') return 'urgent'
  if (status === 'attention' || status === 'review' || status === 'verify') return 'attention'
  return 'normal' // 'optimal', 'normal'
}

/**
 * Requirement 3: Clear status labels (Normal, Needs Attention, Urgent)
 * Uses both text and visual indicators. Never depends only on color.
 */
function StatusIndicator({
  status,
  size = 'md',
}: {
  status?: string
  size?: 'sm' | 'md'
}) {
  const L = useL()
  const s = getNormalizedStatus(status)

  if (s === 'urgent') {
    return (
      <span
        className={cx(
          'inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-50 text-rose-950 border border-rose-300 shadow-2xs',
          size === 'sm' ? 'px-2.5 py-0.5 text-[10.5px]' : 'px-3 py-1 text-xs'
        )}
      >
        <AlertTriangle size={size === 'sm' ? 12 : 13} className="text-rose-600 shrink-0" />
        <span>{L('Urgent', 'तत्काल ध्यान दें')}</span>
      </span>
    )
  }

  if (s === 'attention') {
    return (
      <span
        className={cx(
          'inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-50 text-amber-950 border border-amber-300 shadow-2xs',
          size === 'sm' ? 'px-2.5 py-0.5 text-[10.5px]' : 'px-3 py-1 text-xs'
        )}
      >
        <AlertCircle size={size === 'sm' ? 12 : 13} className="text-amber-600 shrink-0" />
        <span>{L('Needs Attention', 'ध्यान देने योग्य')}</span>
      </span>
    )
  }

  if (s === 'no_data') {
    return (
      <span
        className={cx(
          'inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200',
          size === 'sm' ? 'px-2.5 py-0.5 text-[10.5px]' : 'px-3 py-1 text-xs'
        )}
      >
        <HelpCircle size={size === 'sm' ? 12 : 13} className="text-slate-500 shrink-0" />
        <span>{L('No data available', 'डेटा उपलब्ध नहीं')}</span>
      </span>
    )
  }

  // Normal
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 font-bold rounded-full bg-teal-50 text-teal-950 border border-teal-200 shadow-2xs',
        size === 'sm' ? 'px-2.5 py-0.5 text-[10.5px]' : 'px-3 py-1 text-xs'
      )}
    >
      <CheckCircle2 size={size === 'sm' ? 12 : 13} className="text-teal-600 shrink-0" />
      <span>{L('Normal', 'सामान्य')}</span>
    </span>
  )
}

/**
 * Requirement 4: Show measurements in very simple language.
 * Example from prompt:
 * "HbA1c: 6.4%"
 * "This is slightly above the usual range."
 */
function getSimpleMeasurementExplanation(
  m: {
    name: string
    value: string
    unit?: string
    referenceRange?: string
    status?: string
  },
  L: (en: string, hi: string) => string
): string {
  const s = getNormalizedStatus(m.status)
  const normName = m.name.toLowerCase()

  if (s === 'urgent') {
    return L(
      'This reading is significantly outside the usual target. Prompt doctor review is recommended.',
      'यह माप सामान्य सीमा से काफी बाहर है। जल्द डॉक्टर से परामर्श की सलाह दी जाती है।'
    )
  }

  if (s === 'attention') {
    if (normName.includes('hba1c')) {
      return L(
        'This is slightly above the usual healthy target (under 5.7%).',
        'यह सामान्य स्वस्थ लक्ष्य (5.7% से कम) से थोड़ा ऊपर है।'
      )
    }
    if (normName.includes('post-meal') || normName.includes('ppbs')) {
      return L(
        'This is slightly above the usual target (under 140 mg/dL).',
        'यह सामान्य लक्ष्य (140 mg/dL से कम) से थोड़ा अधिक है।'
      )
    }
    if (normName.includes('fasting')) {
      return L(
        'This is slightly above the usual fasting target (under 100 mg/dL).',
        'यह सामान्य उपवास लक्ष्य (100 mg/dL से कम) से थोड़ा अधिक है।'
      )
    }
    return L(
      `This is slightly above the usual range (${m.referenceRange || 'usual targets'}).`,
      `यह सामान्य संदर्भ सीमा (${m.referenceRange || 'सामान्य लक्ष्य'}) से थोड़ा ऊपर है।`
    )
  }

  // Normal
  if (normName.includes('blood pressure')) {
    return L(
      'This is within the healthy usual range (systolic under 120 and diastolic under 80 mmHg).',
      'यह स्वस्थ सामान्य सीमा के भीतर है (सिस्टोलिक 120 से कम और डायस्टोलिक 80 से कम)।'
    )
  }
  if (normName.includes('heart rate') || normName.includes('pulse')) {
    return L(
      'This is within the healthy resting range (60–100 bpm).',
      'यह स्वस्थ विश्राम सीमा (60–100 bpm) के भीतर है।'
    )
  }
  if (normName.includes('creatinine') || normName.includes('egfr')) {
    return L(
      'This indicates healthy and normal kidney filtration.',
      'यह स्वस्थ और सामान्य किडनी फिल्ट्रेशन को दर्शाता है।'
    )
  }
  if (normName.includes('cholesterol')) {
    return L(
      'This is within the desirable healthy target (under 200 mg/dL).',
      'यह अनुशंसित स्वस्थ लक्ष्य (200 mg/dL से कम) के भीतर है।'
    )
  }

  return L(
    `This is within the usual healthy range (${m.referenceRange || 'standard reference'}).`,
    `यह सामान्य स्वस्थ सीमा के भीतर है (${m.referenceRange || 'मानक संदर्भ'})।`
  )
}

export function Conditions({
  conditions,
  selectedConditionId: externalSelected,
  onSelectCondition: externalOnSelect,
  onAskAi,
  onBookDoctor,
  hasRecords: initialHasRecords = true,
  onNavigate,
}: ConditionsProps) {
  const L = useL()
  const ev = useEvidence()
  const toast = useToast()

  const [hasRecords, setHasRecords] = useState(initialHasRecords)
  useEffect(() => {
    setHasRecords(initialHasRecords)
  }, [initialHasRecords])

  const [internalSelected, setInternalSelected] = useState<HealthConditionId | null>(null)
  const activeConditionId = externalSelected !== undefined ? externalSelected : internalSelected
  const setSelected = externalOnSelect || setInternalSelected

  const activeCondition = conditions.find((c) => c.id === activeConditionId)

  const getConditionIcon = (name: string, size = 22) => {
    switch (name) {
      case 'Droplets':
        return <Droplets size={size} className="text-teal-600" />
      case 'Activity':
        return <Activity size={size} className="text-sky-600" />
      case 'Heart':
        return <Heart size={size} className="text-rose-600" />
      case 'FlaskConical':
      default:
        return <FlaskConical size={size} className="text-violet-600" />
    }
  }

  // =========================================================
  // CONDITION DETAIL VIEW
  // =========================================================
  if (activeCondition && hasRecords) {
    const isAttention = activeCondition.status === 'attention'
    const simpleDesc =
      activeCondition.simpleExplanation ||
      (activeCondition.id === 'diabetes'
        ? 'Tracks your blood sugar levels.'
        : activeCondition.id === 'blood_pressure'
        ? 'Tracks your blood pressure.'
        : activeCondition.id === 'heart'
        ? 'Tracks heart rate and cholesterol.'
        : 'Tracks kidney function.')

    const primaryLabel =
      activeCondition.primaryMeasurementLabel ||
      activeCondition.keyMetrics[0]?.label ||
      'Latest reading'
    const primaryVal =
      activeCondition.primaryMeasurementValue || activeCondition.keyMetrics[0]?.value || '—'
    const primaryUnit =
      activeCondition.primaryMeasurementUnit || activeCondition.keyMetrics[0]?.unit || ''

    // Previous readings (excluding the latest one if multiple exist)
    const hasTrendReadings = activeCondition.trendData && activeCondition.trendData.length > 0
    const previousReadings =
      activeCondition.trendData && activeCondition.trendData.length > 1
        ? activeCondition.trendData.slice(0, activeCondition.trendData.length - 1)
        : []

    return (
      <div className="anim-fade-up mx-auto max-w-5xl space-y-7">
        {/* Requirement 11: Clear Back Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft size={16} className="text-teal-700" />
            <span>{L('← Back to Health Conditions', '← स्वास्थ्य स्थितियों पर वापस जाएँ')}</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Requirement 7: Based on your available health records notice */}
            <span className="text-xs text-slate-500 hidden sm:inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
              <ShieldCheck size={13} className="text-teal-600" />
              <span>{L('Based on your available health records', 'उपलब्ध स्वास्थ्य रिकॉर्ड के आधार पर')}</span>
            </span>

            {/* Requirement 3: Status label */}
            <StatusIndicator status={activeCondition.status} size="md" />
          </div>
        </div>

        {/* TOP HERO: 
            1. Condition name
            2. Simple one-line explanation
            3. Current status
            4. Most important current measurement
            5. Plain-language meaning (Requirement 4)
        */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-white via-slate-50/50 to-teal-50/20 border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-xs border border-slate-200 shrink-0">
                {getConditionIcon(activeCondition.iconName, 28)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <Eyebrow>{L('Health Record Overview', 'स्वास्थ्य रिकॉर्ड विवरण')}</Eyebrow>
                  <span className="text-[11px] text-teal-800 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.2 rounded-md">
                    {L('Based on your records', 'आपके रिकॉर्ड के आधार पर')}
                  </span>
                </div>
                <h1 className="mt-1 font-display text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  {L(activeCondition.title, activeCondition.titleHi)}
                </h1>
                <p className="mt-1.5 text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                  "{L(simpleDesc, activeCondition.simpleExplanationHi || activeCondition.subtitleHi)}"
                </p>
              </div>
            </div>

            {/* Prominent Current Measurement Callout */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs min-w-[220px] text-center md:text-right shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {L('Current Key Measurement', 'वर्तमान मुख्य माप')}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{primaryLabel}</p>
              <p className="font-display text-3xl font-bold text-slate-900 tracking-tight mt-1">
                {primaryVal} <span className="text-sm font-normal text-slate-500">{primaryUnit}</span>
              </p>
              <div className="mt-2 flex items-center justify-center md:justify-end gap-1.5">
                <StatusIndicator status={activeCondition.status} size="sm" />
              </div>
            </div>
          </div>

          {/* Requirement 4 & 8: Plain-language summary & non-diagnostic framing */}
          <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {L('What this measurement means', 'इस माप का क्या अर्थ है')}
              </p>
              <span className="text-[11px] text-slate-500 italic">
                {L('Non-diagnostic observation', 'गैर-नैदानिक अवलोकन')}
              </span>
            </div>
            <p className="text-sm md:text-[15px] leading-relaxed text-slate-800 font-medium bg-white/70 p-3.5 rounded-xl border border-slate-200/80">
              {L(
                activeCondition.overview,
                activeCondition.overviewHi
              )}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <Info size={13} className="text-teal-600 shrink-0" />
              <span>
                {L(
                  'Based on your available health records. An abnormal measurement is an observation to discuss with your doctor, not a disease diagnosis.',
                  'आपके उपलब्ध स्वास्थ्य रिकॉर्ड के आधार पर। असामान्य माप डॉक्टर से चर्चा के लिए एक संकेत है, कोई बीमारी का निदान नहीं।'
                )}
              </span>
            </p>
          </div>
        </Card>

        {/* SECTION A: CURRENT MEASUREMENTS (Requirement 5 & 4) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                {L('A. Current Measurements', 'A. वर्तमान स्वास्थ्य माप')}
              </h2>
              <p className="text-xs text-slate-500">
                {L(
                  'Based on your available health records. Stated in simple language.',
                  'आपके उपलब्ध रिकॉर्ड के आधार पर। सरल, सहज भाषा में।'
                )}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {activeCondition.measurements.length} {L('recorded measurements', 'दर्ज माप')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeCondition.measurements.map((m) => {
              const simpleMeaning = getSimpleMeasurementExplanation(m, L)

              return (
                <Card
                  key={m.id}
                  className="p-5 transition-all hover:shadow-md border-slate-200 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Measurement Name + Requirement 3 Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 leading-snug">
                        {m.name}
                      </span>
                      <StatusIndicator status={m.status} size="sm" />
                    </div>

                    {/* Visually Prominent Value */}
                    <div className="my-1">
                      <p className="font-display text-3xl font-bold text-slate-900 tracking-tight">
                        {m.value}{' '}
                        <span className="text-sm font-semibold text-slate-500">{m.unit}</span>
                      </p>
                    </div>

                    {/* Requirement 4: Simple language explanation */}
                    <div className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-slate-800">
                      <p className="font-semibold text-teal-900">{simpleMeaning}</p>
                    </div>

                    {/* Reference Range and Date */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-500 font-medium">
                          {L('Reference target:', 'संदर्भ लक्ष्य:')}
                        </span>
                        <span className="font-semibold text-slate-800">{m.referenceRange}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-500 font-medium">
                          {L('Date recorded:', 'दर्ज तारीख:')}
                        </span>
                        <span className="font-semibold text-slate-800">{m.date}</span>
                      </div>
                    </div>

                    {m.note && (
                      <p className="text-[11.5px] text-slate-600 italic">
                        {m.note}
                      </p>
                    )}
                  </div>

                  {/* Requirement 5 & 10: Source / evidence link */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {L('Verified record', 'सत्यापित रिकॉर्ड')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCondition.id === 'diabetes' && onNavigate) {
                          onNavigate('summary')
                        } else {
                          ev({ kind: 'cbc', region: 'hb' })
                        }
                      }}
                      className="font-bold text-teal-800 hover:text-teal-950 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      <span>{L('View source document', 'मूल दस्तावेज़ देखें')}</span>
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* SECTION B: PREVIOUS MEASUREMENTS (Requirement 5) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
                {L('B. Previous Measurements', 'B. पिछली दर्ज माप')}
              </h2>
              <p className="text-xs text-slate-500">
                {L('Historical readings recorded in your uploaded documents.', 'आपके अपलोड किए गए दस्तावेज़ों में पिछली दर्ज रीडिंग।')}
              </p>
            </div>
            {previousReadings.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                {previousReadings.length} {L('earlier readings', 'पुरानी रीडिंग')}
              </span>
            )}
          </div>

          <Card className="p-4 border-slate-200">
            {previousReadings.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {previousReadings.map((p, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] shrink-0">
                        <Clock size={13} />
                      </span>
                      <div>
                        <span className="font-bold text-slate-800">{p.label}</span>
                        <p className="text-[11px] text-slate-500">
                          {p.date} · {L('Recorded from verified report', 'सत्यापित रिपोर्ट से दर्ज')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/70">
                      {L('Historical reading', 'पिछली रीडिंग')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-700">
                  {L('No previous readings recorded on file yet.', 'फ़ाइल में अभी पिछली कोई रीडिंग दर्ज नहीं है।')}
                </p>
                <p className="text-[11px] text-slate-400">
                  {L('Earlier measurements will appear here when you upload older lab tests or clinic notes.', 'जब आप पुरानी रिपोर्ट अपलोड करेंगे, तो वे यहाँ दिखाई देंगी।')}
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* SECTION C: CHANGES OVER TIME / TREND (Requirement 5 & 6) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                {L('C. Changes Over Time (Trend)', 'C. समय के साथ बदलाव (रुझान)')}
              </h2>
              <p className="text-xs text-slate-500">
                {L('Readings plotted directly from your available health records.', 'सीधे आपके रिकॉर्ड से तैयार किया गया रुझान।')}
              </p>
            </div>
            {hasTrendReadings && activeCondition.trendData.length > 1 && (
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                <TrendingUp size={13} className="inline mr-1" />
                {L(activeCondition.trendSummary, activeCondition.trendSummaryHi)}
              </span>
            )}
          </div>

          <Card className="p-6 border-slate-200">
            {/* Requirement 6: Honest Trend Logic */}
            {!activeCondition.trendData || activeCondition.trendData.length === 0 ? (
              // 0 readings
              <div className="py-8 text-center space-y-2">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-400">
                  <TrendingUp size={20} />
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {L('No data available yet.', 'अभी कोई डेटा उपलब्ध नहीं है।')}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {L(
                    'Upload a medical report or diagnostic test to begin tracking changes over time.',
                    'समय के साथ बदलाव देखने के लिए मेडिकल रिपोर्ट या टेस्ट अपलोड करें।'
                  )}
                </p>
              </div>
            ) : activeCondition.trendData.length === 1 ? (
              // 1 reading
              <div className="py-8 text-center space-y-2">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <Activity size={20} />
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {L(
                    'Only one reading is available. A trend cannot be determined yet.',
                    'केवल एक रीडिंग उपलब्ध है। अभी रुझान निर्धारित नहीं किया जा सकता।'
                  )}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {L(
                    'Single reading recorded: ' + activeCondition.trendData[0].label + ' on ' + activeCondition.trendData[0].date + '. Multiple readings from different dates are required to show whether numbers are rising, falling, or steady.',
                    'एक रीडिंग दर्ज: ' + activeCondition.trendData[0].label + ' (' + activeCondition.trendData[0].date + ')। रुझान देखने के लिए अलग-अलग तारीखों की कई रीडिंग आवश्यक हैं।'
                  )}
                </p>
              </div>
            ) : (
              // Multiple readings -> show actual honest trend
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 uppercase tracking-wide">
                      {primaryLabel} ({primaryUnit})
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {L(
                        'Actual recorded readings from your uploaded documents (never invented)',
                        'आपके अपलोड किए गए दस्तावेज़ों से वास्तविक दर्ज रीडिंग (काल्पनिक नहीं)'
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-teal-400" />
                      <span className="text-slate-600">{L('Previous Reading', 'पिछली रीडिंग')}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-[#0f3057]" />
                      <span className="font-bold text-slate-800">{L('Latest Reading', 'नवीनतम रीडिंग')}</span>
                    </span>
                  </div>
                </div>

                {/* Plain-Language Step / Bar Visualization */}
                <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-3 pb-2 border-b border-slate-100">
                  {activeCondition.trendData.map((point, idx) => {
                    const isLatest = idx === activeCondition.trendData.length - 1
                    const maxVal = Math.max(...activeCondition.trendData.map((d) => d.value))
                    const barHeightPct = Math.max(25, Math.round((point.value / (maxVal * 1.15)) * 100))

                    return (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        {/* Reading Value Label */}
                        <span
                          className={cx(
                            'text-xs tabular-nums text-center font-bold px-1.5 py-0.5 rounded-md',
                            isLatest
                              ? 'bg-[#0f3057] text-white shadow-2xs'
                              : 'text-slate-700 bg-slate-100'
                          )}
                        >
                          {point.label}
                        </span>

                        {/* Bar Container */}
                        <div className="w-full bg-slate-50 rounded-xl h-28 flex items-end p-1.5 border border-slate-100">
                          <div
                            style={{ height: `${barHeightPct}%` }}
                            className={cx(
                              'w-full rounded-lg transition-all duration-500',
                              isLatest
                                ? 'bg-gradient-to-t from-[#0f3057] to-teal-600'
                                : 'bg-gradient-to-t from-teal-400 to-sky-300'
                            )}
                          />
                        </div>

                        {/* Date Axis Label */}
                        <span
                          className={cx(
                            'text-[11px]',
                            isLatest ? 'font-bold text-[#0f3057]' : 'font-medium text-slate-500'
                          )}
                        >
                          {point.date}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                  <p className="flex items-center gap-1.5">
                    <Info size={13} className="text-teal-600 shrink-0" />
                    <span>
                      {L(
                        'Based on your available health records. This chart visualizes measured readings over time, not a disease diagnosis.',
                        'आपके उपलब्ध स्वास्थ्य रिकॉर्ड पर आधारित। यह चार्ट समय के साथ दर्ज माप दर्शाता है, किसी बीमारी का निदान नहीं।'
                      )}
                    </span>
                  </p>
                  <span className="font-semibold text-slate-700 text-[11px] self-end sm:self-auto">
                    {L('Reference Target:', 'संदर्भ लक्ष्य:')}{' '}
                    {activeCondition.measurements[0]?.referenceRange || 'Standard clinical target'}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* SECTION D & SECTION E: RELATED MEDICINES & RELATED REPORTS (Requirement 5 & 10) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION D: Related Medicines */}
          <Card className="p-6 border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Pill size={18} className="text-sky-600" />
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {L('D. Related Medications', 'D. संबंधित दवाएँ')}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {L('Medications recorded in your profile related to this condition.', 'इस स्थिति से जुड़ी आपकी प्रोफ़ाइल में दर्ज दवाएँ।')}
                </p>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('medications')}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{L('All meds', 'सभी दवाएँ')}</span>
                  <ChevronRight size={13} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {activeCondition.relatedMeds.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-100 text-sky-800 shrink-0 font-bold text-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{med}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {L('Verified from prescription · Take exactly as prescribed', 'पर्चे से सत्यापित · निर्देशानुसार लें')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
              {L(
                'Always follow your doctor’s exact instructions. Never stop or modify medication doses on your own.',
                'हमेशा अपने डॉक्टर के निर्देशों का पालन करें। खुद से खुराक न बदलें।'
              )}
            </p>
          </Card>

          {/* SECTION E: Related Reports (Requirement 10: Clickable!) */}
          <Card className="p-6 border-slate-200 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={18} className="text-violet-600" />
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {L('E. Related Medical Reports', 'E. संबंधित मेडिकल रिपोर्ट')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {L('Tap to open and view the original verified medical documents.', 'मूल सत्यापित मेडिकल दस्तावेज़ देखने के लिए टैप करें।')}
              </p>
            </div>

            <div className="space-y-2.5">
              {activeCondition.relatedReports.map((rep, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{rep.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {rep.date} · {rep.summary}
                    </p>
                  </div>

                  {/* Requirement 10: Clickable related report */}
                  <button
                    type="button"
                    onClick={() => {
                      if (rep.title.toLowerCase().includes('cbc') && onNavigate) {
                        onNavigate('summary')
                      } else if (rep.title.toLowerCase().includes('prescription') && onNavigate) {
                        onNavigate('medications')
                      } else if (rep.regionKey && rep.kind) {
                        ev({ kind: rep.kind, region: rep.regionKey })
                      } else if (onNavigate) {
                        onNavigate('documents')
                      } else {
                        toast(`Viewing source document: ${rep.title}`, 'ok')
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-teal-800 hover:text-teal-950 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 hover:border-teal-300 shadow-2xs shrink-0 cursor-pointer transition"
                  >
                    <span>{L('View report', 'रिपोर्ट देखें')}</span>
                    <ExternalLink size={11} />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              {L(
                'Based on your available health records. Grounded directly in your uploaded files.',
                'आपके उपलब्ध स्वास्थ्य रिकॉर्ड पर आधारित। सीधे आपकी अपलोड फाइलों से जुड़ा।'
              )}
            </p>
          </Card>
        </div>

        {/* SECTION F: IMPORTANT OBSERVATIONS (Requirement 5, 7, 8) */}
        <Card className="p-6 border-slate-200 space-y-3.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-teal-600" />
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                {L('F. Important Observations', 'F. महत्वपूर्ण अवलोकन')}
              </h3>
              <p className="text-xs text-slate-500">
                {L(
                  'Based on your available health records. Plain-language discussion points for your doctor.',
                  'आपके उपलब्ध रिकॉर्ड पर आधारित। डॉक्टर से चर्चा के लिए सरल बिंदु।'
                )}
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            {activeCondition.observations.map((obs, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100 leading-relaxed font-medium"
              >
                <span className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0" />
                <span>{obs}</span>
              </li>
            ))}
          </ul>

          {/* Requirement 8: Non-diagnostic disease reassurance */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {L(
                'Based on your available health records. These observations are to help you prepare for discussions with your healthcare provider. An abnormal measurement is an observation to discuss, not a disease diagnosis.',
                'आपके उपलब्ध रिकॉर्ड पर आधारित। ये बिंदु डॉक्टर से चर्चा की तैयारी के लिए हैं। कोई भी असामान्य माप डॉक्टर से बातचीत का विषय है, किसी बीमारी का निदान नहीं।'
              )}
            </span>
          </div>
        </Card>

        {/* SECTION G: PERSONALIZED WELLNESS RECOMMENDATIONS (FOOD & EXERCISE) */}
        <Card className="p-6 md:p-7 border-teal-200/90 shadow-xs bg-white">
          <PersonalizedRecommendations
            conditionId={activeCondition.id}
            hasRecords={hasRecords}
            onAskAi={onAskAi}
            onNavigate={onNavigate}
            onViewSourceDoc={(title) => {
              if (onNavigate) onNavigate('documents')
              else toast(`Viewing source report: ${title}`, 'ok')
            }}
          />
        </Card>

        {/* SECTION H: ASK HEALTHCOPILOT (Requirement 9: Functional AI Chat routing!) */}
        <Card className="p-6 bg-gradient-to-r from-violet-50/40 via-sky-50/30 to-white border-violet-200/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-violet-600 shrink-0" />
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {L('H. Ask HealthCopilot About This Condition', 'H. हेल्थ कॉपायलट से इस स्थिति के बारे में पूछें')}
                </h3>
                <p className="text-xs text-slate-500">
                  {L(
                    'Tap any question below to open AI Health Chat with answers grounded in your records.',
                    'अपने रिकॉर्ड के आधार पर उत्तर पाने के लिए नीचे किसी भी प्रश्न पर टैप करें।'
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onAskAi(`What do my latest ${activeCondition.title} measurements mean for my health?`)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
            >
              <Sparkles size={13} />
              <span>{L('Ask custom question', 'अपना प्रश्न पूछें')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeCondition.aiQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAskAi(q)}
                className="p-3.5 bg-white hover:bg-violet-50/70 rounded-xl border border-slate-200 hover:border-violet-300 text-left text-xs font-semibold text-slate-800 hover:text-violet-950 transition shadow-2xs group flex flex-col justify-between cursor-pointer"
              >
                <span className="leading-snug">"{q}"</span>
                <span className="mt-3 text-[11px] font-bold text-teal-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {L('Ask HealthCopilot', 'हेल्थ कॉपायलट से पूछें')} <ArrowRight size={12} />
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* SECTION I: BOOK A DOCTOR */}
        <Card className="p-6 md:p-7 border-teal-200 bg-gradient-to-br from-teal-50/40 via-white to-sky-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={18} className="text-teal-700" />
              <h3 className="font-display text-lg font-bold text-slate-900">
                {L('I. Schedule Doctor Review', 'I. डॉक्टर परामर्श बुक करें')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              {L(
                `Review your verified ${activeCondition.title} measurements and lab records directly with a licensed physician.`,
                `अपने सत्यापित ${activeCondition.title} डेटा और रिपोर्ट की समीक्षा के लिए विशेषज्ञ डॉक्टर से परामर्श लें।`
              )}
            </p>
          </div>

          <Btn
            onClick={() =>
              onBookDoctor(
                activeCondition.id === 'diabetes'
                  ? 'Diabetes'
                  : activeCondition.id === 'blood_pressure' || activeCondition.id === 'heart'
                  ? 'Cardiology'
                  : 'Nephrology'
              )
            }
            className="shrink-0 font-bold px-5"
          >
            <Calendar size={15} />
            <span>{L('Book consultation', 'परामर्श बुक करें')}</span>
          </Btn>
        </Card>

        {/* Non-diagnostic Medical Safety Disclaimer */}
        <p className="text-xs text-slate-500 text-center py-2 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>
            {L(
              'HealthCopilot organizes your health measurements. It does not provide medical diagnoses or replace a licensed doctor.',
              'HealthCopilot आपके रिकॉर्ड को व्यवस्थित करता है। यह कोई चिकित्सीय निदान नहीं देता।'
            )}
          </span>
        </p>
      </div>
    )
  }

  // =========================================================
  // HEALTH CONDITIONS OVERVIEW (List of Cards or Empty State)
  // =========================================================
  return (
    <div className="anim-fade-up mx-auto max-w-5xl space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eyebrow>{L('Health Measurements', 'स्वास्थ्य माप')}</Eyebrow>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.2 rounded-md">
              {L('Based on your available health records', 'उपलब्ध रिकॉर्ड पर आधारित')}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {L('Health Conditions', 'स्वास्थ्य स्थितियाँ')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            {L(
              'Plain-language measurements and tracking grounded in your verified medical files.',
              'आपकी सत्यापित फाइलों पर आधारित सरल भाषा में माप और निगरानी।'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* State toggle for seamless review & testing */}
          <button
            type="button"
            onClick={() => {
              const next = !hasRecords
              setHasRecords(next)
              setSelected(null)
              toast(
                next
                  ? 'Switched to Demo User (4 conditions active)'
                  : 'Switched to New User (Empty records state)',
                'ok'
              )
            }}
            title={L('Toggle between Demo User and New User state', 'डेमो और नए उपयोगकर्ता के बीच स्विच करें')}
            className={cx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-2xs',
              hasRecords
                ? 'bg-teal-50 text-teal-900 border-teal-200/80 hover:bg-teal-100'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            )}
          >
            <span
              className={cx('h-2 w-2 rounded-full', hasRecords ? 'bg-teal-500 animate-pulse' : 'bg-slate-400')}
            />
            <span>
              {hasRecords
                ? L('Demo User (4 Conditions)', 'डेमो उपयोगकर्ता (4 स्थितियाँ)')
                : L('New User (No Data)', 'नया उपयोगकर्ता (खाली)')}
            </span>
          </button>

          <Btn v="secondary" sm onClick={() => onBookDoctor()}>
            <Calendar size={14} />
            <span>{L('Book a doctor', 'डॉक्टर बुक करें')}</span>
          </Btn>
        </div>
      </div>

      {/* Requirement 12: Completely New User With No Medical Records */}
      {!hasRecords || conditions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
            <FileText size={28} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {L(
                'No health conditions or measurements available yet.',
                'अभी कोई स्वास्थ्य स्थिति या माप उपलब्ध नहीं है।'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {L(
                'Upload a medical report or prescription to start building your health profile.',
                'अपनी स्वास्थ्य प्रोफ़ाइल बनाना शुरू करने के लिए मेडिकल रिपोर्ट या पर्चा अपलोड करें।'
              )}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('documents')
                else toast('Navigating to Documents upload', 'ok')
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              <Upload size={16} />
              <span>{L('Upload a document', 'दस्तावेज़ अपलोड करें')}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto pt-2 leading-relaxed">
            {L(
              'HealthCopilot only creates condition profiles when verified lab tests, discharge summaries, or doctor prescriptions are uploaded. We do not assume diagnoses.',
              'HealthCopilot केवल सत्यापित लैब रिपोर्ट या पर्चे अपलोड होने पर ही माप प्रदर्शित करता है। हम किसी बीमारी का अनुमान नहीं लगाते।'
            )}
          </p>
        </div>
      ) : (
        /* Overview Cards Grid for Demo User with verified records */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {conditions.map((cond) => {
            // Simple one-line explanation
            const simpleDesc =
              cond.simpleExplanation ||
              (cond.id === 'diabetes'
                ? 'Tracks your blood sugar levels.'
                : cond.id === 'blood_pressure'
                ? 'Tracks your blood pressure.'
                : cond.id === 'heart'
                ? 'Tracks heart rate and cholesterol.'
                : 'Tracks kidney function.')

            // Current primary measurement
            const primaryLabel =
              cond.primaryMeasurementLabel || cond.keyMetrics[0]?.label || 'Latest reading'
            const primaryVal =
              cond.primaryMeasurementValue || cond.keyMetrics[0]?.value || '—'
            const primaryUnit =
              cond.primaryMeasurementUnit || cond.keyMetrics[0]?.unit || ''

            // Requirement 4: Simple language explanation for this condition's key metric
            const simpleLanguageExplanation = getSimpleMeasurementExplanation(
              {
                name: primaryLabel,
                value: primaryVal,
                unit: primaryUnit,
                referenceRange: cond.measurements[0]?.referenceRange,
                status: cond.status,
              },
              L
            )

            return (
              <Card
                key={cond.id}
                className="p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-slate-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* 1. Condition Name + Icon */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 border border-slate-200 shrink-0">
                        {getConditionIcon(cond.iconName, 24)}
                      </span>
                      <div>
                        <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                          {L(cond.title, cond.titleHi)}
                        </h2>
                        {/* 2. Simple one-line explanation */}
                        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 leading-snug">
                          "{L(simpleDesc, cond.simpleExplanationHi || cond.subtitleHi)}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Most important current measurement */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {L('Current Measurement', 'वर्तमान माप')}
                      </p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">{primaryLabel}:</p>
                    </div>
                    <p className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                      {primaryVal}{' '}
                      <span className="text-xs font-normal text-slate-500">{primaryUnit}</span>
                    </p>
                  </div>

                  {/* Requirement 4: Simple language meaning */}
                  <div className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-slate-800">
                    <p className="font-semibold text-teal-900">{simpleLanguageExplanation}</p>
                  </div>

                  {/* 4. Status Indicator (Requirement 3: Normal / Needs Attention / Urgent) */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-slate-500">
                      {L('Status indicator:', 'स्थिति संकेतक:')}
                    </span>
                    <StatusIndicator status={cond.status} size="sm" />
                  </div>

                  {/* Requirement 7: Notice that this comes from records */}
                  <p className="text-[11px] text-slate-400 italic px-1">
                    {L('Based on your available health records', 'आपके उपलब्ध स्वास्थ्य रिकॉर्ड के आधार पर')}
                  </p>
                </div>

                {/* 5. Primary actions: "Ask HealthCopilot →" & "View details →" */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      onAskAi(
                        `What do my ${cond.title} measurements indicate based on my available records?`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-800 hover:text-violet-950 transition cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>{L('Ask HealthCopilot →', 'हेल्थ कॉपायलट से पूछें →')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelected(cond.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f3057] hover:text-teal-700 transition cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    <span>{L('View details →', 'विवरण देखें →')}</span>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Safety Reassurance Note */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 flex items-center gap-3 text-xs text-slate-700">
        <ShieldCheck size={16} className="text-teal-600 shrink-0" />
        <p>
          {L(
            'Based on your available health records. HealthCopilot organizes and visualizes measurements clearly to help you prepare for discussions with your healthcare provider. An abnormal reading is not a disease diagnosis. Always discuss results with your doctor.',
            'आपके उपलब्ध रिकॉर्ड के आधार पर। HealthCopilot डॉक्टर से बातचीत की तैयारी के लिए माप प्रस्तुत करता है। कोई भी असामान्य माप किसी बीमारी का निदान नहीं है। हमेशा अपने डॉक्टर से परामर्श करें।'
          )}
        </p>
      </div>
    </div>
  )
}
