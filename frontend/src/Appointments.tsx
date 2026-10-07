import { useState, useMemo, useEffect } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  Bell,
  BellOff,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Search,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  FileText,
  Video,
  Check,
  CalendarClock,
  Sparkles,
} from 'lucide-react'
import { Card, Eyebrow, cx, useL, useToast } from './ui'
import type { Doctor, Appointment } from './types'

interface AppointmentsProps {
  doctors: Doctor[]
  appointments: Appointment[]
  onBookAppointment: (appointment: Omit<Appointment, 'id'>) => void
  onCancelAppointment: (id: string) => void
  onToggleReminder: (id: string) => void
  onDeleteAppointment?: (id: string) => void
  initialSpecialtyFilter?: string
}

const SPECIALTY_OPTIONS = [
  { id: 'all', label: 'All Specialties', labelHi: 'सभी विशेषज्ञता', match: '' },
  { id: 'cardiology', label: 'Cardiology & Internal Medicine', labelHi: 'हृदय रोग एवं सामान्य चिकित्सा', match: 'Cardiology' },
  { id: 'diabetes', label: 'Diabetes & Endocrinology', labelHi: 'डायबिटीज व हार्मोन विशेषज्ञता', match: 'Diabetes' },
  { id: 'nephrology', label: 'Nephrology & Renal Care', labelHi: 'किडनी एवं रीनल केयर', match: 'Nephrology' },
  { id: 'family', label: 'General Family Medicine', labelHi: 'सामान्य पारिवारिक चिकित्सा', match: 'Family' },
]

// Standard time options for quick picker
const PRESET_TIMES = [
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:30 PM',
  '5:00 PM',
  '5:30 PM',
]

