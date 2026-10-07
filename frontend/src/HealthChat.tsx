import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Plus,
  Compass,
  TrendingUp,
  FileText,
  Activity,
  ShieldCheck,
  Moon,
  Droplets,
  Heart,
  Pill,
  ArrowRight,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Clock,
  FlaskConical,
  RotateCcw,
  SlidersHorizontal,
  BookmarkPlus,
  Share2,
  ExternalLink
} from 'lucide-react'
import { Badge, Btn, Card, ConfRing, Eyebrow, cx, useL, useEvidence, useToast } from './ui'

interface MessageSource {
  title: string
  date: string
  kind: 'lab' | 'rx' | 'vitals' | 'device'
  detail: string
  regionKey?: string
}

interface MessageAction {
  category: 'lifestyle' | 'nutrition' | 'followup' | 'monitoring'
  title: string
  description: string
  priority: 'recommended' | 'optional'
}

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  timestamp: string
  text?: string
  // Structured Copilot Response Payload: Ask → Understand → Detect → Explain → Act
  copilotResponse?: {
    summary: string
    // Understand: Context factors evaluated
    analyzedFactors: {
      factor: string
      finding: string
      status: 'normal' | 'attention' | 'optimal' | 'info'
      metric?: string
      source: string
    }[]
    // Detect: Trends identified
    detectedTrends: {
      title: string
      detail: string
      trajectory: 'lower' | 'fluctuating' | 'improving' | 'stable'
      severity: 'moderate' | 'low' | 'neutral'
    }[]
    // Explain: Why this matters (not a diagnosis, but clear physiological context)
    clinicalReasoning: {
      whyItMatters: string
      possibleContributors: string[]
      whatItIsNot: string
    }
    // Act: Practical, healthy lifestyle steps & doctor talking points
    suggestedActions: MessageAction[]
    // Sources and evidence grounding
    groundedSources: MessageSource[]
    // Safe boundary disclaimer
    disclaimer: string
  }
}

const ACTION_CARDS = [
  {
    id: 'ask-tired',
    kicker: 'ASK ABOUT YOUR HEALTH',
    prompt: 'Why am I feeling tired?',
    description: 'Correlate recent blood counts, sleep metrics, and medications for fatigue contributors.',
    icon: Moon,
    color: 'from-sky-500/10 to-teal-500/10 text-sky-700 border-sky-200/80',
    iconColor: 'bg-sky-50 text-sky-700',
  },
  {
    id: 'summarize',
    kicker: 'SUMMARIZE MY HEALTH',
    prompt: 'Summarize my health this month.',
    description: 'Consolidated overview of 3 uploaded reports, active prescriptions, and recent vitals.',
    icon: FileText,
    color: 'from-teal-500/10 to-emerald-500/10 text-teal-800 border-teal-200/80',
    iconColor: 'bg-teal-50 text-teal-700',
  },
  {
    id: 'detect-trends',
    kicker: 'DETECT TRENDS',
    prompt: 'What has changed recently?',
    description: 'Spot subtle shifts across blood counts, resting vitals, and antibiotic completions.',
    icon: TrendingUp,
    color: 'from-amber-500/10 to-orange-500/10 text-amber-800 border-amber-200/80',
    iconColor: 'bg-amber-50 text-amber-700',
  },
  {
    id: 'lifestyle-act',
    kicker: 'WHAT SHOULD I DO?',
    prompt: 'What lifestyle changes might help?',
    description: 'Practical, evidence-backed lifestyle & nutrition habits tailored to your current records.',
    icon: Activity,
    color: 'from-violet-500/10 to-sky-500/10 text-violet-800 border-violet-200/80',
    iconColor: 'bg-violet-50 text-violet-700',
  },
]

