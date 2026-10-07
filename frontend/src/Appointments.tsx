import { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { Card, Eyebrow, cx, useL, useToast } from './ui'
import type { Doctor, Appointment } from './types'

interface AppointmentsProps {
  doctors: Doctor[]
  appointments: Appointment[]
  onBookAppointment: (appointment: Omit<Appointment, 'id'>) => void
  onCancelAppointment: (id: string) => void
  onToggleReminder: (id: string) => void
  initialSpecialtyFilter?: string
}

const SPECIALTY_FILTERS = [
  { id: 'all', label: 'All', labelHi: 'सभी', match: '' },
  { id: 'cardiology', label: 'Cardiology', labelHi: 'हृदय रोग (कार्डियोलॉजी)', match: 'Cardiology' },
  { id: 'diabetes', label: 'Diabetes & Endocrinology', labelHi: 'डायबिटीज व हार्मोन', match: 'Diabetes' },
  { id: 'nephrology', label: 'Nephrology', labelHi: 'किडनी (नेफ्रोलॉजी)', match: 'Nephrology' },
  { id: 'family', label: 'General Family Medicine', labelHi: 'सामान्य पारिवारिक चिकित्सा', match: 'Family' },
]

export function Appointments({
  doctors,
  appointments,
  onBookAppointment,
  onCancelAppointment,
  onToggleReminder,
  initialSpecialtyFilter = 'All',
}: AppointmentsProps) {
  const L = useL()
  const toast = useToast()

  // Filters & search
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialSpecialtyFilter)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Booking wizard states: Step 1 (Doctor & Time), Step 2 (Visit reason), Step 3 (Review & Confirm)
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1)
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [visitReason, setVisitReason] = useState<string>('Follow-up on recent lab reports and prescription')
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false)

  // Reschedule tracking
  const [reschedulingAptId, setReschedulingAptId] = useState<string | null>(null)

  // Confirmation state
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null)

  // View appointment detail modal
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null)

  // Cancel appointment confirmation modal
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Specialty filter
      let matchesSpecialty = true
      if (selectedSpecialty !== 'All') {
        const filterItem = SPECIALTY_FILTERS.find((f) => f.label === selectedSpecialty)
        const matchTerm = filterItem ? filterItem.match : selectedSpecialty
        matchesSpecialty = doc.specialty.toLowerCase().includes(matchTerm.toLowerCase())
      }

      // Text search
      let matchesSearch = true
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        matchesSearch =
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          doc.clinic.toLowerCase().includes(q)
      }

      return matchesSpecialty && matchesSearch
    })
  }, [doctors, selectedSpecialty, searchQuery])

  // Active upcoming appointments
  const upcomingAppointments = appointments.filter((a) => a.status === 'confirmed')

  // Start booking wizard
  const handleStartBooking = (doctor: Doctor, preselectedDate?: string, preselectedSlot?: string) => {
    setBookingDoctor(doctor)
    setBookingStep(preselectedSlot ? 2 : 1)

    if (preselectedDate) {
      setSelectedDateStr(preselectedDate)
    } else if (doctor.availableDates.length > 0) {
      setSelectedDateStr(doctor.availableDates[0].dateStr)
    }

    if (preselectedSlot) {
      setSelectedSlot(preselectedSlot)
    } else if (doctor.availableDates.length > 0 && doctor.availableDates[0].slots.length > 0) {
      setSelectedSlot(doctor.availableDates[0].slots[0])
    }

    setShowBookingModal(true)
  }

  // Reschedule flow
  const handleStartReschedule = (apt: Appointment) => {
    setViewingAppointment(null)
    setReschedulingAptId(apt.id)
    const matchedDoctor = doctors.find((d) => d.id === apt.doctorId) || doctors[0]
    handleStartBooking(matchedDoctor)
  }

  // Confirm booking
  const handleConfirmBooking = () => {
    if (!bookingDoctor || !selectedDateStr || !selectedSlot) return

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
      date: selectedDateStr,
      time: selectedSlot,
      status: 'confirmed',
      hasReminder: true,
      notes: visitReason.trim() || 'General health consultation',
    }

    onBookAppointment(newApt)
    setShowBookingModal(false)

    const confirmedObj: Appointment = {
      id: `apt-${Date.now()}`,
      ...newApt,
    }
    setConfirmedBooking(confirmedObj)
    toast(`Appointment confirmed with ${bookingDoctor.name}! Added to Dashboard reminders.`, 'ok')
  }

  // Handle final cancel execution
  const handleExecuteCancel = () => {
    if (!appointmentToCancel) return
    onCancelAppointment(appointmentToCancel.id)
    setViewingAppointment(null)
    toast(`Cancelled appointment with ${appointmentToCancel.doctorName}.`)
    setAppointmentToCancel(null)
  }

  return (
    <div className="anim-fade-up mx-auto max-w-5xl space-y-8">
      {/* 1. Page Hierarchy */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-50 text-teal-700">
            <Stethoscope size={14} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
            {L('Doctor Consultations', 'डॉक्टर परामर्श')}
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

      {/* 2. Upcoming Appointment Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-teal-600" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
              {L('Your Upcoming Appointment', 'आपकी आगामी अपॉइंटमेंट')}
            </h2>
          </div>
          {upcomingAppointments.length > 0 && (
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/80">
              {upcomingAppointments.length} {L('Active', 'सक्रिय')}
            </span>
          )}
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <Card
                key={apt.id}
                className="p-5 sm:p-6 border-l-4 border-l-teal-600 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white shadow-xs"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 shrink-0 ring-1 ring-teal-100">
                    <Stethoscope size={22} />
                  </span>
                  <div>
                    {/* Status & Schedule */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-900 text-xs font-bold">
                        {apt.date} · {apt.time}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        <span>{L('Confirmed', 'पुष्ट')}</span>
                      </span>
                      {apt.hasReminder && (
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
                    <p className="text-xs font-medium text-teal-800">{L(apt.specialty, apt.specialtyHi)}</p>

                    <p className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span>{apt.clinic}</span>
                    </p>

                    {apt.notes && (
                      <p className="mt-2 text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xl">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Primary & Secondary Actions */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                  {/* Primary Action */}
                  <button
                    type="button"
                    onClick={() => setViewingAppointment(apt)}
                    className="h-10 px-4 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>{L('View appointment', 'अपॉइंटमेंट देखें')}</span>
                    <ChevronRight size={14} />
                  </button>

                  {/* Secondary Reminder Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleReminder(apt.id)
                      toast(apt.hasReminder ? 'Reminder turned off' : 'Reminder turned on', 'ok')
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
                    <span>{apt.hasReminder ? L('Reminder On', 'रिमाइंडर चालू') : L('Reminder Off', 'रिमाइंडर बंद')}</span>
                  </button>

                  {/* Secondary Cancel Action */}
                  <button
                    type="button"
                    onClick={() => setAppointmentToCancel(apt)}
                    className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                  >
                    {L('Cancel', 'रद्द करें')}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty state when no upcoming appointments */
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 text-center space-y-3 shadow-2xs">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <Calendar size={22} />
            </span>
            <h3 className="font-display text-lg font-bold text-slate-900">
              {L('No upcoming appointments', 'कोई आगामी अपॉइंटमेंट नहीं है')}
            </h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              {L("Find a doctor when you're ready.", 'जब आप तैयार हों तब डॉक्टर खोजें।')}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('browse-doctors')?.scrollIntoView({ behavior: 'smooth' })
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

      {/* 3. Doctor Search & Specialty Filters */}
      <section id="browse-doctors" className="space-y-4 pt-2">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            {L('Find a Doctor', 'डॉक्टर खोजें')}
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-600 mt-0.5">
            {L(
              'Select a specialist to review your health records and choose an available consultation time.',
              'अपने स्वास्थ्य रिकॉर्ड की समीक्षा के लिए विशेषज्ञ चुनें और समय स्लॉट तय करें।'
            )}
          </p>
        </div>

        {/* Search bar + Specialty Filter chips */}
        <div className="space-y-3">
          {/* Simple Search Input */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={L('Search by doctor name, specialty, or clinic...', 'डॉक्टर, विशेषज्ञता या क्लिनिक खोजें...')}
              className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Specialty Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SPECIALTY_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSpecialty(item.label)}
                className={cx(
                  'h-9 shrink-0 rounded-xl px-4 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  selectedSpecialty === item.label
                    ? 'bg-[#0f3057] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                )}
              >
                {L(item.label, item.labelHi)}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Doctor Cards Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredDoctors.map((doc) => {
              const firstAvailable = doc.availableDates[0]

              return (
                <Card
                  key={doc.id}
                  className="p-5 sm:p-6 transition-all duration-200 hover:shadow-md border-slate-200/90 flex flex-col justify-between bg-white"
                >
                  <div>
                    {/* 1. Doctor Name & 2. Specialty */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white font-display text-lg font-bold shadow-xs shrink-0">
                          {doc.avatarChar}
                        </span>
                        <div>
                          <h3 className="font-display text-[18px] sm:text-[19px] font-bold text-slate-900 leading-snug">
                            {doc.name}
                          </h3>
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

                    {/* 3. Clinic */}
                    <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <p className="font-bold text-slate-800">{doc.clinic}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{doc.clinicAddress}</p>
                    </div>

                    {/* 4. Available Appointment Time Grouping */}
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          {L('Available:', 'उपलब्ध समय:')} {firstAvailable?.displayDay || 'Upcoming'}
                        </span>
                        <span className="text-[10px] text-slate-400">{firstAvailable?.dateStr}</span>
                      </div>

                      {/* Selectable time slot buttons */}
                      <div className="flex flex-wrap gap-2">
                        {firstAvailable?.slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleStartBooking(doc, firstAvailable.dateStr, slot)}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-800 hover:text-teal-900 transition cursor-pointer shadow-2xs"
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 5. Primary Action */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {L('In-person clinic consultation', 'क्लिनिक परामर्श')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartBooking(doc)}
                      className="h-9 px-4 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <span>{L('Book a slot', 'स्लॉट बुक करें')}</span>
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
                setSelectedSpecialty('All')
                setSearchQuery('')
              }}
              className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
            >
              {L('Reset filters', 'फ़िल्टर रीसेट करें')}
            </button>
          </div>
        )}
      </section>

      {/* Safety Disclaimer */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-center">
        <p className="text-xs text-slate-600 leading-relaxed">
          🔒{' '}
          {L(
            'HealthCopilot connects you with licensed doctors. For acute medical emergencies, please dial 112 or visit an emergency room immediately.',
            'HealthCopilot आपको प्रमाणित डॉक्टरों से जोड़ता है। आपातकालीन स्थिति में तुरंत 112 पर कॉल करें।'
          )}
        </p>
      </div>

      {/* 6. Booking Sequence Modal (Step 1 -> Step 2 -> Step 3) */}
      {showBookingModal && bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="max-w-lg w-full p-6 space-y-5 anim-fade-up max-h-[92vh] overflow-y-auto bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  {bookingStep === 1
                    ? L('Step 1 of 3: Choose Time', 'चरण 1/3: समय चुनें')
                    : bookingStep === 2
                    ? L('Step 2 of 3: Visit Reason', 'चरण 2/3: विज़िट का कारण')
                    : L('Step 3 of 3: Review & Confirm', 'चरण 3/3: समीक्षा व पुष्टि')}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                  {bookingDoctor.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: Choose Doctor and Time */}
            {bookingStep === 1 && (
              <div className="space-y-4">
                {/* Doctor Summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                  <p className="font-bold text-slate-800">{bookingDoctor.specialty}</p>
                  <p className="text-slate-600 mt-0.5">{bookingDoctor.clinic}</p>
                </div>

                {/* Available Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {L('Choose Consultation Date', 'परामर्श की तारीख चुनें')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {bookingDoctor.availableDates.map((ad) => {
                      const isSelected = selectedDateStr === ad.dateStr
                      return (
                        <button
                          key={ad.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDateStr(ad.dateStr)
                            setSelectedSlot(ad.slots[0] || '')
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

                {/* Available Time Slots */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {L('Available Time Slots', 'उपलब्ध समय स्लॉट')}
                  </label>
                  {(() => {
                    const currentSlots =
                      bookingDoctor.availableDates.find((ad) => ad.dateStr === selectedDateStr)?.slots || []
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {currentSlots.map((time) => {
                          const isSelected = selectedSlot === time
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedSlot(time)}
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

                {/* Clinic address reminder */}
                <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                  <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">{bookingDoctor.clinic}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{bookingDoctor.clinicAddress}</p>
                  </div>
                </div>

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
                    disabled={!selectedSlot}
                    onClick={() => setBookingStep(2)}
                    className="flex-1 h-11 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>{L('Continue to Visit Reason', 'विज़िट कारण पर आगे बढ़ें')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Visit Reason */}
            {bookingStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {L('What would you like to discuss?', 'आप किस बारे में चर्चा करना चाहेंगे?')}
                  </label>
                  <p className="text-xs text-slate-500 mb-2.5">
                    {L(
                      'Give your doctor context so they can prepare your records in advance.',
                      'डॉक्टर को संदर्भ दें ताकि वे आपके रिकॉर्ड पहले से तैयार रख सकें।'
                    )}
                  </p>

                  {/* Quick Reason Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[
                      'Review recent lab tests',
                      'Discuss current medications',
                      'Routine checkup & vitals',
                      'Respiratory recovery follow-up',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setVisitReason(chip)}
                        className={cx(
                          'text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer',
                          visitReason === chip
                            ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    placeholder="e.g. Review CBC blood test results and antibiotic course"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{L('Selected Slot:', 'चुना गया समय:')}</span>
                    <span className="font-bold text-slate-900">{selectedDateStr} · {selectedSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{L('Location:', 'स्थान:')}</span>
                    <span className="text-slate-800">{bookingDoctor.clinic}</span>
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
                    onClick={() => setBookingStep(3)}
                    className="flex-1 h-11 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>{L('Review Appointment', 'अपॉइंटमेंट की समीक्षा करें')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Confirm */}
            {bookingStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-3 border-b border-teal-100/80 pb-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-600 text-white font-bold text-base">
                      {bookingDoctor.avatarChar}
                    </span>
                    <div>
                      <h4 className="font-display font-bold text-slate-900 text-base">{bookingDoctor.name}</h4>
                      <p className="text-xs text-teal-800 font-medium">{bookingDoctor.specialty}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500">{L('Date & Time:', 'दिनांक और समय:')}</span>
                      <span className="font-bold text-slate-900 text-right">
                        {selectedDateStr} at {selectedSlot}
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-slate-500">{L('Clinic Address:', 'क्लिनिक पता:')}</span>
                      <span className="font-medium text-slate-800 text-right max-w-[220px]">
                        {bookingDoctor.clinic} · {bookingDoctor.clinicAddress}
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
                    onClick={() => setBookingStep(2)}
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
                    <span>
                      {L(`Book ${selectedSlot}`, `${selectedSlot} बुक करें`)}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 7. Booking Confirmation State Modal */}
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
              <p className="text-xs text-teal-800 font-medium">{confirmedBooking.specialty}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2.5 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{L('Date & Time:', 'दिनांक और समय:')}</span>
                <span className="font-bold text-slate-900 text-sm">
                  {confirmedBooking.date} · {confirmedBooking.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{L('Clinic:', 'क्लिनिक:')}</span>
                <span className="font-medium text-slate-800 text-right">{confirmedBooking.clinic}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">{L('Dashboard Reminder:', 'डैशबोर्ड रिमाइंडर:')}</span>
                <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  <Bell size={11} className="text-teal-600" />
                  <span>{L('Active', 'सक्रिय')}</span>
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
                {L('View appointment', 'अपॉइंटमेंट देखें')}
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

      {/* Detail Modal for "View appointment" */}
      {viewingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 space-y-5 anim-fade-up bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>{L('Confirmed Appointment', 'पुष्ट अपॉइंटमेंट')}</span>
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {viewingAppointment.doctorName}
                </h3>
                <p className="text-xs text-teal-800 font-medium">{viewingAppointment.specialty}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-800 block">
                    {L('Consultation Date & Time', 'परामर्श समय')}
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {viewingAppointment.date} · {viewingAppointment.time}
                  </p>
                </div>
                <Calendar size={20} className="text-teal-600" />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block">
                  {L('Clinic Location', 'क्लिनिक स्थान')}
                </span>
                <p className="font-bold text-slate-900">{viewingAppointment.clinic}</p>
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

              {/* Reminder Status */}
              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={15} className={viewingAppointment.hasReminder ? 'text-amber-600' : 'text-slate-400'} />
                  <div>
                    <span className="font-bold text-slate-800">
                      {viewingAppointment.hasReminder
                        ? L('Reminder active', 'रिमाइंडर सक्रिय')
                        : L('No reminder', 'कोई रिमाइंडर नहीं')}
                    </span>
                    <p className="text-[11px] text-slate-500">{viewingAppointment.date} at {viewingAppointment.time}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onToggleReminder(viewingAppointment.id)
                    setViewingAppointment((prev) => prev ? { ...prev, hasReminder: !prev.hasReminder } : null)
                  }}
                  className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
                >
                  {viewingAppointment.hasReminder ? L('Turn off', 'बंद करें') : L('Turn on', 'चालू करें')}
                </button>
              </div>
            </div>

            {/* Actions: Reschedule & Cancel */}
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
                onClick={() => {
                  setAppointmentToCancel(viewingAppointment)
                }}
                className="w-full h-10 rounded-xl border border-slate-200 hover:border-rose-300 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                {L('Cancel appointment', 'अपॉइंटमेंट रद्द करें')}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* 9. Cancellation Confirmation Dialog */}
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
              <p className="font-bold text-slate-800">{appointmentToCancel.date} · {appointmentToCancel.time}</p>
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