// Convert a time string like "10:30 AM" or "2:30 PM" to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const clean = timeStr.trim().toUpperCase()
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/)
  if (!match) return 600 // fallback 10:00 AM
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const modifier = match[3]
  if (modifier === 'PM' && hours < 12) hours += 12
  if (modifier === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

// Convert minutes from midnight back to 12-hour formatted time "10:30 AM"
function formatMinutesToTime(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`
}

// Dynamic date generator relative to today (Requirement 10)
export function getRelativeDayInfo(offsetDays: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(0, 0, 0, 0)

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayOfWeek = dayNames[d.getDay()]
  const dayNum = d.getDate()
  const month = monthNames[d.getMonth()]
  const year = d.getFullYear()

  let relativeLabel = dayOfWeek
  if (offsetDays === 0) relativeLabel = 'Today'
  else if (offsetDays === 1) relativeLabel = 'Tomorrow'

  const isoStr = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
  const dateStr = `${relativeLabel} · ${dayNum} ${month}`

  return {
    date: d,
    isoStr,
    relativeLabel,
    dayOfWeek,
    dayNum,
    month,
    dateStr,
  }
}

// Format an ISO date string like "2026-10-08" into dynamic relative date string (Requirement 10)
export function formatDynamicDateString(isoOrDateStr: string): string {
  if (!isoOrDateStr) return ''

  // If it's already an ISO date YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDateStr)) {
    const [y, m, d] = isoOrDateStr.split('-').map(Number)
    const target = new Date(y, m - 1, d)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const dayOfWeek = dayNames[target.getDay()]
    const dayNum = target.getDate()
    const month = monthNames[target.getMonth()]

    let label = dayOfWeek
    if (diffDays === 0) label = 'Today'
    else if (diffDays === 1) label = 'Tomorrow'

    return `${label} · ${dayNum} ${month}`
  }

  // If it's a legacy string like "Tomorrow · 8 Oct" or "Friday · 10 Oct"
  return isoOrDateStr
}

export function Appointments({
  doctors,
  appointments,
  onBookAppointment,
  onCancelAppointment,
  onToggleReminder,
  onDeleteAppointment,
  initialSpecialtyFilter = 'All',
}: AppointmentsProps) {
  const L = useL()
  const toast = useToast()

  // 1. Dynamic Dates for the week (Requirement 10)
  const dynamicDays = useMemo(() => {
    return [
      getRelativeDayInfo(0), // Today
      getRelativeDayInfo(1), // Tomorrow
      getRelativeDayInfo(2), // Day after
      getRelativeDayInfo(3),
      getRelativeDayInfo(4),
      getRelativeDayInfo(5),
    ]
  }, [])

  // 2. Dynamic Doctors schedule (attaches dynamic date labels matching requirement 10)
  const scheduledDoctors: Doctor[] = useMemo(() => {
    return doctors.map((doc) => {
      // Map availableDates to dynamic relative days
      let dynamicDates = doc.availableDates.map((ad, idx) => {
        // Match with dynamic days by index or keep structured
        const targetDay = dynamicDays[idx < dynamicDays.length ? idx : 0]
        return {
          dateStr: targetDay.dateStr,
          displayDay: targetDay.relativeLabel,
          slots: ad.slots,
        }
      })

      // Ensure Dr. Menon has tomorrow as first slot
      if (doc.id === 'doc-menon') {
        dynamicDates = [
          { dateStr: dynamicDays[1].dateStr, displayDay: dynamicDays[1].relativeLabel, slots: ['10:00 AM', '10:30 AM', '11:30 AM', '2:30 PM', '4:00 PM'] },
          { dateStr: dynamicDays[3].dateStr, displayDay: dynamicDays[3].relativeLabel, slots: ['9:30 AM', '10:00 AM', '11:00 AM', '3:00 PM'] },
          { dateStr: dynamicDays[5].dateStr, displayDay: dynamicDays[5].relativeLabel, slots: ['10:00 AM', '11:30 AM', '2:00 PM', '4:30 PM'] },
        ]
      } else if (doc.id === 'doc-sen') {
        dynamicDates = [
          { dateStr: dynamicDays[1].dateStr, displayDay: dynamicDays[1].relativeLabel, slots: ['11:00 AM', '11:45 AM', '3:30 PM', '5:00 PM'] },
          { dateStr: dynamicDays[2].dateStr, displayDay: dynamicDays[2].relativeLabel, slots: ['9:30 AM', '10:30 AM', '2:00 PM'] },
          { dateStr: dynamicDays[4].dateStr, displayDay: dynamicDays[4].relativeLabel, slots: ['10:00 AM', '11:00 AM', '12:00 PM'] },
        ]
      } else if (doc.id === 'doc-mehta') {
        dynamicDates = [
          { dateStr: dynamicDays[2].dateStr, displayDay: dynamicDays[2].relativeLabel, slots: ['10:00 AM', '11:30 AM', '3:00 PM'] },
          { dateStr: dynamicDays[3].dateStr, displayDay: dynamicDays[3].relativeLabel, slots: ['9:00 AM', '10:30 AM', '12:00 PM', '4:00 PM'] },
        ]
      } else if (doc.id === 'doc-verma') {
        dynamicDates = [
          { dateStr: dynamicDays[0].dateStr, displayDay: dynamicDays[0].relativeLabel, slots: ['3:30 PM', '4:30 PM', '5:30 PM'] },
          { dateStr: dynamicDays[1].dateStr, displayDay: dynamicDays[1].relativeLabel, slots: ['9:00 AM', '10:00 AM', '11:30 AM', '2:00 PM'] },
        ]
      }

      return {
        ...doc,
        availableDates: dynamicDates,
      }
    })
  }, [doctors, dynamicDays])

  // 3. Find a Doctor Search Preferences (Requirement 2 & 13)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(() => {
    if (initialSpecialtyFilter && initialSpecialtyFilter !== 'All') {
      const match = SPECIALTY_OPTIONS.find((s) =>
        s.label.toLowerCase().includes(initialSpecialtyFilter.toLowerCase()) ||
        (s.match && initialSpecialtyFilter.toLowerCase().includes(s.match.toLowerCase()))
      )
      return match ? match.label : initialSpecialtyFilter
    }
    return 'All Specialties'
  })

  // Preferred Date: default to Tomorrow (offset 1) or Today
  const [preferredDateStr, setPreferredDateStr] = useState<string>(dynamicDays[1].dateStr)
  // Preferred Time: default to 10:30 AM
  const [preferredTime, setPreferredTime] = useState<string>('10:30 AM')
  // Consultation Type preference: 'any' | 'in-person' | 'online'
  const [preferredMode, setPreferredMode] = useState<'any' | 'in-person' | 'online'>('any')
  // Optional text search
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Sync initialSpecialtyFilter when passed from Health Conditions (Requirement 12)
  useEffect(() => {
    if (initialSpecialtyFilter && initialSpecialtyFilter !== 'All') {
      const match = SPECIALTY_OPTIONS.find((s) =>
        s.label.toLowerCase().includes(initialSpecialtyFilter.toLowerCase()) ||
        (s.match && initialSpecialtyFilter.toLowerCase().includes(s.match.toLowerCase()))
      )
      const nextSpecialty = match ? match.label : initialSpecialtyFilter
      setSelectedSpecialty(nextSpecialty)

      // Smooth scroll to search section
      setTimeout(() => {
        const el = document.getElementById('find-doctor-section')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [initialSpecialtyFilter])

  // 4. Appointments filter tab (Upcoming, All, Cancelled) (Requirement 8)
  const [appointmentsTab, setAppointmentsTab] = useState<'upcoming' | 'all'>('upcoming')

  // Modals & Flows
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false)
  const [bookingStep, setBookingStep] = useState<1 | 2>(1) // Step 1: Slot & Type, Step 2: Confirm
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)
  const [bookingDateStr, setBookingDateStr] = useState<string>('')
  const [bookingSlot, setBookingSlot] = useState<string>('')
  const [bookingMode, setBookingMode] = useState<'in-person' | 'online'>('in-person')
  const [visitReason, setVisitReason] = useState<string>('Follow-up on recent lab reports and prescription')

  // Reschedule tracking
  const [reschedulingAptId, setReschedulingAptId] = useState<string | null>(null)

  // Confirmation modal state (Requirement 7)
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null)

  // View appointment detail modal
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null)

  // Cancel confirmation modal
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)

  // 5. Categorized appointments (Requirement 8)
  const upcomingAppointments = useMemo(() => {
    return appointments.filter((a) => a.status === 'confirmed' || a.status === 'requested')
  }, [appointments])

  const displayedAppointments = useMemo(() => {
    if (appointmentsTab === 'upcoming') {
      return upcomingAppointments
    }
    return appointments
  }, [appointments, appointmentsTab, upcomingAppointments])

  // 6. Match Doctors based on Search Preferences (Requirements 3 & 4)
  const requestedTimeMinutes = useMemo(() => parseTimeToMinutes(preferredTime), [preferredTime])

  const doctorSearchResults = useMemo(() => {
    return scheduledDoctors
      .filter((doc) => {
        // Specialty match
        if (selectedSpecialty !== 'All Specialties' && selectedSpecialty !== 'All') {
          const opt = SPECIALTY_OPTIONS.find((s) => s.label === selectedSpecialty)
          const searchTerm = opt?.match || selectedSpecialty
          if (!doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false
          }
        }
        // Name/Clinic search match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matches =
            doc.name.toLowerCase().includes(q) ||
            doc.specialty.toLowerCase().includes(q) ||
            doc.clinic.toLowerCase().includes(q)
          if (!matches) return false
        }
        return true
      })
      .map((doc) => {
        // Find slots on the preferred date (or first available date if preferred date has no slots)
        const dateMatch = doc.availableDates.find((ad) => ad.dateStr === preferredDateStr)
        const activeDateObj = dateMatch || doc.availableDates[0]
        const slots = activeDateObj ? activeDateObj.slots : []

        // Check if exact time match exists
        const exactMatchSlot = slots.find((s) => s === preferredTime)

        // Find nearest slot before and nearest slot after requested time
        let nearestBefore: { slot: string; diffMins: number } | null = null
        let nearestAfter: { slot: string; diffMins: number } | null = null

        slots.forEach((s) => {
          const slotMin = parseTimeToMinutes(s)
          const diff = slotMin - requestedTimeMinutes
          if (diff < 0) {
            // Before
            const absDiff = Math.abs(diff)
            if (!nearestBefore || absDiff < nearestBefore.diffMins) {
              nearestBefore = { slot: s, diffMins: absDiff }
            }
          } else if (diff > 0) {
            // After
            if (!nearestAfter || diff < nearestAfter.diffMins) {
              nearestAfter = { slot: s, diffMins: diff }
            }
          }
        })

        // Minimum distance to requested time (in minutes) for sorting
        let minDiff = exactMatchSlot ? 0 : 9999
        if (!exactMatchSlot) {
          const bDiff = nearestBefore ? (nearestBefore as { diffMins: number }).diffMins : 9999
          const aDiff = nearestAfter ? (nearestAfter as { diffMins: number }).diffMins : 9999
          minDiff = Math.min(bDiff, aDiff)
        }

        return {
          doctor: doc,
          activeDate: activeDateObj,
          hasExactMatch: Boolean(exactMatchSlot),
          exactSlot: exactMatchSlot || null,
          nearestBefore: nearestBefore ? (nearestBefore as { slot: string; diffMins: number }).slot : null,
          nearestAfter: nearestAfter ? (nearestAfter as { slot: string; diffMins: number }).slot : null,
          minDiff,
          slots,
        }
      })
      .sort((a, b) => {
        // Sort doctors available at or closest to requested time (Requirement 3)
        return a.minDiff - b.minDiff
      })
  }, [scheduledDoctors, selectedSpecialty, searchQuery, preferredDateStr, preferredTime, requestedTimeMinutes])

  // Is there ANY doctor with an exact match at preferred time? (Requirement 4)
  const anyExactMatchFound = useMemo(() => {
    return doctorSearchResults.some((r) => r.hasExactMatch)
  }, [doctorSearchResults])

  // Start booking flow for a doctor (Requirement 6)
  const handleStartBooking = (
    doctor: Doctor,
    preselectedDate?: string,
    preselectedSlot?: string,
    mode?: 'in-person' | 'online'
  ) => {
    setBookingDoctor(doctor)
    setBookingMode(mode || (preferredMode === 'online' ? 'online' : 'in-person'))

    // Pick date
    const dateToUse = preselectedDate || preferredDateStr || doctor.availableDates[0]?.dateStr || ''
    setBookingDateStr(dateToUse)

    // Pick slot
    if (preselectedSlot) {
      setBookingSlot(preselectedSlot)
      setBookingStep(2) // Jump directly to Review & Confirm
    } else {
      const matchDateObj = doctor.availableDates.find((ad) => ad.dateStr === dateToUse)
      const firstSlot = matchDateObj?.slots[0] || doctor.availableDates[0]?.slots[0] || '10:00 AM'
      setBookingSlot(firstSlot)
      setBookingStep(1)
    }

    setShowBookingModal(true)
  }

  // Reschedule flow
  const handleStartReschedule = (apt: Appointment) => {
    setViewingAppointment(null)
    setReschedulingAptId(apt.id)
    const matchedDoctor = scheduledDoctors.find((d) => d.id === apt.doctorId) || scheduledDoctors[0]
    handleStartBooking(matchedDoctor, apt.date, undefined, apt.consultationType || 'in-person')
  }

  // Confirm booking (Requirement 7)
  const handleConfirmBooking = () => {
    if (!bookingDoctor || !bookingDateStr || !bookingSlot) return

    // If this was a reschedule, cancel previous appointment
    if (reschedulingAptId) {
      onCancelAppointment(reschedulingAptId)
      setReschedulingAptId(null)
    }

    const newApt: Omit<Appointment, 'id'> = {
      doctorId: bookingDoctor.id,
      doctorName: bookingDoctor.name,
      specialty: bookingDoctor.specialty,
      specialtyHi: bookingDoctor.specialtyHi,
      clinic: bookingDoctor.clinic,
      date: bookingDateStr,
      time: bookingSlot,
      status: 'confirmed',
      hasReminder: true,
      consultationType: bookingMode,
      location:
        bookingMode === 'in-person'
          ? `${bookingDoctor.clinic} · ${bookingDoctor.clinicAddress}`
          : 'HealthCopilot Telehealth Room (Meeting link sent via SMS/WhatsApp)',
      notes: visitReason.trim() || 'General health consultation',
    }

    onBookAppointment(newApt)
    setShowBookingModal(false)

    const confirmedObj: Appointment = {
      id: `apt-${Date.now()}`,
      ...newApt,
    }
    setConfirmedBooking(confirmedObj)
    toast(
      L(
        `Appointment confirmed with ${bookingDoctor.name}! Added to reminders.`,
        `${bookingDoctor.name} के साथ अपॉइंटमेंट पुष्ट! रिमाइंडर में जोड़ा गया।`
      ),
      'ok'
    )
  }

  // Cancel appointment execution
  const handleExecuteCancel = () => {
    if (!appointmentToCancel) return
    onCancelAppointment(appointmentToCancel.id)
    setViewingAppointment(null)
    toast(
      L(
        `Cancelled appointment with ${appointmentToCancel.doctorName}.`,
        `${appointmentToCancel.doctorName} के साथ अपॉइंटमेंट रद्द की गई।`
      )
    )
    setAppointmentToCancel(null)
  }

  return (
    <div className="anim-fade-up mx-auto max-w-5xl space-y-8">
      {/* 1. Page Header & Hierarchy */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <Stethoscope size={14} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              {L('Doctor Consultations', 'डॉक्टर परामर्श')}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <ShieldCheck size={12} className="text-teal-600" />
            <span>{L('Verified Demo Doctors', 'सत्यापित डेमो डॉक्टर')}</span>
          </span>
        </div>

        <h1 className="font-display text-[26px] sm:text-[32px] font-bold text-[#0b1b33] tracking-tight leading-tight">
          {L('Doctor Appointments', 'डॉक्टर अपॉइंटमेंट्स')}
        </h1>

        <p className="mt-1 text-sm sm:text-[15px] text-slate-600">
          {L(
            'Find a doctor, choose a convenient time, and manage your appointments.',
            'एक डॉक्टर खोजें, सुविधाजनक समय चुनें, और अपनी अपॉइंटमेंट्स प्रबंधित करें।'
          )}
        </p>
      </div>

      {/* 2. UPCOMING APPOINTMENTS SECTION (Requirements 8, 9, 10) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-teal-600" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
              {L('Your Upcoming Appointments', 'आपकी आगामी अपॉइंटमेंट्स')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {appointments.length > 0 && (
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAppointmentsTab('upcoming')}
                  className={cx(
                    'px-3 py-1 rounded-lg transition cursor-pointer',
                    appointmentsTab === 'upcoming'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {L('Active', 'सक्रिय')} ({upcomingAppointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentsTab('all')}
                  className={cx(
                    'px-3 py-1 rounded-lg transition cursor-pointer',
                    appointmentsTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {L('All Records', 'सभी रिकॉर्ड')} ({appointments.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Displayed Appointments Cards or Friendly Empty State (Requirement 9) */}
        {displayedAppointments.length > 0 ? (
          <div className="space-y-3">
            {displayedAppointments.map((apt) => {
              const isConfirmed = apt.status === 'confirmed'
              const isRequested = apt.status === 'requested'
              const isCancelled = apt.status === 'cancelled'
              const isCompleted = apt.status === 'completed'

              return (
                <Card
                  key={apt.id}
                  className={cx(
                    'p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white shadow-xs transition',
                    isConfirmed && 'border-l-4 border-l-teal-600',
                    isRequested && 'border-l-4 border-l-sky-500',
                    isCancelled && 'border-l-4 border-l-rose-400 opacity-90',
                    isCompleted && 'border-l-4 border-l-slate-400 opacity-80'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={cx(
                        'grid h-12 w-12 place-items-center rounded-2xl shrink-0 ring-1',
                        isCancelled
                          ? 'bg-rose-50 text-rose-600 ring-rose-100'
                          : 'bg-teal-50 text-teal-700 ring-teal-100'
                      )}
                    >
                      {apt.consultationType === 'online' ? (
                        <Video size={22} />
                      ) : (
                        <Stethoscope size={22} />
                      )}
                    </span>
                    <div>
                      {/* Status & Schedule Badges (Requirement 8) */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1">
                          <CalendarClock size={12} className="text-slate-500" />
                          <span>{apt.date} · {apt.time}</span>
                        </span>

                        {/* Status Label with Text & Icon */}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>{L('Confirmed', 'पुष्ट')}</span>
                          </span>
                        )}
                        {isRequested && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[11px] font-bold border border-sky-200">
                            <Clock size={12} className="text-sky-600" />
                            <span>{L('Requested', 'प्रतीक्षारत')}</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                            <X size={12} className="text-rose-600" />
                            <span>{L('Cancelled', 'रद्द')}</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                            <Check size={12} className="text-slate-600" />
                            <span>{L('Completed', 'पूर्ण')}</span>
                          </span>
                        )}

                        {/* Consultation Type Badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[11px] font-medium border border-slate-200">
                          {apt.consultationType === 'online' ? (
                            <>
                              <Video size={11} className="text-teal-600" />
                              <span>{L('Online Video', 'ऑनलाइन वीडियो')}</span>
                            </>
                          ) : (
                            <>
                              <MapPin size={11} className="text-slate-500" />
                              <span>{L('In-person Clinic', 'क्लिनिक विज़िट')}</span>
                            </>
                          )}
                        </span>

                        {/* Reminder Badge */}
                        {apt.hasReminder && !isCancelled && !isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                            <Bell size={11} className="text-amber-600" />
                            <span>{L('Reminder active', 'रिमाइंडर सक्रिय')}</span>
                          </span>
                        )}
                      </div>

                      {/* Doctor Name, Specialty, Clinic */}
                      <h3 className="font-display text-[19px] font-bold text-slate-900 mt-2">
                        {apt.doctorName}
                      </h3>
                      <p className="text-xs font-semibold text-teal-800">
                        {L(apt.specialty, apt.specialtyHi)}
                      </p>

                      <p className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
                        {apt.consultationType === 'online' ? (
                          <>
                            <Video size={13} className="text-teal-600 shrink-0" />
                            <span>{apt.location || L('Online Video Consultation', 'ऑनलाइन वीडियो परामर्श')}</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span>{apt.clinic}</span>
                          </>
                        )}
                      </p>

                      {apt.notes && (
                        <p className="mt-2 text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xl">
                          "{apt.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for this appointment */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => setViewingAppointment(apt)}
                      className="h-10 px-4 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <span>{L('View appointment', 'अपॉइंटमेंट देखें')}</span>
                      <ChevronRight size={14} />
                    </button>

                    {/* Active Appointment Controls */}
                    {!isCancelled && !isCompleted ? (
                      <>
                        {/* Reminder Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            onToggleReminder(apt.id)
                            toast(
                              apt.hasReminder
                                ? L('Reminder turned off', 'रिमाइंडर बंद कर दिया')
                                : L('Reminder turned on', 'रिमाइंडर चालू कर दिया'),
                              'ok'
                            )
                          }}
                          title={apt.hasReminder ? 'Mute reminder' : 'Set reminder'}
                          className={cx(
                            'h-10 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer',
                            apt.hasReminder
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          {apt.hasReminder ? <Bell size={14} /> : <BellOff size={14} />}
                          <span>
                            {apt.hasReminder
                              ? L('Reminder On', 'रिमाइंडर चालू')
                              : L('Reminder Off', 'रिमाइंडर बंद')}
                          </span>
                        </button>

                        {/* Reschedule Action (Requirement 8) */}
                        <button
                          type="button"
                          onClick={() => handleStartReschedule(apt)}
                          className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw size={13} />
                          <span>{L('Reschedule', 'पुनर्निर्धारित')}</span>
                        </button>

                        {/* Cancel Action (Requirement 8) */}
                        <button
                          type="button"
                          onClick={() => setAppointmentToCancel(apt)}
                          className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                        >
                          {L('Cancel', 'रद्द करें')}
                        </button>
                      </>
                    ) : isCancelled ? (
                      /* Cancelled Re-book button */
                      <button
                        type="button"
                        onClick={() => {
                          const doc = scheduledDoctors.find((d) => d.id === apt.doctorId) || scheduledDoctors[0]
                          handleStartBooking(doc)
                        }}
                        className="h-10 px-3 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold transition cursor-pointer"
                      >
                        {L('Book again', 'पुनः बुक करें')}
                      </button>
                    ) : (
                      /* Completed Follow-up button */
                      <button
                        type="button"
                        onClick={() => {
                          const doc = scheduledDoctors.find((d) => d.id === apt.doctorId) || scheduledDoctors[0]
                          handleStartBooking(doc)
                        }}
                        className="h-10 px-3 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold transition cursor-pointer"
                      >
                        {L('Book follow-up', 'फॉलो-अप बुक करें')}
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Exact required empty state (Requirement 9) */
          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-9 text-center space-y-3 shadow-2xs">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <Calendar size={22} />
            </span>
            <h3 className="font-display text-lg font-bold text-slate-900">
              {L('No upcoming appointments', 'कोई आगामी अपॉइंटमेंट नहीं है')}
            </h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              {L('Book an appointment when you need one.', 'जब आपको आवश्यकता हो तब अपॉइंटमेंट बुक करें।')}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('find-doctor-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Search size={14} />
                <span>{L('Find a doctor', 'डॉक्टर खोजें')}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. "FIND A DOCTOR" SEARCH FLOW (Requirements 2, 3, 4, 13) */}
      <section id="find-doctor-section" className="space-y-5 pt-2">
        <div className="rounded-2xl bg-gradient-to-br from-teal-50/70 via-white to-sky-50/60 p-5 sm:p-6 border border-teal-100 shadow-2xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-600 text-white shadow-2xs">
                  <Search size={13} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                  {L('Simple Doctor Finder', 'सरल डॉक्टर खोज')}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                {L('When do you want to see a doctor?', 'आप डॉक्टर से कब मिलना चाहते हैं?')}
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-600 mt-0.5">
                {L(
                  'Choose your specialty, preferred date, and time. We will show doctors available at or closest to your requested time.',
                  'अपनी पसंद की विशेषज्ञता, तारीख और समय चुनें। हम आपके समय के सबसे करीब उपलब्ध डॉक्टरों को दिखाएंगे।'
                )}
              </p>
            </div>

            {/* Reset search button */}
            <button
              type="button"
              onClick={() => {
                setSelectedSpecialty('All Specialties')
                setPreferredDateStr(dynamicDays[1].dateStr)
                setPreferredTime('10:30 AM')
                setPreferredMode('any')
                setSearchQuery('')
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
            >
              <RotateCcw size={12} />
              <span>{L('Reset', 'रीसेट')}</span>
            </button>
          </div>

          {/* Search Preference Controls (Requirement 2 & 13) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            {/* 1. Specialty Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {L('1. Required Specialty', '1. विशेषज्ञता चुनें')}
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-100 cursor-pointer"
              >
                {SPECIALTY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.label}>
                    {L(opt.label, opt.labelHi)}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Preferred Date Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {L('2. Preferred Date', '2. पसंदीदा तारीख')}
              </label>
              <select
                value={preferredDateStr}
                onChange={(e) => setPreferredDateStr(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-100 cursor-pointer"
              >
                {dynamicDays.map((d) => (
                  <option key={d.dateStr} value={d.dateStr}>
                    {d.dateStr} ({d.dayOfWeek})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Preferred Time Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {L('3. Preferred Time', '3. पसंदीदा समय')}
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-100 cursor-pointer"
              >
                {PRESET_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Consultation Type (Online or In-person) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {L('4. Consultation Mode', '4. परामर्श का प्रकार')}
              </label>
              <select
                value={preferredMode}
                onChange={(e) => setPreferredMode(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-100 cursor-pointer"
              >
                <option value="any">{L('Any Mode (Clinic or Online)', 'कोई भी (क्लिनिक या ऑनलाइन)')}</option>
                <option value="in-person">{L('In-person Clinic Consultation', 'व्यक्तिगत क्लिनिक परामर्श')}</option>
                <option value="online">{L('Online Video Consultation', 'ऑनलाइन वीडियो परामर्श')}</option>
              </select>
            </div>
          </div>

          {/* Quick Date and Time Pills for non-technical users */}
          <div className="space-y-2 pt-1 border-t border-teal-100/70">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">
                {L('Quick Time Suggestions:', 'त्वरित समय विकल्प:')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['10:00 AM', '10:30 AM', '11:30 AM', '2:30 PM', '4:30 PM'].map((timeChip) => (
                  <button
                    key={timeChip}
                    type="button"
                    onClick={() => setPreferredTime(timeChip)}
                    className={cx(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer',
                      preferredTime === timeChip
                        ? 'bg-[#0f3057] text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {timeChip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. TIME AVAILABILITY ALERT (Requirement 4) */}
        {!anyExactMatchFound && doctorSearchResults.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-2xs">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertCircle size={18} />
            </span>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-amber-900">
                {L('No doctors are available at this exact time.', 'इस सटीक समय पर कोई डॉक्टर उपलब्ध नहीं है।')}
              </h4>
              <p className="text-xs sm:text-[13px] text-amber-800 leading-relaxed">
                {L(
                  `None of the specialists have an opening at ${preferredTime} on ${preferredDateStr}. Below are the nearest available slots before and after your requested time. Click any slot to book.`,
                  `${preferredDateStr} को ${preferredTime} पर कोई स्लॉट खाली नहीं है। नीचे आपके अनुरोधित समय के ठीक पहले और बाद के निकटतम उपलब्ध स्लॉट दिखाए गए हैं। बुक करने के लिए किसी भी स्लॉट पर क्लिक करें।`
                )}
              </p>
            </div>
          </div>
        )}

        {/* 5. DOCTOR CARDS LIST (Requirement 5) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold text-slate-900">
              {L('Available Doctors', 'उपलब्ध डॉक्टर')} ({doctorSearchResults.length})
            </h3>
            <span className="text-xs text-slate-500">
              {L(
                `Sorted by closest time to ${preferredTime}`,
                `${preferredTime} के निकटतम समय अनुसार`
              )}
            </span>
          </div>

          {doctorSearchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {doctorSearchResults.map((result) => {
                const doc = result.doctor
                const activeDate = result.activeDate
                const isOnlinePreferred = preferredMode === 'online'

                return (
                  <Card
                    key={doc.id}
                    className="p-5 sm:p-6 transition-all duration-200 hover:shadow-md border-slate-200/90 flex flex-col justify-between bg-white"
                  >
                    <div>
                      {/* Doctor Name, Specialty, Experience, Rating (Requirement 5) */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white font-display text-lg font-bold shadow-xs shrink-0">
                            {doc.avatarChar}
                          </span>
                          <div>
                            <h4 className="font-display text-[18px] sm:text-[19px] font-bold text-slate-900 leading-snug">
                              {doc.name}
                            </h4>
                            <p className="text-xs font-semibold text-teal-800">
                              {L(doc.specialty, doc.specialtyHi)}
                            </p>
                            <p className="text-[11px] text-slate-500">{doc.experience}</p>
                          </div>
                        </div>

                        <span className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-xs font-semibold text-amber-800 shrink-0">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{doc.rating}</span>
                        </span>
                      </div>

                      {/* Location & Consultation Mode (Requirement 5) */}
                      <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <MapPin size={13} className="text-teal-600 shrink-0" />
                            <span>{doc.clinic}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {isOnlinePreferred
                              ? L('Online Video Available', 'ऑनलाइन वीडियो उपलब्ध')
                              : L('In-person & Online', 'क्लिनिक व ऑनलाइन')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-5">{doc.clinicAddress}</p>
                      </div>

                      {/* Available Date & Closest Slot Display (Requirements 4 & 5) */}
                      <div className="mt-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Calendar size={13} className="text-teal-600" />
                            <span>{activeDate?.dateStr || preferredDateStr}</span>
                          </span>
                          {result.hasExactMatch ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              <span>{L('Exact Time Available', 'सटीक समय उपलब्ध')}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500">
                              {L('Closest available slots:', 'निकटतम उपलब्ध समय:')}
                            </span>
                          )}
                        </div>

                        {/* Nearest Before / After Highlight (Requirement 4) */}
                        {!result.hasExactMatch && (result.nearestBefore || result.nearestAfter) && (
                          <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-xs flex flex-wrap gap-2 items-center">
                            {result.nearestBefore && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartBooking(doc, activeDate?.dateStr, result.nearestBefore || undefined)
                                }
                                className="h-7 px-2.5 rounded-lg bg-white border border-teal-300 text-teal-900 font-bold hover:bg-teal-600 hover:text-white transition cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                              >
                                <span>{result.nearestBefore}</span>
                                <span className="text-[10px] font-normal opacity-80">
                                  ({L('Before', 'पहले')})
                                </span>
                              </button>
                            )}
                            {result.nearestAfter && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartBooking(doc, activeDate?.dateStr, result.nearestAfter || undefined)
                                }
                                className="h-7 px-2.5 rounded-lg bg-white border border-teal-300 text-teal-900 font-bold hover:bg-teal-600 hover:text-white transition cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                              >
                                <span>{result.nearestAfter}</span>
                                <span className="text-[10px] font-normal opacity-80">
                                  ({L('After', 'बाद में')})
                                </span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* All Selectable Slots for this Doctor */}
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                            {L('All available slots:', 'सभी उपलब्ध स्लॉट:')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.slots.map((slot) => {
                              const isExact = slot === preferredTime
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleStartBooking(doc, activeDate?.dateStr, slot)}
                                  className={cx(
                                    'h-8 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1',
                                    isExact
                                      ? 'bg-teal-600 text-white hover:bg-teal-700 ring-2 ring-teal-600/30'
                                      : 'bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-800 hover:text-teal-900'
                                  )}
                                >
                                  {isExact && <Check size={12} />}
                                  <span>{slot}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Book Button (Requirement 5) */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {preferredMode === 'online'
                          ? L('Online Video Consultation', 'ऑनलाइन वीडियो परामर्श')
                          : L('In-person Clinic Consultation', 'क्लिनिक परामर्श')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartBooking(doc, activeDate?.dateStr)}
                        className="h-9 px-4 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <span>{L('Book Doctor', 'डॉक्टर बुक करें')}</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                {L('No doctors found matching your filter.', 'आपके फ़िल्टर से मेल खाता कोई डॉक्टर नहीं मिला।')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSpecialty('All Specialties')
                  setSearchQuery('')
                }}
                className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
              >
                {L('Reset filters', 'फ़िल्टर रीसेट करें')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Safety Notice & Demo Disclaimer (Requirement 14) */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-center">
        <p className="text-xs text-slate-600 leading-relaxed">
          🔒{' '}
          {L(
            'HealthCopilot connects you with licensed doctors. For acute medical emergencies, please dial 112 or visit an emergency room immediately.',
            'HealthCopilot आपको प्रमाणित डॉक्टरों से जोड़ता है। आपातकालीन स्थिति में तुरंत 112 पर कॉल करें।'
          )}
        </p>
      </div>

      {/* 6. BOOKING FLOW MODAL (Step 1: Slot & Type -> Step 2: Confirm) (Requirements 6 & 13) */}
      {showBookingModal && bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="max-w-lg w-full p-6 space-y-5 anim-fade-up max-h-[92vh] overflow-y-auto bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  {bookingStep === 1
                    ? L('Step 1 of 2: Select Slot & Type', 'चरण 1/2: समय और प्रकार चुनें')
                    : L('Step 2 of 2: Review & Confirm', 'चरण 2/2: समीक्षा व पुष्टि')}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                  {bookingDoctor.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: Select Available Slot & Consultation Type */}
            {bookingStep === 1 && (
              <div className="space-y-4">
                {/* Doctor Summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                  <p className="font-bold text-slate-800">{bookingDoctor.specialty}</p>
                  <p className="text-slate-600 mt-0.5">{bookingDoctor.clinic}</p>
                </div>

                {/* Consultation Mode Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {L('Consultation Type', 'परामर्श का प्रकार')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingMode('in-person')}
                      className={cx(
                        'p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5',
                        bookingMode === 'in-person'
                          ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <MapPin size={18} className="text-teal-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">{L('In-person Clinic', 'क्लिनिक विज़िट')}</p>
                        <p className="text-[11px] text-slate-500 font-normal">
                          {L('Visit doctor at clinic', 'क्लिनिक में मिलें')}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingMode('online')}
                      className={cx(
                        'p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5',
                        bookingMode === 'online'
                          ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <Video size={18} className="text-teal-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">{L('Online Video', 'ऑनलाइन वीडियो')}</p>
                        <p className="text-[11px] text-slate-500 font-normal">
                          {L('Telehealth consultation', 'घर बैठे वीडियो कॉल')}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {L('Select Available Date', 'उपलब्ध तारीख चुनें')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {bookingDoctor.availableDates.map((ad) => {
                      const isSelected = bookingDateStr === ad.dateStr
                      return (
                        <button
                          key={ad.dateStr}
                          type="button"
                          onClick={() => {
                            setBookingDateStr(ad.dateStr)
                            setBookingSlot(ad.slots[0] || '')
                          }}
                          className={cx(
                            'p-2.5 rounded-xl border text-left transition text-xs font-semibold cursor-pointer',
                            isSelected
                              ? 'border-teal-600 bg-teal-50 text-teal-950 ring-2 ring-teal-600/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <p className="font-bold">{ad.displayDay}</p>
                          <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                            {ad.dateStr.split('·')[1]?.trim() || ad.dateStr}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Slot Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {L('Choose Available Time', 'उपलब्ध समय चुनें')}
                  </label>
                  {(() => {
                    const currentSlots =
                      bookingDoctor.availableDates.find((ad) => ad.dateStr === bookingDateStr)?.slots ||
                      bookingDoctor.availableDates[0]?.slots ||
                      []
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {currentSlots.map((time) => {
                          const isSelected = bookingSlot === time
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setBookingSlot(time)}
                              className={cx(
                                'h-11 px-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer flex items-center justify-center',
                                isSelected
                                  ? 'bg-[#0f3057] text-white border-[#0f3057] shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                              )}
                            >
                              {time}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Reason Context */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {L('Reason for Visit (Optional)', 'विज़िट का कारण (वैकल्पिक)')}
                  </label>
                  <textarea
                    rows={2}
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    placeholder="e.g. Discuss CBC report results and ongoing medications"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-100"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 h-11 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {L('Cancel', 'रद्द करें')}
                  </button>
                  <button
                    type="button"
                    disabled={!bookingSlot}
                    onClick={() => setBookingStep(2)}
                    className="flex-1 h-11 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>{L('Continue to Review', 'समीक्षा पर आगे बढ़ें')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Review & Confirm */}
            {bookingStep === 2 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-3 border-b border-teal-100/80 pb-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-600 text-white font-bold text-base">
                      {bookingDoctor.avatarChar}
                    </span>
                    <div>
                      <h4 className="font-display font-bold text-slate-900 text-base">
                        {bookingDoctor.name}
                      </h4>
                      <p className="text-xs text-teal-800 font-medium">{bookingDoctor.specialty}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500">{L('Date & Time:', 'दिनांक और समय:')}</span>
                      <span className="font-bold text-slate-900 text-right">
                        {bookingDateStr} at {bookingSlot}
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-slate-500">{L('Consultation Type:', 'परामर्श प्रकार:')}</span>
                      <span className="font-bold text-teal-900 text-right">
                        {bookingMode === 'online'
                          ? L('Online Video Consultation', 'ऑनलाइन वीडियो परामर्श')
                          : L('In-person Clinic Consultation', 'व्यक्तिगत क्लिनिक परामर्श')}
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-slate-500">{L('Location:', 'स्थान:')}</span>
                      <span className="font-medium text-slate-800 text-right max-w-[220px]">
                        {bookingMode === 'online'
                          ? L('Secure Video Room (Link sent via SMS/WhatsApp)', 'सुरक्षित वीडियो लिंक (SMS/व्हाट्सएप द्वारा)')
                          : `${bookingDoctor.clinic} · ${bookingDoctor.clinicAddress}`}
                      </span>
                    </div>

                    <div className="flex items-start justify-between border-t border-teal-100/80 pt-2">
                      <span className="text-slate-500">{L('Reason for Visit:', 'विज़िट कारण:')}</span>
                      <span className="font-medium text-slate-800 text-right max-w-[220px] italic">
                        "{visitReason}"
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>{L('Back', 'पीछे')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    className="flex-1 h-11 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} />
                    <span>{L(`Confirm Booking for ${bookingSlot}`, `${bookingSlot} बुक करें`)}</span>
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 7. BOOKING CONFIRMATION MODAL (Requirement 7) */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 text-center space-y-4 anim-fade-up border-teal-200 bg-white shadow-2xl">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600 ring-4 ring-teal-100">
              <CheckCircle2 size={32} />
            </span>

            <div>
              <Eyebrow className="text-teal-800">{L('Appointment Confirmed', 'अपॉइंटमेंट पुष्ट')}</Eyebrow>
              <h3 className="font-display text-2xl font-bold text-slate-900 mt-1">
                {confirmedBooking.doctorName}
              </h3>
              <p className="text-xs text-teal-800 font-semibold">{confirmedBooking.specialty}</p>
            </div>

            {/* Confirmation Details (Requirement 7) */}
            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2.5 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{L('Doctor:', 'डॉक्टर:')}</span>
                <span className="font-bold text-slate-900">{confirmedBooking.doctorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{L('Date & Time:', 'दिनांक और समय:')}</span>
                <span className="font-bold text-slate-900 text-sm">
                  {confirmedBooking.date} · {confirmedBooking.time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{L('Specialty:', 'विशेषज्ञता:')}</span>
                <span className="font-medium text-slate-800">{confirmedBooking.specialty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{L('Consultation Type:', 'परामर्श प्रकार:')}</span>
                <span className="font-bold text-teal-900">
                  {confirmedBooking.consultationType === 'online'
                    ? L('Online Video Consultation', 'ऑनलाइन वीडियो परामर्श')
                    : L('In-person Clinic Consultation', 'व्यक्तिगत क्लिनिक परामर्श')}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500">{L('Location/Meeting Info:', 'स्थान/मीटिंग जानकारी:')}</span>
                <span className="font-medium text-slate-800 text-right max-w-[200px]">
                  {confirmedBooking.location || confirmedBooking.clinic}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">{L('Notification Reminder:', 'नोटिफिकेशन रिमाइंडर:')}</span>
                <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  <Bell size={11} className="text-teal-600" />
                  <span>{L('Active in notifications', 'नोटिफिकेशन सक्रिय')}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setViewingAppointment(confirmedBooking)
                  setConfirmedBooking(null)
                }}
                className="w-full h-11 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {L('View appointment details', 'अपॉइंटमेंट विवरण देखें')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmedBooking(null)}
                className="w-full h-10 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {L('Done', 'पूर्ण')}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* 8. APPOINTMENT DETAIL MODAL */}
      {viewingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 space-y-5 anim-fade-up bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span
                  className={cx(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                    viewingAppointment.status === 'confirmed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : viewingAppointment.status === 'requested'
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  )}
                >
                  <CheckCircle2 size={12} />
                  <span>
                    {viewingAppointment.status === 'confirmed'
                      ? L('Confirmed Appointment', 'पुष्ट अपॉइंटमेंट')
                      : viewingAppointment.status === 'requested'
                      ? L('Requested Appointment', 'प्रतीक्षारत अपॉइंटमेंट')
                      : L('Cancelled Appointment', 'रद्द अपॉइंटमेंट')}
                  </span>
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {viewingAppointment.doctorName}
                </h3>
                <p className="text-xs text-teal-800 font-medium">{viewingAppointment.specialty}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-800 block">
                    {L('Date & Time', 'परामर्श समय')}
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {viewingAppointment.date} · {viewingAppointment.time}
                  </p>
                </div>
                <Calendar size={20} className="text-teal-600" />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block">
                  {L('Consultation Type & Location', 'परामर्श प्रकार व स्थान')}
                </span>
                <p className="font-bold text-slate-900">
                  {viewingAppointment.consultationType === 'online'
                    ? L('Online Video Consultation', 'ऑनलाइन वीडियो परामर्श')
                    : L('In-person Clinic Consultation', 'क्लिनिक परामर्श')}
                </p>
                <p className="text-slate-600">
                  {viewingAppointment.location || viewingAppointment.clinic}
                </p>
              </div>

              {viewingAppointment.notes && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block">
                    {L('Reason for Visit', 'विज़िट कारण')}
                  </span>
                  <p className="text-slate-800 leading-relaxed italic">
                    "{viewingAppointment.notes}"
                  </p>
                </div>
              )}

              {/* Reminder Toggle */}
              {viewingAppointment.status !== 'cancelled' && (
                <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell
                      size={15}
                      className={viewingAppointment.hasReminder ? 'text-amber-600' : 'text-slate-400'}
                    />
                    <div>
                      <span className="font-bold text-slate-800">
                        {viewingAppointment.hasReminder
                          ? L('Reminder active', 'रिमाइंडर सक्रिय')
                          : L('No reminder', 'कोई रिमाइंडर नहीं')}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {viewingAppointment.date} at {viewingAppointment.time}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleReminder(viewingAppointment.id)
                      setViewingAppointment((prev) =>
                        prev ? { ...prev, hasReminder: !prev.hasReminder } : null
                      )
                    }}
                    className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
                  >
                    {viewingAppointment.hasReminder ? L('Turn off', 'बंद करें') : L('Turn on', 'चालू करें')}
                  </button>
                </div>
              )}
            </div>

            {/* Actions: Reschedule & Cancel (Requirement 8) */}
            {viewingAppointment.status !== 'cancelled' ? (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleStartReschedule(viewingAppointment)}
                  className="w-full h-11 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>{L('Reschedule appointment', 'अपॉइंटमेंट पुनर्निर्धारित करें')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppointmentToCancel(viewingAppointment)}
                  className="w-full h-10 rounded-xl border border-slate-200 hover:border-rose-300 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  {L('Cancel appointment', 'अपॉइंटमेंट रद्द करें')}
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const doc = scheduledDoctors.find((d) => d.id === viewingAppointment.doctorId) || scheduledDoctors[0]
                    setViewingAppointment(null)
                    handleStartBooking(doc)
                  }}
                  className="w-full h-11 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>{L('Book again with this doctor', 'इस डॉक्टर के साथ पुनः बुक करें')}</span>
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 9. CANCELLATION CONFIRMATION DIALOG (Requirement 8) */}
      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 text-center space-y-4 anim-fade-up bg-white shadow-2xl border-rose-200">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle size={24} />
            </span>

            <div>
              <h3 className="font-display text-xl font-bold text-slate-900">
                {L('Cancel this appointment?', 'क्या यह अपॉइंटमेंट रद्द करें?')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {L(
                  `Are you sure you want to cancel your appointment with ${appointmentToCancel.doctorName}?`,
                  `क्या आप वाकई ${appointmentToCancel.doctorName} के साथ अपनी अपॉइंटमेंट रद्द करना चाहते हैं?`
                )}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-left">
              <p className="font-bold text-slate-800">
                {appointmentToCancel.date} · {appointmentToCancel.time}
              </p>
              <p className="text-slate-500 mt-0.5">{appointmentToCancel.clinic}</p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAppointmentToCancel(null)}
                className="flex-1 h-11 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {L('Keep appointment', 'अपॉइंटमेंट रखें')}
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                className="flex-1 h-11 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
              >
                {L('Cancel appointment', 'अपॉइंटमेंट रद्द करें')}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