export function HealthChat({ userName = 'Alex' }: { userName?: string }) {
  const L = useL()
  const ev = useEvidence()
  const toast = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'evidence' | 'actions'>('all')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSendPrompt = (promptText: string) => {
    if (!promptText.trim()) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text: promptText,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate intelligent multi-factor synthesis
    setTimeout(() => {
      setIsTyping(false)

      const normalized = promptText.toLowerCase()
      let assistantMsg: ChatMessage

      if (normalized.includes('tired') || normalized.includes('fatigue')) {
        assistantMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          copilotResponse: {
            summary:
              'Analyzing your available health records indicates 3 intersecting factors that frequently contribute to feeling low energy or tired: mildly lower hemoglobin on your recent CBC, an active recovery course from a recent infection, and slightly shortened sleep cycles over the past 4 nights.',
            analyzedFactors: [
              {
                factor: 'Hemoglobin (Oxygen Transport)',
                finding: '10.8 g/dL (Below reference 12.0 – 15.5 g/dL)',
                metric: '10.8 g/dL',
                status: 'attention',
                source: 'CBC Blood Test (Meridian Diagnostics · 07 Oct 2026)',
              },
              {
                factor: 'Recent Infection Recovery',
                finding: 'Finishing Amoxicillin 500mg (Day 4 of 5 for upper respiratory tract infection)',
                status: 'normal',
                source: 'Prescription by Dr. R. Menon (04 Oct 2026)',
              },
              {
                factor: 'Sleep Duration & Consistency',
                finding: 'Averaging 6h 12m over the last 4 nights (vs your 7h 30m baseline)',
                metric: '6.2 hrs/night',
                status: 'attention',
                source: 'Connected Health Sensor & Wellness Log',
              },
              {
                factor: 'Hydration & Daily Activity',
                finding: 'Daily steps reduced by ~28% during illness; reported water intake at 1.4 L/day',
                metric: '1.4 L / day',
                status: 'info',
                source: 'Wellness Profile & Symptoms record',
              },
            ],
            detectedTrends: [
              {
                title: 'Hemoglobin shifted lower compared to baseline',
                detail:
                  'A lower hemoglobin count reduces the red blood cells’ oxygen-carrying capacity to muscle and brain tissues, which is a common driver of afternoon lethargy and brain fog.',
                trajectory: 'lower',
                severity: 'moderate',
              },
              {
                title: 'Immune response energy expenditure',
                detail:
                  'Your body expends considerable metabolic energy resolving respiratory infections even as obvious symptoms (fever, congestion) subside.',
                trajectory: 'fluctuating',
                severity: 'low',
              },
            ],
            clinicalReasoning: {
              whyItMatters:
                'Understanding fatigue as a combination of mild laboratory shifts + infection recovery + sleep deficits helps prevent guesswork. Rather than an isolated issue, these factors compound.',
              possibleContributors: [
                'Mildly decreased red blood cell oxygen carrying efficiency',
                'Cellular repair metabolic demand post-infection',
                'Fragmented sleep stages while breathing was congested',
                'Slight sub-optimal hydration during antibiotic regimen',
              ],
              whatItIsNot:
                'This is an informational analysis of your records, not a clinical diagnosis of chronic fatigue syndrome, severe anemia, or thyroid dysfunction.',
            },
            suggestedActions: [
              {
                category: 'nutrition',
                title: 'Prioritize iron-rich nutrition & Vitamin C pairing',
                description:
                  'Incorporate lentils, spinach, beans, lean poultry, or fortified cereals paired with citrus (Vitamin C aids non-heme iron absorption). Avoid drinking coffee/tea within 45 minutes of iron-rich meals.',
                priority: 'recommended',
              },
              {
                category: 'lifestyle',
                title: 'Target 7.5 hours of restorative sleep with wind-down',
                description:
                  'Aim for a consistent 10:30 PM bedtime tonight. Sleep is when marrow synthesizes red blood cells and clears post-infection inflammatory markers.',
                priority: 'recommended',
              },
              {
                category: 'monitoring',
                title: 'Hydrate to 2.2+ liters while finishing Amoxicillin',
                description:
                  'Antibiotics and cellular debris clearance place extra filtration demand on kidneys. Proper hydration immediately improves perceived daytime alertness.',
                priority: 'recommended',
              },
              {
                category: 'followup',
                title: 'Doctor talking point: Ask Dr. Menon about re-testing ferritin',
                description:
                  'At your upcoming follow-up visit on Oct 18, discuss if a repeat CBC or iron panel (Ferritin/TIBC) is recommended once your antibiotic course is completed.',
                priority: 'recommended',
              },
            ],
            groundedSources: [
              {
                title: 'CBC Blood Test (Meridian Diagnostics)',
                date: '07 Oct 2026',
                kind: 'lab',
                detail: 'Hemoglobin 10.8 g/dL (Reference 12.0 – 15.5), WBC 7.2 ×10³/µL, Platelets 245 ×10³/µL',
                regionKey: 'hb',
              },
              {
                title: 'Prescription by Dr. R. Menon',
                date: '04 Oct 2026',
                kind: 'rx',
                detail: 'Amoxicillin 500mg, Pantoprazole 40mg, Vitamin D3 60,000 IU',
                regionKey: 'med1',
              },
              {
                title: 'Sunrise Family Clinic Consultation Note',
                date: '28 Sep 2026',
                kind: 'vitals',
                detail: 'BP 118/76 mmHg, Resting HR 68 bpm, Weight 64 kg',
              },
            ],
            disclaimer:
              'HealthLens assists you in interpreting documented health patterns. This is not medical advice or an automated diagnosis. Consult your healthcare provider before altering treatments or supplements.',
          },
        }
      } else if (normalized.includes('summarize') || normalized.includes('month')) {
        assistantMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          copilotResponse: {
            summary:
              'Over the past 30 days, your record reflects 3 analyzed medical events: an acute respiratory episode managed with antibiotics, a comprehensive blood panel with one value flagged for review, and a stable discharge summary from September.',
            analyzedFactors: [
              {
                factor: 'Active Prescriptions',
                finding: '4 medications documented (Amoxicillin ending soon, Pantoprazole, Vitamin D3, Paracetamol PRN)',
                status: 'normal',
                source: 'Rx & Discharge records',
              },
              {
                factor: 'CBC Laboratory Panel',
                finding: '5 parameters evaluated; WBC, platelets & hematocrit optimal; Hemoglobin slightly lower (10.8 g/dL)',
                status: 'attention',
                source: 'Meridian Diagnostics',
              },
              {
                factor: 'Cardiovascular & Vitals',
                finding: 'Blood pressure recorded at 118/76 mmHg; Discharge temp normal at 98.4 °F',
                status: 'optimal',
                source: 'Clinic Checkup & Hospital Discharge',
              },
            ],
            detectedTrends: [
              {
                title: 'Infection resolution on schedule',
                detail: 'Vital signs and WBC counts confirm inflammation has dropped compared to late September.',
                trajectory: 'improving',
                severity: 'neutral',
              },
              {
                title: 'Nutritional cofactor replenishment',
                detail: 'Weekly Vitamin D3 supplementation is actively addressing previous deficiency documented in September.',
                trajectory: 'improving',
                severity: 'neutral',
              },
            ],
            clinicalReasoning: {
              whyItMatters:
                'Consolidating your monthly trajectory gives your doctor a complete, organized snapshot rather than scattered papers.',
              possibleContributors: ['Seasonality and viral recovery', 'Consistent medication compliance'],
              whatItIsNot: 'Not an assessment of unrecorded conditions.',
            },
            suggestedActions: [
              {
                category: 'followup',
                title: 'Schedule scheduled 2-week clinic follow-up',
                description: 'Dr. Menon advised a follow-up check around mid-October to confirm complete respiratory clearance.',
                priority: 'recommended',
              },
              {
                category: 'monitoring',
                title: 'Log any recurring reflux symptoms before breakfast',
                description: 'Keep track of whether Pantoprazole 40mg is adequately preventing morning heartburn.',
                priority: 'optional',
              },
            ],
            groundedSources: [
              { title: 'CBC Blood Report', date: '07 Oct 2026', kind: 'lab', detail: 'Complete Blood Count panel' },
              { title: 'Clinic Prescription', date: '04 Oct 2026', kind: 'rx', detail: 'Sunrise Family Clinic' },
              { title: 'Hospital Discharge Summary', date: '12 Sep 2026', kind: 'vitals', detail: 'City General Hospital' },
            ],
            disclaimer:
              'Monthly summaries are generated directly from documents uploaded into your HealthLens vault.',
          },
        }
      } else if (normalized.includes('trend') || normalized.includes('change')) {
        assistantMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          copilotResponse: {
            summary:
              'Comparing your October 2026 documents with earlier September records identifies 2 noteworthy changes: blood counts show normal WBC normalization following infection, while Hemoglobin sits 1.2 points below the reference threshold.',
            analyzedFactors: [
              {
                factor: 'White Blood Cell (WBC)',
                finding: 'Stabilized at 7.2 ×10³/µL (down from mild elevation during fever in Sept)',
                status: 'optimal',
                source: 'Meridian Diagnostics CBC',
              },
              {
                factor: 'Hemoglobin Trend',
                finding: '10.8 g/dL (reference 12.0 – 15.5 g/dL)',
                status: 'attention',
                source: 'Meridian Diagnostics CBC',
              },
            ],
            detectedTrends: [
              {
                title: 'Infection markers resolved to healthy baseline',
                detail: 'Platelet and WBC stability confirms acute infection has cleared.',
                trajectory: 'improving',
                severity: 'neutral',
              },
              {
                title: 'Hemoglobin lower than reference range',
                detail: 'Worth verifying whether this is transient post-illness or related to dietary iron availability.',
                trajectory: 'lower',
                severity: 'moderate',
              },
            ],
            clinicalReasoning: {
              whyItMatters:
                'Tracking trends rather than single isolated snapshots helps distinguish acute short-term recovery from lasting changes.',
              possibleContributors: ['Recent viral febrile illness', 'Post-infection hemodilution'],
              whatItIsNot: 'Not an indicator of urgent clinical emergencies.',
            },
            suggestedActions: [
              {
                category: 'lifestyle',
                title: 'Gentle aerobic activity as energy returns',
                description: '20-minute daily walks promote red cell oxygenation without exhausting healing tissue.',
                priority: 'recommended',
              },
            ],
            groundedSources: [
              { title: 'CBC Blood Test', date: '07 Oct 2026', kind: 'lab', detail: 'Meridian Diagnostics' },
              { title: 'Discharge Summary', date: '12 Sep 2026', kind: 'vitals', detail: 'City General Hospital' },
            ],
            disclaimer:
              'Laboratory trends should always be reviewed alongside clinical evaluation by your attending doctor.',
          },
        }
      } else {
        // Fallback natural health question response with complete 5-stage synthesis
        assistantMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          copilotResponse: {
            summary: `Looking across your verified health profile, prescriptions, and recent lab results regarding "${promptText}": HealthLens cross-references your current records to provide context without making unsupported medical assumptions.`,
            analyzedFactors: [
              {
                factor: 'Personal Health Baseline',
                finding: 'Profile: 34 yr old male, BP 118/76 mmHg, Blood Group O+',
                status: 'normal',
                source: 'HealthLens Personal Profile & Clinic Vitals',
              },
              {
                factor: 'Active Medication Context',
                finding: 'Amoxicillin 500mg, Pantoprazole 40mg, Vitamin D3 60,000 IU',
                status: 'normal',
                source: 'Dr. R. Menon Prescription (04 Oct 2026)',
              },
              {
                factor: 'Laboratory Observations',
                finding: 'CBC shows Hemoglobin 10.8 g/dL (attention), other blood cells within reference intervals',
                status: 'attention',
                source: 'Meridian Diagnostics (07 Oct 2026)',
              },
            ],
            detectedTrends: [
              {
                title: 'Stable physiological parameters overall',
                detail: 'Your recent vital signs and metabolic indicators show normal general stability.',
                trajectory: 'stable',
                severity: 'neutral',
              },
            ],
            clinicalReasoning: {
              whyItMatters:
                'Understanding your question in the context of your existing prescriptions and recent laboratory tests prevents fragmented advice.',
              possibleContributors: ['Individual health history', 'Documented medications and recovery status'],
              whatItIsNot: 'Not an autonomous diagnosis or clinical prescription.',
            },
            suggestedActions: [
              {
                category: 'followup',
                title: 'Discuss specific questions with your doctor',
                description: 'Bring this observation to your upcoming consult with Dr. Menon for professional advice.',
                priority: 'recommended',
              },
              {
                category: 'monitoring',
                title: 'Track symptom frequency in your HealthLens log',
                description: 'Note when this symptom occurs relative to meals, medication timing, and sleep.',
                priority: 'optional',
              },
            ],
            groundedSources: [
              { title: 'CBC Report', date: '07 Oct 2026', kind: 'lab', detail: 'Meridian Diagnostics' },
              { title: 'Prescription', date: '04 Oct 2026', kind: 'rx', detail: 'Sunrise Family Clinic' },
            ],
            disclaimer:
              'HealthLens provides evidence-grounded health literacy. Never disregard professional medical advice based on AI summaries.',
          },
        }
      }

      setMessages((prev) => [...prev, assistantMsg])
    }, 750)
  }

  const handleResetChat = () => {
    setMessages([])
    toast('Started a new health conversation', 'ok')
  }

  return (
    <div className="anim-fade-up mx-auto max-w-5xl space-y-6">
      {/* 2. Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <Sparkles size={14} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              Personal Health Copilot
            </span>
          </div>
          <h1 className="font-display text-[28px] sm:text-[34px] font-bold text-[#0b1b33] tracking-tight leading-tight">
            AI Health Chat
          </h1>
          <p className="mt-1 text-sm sm:text-[15px] text-slate-600">
            {L(
              'Your personal health copilot, powered by your health data.',
              'आपका व्यक्तिगत स्वास्थ्य कॉपायलट, आपके स्वास्थ्य डेटा पर आधारित।'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Health context active badge */}
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50/80 px-2.5 py-1 rounded-full border border-teal-200/60 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              Health context active
            </span>
            <span className="text-[10.5px] text-slate-400 mt-1 max-w-[220px] leading-tight">
              Reports, meds & vitals synchronized
            </span>
          </div>

          <Btn v="secondary" sm onClick={handleResetChat} className="shadow-2xs">
            <RotateCcw size={14} />
            {L('New Chat', 'नई बातचीत')}
          </Btn>
        </div>
      </div>

      {/* Helpful Context Reassurance Banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-teal-50/70 via-sky-50/50 to-white p-3.5 border border-teal-100/80 text-xs text-slate-600">
        <Info size={16} className="text-teal-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-slate-800">
            {L('Personalized Health Grounding:', 'व्यक्तिगत स्वास्थ्य साक्ष्य आधार:')}{' '}
          </span>
          <span>
            {L(
              'HealthLens can use your verified profile, reports, medications and wellness data to personalize responses. It clearly shows the logic: Ask → Understand → Detect → Explain → Act.',
              'HealthLens आपकी सत्यापित प्रोफ़ाइल, रिपोर्ट, दवाओं और स्वास्थ्य डेटा का उपयोग करके उत्तर तैयार करता है।'
            )}
          </span>
        </div>
      </div>

      {/* 3. Intelligent Welcome State (if no messages yet) */}
      {messages.length === 0 && (
        <div className="py-6 sm:py-8 space-y-8">
          <div className="text-center sm:text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {L(`Hi ${userName}, let's understand your health.`, `नमस्ते ${userName}, आइए आपके स्वास्थ्य को समझें।`)}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              {L(
                'I can answer questions, summarize your health, and highlight meaningful changes in your health data.',
                'मैं सवालों के जवाब दे सकता हूँ, आपके स्वास्थ्य का सारांश प्रस्तुत कर सकता हूँ और आपके स्वास्थ्य डेटा में बदलावों को समझा सकता हूँ।'
              )}
            </p>
          </div>

          {/* Four Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACTION_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <button
                  key={card.id}
                  onClick={() => handleSendPrompt(card.prompt)}
                  className="group relative rounded-2xl border bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-teal-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={cx('grid h-10 w-10 place-items-center rounded-xl', card.iconColor)}>
                      <Icon size={19} strokeWidth={2} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-teal-700 transition">
                      {card.kicker}
                    </span>
                  </div>

                  <p className="font-display text-[17px] font-bold text-slate-900 group-hover:text-[#0f3057] transition leading-snug">
                    "{card.prompt}"
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-800 opacity-90 group-hover:opacity-100">
                    <span>Ask this question</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Quick Context Summary pills */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Active Health Sources in Vault
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
                <FlaskConical size={16} className="text-teal-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">CBC Blood Test</p>
                  <p className="text-[11px] text-slate-600">07 Oct 2026</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
                <Pill size={16} className="text-sky-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">4 Prescriptions</p>
                  <p className="text-[11px] text-slate-600">Active Course</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
                <Heart size={16} className="text-rose-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">Vital Records</p>
                  <p className="text-[11px] text-slate-600">BP: 118/76 mmHg</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
                <Activity size={16} className="text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">Sleep & Activity</p>
                  <p className="text-[11px] text-slate-600">4-day Log</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Timeline */}
      {messages.length > 0 && (
        <div className="space-y-6 pb-6">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end anim-fade-up">
                  <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-xs bg-[#0f3057] px-4 py-3 text-white shadow-sm">
                    <p className="text-[15px] font-medium leading-relaxed">{msg.text}</p>
                    <span className="mt-1 block text-right text-[10px] text-slate-300">{msg.timestamp}</span>
                  </div>
                </div>
              )
            }

            // Structured Copilot Response (Ask → Understand → Detect → Explain → Act)
            const cr = msg.copilotResponse
            if (!cr) return null

            return (
              <div key={msg.id} className="anim-fade-up space-y-4">
                {/* Copilot Header Indicator */}
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[#0f3057] to-[#0b1b33] text-white shadow-xs">
                    <Sparkles size={14} />
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-900">HealthLens Copilot</span>
                    <span className="ml-2 text-xs text-slate-400">Synthesized from 4 health records</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
                  {/* Stage 1: Executive Summary */}
                  <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-50/70 to-white border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-teal-800">
                      <Compass size={16} className="shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">Clinical Synthesis</span>
                    </div>
                    <p className="text-[16px] sm:text-[17px] text-slate-900 font-medium leading-relaxed">
                      {cr.summary}
                    </p>
                  </div>

                  {/* Stage 2: UNDERSTAND — Analyzed Factors & Context Grounding */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          1. Understand · Factors Evaluated
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">Cross-referenced with vault</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cr.analyzedFactors.map((f, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3.5 space-y-1 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">{f.factor}</span>
                            <span
                              className={cx(
                                'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                                f.status === 'attention'
                                  ? 'bg-amber-100 text-amber-800'
                                  : f.status === 'optimal'
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-slate-200/70 text-slate-700'
                              )}
                            >
                              {f.status === 'attention' ? 'Attention' : f.status === 'optimal' ? 'Optimal' : 'Normal'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{f.finding}</p>
                          <p className="text-[11px] text-slate-600 pt-1 flex items-center gap-1">
                            <FileText size={11} /> {f.source}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage 3: DETECT — Proactive Meaningful Trends */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 space-y-3 bg-amber-50/20">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-amber-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        2. Detect · Meaningful Trends
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {cr.detectedTrends.map((t, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-amber-200/60 bg-white p-3.5 space-y-1 shadow-2xs"
                        >
                          <p className="text-sm font-bold text-slate-900">{t.title}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{t.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage 4: EXPLAIN — Why This Matters (Clear, non-alarming physiological explanation) */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-violet-800">
                      <HelpCircle size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-900">
                        3. Explain · Why This Trend Matters
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed font-normal">
                      {cr.clinicalReasoning.whyItMatters}
                    </p>

                    <div className="rounded-2xl bg-violet-50/50 p-4 border border-violet-100/70">
                      <p className="text-xs font-bold text-violet-900 uppercase tracking-wider mb-2">
                        Plausible Physiological Contributors
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {cr.clinicalReasoning.possibleContributors.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Strict Boundary / What it is NOT */}
                    <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200/70 text-xs text-slate-600">
                      <ShieldCheck size={15} className="text-teal-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Interpretation Guardrail: </span>
                        {cr.clinicalReasoning.whatItIsNot}
                      </div>
                    </div>
                  </div>

                  {/* Stage 5: ACT — Appropriate Lifestyle Actions & Doctor Talking Points */}
                  <div className="p-5 sm:p-6 space-y-4 bg-teal-50/15">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-teal-800">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                          4. Act · Suggested Practical Steps
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-teal-800">Doctor-aligned habits</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cr.suggestedActions.map((action, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-teal-200/60 bg-white p-4 space-y-2 shadow-2xs hover:shadow-xs transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                              {action.category}
                            </span>
                            <span className="text-[10.5px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                              {action.priority}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{action.title}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage 6: Grounded Sources & Evidence Drawer Integration */}
                  <div className="bg-slate-50/80 px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText size={14} className="text-slate-500" />
                      <span className="font-semibold text-slate-700">Grounded Records:</span>
                      <div className="flex flex-wrap gap-2">
                        {cr.groundedSources.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (s.regionKey) {
                                ev({ kind: s.kind === 'rx' ? 'rx' : 'cbc', region: s.regionKey })
                              } else {
                                toast(`Viewing source record: ${s.title}`)
                              }
                            }}
                            className="inline-flex items-center gap-1 font-medium text-teal-800 hover:text-teal-900 hover:underline bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <span>{s.title}</span>
                            <ExternalLink size={11} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 italic">
                      {cr.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {isTyping && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/70 anim-fade-up max-w-sm">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-teal-50 text-teal-600">
                <Sparkles size={14} className="animate-spin" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-800">Synthesizing personal health data…</p>
                <p className="text-[11px] text-slate-400">Evaluating CBC reports, sleep logs & active medications</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Form Bar */}
      <div className="sticky bottom-4 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendPrompt(input)
          }}
          className="relative flex items-center rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-lg shadow-slate-200/50 overflow-hidden focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100/70 transition"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={L(
              'Ask a health question (e.g., "Why am I feeling tired?" or "Summarize my reports")…',
              'स्वास्थ्य संबंधी सवाल पूछें (उदा. "मुझे थकान क्यों लग रही है?" या "मेरी रिपोर्ट का सारांश दें")…'
            )}
            className="w-full h-14 pl-5 pr-28 text-sm sm:text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white font-semibold text-xs transition disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <span>Ask Copilot</span>
              <Send size={13} />
            </button>
          </div>
        </form>

        <p className="mt-2 text-center text-[11px] text-slate-600">
          🔒 Encrypted health reasoning. HealthLens provides supportive health context and never replaces professional clinical advice.
        </p>
      </div>
    </div>
  )
}
