import { useState } from 'react'
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
  HelpCircle,
  Link2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Badge, Btn, Card, Eyebrow, PageHead, cx, useL, useEvidence, useToast } from './ui'
import type { ConditionInfo, HealthConditionId } from './types'

interface ConditionsProps {
  conditions: ConditionInfo[]
  selectedConditionId?: HealthConditionId | null
  onSelectCondition?: (id: HealthConditionId | null) => void
  onAskAi: (prompt: string) => void
  onBookDoctor: (specialty?: string) => void
}

export function Conditions({
  conditions,
  selectedConditionId: externalSelected,
  onSelectCondition: externalOnSelect,
  onAskAi,
  onBookDoctor,
}: ConditionsProps) {
  const L = useL()
  const ev = useEvidence()
  const toast = useToast()

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'attention':
        return 'bg-amber-50 text-amber-900 border border-amber-300'
      case 'optimal':
      case 'normal':
        return 'bg-teal-50 text-teal-900 border border-teal-200'
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200'
    }
  }

  // =========================================================
  // CONDITION DETAIL VIEW
  // =========================================================
  if (activeCondition) {
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

    const primaryLabel = activeCondition.primaryMeasurementLabel || activeCondition.keyMetrics[0]?.label || 'Latest reading'
    const primaryVal = activeCondition.primaryMeasurementValue || activeCondition.keyMetrics[0]?.value || '—'
    const primaryUnit = activeCondition.primaryMeasurementUnit || activeCondition.keyMetrics[0]?.unit || ''
    const plainStatusText = activeCondition.plainStatus || activeCondition.statusLabel

    return (
      <div className="anim-fade-up mx-auto max-w-5xl space-y-7">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{L('← Back to Health Conditions', '← स्वास्थ्य स्थितियों पर वापस जाएँ')}</span>
          </button>

          <span
            className={cx(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
              getStatusBadgeClass(activeCondition.status)
            )}
          >
            {isAttention ? (
              <AlertCircle size={13} className="text-amber-600" />
            ) : (
              <CheckCircle2 size={13} className="text-teal-600" />
            )}
            <span>{L(`Status: ${plainStatusText}`, `स्थिति: ${activeCondition.plainStatusHi || activeCondition.statusLabelHi}`)}</span>
          </span>
        </div>

        {/* TOP HERO: 
            1. Condition name
            2. Simple one-line explanation
            3. Current status
            4. Most important current measurement
        */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-white via-slate-50/50 to-teal-50/20 border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-xs border border-slate-200 shrink-0">
                {getConditionIcon(activeCondition.iconName, 28)}
              </span>
              <div>
                <Eyebrow>{L('Health Condition Profile', 'स्वास्थ्य स्थिति प्रोफ़ाइल')}</Eyebrow>
                <h1 className="mt-1 font-display text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  {L(activeCondition.title, activeCondition.titleHi)}
                </h1>
                <p className="mt-1.5 text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                  {L(simpleDesc, activeCondition.simpleExplanationHi || activeCondition.subtitleHi)}
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
                <span
                  className={cx(
                    'px-2 py-0.5 rounded-md text-[11px] font-bold',
                    isAttention
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-teal-100 text-teal-900'
                  )}
                >
                  {L(`Status: ${plainStatusText}`, `स्थिति: ${activeCondition.plainStatusHi || activeCondition.statusLabelHi}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Plain-Language Overview & What It Means */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {L('What this means for you', 'आपके लिए इसका क्या अर्थ है')}
            </p>
            <p className="text-sm md:text-[15px] leading-relaxed text-slate-700 font-medium">
              {L(activeCondition.overview, activeCondition.overviewHi)}
            </p>
          </div>
        </Card>

        {/* SECTION A: LATEST MEASUREMENTS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                {L('A. Latest Measurements', 'A. ताज़ा स्वास्थ्य माप')}
              </h2>
              <p className="text-xs text-slate-500">
                {L('Every measurement is pulled directly from your verified medical reports.', 'प्रत्येक माप सीधे आपकी सत्यापित रिपोर्ट से लिया गया है।')}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {activeCondition.measurements.length} {L('measurements', 'माप')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeCondition.measurements.map((m) => {
              const isItemAttention = m.status === 'attention' || m.status === 'critical'
              return (
                <Card key={m.id} className="p-5 transition-all hover:shadow-md border-slate-200 flex flex-col justify-between">
                  <div>
                    {/* Measurement Name + Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-700 leading-snug">
                        {m.name}
                      </span>
                      <span
                        className={cx(
                          'px-2 py-0.5 rounded-full text-[10.5px] font-bold shrink-0',
                          isItemAttention
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-teal-100 text-teal-900 border border-teal-200'
                        )}
                      >
                        {isItemAttention ? L('Needs attention', 'ध्यान दें') : L('Normal', 'सामान्य')}
                      </span>
                    </div>

                    {/* Visually Prominent Current Value */}
                    <div className="my-2.5">
                      <p className="font-display text-3xl font-bold text-slate-900 tracking-tight">
                        {m.value}{' '}
                        <span className="text-sm font-semibold text-slate-500">{m.unit}</span>
                      </p>
                    </div>

                    {/* Reference Range */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-500 font-medium">{L('Reference range:', 'संदर्भ सीमा:')}</span>
                        <span className="font-semibold text-slate-800">{m.referenceRange}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-500 font-medium">{L('Date recorded:', 'दर्ज तारीख:')}</span>
                        <span className="font-semibold text-slate-800">{m.date}</span>
                      </div>
                    </div>

                    {m.note && (
                      <p className="mt-2 text-[11.5px] text-slate-600 italic">
                        {m.note}
                      </p>
                    )}
                  </div>

                  {/* Source evidence link */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Verified document</span>
                    <button
                      onClick={() => ev({ kind: 'cbc', region: 'hb' })}
                      className="font-bold text-teal-800 hover:text-teal-950 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Link2 size={12} />
                      <span>{L('View source', 'स्रोत देखें')}</span>
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* SECTION B: CHANGES OVER TIME (Trend Chart) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                {L('B. Changes Over Time', 'B. समय के साथ बदलाव (रुझान)')}
              </h2>
              <p className="text-xs text-slate-500">
                {L('Historical readings plotted to show your trajectory clearly.', 'समय के साथ आपकी रीडिंग का स्पष्ट ग्राफ़।')}
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              <TrendingUp size={13} className="inline mr-1" />
              {L(activeCondition.trendSummary, activeCondition.trendSummaryHi)}
            </span>
          </div>

          <Card className="p-6 border-slate-200">
            {activeCondition.trendData && activeCondition.trendData.length > 1 ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 uppercase tracking-wide">
                      {primaryLabel} ({primaryUnit})
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {L('Latest recorded reading highlighted in deep blue', 'नवीनतम रीडिंग गहरे नीले रंग में चिह्नित')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-teal-500" />
                      <span className="text-slate-600">{L('Historical Reading', 'पिछली रीडिंग')}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-[#0f3057]" />
                      <span className="font-bold text-slate-800">{L('Latest Reading', 'ताज़ा रीडिंग')}</span>
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
                            isLatest ? 'bg-[#0f3057] text-white shadow-2xs' : 'text-slate-700 bg-slate-100'
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
                        <span className={cx('text-[11px]', isLatest ? 'font-bold text-[#0f3057]' : 'font-medium text-slate-500')}>
                          {point.date}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                  <p className="flex items-center gap-1.5">
                    <Info size={13} className="text-slate-400 shrink-0" />
                    <span>
                      {L(
                        'Readings represent verified measurements over time. This shows your personal trend, not a disease diagnosis.',
                        'ये मान समय के साथ आपके व्यक्तिगत रुझान को दर्शाते हैं, किसी बीमारी का निदान नहीं।'
                      )}
                    </span>
                  </p>
                  <span className="font-semibold text-slate-700 text-[11px] self-end sm:self-auto">
                    {L('Reference Target:', 'संदर्भ लक्ष्य:')} {activeCondition.measurements[0]?.referenceRange || 'Standard clinical target'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-400">
                  <TrendingUp size={20} />
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {L('Not enough historical readings yet.', 'अभी पर्याप्त पिछली रीडिंग उपलब्ध नहीं हैं।')}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {L('More readings will appear here as you upload new lab reports and clinical checkup records.', 'जैसे ही आप नई लैब रिपोर्ट अपलोड करेंगे, यहाँ रुझान दिखने लगेगा।')}
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* SECTION C & SECTION D: RELATED MEDICINES & RELATED REPORTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION C: Related Medicines */}
          <Card className="p-6 border-slate-200 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Pill size={18} className="text-sky-600" />
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {L('C. Related Medicines', 'C. संबंधित दवाएँ')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {L('These medicines are linked to this condition.', 'ये दवाएँ इस स्वास्थ्य स्थिति से जुड़ी हैं।')}
              </p>
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
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{med}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {L('From prescription by Dr. R. Menon · Take as prescribed', 'डॉ. मेनन की पर्ची से · निर्देशानुसार लें')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
              {L('Always follow your doctor’s exact instructions. Do not change doses without consulting your doctor.', 'हमेशा अपने डॉक्टर के निर्देशों का पालन करें। बिना सलाह के खुराक न बदलें।')}
            </p>
          </Card>

          {/* SECTION D: Related Reports */}
          <Card className="p-6 border-slate-200 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={18} className="text-violet-600" />
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {L('D. Related Reports', 'D. संबंधित रिपोर्ट')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {L('View the original report used for this information.', 'इस जानकारी के लिए उपयोग की गई मूल रिपोर्ट देखें।')}
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
                    <p className="text-[11px] text-slate-500 mt-0.5">{rep.date} · {rep.summary}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (rep.regionKey && rep.kind) {
                        ev({ kind: rep.kind, region: rep.regionKey })
                      } else {
                        toast(`Viewing source document: ${rep.title}`)
                      }
                    }}
                    className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 hover:underline px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
                  >
                    <span>{L('View source', 'स्रोत देखें')}</span>
                    <ExternalLink size={11} />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              {L('All readings are grounded directly in your uploaded laboratory files.', 'सभी मान सीधे आपकी अपलोड की गई लैब फाइलों पर आधारित हैं।')}
            </p>
          </Card>
        </div>

        {/* SECTION E: IMPORTANT OBSERVATIONS */}
        <Card className="p-6 border-slate-200 space-y-3.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-teal-600" />
            <h3 className="font-display text-lg font-bold text-slate-900">
              {L('E. Important Observations', 'E. महत्वपूर्ण अवलोकन')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {L('Plain-language summary of what your records show and what is worth discussing with your doctor.', 'सरल भाषा में सारांश कि आपके रिकॉर्ड क्या दर्शाते हैं और डॉक्टर से क्या पूछना चाहिए।')}
          </p>

          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            {activeCondition.observations.map((obs, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="h-2 w-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed font-medium">{obs}</span>
              </li>
            ))}
          </ul>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
            <span>
              {L(
                'These observations are intended to help you prepare for conversations with your healthcare provider. They are not medical diagnoses.',
                'ये अवलोकन आपको डॉक्टर से बातचीत की तैयारी में मदद के लिए हैं, यह कोई चिकित्सीय निदान नहीं हैं।'
              )}
            </span>
          </div>
        </Card>

        {/* SECTION F: ASK HEALTHCOPILOT (Condition-Specific AI Questions) */}
        <Card className="p-6 bg-gradient-to-r from-violet-50/40 via-sky-50/30 to-white border-violet-200/70 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet-600" />
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                {L('F. Ask HealthCopilot About This Condition', 'F. इस स्थिति के बारे में हेल्थ कॉपायलट से पूछें')}
              </h3>
              <p className="text-xs text-slate-500">
                {L('Tap any question below to get answers grounded in your verified records.', 'अपने रिकॉर्ड के आधार पर उत्तर पाने के लिए नीचे दिए गए किसी भी प्रश्न पर टैप करें।')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeCondition.aiQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onAskAi(q)}
                className="p-3.5 bg-white hover:bg-violet-50/60 rounded-xl border border-slate-200 hover:border-violet-300 text-left text-xs font-semibold text-slate-800 hover:text-violet-950 transition shadow-2xs group flex flex-col justify-between cursor-pointer"
              >
                <span className="leading-snug">"{q}"</span>
                <span className="mt-3 text-[11px] font-bold text-teal-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {L('Ask AI', 'AI से पूछें')} <ArrowRight size={12} />
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* SECTION G: BOOK A DOCTOR */}
        <Card className="p-6 md:p-7 border-teal-200 bg-gradient-to-br from-teal-50/40 via-white to-sky-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={18} className="text-teal-700" />
              <h3 className="font-display text-lg font-bold text-slate-900">
                {L('G. Book a Doctor', 'G. डॉक्टर अपॉइंटमेंट बुक करें')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              {L(
                `Schedule an in-person or video consultation with a certified specialist to review your ${activeCondition.title} data and latest readings.`,
                `अपने ${activeCondition.title} डेटा और रिपोर्ट की समीक्षा के लिए विशेषज्ञ डॉक्टर से परामर्श बुक करें।`
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
            <span>{L('Book a doctor', 'डॉक्टर बुक करें')}</span>
          </Btn>
        </Card>

        {/* Non-diagnostic Medical Safety Disclaimer */}
        <p className="text-xs text-slate-500 text-center py-2 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>
            {L(
              'HealthCopilot helps you organize and understand your records. It does not provide medical diagnoses or replace a licensed doctor.',
              'HealthCopilot आपके रिकॉर्ड को समझने में मदद करता है। यह कोई चिकित्सीय निदान नहीं देता।'
            )}
          </span>
        </p>
      </div>
    )
  }

  // =========================================================
  // HEALTH CONDITIONS OVERVIEW (Four Cards)
  // Ordered strictly as requested:
  // 1. Condition name
  // 2. Simple one-line explanation
  // 3. Most important current measurement
  // 4. Plain-language status
  // 5. Primary actions ("View details →" & "Ask HealthCopilot →")
  // =========================================================
  return (
    <div className="anim-fade-up mx-auto max-w-5xl space-y-7">
      <PageHead
        title={L('Health Conditions', 'स्वास्थ्य स्थितियाँ')}
        sub={L(
          'Understand your 4 key health areas at a glance with plain-language explanations and verified readings.',
          'सरल भाषा और सत्यापित रीडिंग के साथ अपने 4 मुख्य स्वास्थ्य क्षेत्रों को आसानी से समझें।'
        )}
      >
        <Btn v="secondary" sm onClick={() => onBookDoctor()}>
          <Calendar size={14} />
          <span>{L('Book a doctor', 'डॉक्टर बुक करें')}</span>
        </Btn>
      </PageHead>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {conditions.map((cond) => {
          const isAttention = cond.status === 'attention'

          // 2. Simple one-line explanation
          const simpleDesc =
            cond.simpleExplanation ||
            (cond.id === 'diabetes'
              ? 'Tracks your blood sugar levels.'
              : cond.id === 'blood_pressure'
              ? 'Tracks your blood pressure.'
              : cond.id === 'heart'
              ? 'Tracks heart rate and cholesterol.'
              : 'Tracks kidney function.')

          // 3. Most important current measurement
          const primaryLabel = cond.primaryMeasurementLabel || cond.keyMetrics[0]?.label || 'Latest reading'
          const primaryVal = cond.primaryMeasurementValue || cond.keyMetrics[0]?.value || '—'
          const primaryUnit = cond.primaryMeasurementUnit || cond.keyMetrics[0]?.unit || ''
          const plainStatusText = cond.plainStatus || cond.statusLabel

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
                    {primaryVal} <span className="text-xs font-normal text-slate-500">{primaryUnit}</span>
                  </p>
                </div>

                {/* 4. Plain-language status */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-slate-500">{L('Status summary:', 'स्थिति सारांश:')}</span>
                  <span
                    className={cx(
                      'px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5',
                      getStatusBadgeClass(cond.status)
                    )}
                  >
                    {isAttention ? (
                      <AlertCircle size={13} className="text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 size={13} className="text-teal-600 shrink-0" />
                    )}
                    <span>{L(`Status: ${plainStatusText}`, `स्थिति: ${cond.plainStatusHi || cond.statusLabelHi}`)}</span>
                  </span>
                </div>
              </div>

              {/* 5. Primary actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    onAskAi(`Tell me about my ${cond.title} readings and what these numbers indicate.`)
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

      {/* Safety Reassurance Note */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 flex items-center gap-3 text-xs text-slate-700">
        <ShieldCheck size={16} className="text-teal-600 shrink-0" />
        <p>
          {L(
            'HealthCopilot presents your data clearly to help you understand your health journey. It does not diagnose medical conditions. Always discuss results with your doctor.',
            'HealthCopilot आपकी स्वास्थ्य यात्रा को समझने के लिए डेटा स्पष्ट रूप से प्रस्तुत करता है। यह किसी बीमारी का निदान नहीं करता।'
          )}
        </p>
      </div>
    </div>
  )
}
