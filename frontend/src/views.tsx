import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileText,
  FlaskConical,
  Hospital,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Activity,
  FolderOpen,
  Link2,
  Info,
  Database,
  Layers,
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mic,
  Send,
  Droplets,
  Heart,
  Edit2,
  Save,
  X,
} from 'lucide-react'
import { Badge, Btn, Card, ConfBar, ConfRing, DocPaper, Eyebrow, PageHead, cx, useEvidence, useL, useToast, formatAppointmentDate, type StatusKey } from './ui'
import type { ConditionInfo, Appointment, MedicationItem, HealthAlert, UserHealthProfile } from './types'

export type Go = (v: string, extra?: any) => void

interface HomeProps {
  go: Go
  user?: UserHealthProfile
  conditions: ConditionInfo[]
  appointments: Appointment[]
  medications: MedicationItem[]
  alerts: HealthAlert[]
  recentActivities?: {
    date: string
    type: string
    title: string
    note: string
    s: StatusKey
    icon?: any
  }[]
  onMedicationStatusChange: (id: string, action: 'taken' | 'skip' | 'reset') => void
  onQuickAskAi?: (prompt: string) => void
}

export function Home({
  go,
  user,
  conditions,
  appointments,
  medications,
  alerts,
  recentActivities,
  onMedicationStatusChange,
  onQuickAskAi,
}: HomeProps) {
  const L = useL()
  const ev = useEvidence()
  const toast = useToast()
  const [askInput, setAskInput] = useState('')

  const userName = user?.name ? user.name.split(' ')[0] : 'Alex'
  // Support active upcoming appointments (confirmed or requested)
  const upcomingAppointment = appointments.find((a) => a.status === 'confirmed' || a.status === 'requested')

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!askInput.trim()) return
    if (onQuickAskAi) {
      onQuickAskAi(askInput.trim())
    }
    go('chat', { prompt: askInput.trim() })
  }

  // Dynamic relative date for upcoming appointment
  const dynamicAptDate = upcomingAppointment ? formatAppointmentDate(upcomingAppointment.date) : ''

  // Recent activity default fallback (Alex Rao demo)
  const defaultActivities = [
    {
      date: '07 OCT',
      type: 'Blood Test',
      title: 'CBC Report (Meridian Diagnostics)',
      note: '1 item needs attention · Hemoglobin 10.8 g/dL (Below reference range)',
      s: 'attention' as StatusKey,
      icon: FlaskConical,
    },
    {
      date: '04 OCT',
      type: 'Prescription',
      title: 'Prescription (Dr. R. Menon)',
      note: '3 medications extracted & verified · 1 awaiting confirmation',
      s: 'verified' as StatusKey,
      icon: Pill,
    },
    {
      date: '28 SEP',
      type: 'Clinic Consultation',
      title: 'Doctor Visit (Sunrise Family Clinic)',
      note: 'Blood pressure 118/76 mmHg · Pulse 68 bpm recorded',
      s: 'neutral' as StatusKey,
      icon: Stethoscope,
    },
    {
      date: '12 SEP',
      type: 'Discharge Summary',
      title: 'Hospital Visit (City General Hospital)',
      note: 'Discharged in stable condition · Normal vital indicators',
      s: 'neutral' as StatusKey,
      icon: Hospital,
    },
  ]
  const displayActivities = recentActivities !== undefined ? recentActivities : defaultActivities

  return (
    <div className="anim-fade-up mx-auto max-w-6xl space-y-9">
      {/* Welcome Greeting Header */}
      <div>
        <h1 className="font-display text-[32px] sm:text-[40px] font-bold leading-tight tracking-tight text-slate-900">
          {L(`Good morning, ${userName}`, `सुप्रभात, ${userName}`)}
        </h1>
        <p className="mt-1.5 text-[16px] text-slate-600 font-medium">
          {L("Here's what needs your attention today.", 'यहाँ आपके आज के ज़रूरी स्वास्थ्य अपडेट हैं।')}
        </p>
      </div>

      {/* SECTION 1: Conditional Health Alerts */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          {alerts.length > 0 ? (
            <AlertCircle size={18} className="text-amber-600" />
          ) : (
            <CheckCircle2 size={18} className="text-teal-600" />
          )}
          <h2 className="font-display text-lg font-bold text-slate-900">
            {L('Important Health Alerts', 'ज़रूरी स्वास्थ्य सूचनाएँ')}
          </h2>
        </div>

        {alerts.length === 0 ? (
          <Card className="p-5 border-slate-200/90 bg-slate-50/60 flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {L('No health alerts right now', 'वर्तमान में कोई स्वास्थ्य चेतावनी नहीं')}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {L(
                  "We'll highlight important changes when they appear in your health records.",
                  'जब आपके स्वास्थ्य रिकॉर्ड में कोई महत्वपूर्ण बदलाव आएगा, हम यहाँ सूचित करेंगे।'
                )}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {alerts.map((al) => {
              // Dynamic appointment date calculation if alert describes appointment
              let alertDesc = al.description
              let alertDescHi = al.descriptionHi
              if (al.type === 'appointment' && upcomingAppointment) {
                const isToday = dynamicAptDate.toLowerCase().startsWith('today')
                const isTmrw = dynamicAptDate.toLowerCase().startsWith('tomorrow')
                const prefixEn = isToday ? 'Today' : isTmrw ? 'Tomorrow' : dynamicAptDate
                const prefixHi = isToday ? 'आज' : isTmrw ? 'कल' : dynamicAptDate
                alertDesc = `${prefixEn} at ${upcomingAppointment.time} with ${upcomingAppointment.doctorName} at ${upcomingAppointment.clinic}.`
                alertDescHi = `${prefixHi} ${upcomingAppointment.time} बजे ${upcomingAppointment.doctorName} के साथ अपॉइंटमेंट निर्धारित है।`
              }

              return (
                <Card
                  key={al.id}
                  className={cx(
                    'p-4.5 transition-all hover:shadow-md flex flex-col justify-between border-l-4',
                    al.type === 'attention'
                      ? 'border-l-amber-500 bg-amber-50/20'
                      : al.type === 'appointment'
                      ? 'border-l-teal-600 bg-teal-50/20'
                      : 'border-l-sky-500 bg-sky-50/20'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        {al.type === 'attention' ? (
                          <>
                            <AlertCircle size={12} className="text-amber-600" />
                            <span>{L('Needs Attention', 'ध्यान दें')}</span>
                          </>
                        ) : al.type === 'appointment' ? (
                          <>
                            <Calendar size={12} className="text-teal-600" />
                            <span>{L('Upcoming', 'आगामी')}</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={12} className="text-sky-600" />
                            <span>{L('Verification', 'सत्यापन')}</span>
                          </>
                        )}
                      </span>
                      <span
                        className={cx(
                          'h-2 w-2 rounded-full',
                          al.type === 'attention' ? 'bg-amber-500' : 'bg-teal-500'
                        )}
                      />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{L(al.title, al.titleHi)}</h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {L(alertDesc, alertDescHi)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {al.source || 'Medical Vault'}
                    </span>
                    <button
                      onClick={() => {
                        if (al.actionView === 'summary') go('summary')
                        else if (al.actionView === 'appointments') go('appointments')
                        else if (al.actionView === 'medications') go('medications')
                        else go(al.actionView)
                      }}
                      className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{al.actionLabel}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* SECTION 2 & SECTION 3: UPCOMING APPOINTMENT & MEDICATION REMINDERS (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2: Upcoming Doctor Appointment */}
        <Card className="p-6 border-slate-200/90 flex flex-col justify-between bg-gradient-to-br from-white to-sky-50/20">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Calendar size={15} className="text-teal-600" />
                {L('Upcoming Doctor Appointment', 'आगामी डॉक्टर अपॉइंटमेंट')}
              </span>
              {upcomingAppointment && (
                <span
                  className={cx(
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1',
                    upcomingAppointment.status === 'confirmed'
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : upcomingAppointment.status === 'requested'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : upcomingAppointment.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  )}
                >
                  {upcomingAppointment.status === 'confirmed' ? (
                    <>
                      <CheckCircle2 size={12} className="text-teal-600" />
                      <span>{L('Confirmed', 'पुष्ट')}</span>
                    </>
                  ) : upcomingAppointment.status === 'requested' ? (
                    <>
                      <Clock size={12} className="text-amber-600" />
                      <span>{L('Requested', 'अनुरोधित')}</span>
                    </>
                  ) : upcomingAppointment.status === 'cancelled' ? (
                    <>
                      <X size={12} className="text-rose-600" />
                      <span>{L('Cancelled', 'रद्द')}</span>
                    </>
                  ) : (
                    <>
                      <Check size={12} className="text-slate-600" />
                      <span>{L('Completed', 'पूर्ण')}</span>
                    </>
                  )}
                </span>
              )}
            </div>

            {upcomingAppointment ? (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-slate-900">
                    {dynamicAptDate}
                  </span>
                  <span className="text-sm font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {upcomingAppointment.time}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">{upcomingAppointment.doctorName}</p>
                  <p className="text-xs text-slate-600">{upcomingAppointment.specialty}</p>
                  <p className="text-xs text-slate-500 mt-1">{upcomingAppointment.clinic}</p>
                </div>

                {upcomingAppointment.notes && (
                  <p className="text-xs text-slate-600 italic">
                    "{upcomingAppointment.notes}"
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 mb-1">
                  <Calendar size={18} />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {L('No upcoming appointments', 'कोई आगामी अपॉइंटमेंट नहीं')}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {L('Your booked appointments will appear here.', 'आपकी बुक की गई अपॉइंटमेंट यहाँ दिखाई देंगी।')}
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {upcomingAppointment
                ? L('Reminder active on dashboard', 'रिमाइंडर सक्रिय है')
                : L('Certified doctors available', 'प्रमाणित डॉक्टर उपलब्ध')}
            </span>
            <button
              onClick={() => go('appointments')}
              className="text-xs font-bold text-[#0f3057] hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            >
              <span>
                {upcomingAppointment
                  ? L('View appointment →', 'अपॉइंटमेंट देखें →')
                  : L('Book doctor →', 'डॉक्टर बुक करें →')}
              </span>
            </button>
          </div>
        </Card>

        {/* SECTION 3: Medication Reminders */}
        <Card className="p-6 border-slate-200/90 flex flex-col justify-between bg-gradient-to-br from-white to-teal-50/20">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Pill size={15} className="text-teal-600" />
                {L('Medication Reminders', 'दवा रिमाइंडर')}
              </span>
              <button
                onClick={() => go('medications')}
                className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
              >
                {medications.length > 0
                  ? L(`All medications (${medications.length}) →`, `सभी दवाएँ (${medications.length}) →`)
                  : L('View medications →', 'दवाएँ देखें →')}
              </button>
            </div>

            {medications.length > 0 ? (
              <div className="space-y-3">
                {medications.slice(0, 2).map((med) => (
                  <div
                    key={med.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {med.name} {med.dose}
                        </p>
                        {med.takenToday && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                            <CheckCircle2 size={10} />
                            <span>{L('Taken', 'ली गई')}</span>
                          </span>
                        )}
                        {med.skippedToday && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-medium">
                            <Clock size={10} />
                            <span>{L('Skipped', 'छोड़ी')}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{med.instructions}</p>
                      <p className="text-[11px] text-teal-800 font-semibold mt-1">
                        {L('Next dose: ', 'अगली खुराक: ')}{med.nextDose}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (med.takenToday) {
                            onMedicationStatusChange(med.id, 'reset')
                            toast(`Reset ${med.name} dose status`)
                          } else {
                            onMedicationStatusChange(med.id, 'taken')
                            toast(`Marked ${med.name} as taken today! Good job following doctor instructions.`, 'ok')
                          }
                        }}
                        className={cx(
                          'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer',
                          med.takenToday
                            ? 'bg-teal-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-800'
                        )}
                      >
                        {med.takenToday ? L('Undo', 'वापस') : L('Taken', 'ली गई')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (med.skippedToday) {
                            onMedicationStatusChange(med.id, 'reset')
                            toast(`Reset ${med.name} dose status`)
                          } else {
                            onMedicationStatusChange(med.id, 'skip')
                            toast(`Marked ${med.name} as skipped.`)
                          }
                        }}
                        className={cx(
                          'px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer',
                          med.skippedToday
                            ? 'bg-slate-300 text-slate-800'
                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                        )}
                      >
                        {L('Skip', 'छोड़ें')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 mb-1">
                  <Pill size={18} />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {L('No medications added yet', 'अभी तक कोई दवा नहीं जोड़ी गई')}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {L('Upload a prescription to start medication reminders.', 'दवा रिमाइंडर शुरू करने के लिए पर्चा अपलोड करें।')}
                </p>
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] text-slate-600 italic border-t border-slate-100 pt-3">
            {L('Always follow your doctor’s prescribed instructions.', 'हमेशा अपने डॉक्टर के निर्देशों का पालन करें।')}
          </p>
        </Card>
      </div>

      {/* SECTION 4: FOUR MAJOR HEALTH CONDITIONS OVERVIEW */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {L('My Health Conditions', 'मेरी स्वास्थ्य स्थितियाँ')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {L(
                'Tracked from your verified health records and clinical consultations',
                'आपके सत्यापित स्वास्थ्य रिकॉर्ड और क्लिनिकल परामर्श से ट्रैक किए गए क्षेत्र'
              )}
            </p>
          </div>
          <button
            onClick={() => go('conditions')}
            className="text-xs font-bold text-[#0f3057] hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            <span>{L('View all conditions →', 'सभी स्थितियाँ देखें →')}</span>
          </button>
        </div>

        {conditions.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-slate-200">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 mb-3">
              <Activity size={24} />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              {L('Your health profile is waiting for your first record.', 'आपकी स्वास्थ्य प्रोफ़ाइल आपके पहले रिकॉर्ड की प्रतीक्षा कर रही है।')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {L(
                'Upload a report or prescription to start building your health timeline.',
                'अपनी स्वास्थ्य टाइमलाइन शुरू करने के लिए रिपोर्ट या पर्चा अपलोड करें।'
              )}
            </p>
            <div className="mt-4 flex justify-center">
              <Btn sm onClick={() => go('documents')}>
                <FileText size={14} />
                <span>{L('Upload First Report', 'पहली रिपोर्ट अपलोड करें')}</span>
              </Btn>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {conditions.map((cond) => {
              const isAttention = cond.status === 'attention'
              const simpleDesc =
                cond.simpleExplanation ||
                (cond.id === 'diabetes'
                  ? 'Tracks your blood sugar levels.'
                  : cond.id === 'blood_pressure'
                  ? 'Tracks your blood pressure.'
                  : cond.id === 'heart'
                  ? 'Tracks heart rate and cholesterol.'
                  : 'Tracks kidney function.')

              const primaryLabel = cond.primaryMeasurementLabel || cond.keyMetrics[0]?.label || 'Latest reading'
              const primaryVal = cond.primaryMeasurementValue || cond.keyMetrics[0]?.value || '—'
              const primaryUnit = cond.primaryMeasurementUnit || cond.keyMetrics[0]?.unit || ''
              const plainStatusText = cond.plainStatus || cond.statusLabel

              return (
                <Card
                  key={cond.id}
                  className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-slate-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* 1. Condition Name & Accessible Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 border border-slate-200/60 shrink-0">
                        {cond.id === 'diabetes' && <Droplets size={20} className="text-teal-600" />}
                        {cond.id === 'blood_pressure' && <Activity size={20} className="text-sky-600" />}
                        {cond.id === 'heart' && <Heart size={20} className="text-rose-600" />}
                        {cond.id === 'kidney' && <FlaskConical size={20} className="text-violet-600" />}
                      </span>
                      <span
                        className={cx(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold',
                          isAttention
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-teal-100 text-teal-900 border border-teal-200'
                        )}
                      >
                        {isAttention ? (
                          <AlertCircle size={12} className="text-amber-700 shrink-0" />
                        ) : (
                          <CheckCircle2 size={12} className="text-teal-700 shrink-0" />
                        )}
                        <span>
                          {isAttention
                            ? L(`Needs attention · ${plainStatusText}`, `ध्यान दें · ${cond.plainStatusHi || plainStatusText}`)
                            : L(`Normal · ${plainStatusText}`, `सामान्य · ${cond.plainStatusHi || plainStatusText}`)}
                        </span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                        {L(cond.title, cond.titleHi)}
                      </h3>
                      {/* 2. Simple one-line explanation */}
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                        "{L(simpleDesc, cond.simpleExplanationHi || cond.subtitleHi)}"
                      </p>
                    </div>

                    {/* 3. Most important current measurement - Grounded in records */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {primaryLabel}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {L('From records', 'रिकॉर्ड से')}
                        </span>
                      </div>
                      <p className="font-display text-xl font-bold text-slate-900 mt-0.5">
                        {primaryVal} <span className="text-xs font-normal text-slate-500">{primaryUnit}</span>
                      </p>
                      <p className="mt-1 text-[10.5px] text-slate-500 flex items-center gap-1">
                        <Info size={11} className="text-slate-400 shrink-0" />
                        <span>
                          {isAttention
                            ? L('Outside lab reference interval', 'लैब संदर्भ सीमा से बाहर')
                            : L('Within standard laboratory range', 'मानक लैब सीमा के भीतर')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 5. Primary Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => go('chat', { prompt: `Tell me about my ${cond.title} readings.` })}
                      className="font-semibold text-violet-800 hover:text-violet-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>{L('Ask AI', 'AI से पूछें')}</span>
                    </button>
                    <button
                      onClick={() => go('conditions', { conditionId: cond.id })}
                      className="font-bold text-[#0f3057] hover:text-teal-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{L('View details →', 'विवरण देखें →')}</span>
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* SECTION 5: ASK HEALTHCOPILOT (Large Prominent Input Box) */}
      <section className="relative overflow-hidden rounded-[24px] border border-teal-200/80 bg-gradient-to-br from-teal-50/60 via-sky-50/30 to-white p-6 md:p-8 shadow-xs">
        <div className="max-w-2xl mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-600 text-white shadow-2xs">
              <Sparkles size={14} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              {L('Ask HealthCopilot', 'हेल्थ कॉपायलट से पूछें')}
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            {L('What would you like to know about your health?', 'आप अपने स्वास्थ्य के बारे में क्या जानना चाहते हैं?')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {L(
              'Get clear answers grounded in your reports, prescriptions, and health trajectory.',
              'अपनी रिपोर्ट और पर्चियों पर आधारित स्पष्ट उत्तर प्राप्त करें।'
            )}
          </p>
        </div>

        <form onSubmit={handleAskSubmit} className="relative flex items-center rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100 transition">
          <input
            type="text"
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            placeholder={L(
              'e.g. "Explain my latest blood test" or "Why is my glucose higher?"…',
              'उदा. "मेरी हालिया रक्त जाँच समझाएँ" या "मेरी शुगर क्यों बढ़ी है?"…'
            )}
            className="w-full h-14 pl-5 pr-44 text-sm md:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />

          <div className="absolute right-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => go('chat')}
              className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Mic size={14} className="text-teal-700" />
              <span className="hidden sm:inline">{L('Ask by voice', 'बोलकर पूछें')}</span>
            </button>
            <button
              type="submit"
              className="h-10 px-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>{L('Ask Copilot', 'पूछें')}</span>
              <Send size={13} />
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-600">{L('Quick questions:', 'त्वरित प्रश्न:')}</span>
          {[
            'Explain my latest report',
            'Explain my medicines',
            'Show my blood sugar trend',
            'What should I discuss with my doctor?',
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => go('chat', { prompt: q })}
              className="text-teal-800 hover:text-teal-950 hover:underline cursor-pointer"
            >
              "{q}"
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 6: RECENT HEALTH ACTIVITY */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {L('Recent Health Activity', 'हाल की स्वास्थ्य गतिविधियाँ')}
          </h2>
          <button onClick={() => go('timeline')} className="text-xs font-bold text-sky-800 hover:underline cursor-pointer">
            {L('Full Timeline →', 'पूरी टाइमलाइन →')}
          </button>
        </div>

        {displayActivities.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-slate-200">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
              <FolderOpen size={22} />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              {L('No health activity yet.', 'अभी तक कोई स्वास्थ्य गतिविधि नहीं है।')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {L(
                'Activity will appear after you upload or add health information, doctor visits, or prescriptions.',
                'जब आप स्वास्थ्य जानकारी, डॉक्टर परामर्श या पर्चा अपलोड करेंगे, तब गतिविधियाँ यहाँ दिखाई देंगी।'
              )}
            </p>
            <div className="mt-4 flex justify-center">
              <Btn sm onClick={() => go('documents')}>
                <FileText size={14} />
                <span>{L('Upload First Document', 'पहला दस्तावेज़ अपलोड करें')}</span>
              </Btn>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayActivities.map((act) => (
              <Card key={act.title} className="flex flex-wrap items-center gap-x-5 gap-y-2 p-4 transition-all hover:shadow-md">
                <span className="font-display text-sm font-bold text-slate-800 w-16 shrink-0">{act.date}</span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-700">
                  <act.icon size={18} />
                </span>
                <div className="min-w-[160px] flex-1">
                  <Eyebrow className="text-[10.5px]">{act.type}</Eyebrow>
                  <p className="font-bold text-sm text-slate-900">{act.title}</p>
                  <p className="text-xs text-slate-500">{act.note}</p>
                </div>
                <Badge s={act.s} />
                <Btn sm v="secondary" onClick={() => (act.type === 'Blood Test' ? go('summary') : go('timeline'))}>
                  {act.type === 'Blood Test' ? L('View report', 'रिपोर्ट देखें') : L('View details', 'विवरण देखें')}
                </Btn>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 7: DETAILED HEALTH EVIDENCE PIPELINE */}
      <Card className="overflow-hidden p-6 md:p-8 border-slate-200">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Eyebrow>{L('Health Data Integrity', 'स्वास्थ्य डेटा विश्वसनीयता')}</Eyebrow>
              <span className="px-2 py-0.2 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">
                {L('100% Traceable', '100% सत्यापन योग्य')}
              </span>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-900">
              {L('Where did this health value come from?', 'यह स्वास्थ्य मान कहाँ से आया?')}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {L(
                'Every value in your profile traces directly back to your original uploaded medical documents.',
                'आपकी प्रोफ़ाइल का हर मान सीधे आपके मूल अपलोड किए गए मेडिकल दस्तावेज़ों से जुड़ा है।'
              )}
            </p>
          </div>
          <button onClick={() => ev({ kind: 'cbc', region: 'hb' })} className="text-xs font-bold text-sky-800 hover:underline cursor-pointer">
            {L('Open document evidence →', 'दस्तावेज़ साक्ष्य खोलें →')}
          </button>
        </div>

        <div className="grid items-stretch gap-3 md:grid-cols-[1.1fr_auto_1fr_auto_1fr_auto_1fr]">
          {[
            {
              n: L('1 · Original Document', '1 · मूल दस्तावेज़'),
              sub: L('Uploaded paper scan', 'अपलोड किया गया स्कैन'),
              body: (
                <div className="relative h-24 overflow-hidden rounded-lg ring-1 ring-slate-200">
                  <div className="absolute left-0 top-0 w-[220%]" style={{ transform: 'translate(-12%, -34%)' }}>
                    <DocPaper kind="cbc" active="hb" tint={{ hb: 'verified' }} showAll={false} />
                  </div>
                </div>
              ),
            },
            {
              n: L('2 · Extracted Reading', '2 · पहचाना गया मान'),
              sub: L('OCR parameter matching', 'ओसीआर मिलान'),
              body: (
                <div className="grid h-24 content-center rounded-lg bg-slate-50 px-4">
                  <p className="text-xs text-slate-500 font-semibold">Hemoglobin</p>
                  <p className="font-display text-2xl font-bold text-slate-900">
                    10.8 <span className="text-sm font-normal text-slate-500">g/dL</span>
                  </p>
                  <p className="text-[10px] text-amber-700 font-medium">{L('Ref: 12.0 – 15.5 g/dL', 'सीमा: 12.0 – 15.5 g/dL')}</p>
                </div>
              ),
            },
            {
              n: L('3 · AI Confidence', '3 · सटीकता स्कोर'),
              sub: L('Validated against scan', 'स्कैन से पुष्टि'),
              body: (
                <div className="flex h-24 items-center gap-3 rounded-lg bg-slate-50 px-4">
                  <ConfRing value={97} size={52} />
                  <div>
                    <Badge s="verified" />
                    <p className="mt-1 text-[11px] text-slate-500">{L('97% high confidence', '97% उच्च सटीकता')}</p>
                  </div>
                </div>
              ),
            },
            {
              n: L('4 · Verified Record', '4 · सत्यापित रिकॉर्ड'),
              sub: L('Stored in Health Profile', 'प्रोफ़ाइल में सुरक्षित'),
              body: (
                <div className="grid h-24 content-center rounded-lg bg-teal-50/70 px-4 ring-1 ring-teal-100">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-teal-800">
                    <ShieldCheck size={15} />
                    {L('Added to Record', 'रिकॉर्ड में शामिल')}
                  </p>
                  <p className="mt-0.5 text-xs text-teal-700/80">Observation · 07 Oct 2026</p>
                </div>
              ),
            },
          ].map((s, i, a) => (
            <div key={s.n} className="contents">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{s.n}</p>
                <p className="mb-2 text-[10px] text-slate-400">{s.sub}</p>
                {s.body}
              </div>
              {i < a.length - 1 && (
                <div className="hidden items-center md:flex">
                  <ArrowRight size={16} className="mt-7 text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ================= Timeline ================= */
type Ev = {
  id: string
  month: string
  day: string
  type: 'report' | 'prescription' | 'visit'
  title: string
  sub: string
  s: StatusKey
  sl: string
  provider: string
  meds: string[]
  obs: string[]
  cond: string[]
  vals: [string, string, boolean?][]
  relatedConditionId?: string
}

const events: Ev[] = [
  {
    id: 'e1',
    month: 'October',
    day: '07',
    type: 'report',
    title: 'CBC Blood Test',
    sub: 'Meridian Diagnostics',
    s: 'attention',
    sl: '1 item needs attention',
    provider: 'Meridian Diagnostics · ref. Dr. R. Menon',
    meds: [],
    obs: ['Hemoglobin below the reference range shown on the report', 'Other counts within range'],
    cond: ['Anemia surveillance'],
    vals: [['Hemoglobin', '10.8 g/dL', true], ['WBC', '7.2 ×10³/µL'], ['Platelets', '245 ×10³/µL']],
    relatedConditionId: 'diabetes',
  },
  {
    id: 'e2',
    month: 'October',
    day: '04',
    type: 'prescription',
    title: 'Prescription',
    sub: '3 medications extracted',
    s: 'verified',
    sl: 'Verified',
    provider: 'Dr. R. Menon · Sunrise Family Clinic',
    meds: ['Amoxicillin 500 mg · twice daily · 5 days', 'Pantoprazole 40 mg · once daily', 'Vitamin D3 60,000 IU · weekly'],
    obs: ['Take Amoxicillin after meals', 'Complete 5-day cycle'],
    cond: ['Upper respiratory infection'],
    vals: [],
    relatedConditionId: 'kidney',
  },
  {
    id: 'e3',
    month: 'September',
    day: '28',
    type: 'visit',
    title: 'Doctor Visit',
    sub: 'Prescription uploaded',
    s: 'neutral',
    sl: 'Recorded',
    provider: 'Dr. R. Menon · Sunrise Family Clinic',
    meds: ['Pantoprazole 40 mg'],
    obs: ['Follow-up advised in 2 weeks', 'Normal cardiac rhythm'],
    cond: ['Acid reflux'],
    vals: [['Blood pressure', '118/76 mmHg'], ['Heart rate', '68 bpm'], ['Weight', '64 kg']],
    relatedConditionId: 'blood_pressure',
  },
  {
    id: 'e4',
    month: 'September',
    day: '12',
    type: 'visit',
    title: 'Discharge Summary',
    sub: 'Hospital visit recorded',
    s: 'neutral',
    sl: 'Recorded',
    provider: 'City General Hospital',
    meds: ['Paracetamol 650 mg · as needed'],
    obs: ['Admitted 2 days for observation', 'Discharged in stable condition'],
    cond: ['Viral fever'],
    vals: [['Temperature at discharge', '98.4 °F'], ['Creatinine', '0.9 mg/dL']],
    relatedConditionId: 'kidney',
  },
]

const filters = ['All', 'Reports', 'Prescriptions', 'Visits', 'Medications']
const evIcon = { report: FlaskConical, prescription: Pill, visit: Hospital }

export function Timeline({ onAskAi, onGoCondition }: { onAskAi?: (prompt: string) => void; onGoCondition?: (condId: string) => void }) {
  const [f, setF] = useState('All')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>('e1')
  const ev = useEvidence()
  const L = useL()

  const list = useMemo(
    () =>
      events.filter((e) => {
        const okF =
          f === 'All' ||
          (f === 'Reports' && e.type === 'report') ||
          (f === 'Prescriptions' && e.type === 'prescription') ||
          (f === 'Visits' && e.type === 'visit') ||
          (f === 'Medications' && e.meds.length > 0)
        const hay = JSON.stringify(e).toLowerCase()
        return okF && hay.includes(q.toLowerCase())
      }),
    [f, q],
  )
  const months = [...new Set(list.map((e) => e.month))]

  return (
    <div className="anim-fade-up mx-auto max-w-3xl">
      <PageHead
        title={L('Your Health Journey', 'आपकी स्वास्थ्य यात्रा')}
        sub={L(
          'Everything important from your medical records, organized chronologically with clickable source evidence.',
          'आपके मेडिकल रिकॉर्ड की हर ज़रूरी बात, तारीख़ के क्रम में और देखने योग्य साक्ष्यों के साथ।'
        )}
      />

      <div className="mb-8 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L('Search records by condition, medication, or doctor…', 'स्थिति, दवा या डॉक्टर के नाम से खोजें…')}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-[15px] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((x) => (
            <button
              key={x}
              onClick={() => setF(x)}
              className={cx(
                'h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-all cursor-pointer',
                f === x
                  ? 'bg-[#0f3057] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="grid place-items-center px-6 py-16 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-400">
            <Search size={22} strokeWidth={1.5} />
          </span>
          <p className="font-display text-lg font-semibold text-slate-800">{L('No matching records found', 'कोई मेल खाता रिकॉर्ड नहीं मिला')}</p>
          <p className="mt-1 text-sm text-slate-500">{L('Try adjusting your search query or filter.', 'खोज शब्द या फ़िल्टर बदलकर प्रयास करें।')}</p>
        </Card>
      ) : (
        <>
          <p className="mb-4 font-display text-[40px] font-bold leading-none tracking-tight text-slate-300">2026</p>
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
                        <span className={cx(
                          'grid h-8 w-8 place-items-center rounded-full bg-white ring-2',
                          e.s === 'attention' ? 'text-amber-600 ring-amber-300' : e.s === 'verified' ? 'text-teal-600 ring-teal-300' : 'text-slate-500 ring-slate-200'
                        )}>
                          <Icon size={14} strokeWidth={2} />
                        </span>
                      </div>
                      <Card className={cx('flex-1 overflow-hidden transition-shadow', isOpen && 'shadow-md')}>
                        <button
                          onClick={() => setOpen(isOpen ? null : e.id)}
                          className="flex w-full items-center gap-4 p-4 text-left md:px-5 cursor-pointer"
                        >
                          <span className="w-9 text-center font-display text-[26px] font-bold leading-none tabular-nums text-slate-900">
                            {e.day}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">{e.title}</p>
                            <p className="truncate text-xs text-slate-500">{e.sub}</p>
                          </div>
                          <Badge s={e.s} label={e.sl} className="hidden sm:inline-flex" />
                          <ChevronDown size={18} className={cx('shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                        </button>

                        {isOpen && (
                          <div className="anim-fade-up grid gap-5 border-t border-slate-100 bg-slate-50/50 p-5 text-xs sm:grid-cols-2">
                            <div>
                              <Eyebrow>{L('Document Type', 'दस्तावेज़ प्रकार')}</Eyebrow>
                              <p className="mt-1 font-semibold text-slate-900">{e.title}</p>
                            </div>
                            <div>
                              <Eyebrow>{L('Date Recorded', 'दर्ज की गई तारीख़')}</Eyebrow>
                              <p className="mt-1 font-semibold text-slate-900">{e.day} {e.month} 2026</p>
                            </div>
                            <div className="sm:col-span-2">
                              <Eyebrow>{L('Doctor / Facility', 'डॉक्टर / संस्थान')}</Eyebrow>
                              <p className="mt-1 font-medium text-slate-800">{e.provider}</p>
                            </div>

                            {e.vals.length > 0 && (
                              <div className="sm:col-span-2">
                                <Eyebrow className="mb-2">{L('Extracted Lab Values', 'निकाले गए लैब मान')}</Eyebrow>
                                <div className="flex flex-wrap gap-2">
                                  {e.vals.map(([k, v, flag]) => (
                                    <button
                                      key={k}
                                      onClick={() => flag && ev({ kind: 'cbc', region: 'hb' })}
                                      className={cx(
                                        'rounded-xl bg-white px-3.5 py-2 text-left ring-1 ring-inset',
                                        flag ? 'ring-amber-300 hover:bg-amber-50 cursor-pointer' : 'cursor-default ring-slate-200'
                                      )}
                                    >
                                      <span className="block text-[10px] text-slate-400">{k}</span>
                                      <span className="font-display text-[16px] font-bold text-slate-900">{v}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {e.meds.length > 0 && (
                              <div className="sm:col-span-2">
                                <Eyebrow>{L('Prescribed Medications', 'सुझाई गई दवाएँ')}</Eyebrow>
                                <ul className="mt-1.5 space-y-1">
                                  {e.meds.map((x) => (
                                    <li key={x} className="flex items-center gap-2 font-medium text-slate-800">
                                      <Pill size={12} className="text-teal-600" />
                                      <span>{x}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div>
                              <Eyebrow>{L('Clinical Observations', 'क्लिनिकल अवलोकन')}</Eyebrow>
                              <ul className="mt-1 space-y-1 text-slate-700">
                                {e.obs.map((x) => <li key={x}>· {x}</li>)}
                              </ul>
                            </div>

                            <div>
                              <Eyebrow>{L('Conditions Mentioned', 'उल्लेखित स्वास्थ्य स्थिति')}</Eyebrow>
                              <p className="mt-1 text-slate-700 font-medium">
                                {e.cond.length ? e.cond.join(', ') : L('None mentioned', 'कोई नहीं')}
                              </p>
                            </div>

                            {/* Action Buttons for this timeline event */}
                            <div className="flex flex-wrap gap-2 sm:col-span-2 pt-2 border-t border-slate-200/60">
                              <Btn
                                sm
                                v="secondary"
                                onClick={() =>
                                  ev({ kind: e.type === 'report' ? 'cbc' : 'rx', region: e.type === 'report' ? 'hb' : 'med1' })
                                }
                              >
                                <Link2 size={13} />
                                <span>{L('View Original Document', 'मूल दस्तावेज़ देखें')}</span>
                              </Btn>

                              {onAskAi && (
                                <Btn
                                  sm
                                  v="ai"
                                  onClick={() =>
                                    onAskAi(`Explain what this ${e.title} from ${e.day} ${e.month} indicates about my health.`)
                                  }
                                >
                                  <Sparkles size={13} />
                                  <span>{L('Ask AI About This Record', 'इस रिकॉर्ड के बारे में AI से पूछें')}</span>
                                </Btn>
                              )}
                            </div>
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
    ['Should I repeat this test in 4 to 6 weeks?', 'क्या मुझे 4 से 6 सप्ताह में यह जाँच दोबारा करानी चाहिए?'],
    ['Could recent antibiotic therapy or viral illness affect this result?', 'क्या हालिया एंटीबायोटिक या बुखार इस परिणाम को प्रभावित कर सकता है?'],
    ['What dietary iron sources paired with Vitamin C are best?', 'विटामिन सी के साथ कौन से आयरन युक्त खाद्य पदार्थ सबसे अच्छे हैं?'],
    ['Are there any symptoms I should monitor before my next visit?', 'अगली मुलाकात से पहले मुझे किन लक्षणों पर नज़र रखनी चाहिए?'],
  ]

  return (
    <div className="anim-fade-up mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2"><Badge s="ai" /></div>
      <PageHead
        title={L('Your Latest Health Report, Explained', 'आपकी नवीनतम स्वास्थ्य रिपोर्ट, आसान भाषा में')}
        sub={L('Plain language explanations grounded directly in your uploaded CBC test.', 'आपकी अपलोड की गई CBC टेस्ट रिपोर्ट पर आधारित सरल व्याख्या।')}
      />

      <div className="space-y-5">
        <Card className="p-6 md:p-8">
          <Eyebrow>{L("What was found", 'रिपोर्ट में क्या मिला')}</Eyebrow>
          <p className="mt-3 text-[17px] leading-relaxed text-slate-700">
            {L(
              'Your blood test (Complete Blood Count) from 07 Oct 2026 was processed. Four of five major parameters are normal. One value (Hemoglobin at 10.8 g/dL) is below the laboratory reference interval.',
              '07 अक्टूबर 2026 की रक्त जाँच (CBC) का विश्लेषण किया गया। 5 में से 4 मुख्य मापदंड सामान्य हैं। हीमोग्लोबिन (10.8 g/dL) प्रयोगशाला की संदर्भ सीमा से कम है।'
            )}
          </p>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-6 md:p-8">
            <Eyebrow>{L('Key Observation', 'मुख्य अवलोकन')}</Eyebrow>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-500">Hemoglobin</p>
                <p className="font-display text-[52px] font-bold leading-none tracking-tight text-slate-900">
                  10.8 <span className="text-xl font-normal text-slate-400">g/dL</span>
                </p>
                <p className="mt-2 text-xs text-slate-500">Reference range printed on report: 12.0 – 15.5 g/dL</p>
              </div>

              <div className="w-56">
                <div className="relative h-2 rounded-full bg-gradient-to-r from-amber-200 via-teal-200 to-teal-200">
                  <span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white bg-amber-500 shadow" style={{ left: '14%' }} />
                  <span className="absolute -top-0.5 h-3 rounded-sm border-x border-teal-600/40" style={{ left: '35%', width: '45%' }} />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>Lower</span><span>Reference</span><span>Higher</span>
                </div>
              </div>
            </div>

            <p className="mt-6 text-[17px] leading-relaxed text-slate-800">
              {L(
                'Your hemoglobin value is below the reference range shown on this report. This value may explain mild afternoon tiredness.',
                'इस रिपोर्ट में आपका हीमोग्लोबिन संदर्भ सीमा से कम है। यह मान दोपहर में हल्की थकान का कारण हो सकता है।'
              )}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3 text-xs md:px-8">
            <span className="flex items-center gap-2 text-slate-600 font-medium">
              <FileText size={14} /> CBC Report · 07 Oct 2026
            </span>
            <button
              onClick={() => ev({ kind: 'cbc', region: 'hb' })}
              className="inline-flex items-center gap-1 font-bold text-teal-800 hover:underline cursor-pointer"
            >
              <span>{L('See in original document', 'मूल दस्तावेज़ में देखें')}</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-slate-900">{L('What does hemoglobin do?', 'हीमोग्लोबिन क्या काम करता है?')}</h3>
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600">
              {L(
                'Hemoglobin is the oxygen-carrying protein inside red blood cells that delivers oxygen to body tissues. When it dips mildly below standard ranges, oxygen transport efficiency temporarily lessens.',
                'हीमोग्लोबिन लाल रक्त कोशिकाओं में मौजूद प्रोटीन है जो शरीर के सभी अंगों तक ऑक्सीजन पहुँचाता है। इसके हल्के कम होने से ऑक्सीजन परिवहन क्षमता कुछ समय के लिए घट जाती है।'
              )}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-slate-900">{L('Why might this happen?', 'ऐसा क्यों हो सकता है?')}</h3>
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600">
              {L(
                'Mild decreases can be linked to recent infection recovery, hydration changes, or dietary iron intake. A single test cannot show a cause, which is why clinical correlation with your doctor is essential.',
                'हाल ही में बुखार, संक्रमण से उबरने, या खान-पान में आयरन की कमी से यह स्तर हल्का गिर सकता है। एक रिपोर्ट से सटीक कारण नहीं पता चलता, इसलिए डॉक्टर से मिलना ज़रूरी है।'
              )}
            </p>
          </Card>
        </div>

        <Card className="p-6 md:p-8">
          <h3 className="font-display text-lg font-bold text-slate-900">
            {L('Recommended Questions for Dr. Menon', 'डॉ. मेनन से पूछने के लिए अनुशंसित सवाल')}
          </h3>
          <ul className="mt-4 divide-y divide-slate-100">
            {qs.map(([en, hi], i) => (
              <li key={en} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-50 text-[11px] font-bold text-teal-800">
                  {i + 1}
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{L(en, hi)}</p>
              </li>
            ))}
          </ul>
        </Card>

        <p className="flex items-start gap-2 px-1 text-xs text-slate-500 leading-relaxed">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-violet-500" />
          <span>
            {L(
              'HealthCopilot helps you understand your records. It does not diagnose diseases or prescribe treatment.',
              'HealthCopilot आपके रिकॉर्ड को समझने में मदद करता है। यह कोई बीमारी का निदान या उपचार नहीं बताता।'
            )}
          </span>
        </p>
      </div>
    </div>
  )
}

/* ================= Medications ================= */
export function Medications({
  medications,
  onMedicationStatusChange,
  onNavigate,
}: {
  medications: MedicationItem[]
  onMedicationStatusChange?: (id: string, action: 'taken' | 'skip' | 'reset') => void
  onNavigate?: (view: any) => void
}) {
  const ev = useEvidence()
  const L = useL()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'routine' | 'verify'>('all')
  const [locallyVerified, setLocallyVerified] = useState<Record<string, boolean>>({})

  // Compute verification status
  const isMedVerified = (m: MedicationItem) => {
    if (locallyVerified[m.id]) return true
    return m.conf >= 85 && !m.needsVerification
  }

  const verifiedCount = medications.filter(isMedVerified).length
  const needsVerificationCount = medications.filter((m) => !isMedVerified(m)).length

  // Filter groups without duplicating records
  const dueTodayMeds = useMemo(() => {
    return medications.filter(
      (m) =>
        isMedVerified(m) &&
        (m.nextDose?.toLowerCase().includes('today') ||
          m.nextDose?.toLowerCase().includes('pm') ||
          m.nextDose?.toLowerCase().includes('am'))
    )
  }, [medications, locallyVerified])

  const upcomingMeds = useMemo(() => {
    return medications.filter(
      (m) =>
        isMedVerified(m) &&
        !m.nextDose?.toLowerCase().includes('today')
    )
  }, [medications, locallyVerified])

  const needsVerificationMeds = useMemo(() => {
    return medications.filter((m) => !isMedVerified(m))
  }, [medications, locallyVerified])

  const displayedMeds = useMemo(() => {
    if (activeTab === 'due') return dueTodayMeds
    if (activeTab === 'routine') return upcomingMeds
    if (activeTab === 'verify') return needsVerificationMeds
    return medications
  }, [activeTab, medications, dueTodayMeds, upcomingMeds, needsVerificationMeds])

  const handleVerifyMedicine = (m: MedicationItem) => {
    ev({ kind: 'rx', region: m.rxRegion })
  }

  const handleConfirmVerified = (m: MedicationItem) => {
    setLocallyVerified((prev) => ({ ...prev, [m.id]: true }))
    toast(`Confirmed ${m.name} as verified from prescription.`, 'ok')
  }

  return (
    <div className="anim-fade-up mx-auto max-w-5xl space-y-6">
      {/* 1. Page Hierarchy */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <Pill size={14} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              {L('Prescription Management', 'प्रिस्क्रिप्शन प्रबंधन')}
            </span>
          </div>

          <h1 className="font-display text-[26px] sm:text-[32px] font-bold text-[#0b1b33] tracking-tight leading-tight">
            {L('Medications', 'दवाएँ')}
          </h1>

          <p className="mt-1 text-sm sm:text-[15px] text-slate-600">
            {L(
              'Your current medicines and instructions from your prescriptions.',
              'आपकी वर्तमान दवाएँ और आपकी पर्चियों से प्राप्त निर्देश।'
            )}
          </p>

          {/* Verification counts summary */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs">
              <CheckCircle2 size={13} className="text-teal-600" />
              <span>
                {verifiedCount} {L('verified from prescription', 'पर्चे से सत्यापित')}
              </span>
            </span>

            {needsVerificationCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                <AlertCircle size={13} className="text-amber-600" />
                <span>
                  {needsVerificationCount} {L('needs verification', 'पुष्टि की आवश्यकता')}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <Btn
              v="secondary"
              sm
              onClick={() => onNavigate('documents')}
              className="shadow-2xs"
            >
              <FileText size={14} />
              {L('View Prescriptions', 'पर्चियां देखें')}
            </Btn>
          )}
        </div>
      </div>

      {/* Verification Warning Alert (if any medicine needs verification) */}
      {needsVerificationCount > 0 && (
        <div className="flex items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 mt-0.5 sm:mt-0">
              <AlertCircle size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-amber-950">
                {L(
                  'One medicine from your 04 Oct prescription needs confirmation',
                  '04 अक्टूबर की पर्ची से एक दवा की पुष्टि आवश्यक है'
                )}
              </p>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {L(
                  'Handwriting in this region was partially unclear. It is kept unverified until you confirm against the original document.',
                  'लिखावट आंशिक रूप से अस्पष्ट थी। जब तक आप मूल दस्तावेज़ से पुष्टि नहीं करते, इसे असत्यापित रखा गया है।'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => ev({ kind: 'rx', region: 'med2' })}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            {L('Verify prescription', 'पर्चे की पुष्टि करें')}
          </button>
        </div>
      )}

      {/* 9. Medication grouping / filter tabs */}
      {medications.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/70 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cx(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap',
              activeTab === 'all'
                ? 'bg-[#0f3057] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            {L('All Medicines', 'सभी दवाएँ')} ({medications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('due')}
            className={cx(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap',
              activeTab === 'due'
                ? 'bg-[#0f3057] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            {L('Due Today', 'आज देय')} ({dueTodayMeds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routine')}
            className={cx(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap',
              activeTab === 'routine'
                ? 'bg-[#0f3057] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            {L('Upcoming / Routine', 'आगामी / नियमित')} ({upcomingMeds.length})
          </button>

          {needsVerificationCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('verify')}
              className={cx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1',
                activeTab === 'verify'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
              )}
            >
              <span>{L('Needs Verification', 'पुष्टि चाहिए')}</span>
              <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                {needsVerificationCount}
              </span>
            </button>
          )}
        </div>
      )}

      {/* 10. Empty state */}
      {medications.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center space-y-3 bg-white">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            <Pill size={24} />
          </span>
          <h3 className="font-display text-lg font-bold text-slate-900">
            {L('No medicines recorded yet.', 'अभी तक कोई दवा दर्ज नहीं है।')}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {L(
              'Medicines from your uploaded prescriptions will appear here.',
              'आपकी अपलोड की गई पर्चियों से दवाएँ यहाँ दिखाई देंगी।'
            )}
          </p>
          {onNavigate && (
            <div className="pt-2">
              <Btn onClick={() => onNavigate('documents')}>
                <FileText size={15} />
                {L('Upload Doctor Prescription', 'डॉक्टर का पर्चा अपलोड करें')}
              </Btn>
            </div>
          )}
        </div>
      ) : (
        /* 2. Medication Cards Grid */
        <div className="grid gap-4 sm:grid-cols-2">
          {displayedMeds.map((m) => {
            const verified = isMedVerified(m)

            return (
              <Card
                key={m.id}
                className={cx(
                  'p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between border',
                  verified
                    ? 'border-slate-200/90 bg-white'
                    : 'border-amber-200 bg-amber-50/20 ring-1 ring-amber-200/50'
                )}
              >
                <div>
                  {/* Top: 1. Medicine Name & Dose + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={cx(
                          'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                          verified
                            ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-100'
                            : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                        )}
                      >
                        <Pill size={20} strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-[18px] sm:text-[19px] font-bold text-slate-900 leading-tight truncate">
                          {m.name}
                        </h3>
                        {/* 2. Dose */}
                        <p className="text-xs font-bold text-teal-800 mt-0.5">
                          {L('Dose:', 'खुराक:')} <span className="text-slate-900 font-extrabold">{m.dose}</span>
                        </p>
                      </div>
                    </div>

                    {/* Verification Status Badge */}
                    <div className="shrink-0">
                      {verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 border border-teal-200">
                          <CheckCircle2 size={12} className="text-teal-600" />
                          <span>{L('Verified', 'सत्यापित')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 border border-amber-300">
                          <AlertCircle size={12} className="text-amber-700" />
                          <span>{L('Needs verification', 'पुष्टि चाहिए')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. What it is for (when safely available from existing data) */}
                  {m.purpose && (
                    <div className="mt-2.5 text-xs text-slate-600 flex items-baseline gap-1.5">
                      <span className="font-semibold text-slate-700 shrink-0">
                        {L('What it is for:', 'किसलिए:')}
                      </span>
                      <span className="text-slate-800 font-medium leading-relaxed">
                        {L(m.purpose, m.purposeHi || m.purpose)}
                      </span>
                    </div>
                  )}

                  {/* 4. When to take it (Instruction) */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      {L('When to take', 'कब लेना है')}
                    </span>
                    <p className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                      {L(m.instructions, m.instructionsHi || m.instructions)}
                    </p>
                  </div>

                  {/* 5. Next Dose Reminder Box */}
                  <div
                    className={cx(
                      'mt-3 p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2.5 transition',
                      m.takenToday
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : m.skippedToday
                        ? 'bg-slate-100 border-slate-200 text-slate-800'
                        : 'bg-teal-50/60 border-teal-200 text-teal-950'
                    )}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                        {m.takenToday
                          ? L('TAKEN TODAY', 'आज ले ली गई')
                          : m.skippedToday
                          ? L('SKIPPED TODAY', 'आज छोड़ दी गई')
                          : L('NEXT DOSE', 'अगली खुराक')}
                      </span>
                      <p className="font-bold text-sm mt-0.5 flex items-center gap-1.5">
                        {m.takenToday ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            <span>{m.nextDose || 'Recorded for today'}</span>
                          </>
                        ) : m.skippedToday ? (
                          <>
                            <Clock size={14} className="text-slate-500 shrink-0" />
                            <span>{L('Dose marked as skipped', 'खुराक छोड़ दी गई')}</span>
                          </>
                        ) : (
                          <>
                            <Clock size={14} className="text-teal-600 shrink-0" />
                            <span>{m.nextDose || 'As prescribed'}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* 4. Interactive Taken / Skip Actions (min 44px touch targets) */}
                    {verified ? (
                      onMedicationStatusChange && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {m.takenToday ? (
                            <button
                              type="button"
                              onClick={() => {
                                onMedicationStatusChange(m.id, 'reset')
                                toast(`Reset ${m.name} dose status`)
                              }}
                              className="h-9 px-3 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition cursor-pointer shadow-2xs"
                            >
                              {L('Undo / Change', 'बदलें')}
                            </button>
                          ) : m.skippedToday ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onMedicationStatusChange(m.id, 'reset')
                                  toast(`Reset ${m.name} dose status`)
                                }}
                                className="h-9 px-2.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                              >
                                {L('Undo / Change', 'बदलें')}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onMedicationStatusChange(m.id, 'taken')
                                  toast(`Marked ${m.name} as taken!`, 'ok')
                                }}
                                className="h-9 px-3 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition cursor-pointer shadow-xs"
                              >
                                {L('Mark Taken', 'ली गई चिह्नित करें')}
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Taken = Primary Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  onMedicationStatusChange(m.id, 'taken')
                                  toast(`Marked ${m.name} dose as taken!`, 'ok')
                                }}
                                className="h-9 px-3.5 rounded-lg text-xs font-bold bg-[#0f3057] hover:bg-[#0b2444] text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <Check size={13} strokeWidth={2.5} />
                                <span>{L('Taken', 'ली गई')}</span>
                              </button>

                              {/* Skip = Secondary Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  onMedicationStatusChange(m.id, 'skip')
                                  toast(`Recorded ${m.name} as skipped for today.`)
                                }}
                                className="h-9 px-2.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 transition cursor-pointer shadow-2xs"
                              >
                                {L('Skip', 'छोड़ें')}
                              </button>
                            </>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleVerifyMedicine(m)}
                          className="h-9 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-xs"
                        >
                          {L('Verify medicine', 'दवा की पुष्टि करें')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Small readable labels: Dose, Frequency, Duration */}
                  <dl className="mt-3.5 grid grid-cols-3 gap-2.5 text-xs border-t border-slate-100 pt-3">
                    <div>
                      <Eyebrow className="text-[10px]">{L('Dose', 'खुराक')}</Eyebrow>
                      <dd className="mt-0.5 font-bold text-slate-800">{m.dose}</dd>
                    </div>
                    <div>
                      <Eyebrow className="text-[10px]">{L('Frequency', 'आवृत्ति')}</Eyebrow>
                      <dd className="mt-0.5 font-semibold text-slate-800">
                        {L(m.frequency, m.frequencyHi || m.frequency)}
                      </dd>
                    </div>
                    <div>
                      <Eyebrow className="text-[10px]">{L('Duration', 'अवधि')}</Eyebrow>
                      <dd className="mt-0.5 font-semibold text-slate-800">
                        {m.dur || m.duration || 'As prescribed'}
                      </dd>
                    </div>
                  </dl>

                  {/* 6. Unclear Handwriting Context if unverified */}
                  {!verified && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                      <p className="leading-relaxed">
                        {L(
                          m.verificationReason ||
                            'This medicine was extracted from the prescription, but part of the handwriting was unclear.',
                          'यह दवा पर्चे से निकाली गई थी, लेकिन लिखावट का कुछ हिस्सा अस्पष्ट था।'
                        )}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleVerifyMedicine(m)}
                          className="text-xs font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
                        >
                          {L('Inspect prescription handwriting ↗', 'पर्चे की लिखावट देखें ↗')}
                        </button>
                        <span className="text-amber-400">·</span>
                        <button
                          type="button"
                          onClick={() => handleConfirmVerified(m)}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                        >
                          {L('Confirm as verified', 'सत्यापित चिह्नित करें')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: 6. OCR Confidence & 7. Source Document */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-slate-600">
                      {verified
                        ? L('Verified from prescription', 'पर्चे से सत्यापित')
                        : L('Needs verification', 'पुष्टि चाहिए')}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[10.5px] font-semibold text-slate-700">
                      {m.conf}% {L('confidence', 'सटीकता')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => ev({ kind: 'rx', region: m.rxRegion })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-800 text-xs font-semibold transition cursor-pointer shadow-2xs"
                  >
                    <FileText size={12} className="text-teal-600" />
                    <span>{L('View prescription', 'पर्चा देखें')}</span>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* 8. Safety Disclaimer */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-center">
        <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium">
          🛡️{' '}
          {L(
            'Always follow your doctor’s prescribed instructions. Do not change doses without clinical guidance.',
            'हमेशा अपने डॉक्टर के निर्देशों का पालन करें। बिना सलाह के खुराक न बदलें।'
          )}
        </p>
      </div>
    </div>
  )
}

/* ================= Profile ================= */
export function Profile({
  user,
  onLogout,
  onUpdateUser,
}: {
  user?: UserHealthProfile
  onLogout?: () => void
  onUpdateUser?: (updated: UserHealthProfile) => void
}) {
  const L = useL()
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || 'Alex Rao',
    age: user?.age || '34',
    gender: user?.gender || 'Male',
    height: user?.height || '178',
    heightUnit: user?.heightUnit || 'cm',
    weight: user?.weight || '68',
    weightUnit: user?.weightUnit || 'kg',
    bloodGroup: user?.bloodGroup || 'O+',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !onUpdateUser) return
    const updated: UserHealthProfile = {
      ...user,
      name: formData.name,
      avatarChar: formData.name.charAt(0).toUpperCase(),
      age: formData.age,
      gender: formData.gender,
      height: formData.height,
      heightUnit: formData.heightUnit,
      weight: formData.weight,
      weightUnit: formData.weightUnit,
      bloodGroup: formData.bloodGroup,
    }
    onUpdateUser(updated)
    setIsEditing(false)
    toast('Profile updated successfully!', 'ok')
  }

  const res = [
    ['Patient', 'Demographics, identifiers', 1],
    ['MedicationRequest', 'Structured medication entries', 4],
    ['Observation', 'Laboratory & vital measurements', 18],
    ['Condition', 'Tracked health condition profiles', 4],
    ['DiagnosticReport', 'Verified documents & summaries', 4],
  ] as const

  return (
    <div className="anim-fade-up mx-auto max-w-5xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHead
          title={L('Health Profile', 'स्वास्थ्य प्रोफ़ाइल')}
          sub={L(
            'Your personal health metrics and interoperable health data architecture.',
            'आपकी व्यक्तिगत स्वास्थ्य जानकारी और अंतर-संचालनीय स्वास्थ्य संरचना।'
          )}
        />
        {onLogout && (
          <Btn v="secondary" sm onClick={onLogout} className="text-slate-600 hover:text-rose-600">
            {L('Sign Out', 'साइन आउट')}
          </Btn>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 space-y-4 anim-fade-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {L('Edit Personal Details', 'व्यक्तिगत जानकारी संपादित करें')}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {L('Full Name', 'पूरा नाम')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {L('Age (Years)', 'उम्र (वर्ष)')}
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {L('Gender', 'लिंग')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {L('Height (cm)', 'ऊँचाई (सेमी)')}
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {L('Weight (kg)', 'वज़न (किग्रा)')}
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {L('Blood Group', 'रक्त समूह')}
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <Btn v="secondary" className="flex-1" onClick={() => setIsEditing(false)}>
                  {L('Cancel', 'रद्द करें')}
                </Btn>
                <Btn className="flex-1" type="submit">
                  <Save size={14} />
                  <span>{L('Save Changes', 'बदलाव सहेजें')}</span>
                </Btn>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Main Profile Details */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-teal-500 font-display text-2xl font-bold text-white shadow-xs">
                {user?.avatarChar || 'A'}
              </span>
              <div>
                <p className="font-display text-xl font-bold text-slate-900">{user?.name || 'Alex Rao'}</p>
                <p className="text-xs text-slate-500">{user?.email || 'alex.rao@email.com'}</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 size={13} />
              <span>{L('Edit', 'संपादित करें')}</span>
            </button>
          </div>

          <Eyebrow className="mb-3">{L('Personal Health Baseline', 'व्यक्तिगत स्वास्थ्य माप')}</Eyebrow>
          <dl className="divide-y divide-slate-100 text-xs">
            {[
              ['Age', `${user?.age || '34'} years`],
              ['Gender', user?.gender || 'Male'],
              ['Height', `${user?.height || '178'} ${user?.heightUnit || 'cm'}`],
              ['Weight', `${user?.weight || '68'} ${user?.weightUnit || 'kg'}`],
              ['Blood Group', user?.bloodGroup || 'O+'],
              ['Health ID (ABHA mock)', user?.abhaId || '91-4820-1928-3341'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5">
                <dt className="text-slate-500 font-medium">{k}</dt>
                <dd className="font-bold text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-6">
          <Eyebrow className="mb-3">{L('Health Record Statistics', 'स्वास्थ्य रिकॉर्ड आँकड़े')}</Eyebrow>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Health Conditions', '4', Activity],
              ['Prescribed Meds', '4', Pill],
              ['Lab Observations', '18', FlaskConical],
              ['Verified Reports', '4', FileText],
            ].map(([k, v, I]) => {
              const Icon = I as typeof Pill
              return (
                <div key={k as string} className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <Icon size={16} className="text-teal-700" />
                  <p className="mt-2 font-display text-2xl font-bold tabular-nums text-slate-900">{v as string}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{k as string}</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* TECHNICAL HEALTH DATA ARCHITECTURE (Moved lower on the page and clearly labeled) */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#0b1b33] p-6 text-white md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-400/15 px-2.5 py-0.5 text-[11px] font-bold text-teal-300 ring-1 ring-inset ring-teal-300/30">
                Technical Architecture Demo
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
              {L('Technical Health Data Architecture', 'तकनीकी स्वास्थ्य डेटा संरचना')}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {L(
                'FHIR-aligned data model and ABDM-ready interoperability framework representation.',
                'FHIR-अनुरूप डेटा मॉडल और ABDM-सक्षम अंतर-संचालनीय ढाँचा।'
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <ol className="space-y-1">
            {[
              [FileText, 'Document Ingestion (OCR / Parser)'],
              [Database, 'Structured Observations Layer'],
              [Layers, 'FHIR-Aligned Resource Representation'],
              [ShieldCheck, 'ABDM-Ready Interoperability Layer'],
            ].map(([I, t], i, a) => {
              const Icon = I as typeof FileText
              return (
                <li key={t as string}>
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 text-xs">
                    <Icon size={15} className="text-teal-300 shrink-0" />
                    <span className="font-semibold text-slate-200">{t as string}</span>
                  </div>
                  {i < a.length - 1 && <ArrowDown size={13} className="mx-auto my-1 text-slate-500" />}
                </li>
              )
            })}
          </ol>

          <div className="space-y-2">
            {res.map(([n, d, c]) => (
              <div key={n} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10 text-xs">
                <div>
                  <p className="font-mono text-xs text-sky-200 font-semibold">{n}</p>
                  <p className="text-[11px] text-slate-400">{d}</p>
                </div>
                <span className="font-display text-lg font-bold tabular-nums text-teal-300">{c}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-[11px] text-slate-400">
          <Info size={13} className="shrink-0" />
          <span>
            {L(
              'Architectural design demonstration prepared for ABDM interoperability standards. This represents an architecture demo, not an active government ABDM gateway connection.',
              'ABDM मानकों के लिए तैयार की गई तकनीकी संरचना। यह आर्किटेक्चर डेमो है, सक्रिय सरकारी गेटवे नहीं।'
            )}
          </span>
        </p>
      </section>
    </div>
  )
}
