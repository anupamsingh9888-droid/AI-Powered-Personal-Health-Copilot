import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  FileText,
  Activity,
  Heart,
  Pill,
  ArrowRight,
  Info,
  CheckCircle2,
  Stethoscope,
  FlaskConical,
  RotateCcw,
  ExternalLink,
  Mic,
  MicOff,
  AlertTriangle,
  PhoneCall,
  Droplets,
  TrendingUp,
  ShieldCheck,
  History,
  Trash2,
  Clock,
  X,
  MessageSquare,
  Plus,
  Upload,
} from 'lucide-react'
import { Btn, cx, useL, useEvidence, useToast } from './ui'
import { auth } from './lib/firebase'
import { createChatSession, sendChatMessage, deleteChatSession, askAiHealthChat } from './services/chatService'

export interface MessageSource {
  title: string
  date: string
  kind: 'lab' | 'rx' | 'vitals' | 'device'
  detail?: string
  regionKey?: string
  targetView?: string
  targetExtra?: any
}

export interface RecordAnswerPayload {
  shortAnswer: string
  keyMeasurement?: {
    label: string
    value: string
    context?: string
  }
  whatThisMeans: string[]
  whatToDoNext: string[]
  sources: MessageSource[]
}

export interface GeneralAnswerPayload {
  shortAnswer: string
  details: string[]
  helpfulTip?: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  timestamp: string
  text?: string
  isEmergency?: boolean
  isGreeting?: boolean
  isUnclear?: boolean
  isOffTopic?: boolean
  isMissingRecord?: boolean
  missingRecordMessage?: {
    heading?: string
    body: string
    missingItem?: string
  }
  unclearMessage?: {
    heading?: string
    body: string
  }
  recordAnswer?: RecordAnswerPayload
  generalAnswer?: GeneralAnswerPayload
  disclaimer?: string
}

export const SUGGESTED_HEALTH_ACTIONS = [
  {
    id: 'report',
    label: 'Explain my latest report',
    labelHi: 'मेरी नवीनतम रिपोर्ट समझाएं',
    prompt: 'Explain my latest report',
    icon: FlaskConical,
    iconColor: 'bg-teal-50 text-teal-700',
  },
  {
    id: 'meds',
    label: 'Explain my medicines',
    labelHi: 'मेरी दवाएं समझाएं',
    prompt: 'Explain my medicines',
    icon: Pill,
    iconColor: 'bg-sky-50 text-sky-700',
  },
  {
    id: 'sugar',
    label: 'Show my blood sugar trend',
    labelHi: 'मेरा ब्लड शुगर ट्रेंड दिखाएं',
    prompt: 'Show my blood sugar trend',
    icon: Droplets,
    iconColor: 'bg-amber-50 text-amber-700',
  },
  {
    id: 'bp',
    label: 'Show my blood pressure trend',
    labelHi: 'मेरा ब्लड प्रेशर ट्रेंड दिखाएं',
    prompt: 'Show my blood pressure trend',
    icon: Activity,
    iconColor: 'bg-blue-50 text-blue-700',
  },
  {
    id: 'doctor',
    label: 'What should I ask my doctor?',
    labelHi: 'मुझे डॉक्टर से क्या पूछना चाहिए?',
    prompt: 'What should I ask my doctor?',
    icon: Stethoscope,
    iconColor: 'bg-violet-50 text-violet-700',
  },
]

const HEALTH_KEYWORDS = [
  'health', 'record', 'report', 'test', 'blood', 'cbc', 'lab', 'hemoglobin', 'hb', 'hba1c', 'a1c',
  'wbc', 'platelet', 'creatinine', 'egfr', 'bun', 'urine', 'sugar', 'glucose', 'diabetes', 'diabetic',
  'prediabetes', 'bp', 'pressure', 'hypertension', 'heart', 'cardiac', 'cardio', 'pulse', 'rate',
  'medicine', 'medication', 'pill', 'prescription', 'dose', 'tablet', 'rx', 'drug', 'antibiotic',
  'amoxicillin', 'pantoprazole', 'vitamin', 'vit', 'paracetamol', 'doctor', 'dr', 'appointment',
  'consult', 'consultation', 'clinic', 'hospital', 'discharge', 'menon', 'sen', 'mehta', 'verma',
  'kidney', 'renal', 'liver', 'cholesterol', 'vitals', 'trend', 'diet', 'food', 'nutrition', 'water',
  'hydration', 'exercise', 'walk', 'sleep', 'fever', 'cough', 'cold', 'pain', 'headache', 'chest',
  'breath', 'fatigue', 'tired', 'dizzy', 'symptom', 'sick', 'illness', 'infection', 'allergy',
  'recovery', 'condition', 'screening', 'fasting', 'post-meal', 'ppbs', 'mg/dl', 'mmhg', 'bpm'
]

function isHealthRelated(normalized: string): boolean {
  return HEALTH_KEYWORDS.some((kw) => {
    if (kw.length <= 3) {
      const regex = new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i')
      return regex.test(normalized)
    }
    return normalized.includes(kw)
  })
}

function isGreeting(normalized: string): boolean {
  const clean = normalized.trim().replace(/[?!.,]/g, '')
  const exactGreetings = [
    'hi', 'hello', 'hey', 'namaste', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'hi there', 'hello there', 'hey there', 'howdy', 'hola'
  ]
  if (exactGreetings.includes(clean)) return true
  const greetingRegex = /^(hi|hello|hey|namaste)\b/i
  if (greetingRegex.test(clean) && !isHealthRelated(normalized)) {
    return true
  }
  return false
}

function isGibberish(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true

  const lower = trimmed.toLowerCase()
  if (isHealthRelated(lower)) return false
  if (isGreeting(lower)) return false

  const clean = lower.replace(/[^a-z0-9\s]/g, '').trim()
  if (!clean) return true

  // Valid short medical abbreviations & units
  const validShortMedical = [
    'bp', 'rx', 'dr', 'cbc', 'hb', 'wbc', 'a1c', 'hba1c', 'egfr', 'bun',
    'lab', 'flu', 'ekg', 'ecg', 'bmi', 'icu', 'med', 'doc', 'mg', 'dl', 'bpm', 'hr'
  ]
  if (validShortMedical.includes(clean)) return false

  // Very short non-medical input (< 3 characters)
  if (clean.length < 3) return true

  // Common keyboard smashes and test patterns
  const keyboardSmashes = [
    'jhk', 'jhgh', 'jhg', 'ghj', 'ghjk', 'asdf', 'asdfg', 'asdfgh', 'asdfghj', 'asdfghjkl',
    'qwe', 'qwer', 'qwerty', 'qwertyu', 'zxc', 'zxcv', 'zxcvb', 'zxcvbn', 'zxcvbnm',
    'xyz', 'xyz123', 'hjk', 'hjkl', 'dfg', 'dfgh', 'bnm', 'asd', 'fgh',
    'klj', 'lkj', 'mnb', 'poi', 'poiu', 'poiuy', 'tyu', 'tyui', 'rty', 'cvb', 'vbn',
    'test', 'testing', 'abc', 'abcd', '123', '1234', '12345', 'aaa', 'bbb', 'xxx', 'zzz',
    'bla', 'blabla', 'blah', 'blahblah', 'stuff', 'random', 'idk', 'dunno', 'huh', 'what', 'k'
  ]
  if (keyboardSmashes.includes(clean)) return true

  // Single character repeated 3 or more times (e.g., "aaaa", "zzzz", "1111")
  if (/^(.)\1{2,}$/.test(clean.replace(/\s/g, ''))) return true

  const words = clean.split(/\s+/).filter(Boolean)

  // Only digits
  if (words.every((w) => /^\d+$/.test(w))) return true

  // Words with length >= 3 that have no vowels
  const noVowelWords = words.filter((w) => w.length >= 3 && !/[aeiouy]/.test(w))
  if (noVowelWords.length > 0 && noVowelWords.length === words.length) {
    return true
  }

  // Extreme consonant cluster in any word
  for (const w of words) {
    if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(w) && !/^(stre|thro|thro|schm|chri)/i.test(w)) {
      return true
    }
  }

  // For 1-2 words that are neither medical nor greetings, check if they exist in basic English vocabulary
  const COMMON_WORDS = new Set([
    'how', 'what', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'should', 'would',
    'is', 'are', 'am', 'was', 'were', 'do', 'does', 'did', 'have', 'has', 'had', 'will',
    'help', 'need', 'want', 'tell', 'explain', 'show', 'check', 'give', 'know', 'see',
    'my', 'your', 'me', 'i', 'you', 'we', 'they', 'it', 'this', 'that', 'about', 'for',
    'with', 'and', 'or', 'but', 'not', 'no', 'yes', 'ok', 'okay', 'thanks', 'thank',
    'good', 'bad', 'pain', 'hurt', 'feel', 'feeling', 'today', 'now', 'water', 'food',
    'eat', 'drink', 'sleep', 'walk', 'run', 'work', 'stress', 'body', 'diet', 'care',
    'safe', 'take', 'stop', 'start', 'normal', 'high', 'low', 'more', 'less', 'better', 'worse'
  ])

  if (words.length <= 2) {
    const hasRecognizableWord = words.some((w) => COMMON_WORDS.has(w))
    if (!hasRecognizableWord) {
      return true
    }
  }

  return false
}

const ACTION_CARDS = [
  {
    id: 'explain-report',
    kicker: 'LATEST TEST',
    prompt: 'Explain my latest report',
    description: 'See what your 07 Oct CBC blood test and hemoglobin result mean in plain language.',
    icon: FlaskConical,
    iconColor: 'bg-sky-50 text-sky-700',
  },
  {
    id: 'explain-meds',
    kicker: 'MEDICATIONS',
    prompt: 'Explain my medicines',
    description: 'Check what each of your 4 medicines does, timing, and doctor instructions.',
    icon: Pill,
    iconColor: 'bg-teal-50 text-teal-700',
  },
  {
    id: 'health-changed',
    kicker: 'RECENT SHIFTS',
    prompt: 'What changed in my health recently?',
    description: 'Compare your September hospital recovery and October lab readings.',
    icon: TrendingUp,
    iconColor: 'bg-amber-50 text-amber-700',
  },
  {
    id: 'doctor-questions',
    kicker: 'APPOINTMENT PREP',
    prompt: 'What should I discuss with my doctor?',
    description: 'Organized, focused questions for your upcoming consultation with Dr. Menon.',
    icon: Stethoscope,
    iconColor: 'bg-violet-50 text-violet-700',
  },
  {
    id: 'bp-trend',
    kicker: 'BLOOD PRESSURE',
    prompt: 'Show my blood pressure trend',
    description: 'Review your resting blood pressure (118/76 mmHg) and pulse history.',
    icon: Activity,
    iconColor: 'bg-blue-50 text-blue-700',
  },
  {
    id: 'sugar-trend',
    kicker: 'BLOOD SUGAR',
    prompt: 'Show my blood sugar trend',
    description: 'Check fasting sugar (118 mg/dL) and post-meal readings against targets.',
    icon: Droplets,
    iconColor: 'bg-teal-50 text-teal-700',
  },
]

export const GENERAL_ACTION_CARDS = [
  {
    id: 'normal-bp',
    kicker: 'BLOOD PRESSURE',
    prompt: 'What is a normal blood pressure range?',
    description: 'Learn standard systolic and diastolic targets for healthy adults.',
    icon: Activity,
    iconColor: 'bg-blue-50 text-blue-700',
  },
  {
    id: 'hb-role',
    kicker: 'HEMOGLOBIN',
    prompt: 'How does hemoglobin affect energy levels?',
    description: 'Understand the oxygen-carrying role of hemoglobin and iron absorption.',
    icon: FlaskConical,
    iconColor: 'bg-teal-50 text-teal-700',
  },
  {
    id: 'general-doc',
    kicker: 'DOCTOR VISIT',
    prompt: 'What questions should I ask my doctor during a checkup?',
    description: 'Organize your thoughts, symptoms, and concerns before your appointment.',
    icon: Stethoscope,
    iconColor: 'bg-violet-50 text-violet-700',
  },
  {
    id: 'sugar-habits',
    kicker: 'BLOOD SUGAR',
    prompt: 'What habits help maintain healthy blood sugar?',
    description: 'Everyday nutritional pacing, dietary fiber, and light post-meal movement.',
    icon: Droplets,
    iconColor: 'bg-amber-50 text-amber-700',
  },
  {
    id: 'med-safety',
    kicker: 'MEDICATIONS',
    prompt: 'What should I verify before starting a new medication?',
    description: 'Checking dosing schedules, potential food interactions, and precautions.',
    icon: Pill,
    iconColor: 'bg-sky-50 text-sky-700',
  },
]

export interface SavedConversation {
  id: string
  title: string
  titleHi?: string
  dateLabel: string
  dateLabelHi?: string
  updatedAt: number
  category: 'report' | 'meds' | 'sugar' | 'bp' | 'doctor' | 'general'
  latestUserMessage: string
  messages: ChatMessage[]
}

export const DEFAULT_CONVERSATIONS: SavedConversation[] = [
  {
    id: 'conv-cbc',
    title: 'CBC Report',
    titleHi: 'सीबीसी रिपोर्ट',
    dateLabel: 'Today · 9:45 AM',
    dateLabelHi: 'आज · सुबह 9:45',
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    category: 'report',
    latestUserMessage: 'Explain my latest blood test',
    messages: [
      {
        id: 'msg-cbc-u',
        sender: 'user',
        timestamp: 'Today · 9:45 AM',
        text: 'Explain my latest blood test',
      },
      {
        id: 'msg-cbc-b',
        sender: 'assistant',
        timestamp: 'Today · 9:45 AM',
        recordAnswer: {
          shortAnswer:
            'Based on your records, your latest CBC report dated 7 October shows hemoglobin of 10.8 g/dL.',
          keyMeasurement: {
            label: 'Your latest result',
            value: '10.8 g/dL',
            context: 'Usual reference range: 12.0 – 15.5 g/dL',
          },
          whatThisMeans: [
            'Hemoglobin is the protein in red blood cells that carries oxygen to your body.',
            'A result of 10.8 g/dL is mildly lower than typical targets, which can sometimes cause mild tiredness.',
            'Your White Blood Cells (7.2 ×10³/µL) and Platelets (245 ×10³/µL) are healthy and normal.',
            'Because one result can have many causes, it is worth discussing this with your doctor.',
          ],
          whatToDoNext: [
            'Discuss this result with Dr. Menon during your consultation tomorrow.',
            'Ask if a follow-up blood count or iron check is advised in 4 to 6 weeks.',
            'Include iron-rich foods (spinach, lentils, beans) alongside vitamin C in your meals.',
          ],
          sources: [
            {
              title: 'CBC Blood Test',
              date: '07 Oct 2026',
              kind: 'lab',
              regionKey: 'hb',
              targetView: 'summary',
            },
          ],
        },
        generalAnswer: {
          shortAnswer:
            'Iron from meals is absorbed much more effectively when paired with vitamin C.',
          details: [
            'Foods like citrus fruits, tomatoes, and bell peppers help your body absorb plant iron.',
            'Tea or coffee taken right after meals can reduce iron absorption.',
          ],
          helpfulTip:
            'A squeeze of fresh lemon juice over lentils or spinach significantly boosts natural iron absorption.',
        },
        disclaimer:
          'HealthCopilot does not diagnose medical conditions. Always review lab tests with your doctor.',
      },
    ],
  },
  {
    id: 'conv-meds',
    title: 'My Medicines',
    titleHi: 'मेरी दवाएं',
    dateLabel: 'Today · 8:30 AM',
    dateLabelHi: 'आज · सुबह 8:30',
    updatedAt: Date.now() - 1000 * 60 * 60 * 3,
    category: 'meds',
    latestUserMessage: 'Explain my medicines',
    messages: [
      {
        id: 'msg-meds-u',
        sender: 'user',
        timestamp: 'Today · 8:30 AM',
        text: 'Explain my medicines',
      },
      {
        id: 'msg-meds-b',
        sender: 'assistant',
        timestamp: 'Today · 8:30 AM',
        recordAnswer: {
          shortAnswer:
            'Based on your records, your recent prescription dated 04 October from Dr. R. Menon lists 4 medicines recorded in your health profile.',
          keyMeasurement: {
            label: 'Active medicines',
            value: '4 prescriptions',
            context: '1 completing tomorrow, 3 ongoing / as-needed',
          },
          whatThisMeans: [
            'Amoxicillin 500 mg: Antibiotic taken twice daily with meals. Finishing tomorrow (Day 4 of 5).',
            'Pantoprazole 40 mg: Stomach acid protection taken once daily 30 minutes before breakfast.',
            'Vitamin D3 60,000 IU: Once weekly replenishment taken with milk or after a meal.',
            'Paracetamol 650 mg: Only taken as needed for fever or body ache.',
          ],
          whatToDoNext: [
            'Finish the final 24 hours of Amoxicillin on schedule as prescribed.',
            'Take Pantoprazole on an empty stomach first thing in the morning.',
            'Confirm the handwritten medicine on your 04 Oct prescription with Dr. Menon tomorrow.',
          ],
          sources: [
            {
              title: 'Prescription by Dr. R. Menon',
              date: '04 Oct 2026',
              kind: 'rx',
              regionKey: 'med1',
              targetView: 'medications',
            },
            {
              title: 'Hospital Discharge Summary',
              date: '12 Sep 2026',
              kind: 'vitals',
              targetView: 'timeline',
            },
          ],
        },
        generalAnswer: {
          shortAnswer:
            'Completing prescribed antibiotics is essential even if symptoms have cleared.',
          details: [
            'Stopping antibiotics early can allow bacteria to regain strength and develop resistance.',
            'Proton-pump medicines like Pantoprazole work best when taken before food activates stomach acid pumps.',
          ],
          helpfulTip:
            'Always keep prescriptions in their original strips so you can check expiration dates and doctor instructions.',
        },
        disclaimer:
          'Never change or stop your prescribed medication dosages without consulting your doctor.',
      },
    ],
  },
  {
    id: 'conv-sugar',
    title: 'Blood Sugar',
    titleHi: 'ब्लड शुगर',
    dateLabel: 'Yesterday',
    dateLabelHi: 'कल',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    category: 'sugar',
    latestUserMessage: 'Show my blood sugar trend',
    messages: [
      {
        id: 'msg-sugar-u',
        sender: 'user',
        timestamp: 'Yesterday',
        text: 'Show my blood sugar trend',
      },
      {
        id: 'msg-sugar-b',
        sender: 'assistant',
        timestamp: 'Yesterday',
        recordAnswer: {
          shortAnswer:
            'Based on your records, your latest metabolic log dated 07 October shows fasting blood sugar of 118 mg/dL and post-meal glucose of 156 mg/dL.',
          keyMeasurement: {
            label: 'Latest post-meal reading',
            value: '156 mg/dL',
            context: 'Target: < 140 mg/dL · Fasting: 118 mg/dL',
          },
          whatThisMeans: [
            'Fasting blood sugar of 118 mg/dL is slightly above the standard healthy target of under 100 mg/dL.',
            'Post-meal glucose of 156 mg/dL indicates your body takes slightly longer to clear sugar after carbohydrate meals.',
            'Your 3-month HbA1c of 6.4% sits at the upper edge of the prediabetes range (5.7 – 6.4%).',
            'This is not a sudden diagnosis of diabetes, but a pattern that can often improve with simple daily adjustments.',
          ],
          whatToDoNext: [
            'Take a gentle 10 to 15 minute walk after lunch and dinner.',
            'Pair carbohydrates with vegetables, lentils, or nuts to blunt glucose spikes.',
            'Discuss dietary suggestions and follow-up screening with Dr. Ananya Sen.',
          ],
          sources: [
            {
              title: 'Metabolic Log',
              date: '07 Oct 2026',
              kind: 'lab',
              regionKey: 'hb',
              targetView: 'conditions',
              targetExtra: { conditionId: 'diabetes' },
            },
            {
              title: 'Laboratory Panel',
              date: '12 Sep 2026',
              kind: 'lab',
              targetView: 'conditions',
              targetExtra: { conditionId: 'diabetes' },
            },
          ],
        },
        generalAnswer: {
          shortAnswer:
            'Gentle movement after meals helps muscles absorb blood sugar naturally without requiring extra insulin.',
          details: [
            'Walking 10 minutes after eating can lower peak blood sugar rises by up to 20%.',
            'Eating fiber and protein first before rice or bread helps smooth digestion.',
          ],
          helpfulTip:
            'Drinking a glass of water before meals also aids digestion and satiety.',
        },
        disclaimer:
          'Consult your physician or endocrinologist before making major dietary or medical changes.',
      },
    ],
  },
  {
    id: 'conv-doctor',
    title: 'Doctor Appointment',
    titleHi: 'डॉक्टर अपॉइंटमेंट',
    dateLabel: 'Yesterday',
    dateLabelHi: 'कल',
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    category: 'doctor',
    latestUserMessage: 'What should I ask my doctor?',
    messages: [
      {
        id: 'msg-doc-u',
        sender: 'user',
        timestamp: 'Yesterday',
        text: 'What should I ask my doctor?',
      },
      {
        id: 'msg-doc-b',
        sender: 'assistant',
        timestamp: 'Yesterday',
        recordAnswer: {
          shortAnswer:
            'Based on your records, here are 3 concise talking points for your consultation with Dr. Menon tomorrow at 10:30 AM.',
          keyMeasurement: {
            label: 'Upcoming appointment',
            value: 'Tomorrow · 10:30 AM',
            context: 'Dr. R. Menon · Sunrise Family Clinic',
          },
          whatThisMeans: [
            'Hemoglobin 10.8 g/dL: Mildly lower than the usual 12.0 – 15.5 g/dL target.',
            'Amoxicillin completion: Finishes tomorrow (Day 5 of 5) for respiratory recovery.',
            'Post-meal glucose 156 mg/dL: Suggests discussing simple nutrition or follow-up tests.',
          ],
          whatToDoNext: [
            'Question 1: "Should I repeat the CBC blood test or check ferritin in 4 to 6 weeks to ensure my hemoglobin recovers?"',
            'Question 2: "Can you confirm the handwritten medicine name on my 04 Oct prescription?"',
            'Question 3: "Do you recommend any dietary changes or follow-up for my 156 mg/dL post-meal glucose reading?"',
          ],
          sources: [
            {
              title: 'CBC Blood Test',
              date: '07 Oct 2026',
              kind: 'lab',
              regionKey: 'hb',
              targetView: 'summary',
            },
            {
              title: 'Prescription by Dr. R. Menon',
              date: '04 Oct 2026',
              kind: 'rx',
              regionKey: 'med1',
              targetView: 'medications',
            },
          ],
        },
        generalAnswer: {
          shortAnswer:
            'Doctors appreciate short, organized questions that connect your symptoms, medications, and test numbers.',
          details: [
            'Write down your top 2 or 3 questions before stepping into the consultation room.',
            'Mention how you have been feeling physically since finishing your medicines.',
          ],
          helpfulTip:
            'You can show this screen directly to your doctor during your consultation.',
        },
        disclaimer:
          'HealthCopilot helps you organize your thoughts for your doctor. Your doctor makes all clinical decisions.',
      },
    ],
  },
]

const CATEGORY_ICON_MAP: Record<SavedConversation['category'], { icon: any; color: string }> = {
  report: { icon: FlaskConical, color: 'bg-teal-50 text-teal-700' },
  meds: { icon: Pill, color: 'bg-sky-50 text-sky-700' },
  sugar: { icon: Droplets, color: 'bg-amber-50 text-amber-700' },
  bp: { icon: Activity, color: 'bg-blue-50 text-blue-700' },
  doctor: { icon: Stethoscope, color: 'bg-violet-50 text-violet-700' },
  general: { icon: MessageSquare, color: 'bg-slate-100 text-slate-700' },
}

function formatChatTimestamp(): string {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `Today · ${displayHours}:${minutes} ${ampm}`
}

function generateChatTitle(firstPrompt: string): { title: string; category: SavedConversation['category'] } {
  const norm = firstPrompt.toLowerCase().trim()
  if (!norm || isGibberish(firstPrompt)) {
    return { title: 'New Health Chat', category: 'general' }
  }
  if (norm.includes('report') || norm.includes('cbc') || norm.includes('hemoglobin') || norm.includes('blood test')) {
    return { title: 'Latest Report', category: 'report' }
  }
  if (norm.includes('medicine') || norm.includes('medication') || norm.includes('pill') || norm.includes('prescription')) {
    return { title: 'My Medicines', category: 'meds' }
  }
  if (norm.includes('sugar') || norm.includes('glucose') || norm.includes('diabetes')) {
    return { title: 'Blood Sugar', category: 'sugar' }
  }
  if (norm.includes('blood pressure') || norm.includes('bp') || norm.includes('hypertension')) {
    return { title: 'Blood Pressure', category: 'bp' }
  }
  if (norm.includes('doctor') || norm.includes('appointment') || norm.includes('discuss')) {
    return { title: 'Doctor Appointment', category: 'doctor' }
  }
  if (norm.includes('kidney') || norm.includes('egfr') || norm.includes('creatinine')) {
    return { title: 'Kidney Health', category: 'report' }
  }
  if (norm.includes('change') || norm.includes('month') || norm.includes('summarize')) {
    return { title: 'Recent Health Shifts', category: 'report' }
  }
  const clean = firstPrompt.replace(/[?!.]/g, '').trim()
  if (clean.length <= 25) {
    return { title: clean.charAt(0).toUpperCase() + clean.slice(1), category: 'general' }
  }
  const words = clean.split(/\s+/)
  const shortened = words.slice(0, 3).join(' ')
  return { title: shortened.charAt(0).toUpperCase() + shortened.slice(1), category: 'general' }
}

function detectMissingHealthTopic(normalized: string): string | null {
  const missingKeywords: Record<string, string> = {
    cholesterol: 'cholesterol or lipid panel',
    lipid: 'lipid profile',
    triglyceride: 'triglycerides test',
    ldl: 'LDL cholesterol test',
    hdl: 'HDL cholesterol test',
    thyroid: 'thyroid (TSH) test',
    tsh: 'TSH thyroid test',
    b12: 'vitamin B12 test',
    'vitamin b12': 'vitamin B12 test',
    calcium: 'serum calcium test',
    uric: 'uric acid test',
    urine: 'urinalysis / urine report',
    urinalysis: 'urine report',
    xray: 'chest X-ray',
    'x-ray': 'X-ray scan',
    mri: 'MRI scan',
    ct: 'CT scan',
    ultrasound: 'ultrasound report',
    scan: 'imaging scan report',
    allergy: 'allergy panel',
    asthma: 'asthma diagnosis record',
    cancer: 'oncology screening record',
    covid: 'COVID test or vaccination record',
    vaccine: 'vaccination record',
    temperature: 'body temperature log',
    weight: 'body weight log',
  }

  for (const [kw, label] of Object.entries(missingKeywords)) {
    if (normalized.includes(kw)) return label
  }
  return null
}

function getGeneralGuidance(normalized: string, topic?: string | null): GeneralAnswerPayload {
  if (topic?.includes('cholesterol') || normalized.includes('cholesterol') || normalized.includes('lipid')) {
    return {
      shortAnswer: 'Total cholesterol for healthy adults is generally recommended to remain under 200 mg/dL.',
      details: [
        'LDL ("bad") cholesterol carries lipids into artery walls; lower values (< 100 mg/dL) are generally targeted.',
        'HDL ("good") cholesterol carries excess cholesterol back to the liver for clearance (> 40 mg/dL for men, > 50 mg/dL for women).',
        'A fasting lipid profile is typically advised every 1 to 5 years depending on cardiovascular risk factors.',
      ],
      helpfulTip: 'Soluble fiber from oats, beans, lentils, and apples naturally helps bind digestive cholesterol.',
    }
  }
  if (topic?.includes('thyroid') || normalized.includes('thyroid') || normalized.includes('tsh')) {
    return {
      shortAnswer: 'Thyroid Stimulating Hormone (TSH) normally ranges between 0.4 and 4.0 mIU/L for most adults.',
      details: [
        'TSH is released by the pituitary gland to regulate thyroid hormone production (T3 and T4).',
        'Elevated TSH can indicate an underactive thyroid (hypothyroidism), while suppressed TSH points toward overactivity (hyperthyroidism).',
        'Common symptoms of thyroid imbalance include unexplained fatigue, weight changes, and cold or heat sensitivity.',
      ],
      helpfulTip: 'A simple morning blood test can accurately evaluate thyroid function if you experience chronic fatigue.',
    }
  }
  if (topic?.includes('b12') || normalized.includes('b12') || normalized.includes('vitamin')) {
    return {
      shortAnswer: 'Vitamin B12 is essential for red blood cell formation, brain function, and cellular metabolism.',
      details: [
        'Standard laboratory reference ranges for serum B12 are typically 200 to 900 pg/mL.',
        'Deficiency can cause persistent fatigue, tingling sensations in hands or feet, and mild cognitive fog.',
        'People following plant-based diets or experiencing digestive absorption shifts often benefit from periodic checks.',
      ],
      helpfulTip: 'Taking B-complex vitamins with breakfast enhances daytime energy support and absorption.',
    }
  }
  if (normalized.includes('blood pressure') || normalized.includes('bp') || normalized.includes('hypertension')) {
    return {
      shortAnswer: 'A healthy resting blood pressure for adults is defined as systolic under 120 mmHg and diastolic under 80 mmHg.',
      details: [
        'Systolic pressure (top number) measures the force exerted when the heart muscle pumps blood.',
        'Diastolic pressure (bottom number) measures arterial resistance while the heart rests between beats.',
        'Limiting daily sodium to under 2,000 mg, moderate physical activity, and restorative sleep protect blood vessel flexibility.',
      ],
      helpfulTip: 'Sit quietly with your back supported and feet flat for 5 minutes before taking a resting blood pressure reading.',
    }
  }
  if (normalized.includes('hemoglobin') || normalized.includes('cbc') || normalized.includes('blood test') || normalized.includes('iron')) {
    return {
      shortAnswer: 'Hemoglobin is the iron-rich protein in red blood cells that transports oxygen throughout your body.',
      details: [
        'Standard reference ranges are typically 13.8 – 17.2 g/dL for adult males and 12.1 – 15.1 g/dL for non-pregnant adult females.',
        'Mildly lower values can sometimes result in reduced stamina, pale skin, or mild breathlessness during exercise.',
        'Iron absorption from lentils, leafy greens, and beans is significantly boosted when consumed alongside vitamin C.',
      ],
      helpfulTip: 'Squeezing fresh lemon juice over iron-rich foods like lentils or spinach can double or triple natural iron absorption.',
    }
  }
  if (normalized.includes('sugar') || normalized.includes('glucose') || normalized.includes('diabetes')) {
    return {
      shortAnswer: 'Standard fasting blood glucose for healthy adults is normally between 70 and 99 mg/dL.',
      details: [
        'Fasting sugar of 100 to 125 mg/dL is categorized as impaired fasting glucose (prediabetes); 126 mg/dL or higher warrants medical evaluation.',
        'Post-meal glucose two hours after eating is generally expected to stay below 140 mg/dL.',
        'A gentle 10 to 15 minute walk after meals allows active muscles to absorb circulating glucose without requiring extra insulin.',
      ],
      helpfulTip: 'Consuming vegetables and fiber before carbohydrates in meals blunts post-meal glucose spikes significantly.',
    }
  }
  if (normalized.includes('medicine') || normalized.includes('medication') || normalized.includes('pill') || normalized.includes('prescription')) {
    return {
      shortAnswer: 'Safe medication use involves adhering to dosing schedules, understanding food timing, and completing prescribed courses.',
      details: [
        'Always check with your doctor or pharmacist whether medications should be taken before food or after meals.',
        'Never stop prescribed antibiotics early, even if you feel completely healthy, to prevent bacterial recurrence.',
        'Keep an updated list of your current prescriptions, dosages, and vitamins to share with your physician during visits.',
      ],
      helpfulTip: 'Always store medicines in their original labeled blister packs so expiration dates and instructions remain clear.',
    }
  }
  if (normalized.includes('doctor') || normalized.includes('appointment') || normalized.includes('consult')) {
    return {
      shortAnswer: 'Preparing 2 to 3 concise questions connecting your physical symptoms, medications, and recent test results maximizes consultation value.',
      details: [
        'Write down changes you have noticed in sleep, stamina, or digestion since your previous consultation.',
        'Bring your actual prescription strips or recent diagnostic printouts directly to the consultation.',
        'Ask your doctor clearly what follow-up steps, screenings, or lifestyle adjustments are recommended over the next month.',
      ],
      helpfulTip: 'Ask your doctor: "What is the single most important number or symptom I should monitor at home?"',
    }
  }
  return {
    shortAnswer: 'General health guidelines emphasize adequate hydration, balanced nutrition, daily movement, and routine preventive checkups.',
    details: [
      'Aim for 7 to 8 hours of quality sleep to support natural immune defense and cellular recovery.',
      'Staying active with 150 minutes of moderate aerobic exercise weekly protects cardiovascular longevity.',
      'Always review any unexplained test values or persistent new symptoms directly with your licensed physician.',
    ],
    helpfulTip: 'Keeping organized records of all medical tests helps healthcare providers make informed clinical decisions.',
  }
}

export function HealthChat({
  userName = 'Alex',
  initialPrompt,
  onNavigate,
  hasRecords: initialHasRecords = true,
}: {
  userName?: string
  initialPrompt?: string
  onNavigate?: (viewId: string, extra?: any) => void
  hasRecords?: boolean
}) {
  const L = useL()
  const ev = useEvidence()
  const toast = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [hasRecords, setHasRecords] = useState(initialHasRecords)

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<SavedConversation[]>(() => {
    if (!initialHasRecords) return []
    try {
      const stored = localStorage.getItem('healthcopilot_chat_history')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_CONVERSATIONS
  })

  useEffect(() => {
    setHasRecords(initialHasRecords)
    if (!initialHasRecords) {
      setMessages([])
      setConversations([])
    } else {
      setConversations(DEFAULT_CONVERSATIONS)
    }
  }, [initialHasRecords])
  const [currentChatId, setCurrentChatId] = useState<string>(() => `chat-${Date.now()}`)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<SavedConversation | null>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (conversationToDelete) {
          setConversationToDelete(null)
        } else if (isHistoryOpen) {
          setIsHistoryOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [conversationToDelete, isHistoryOpen])

  const saveCurrentConversation = (currentMsgs: ChatMessage[], chatId: string) => {
    if (currentMsgs.length === 0) return

    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === chatId)
      const latestUser = [...currentMsgs].reverse().find((m) => m.sender === 'user')?.text || 'Health query'
      const firstUser = currentMsgs.find((m) => m.sender === 'user')?.text || latestUser

      let updated: SavedConversation[]
      if (existingIndex >= 0) {
        const existing = prev[existingIndex]
        const updatedItem: SavedConversation = {
          ...existing,
          updatedAt: Date.now(),
          dateLabel: formatChatTimestamp(),
          latestUserMessage: latestUser,
          messages: currentMsgs,
        }
        updated = [updatedItem, ...prev.filter((_, i) => i !== existingIndex)]
      } else {
        const meta = generateChatTitle(firstUser)
        const newItem: SavedConversation = {
          id: chatId,
          title: meta.title,
          dateLabel: formatChatTimestamp(),
          updatedAt: Date.now(),
          category: meta.category,
          latestUserMessage: latestUser,
          messages: currentMsgs,
        }
        updated = [newItem, ...prev]
      }

      try {
        localStorage.setItem('healthcopilot_chat_history', JSON.stringify(updated))
      } catch (e) {
        console.warn('Could not save chat history to localStorage', e)
      }

      // Sync to Firestore if user is authenticated
      if (auth.currentUser) {
        const activeItem = updated.find((c) => c.id === chatId)
        if (activeItem) {
          createChatSession(auth.currentUser.uid, activeItem.title)
            .then(() => {
              const lastMsg = currentMsgs[currentMsgs.length - 1]
              if (lastMsg && auth.currentUser) {
                const text = lastMsg.text || lastMsg.recordAnswer?.shortAnswer || lastMsg.generalAnswer?.shortAnswer || 'Consultation response'
                sendChatMessage(chatId, auth.currentUser.uid, lastMsg.sender, text)
              }
            })
            .catch((err) => console.warn('Chat sync status:', err))
        }
      }

      return updated
    })
  }

  const handleSelectConversation = (conv: SavedConversation) => {
    if (messages.length > 0 && currentChatId !== conv.id) {
      saveCurrentConversation(messages, currentChatId)
    }
    setMessages(conv.messages)
    setCurrentChatId(conv.id)
    setIsHistoryOpen(false)
    toast(`Loaded conversation: "${conv.title}"`, 'ok')
  }

  const handleConfirmDelete = (id: string) => {
    if (auth.currentUser) {
      deleteChatSession(id).catch((err) => console.warn('Delete chat session status:', err))
    }
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      try {
        localStorage.setItem('healthcopilot_chat_history', JSON.stringify(updated))
      } catch {}
      return updated
    })

    if (currentChatId === id) {
      setMessages([])
      setCurrentChatId(`chat-${Date.now()}`)
      toast('Active conversation deleted. Started a new chat.', 'ok')
    } else {
      toast('Conversation removed from history', 'ok')
    }

    setConversationToDelete(null)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendPrompt(initialPrompt)
    }
  }, [initialPrompt])

  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast('Voice input is not supported in this browser. Please type your question.', 'warn')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = L('en-US', 'hi-IN')
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
        toast('Listening... Speak your question now', 'ok')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        if (transcript) {
          setInput(transcript)
          handleSendPrompt(transcript)
        }
        setIsListening(false)
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event?.error)
        setIsListening(false)
        if (event?.error === 'not-allowed') {
          toast('Microphone access was denied. Please allow microphone access or type.', 'warn')
        } else {
          toast('Could not detect speech. Please try again or type your question.', 'warn')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('SpeechRecognition init error:', err)
      setIsListening(false)
      toast('Voice input unavailable in this browser session.', 'warn')
    }
  }

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

    const runLocalFallback = () => {
      setIsTyping(false)

      const normalized = promptText.toLowerCase()
      let assistantMsg: ChatMessage

      // 1. EMERGENCY SAFETY CHECK
      const isEmergencyQuery =
        normalized.includes('chest pain') ||
        normalized.includes('heart attack') ||
        normalized.includes('severe pain') ||
        normalized.includes('cannot breathe') ||
        normalized.includes("can't breathe") ||
        normalized.includes('shortness of breath') ||
        normalized.includes('difficulty breathing') ||
        normalized.includes('fainted') ||
        normalized.includes('fainting') ||
        normalized.includes('passed out') ||
        normalized.includes('stroke') ||
        normalized.includes('face drooping') ||
        normalized.includes('slurred speech') ||
        normalized.includes('allergic reaction') ||
        normalized.includes('anaphylaxis') ||
        normalized.includes('coughing blood')

      if (isEmergencyQuery) {
        assistantMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          isEmergency: true,
          recordAnswer: {
            shortAnswer:
              '⚠️ IMMEDIATE MEDICAL CARE RECOMMENDED: The symptoms you described require urgent in-person medical evaluation.',
            whatThisMeans: [
              'Sudden chest pain, difficulty breathing, or stroke symptoms are medical emergencies.',
              'HealthCopilot cannot evaluate or treat acute emergencies.',
              'Emergency medical services can start care immediately while taking you to a hospital.',
            ],
            whatToDoNext: [
              'Call emergency services (112 / 108 / 911) right now.',
              'Sit in a comfortable position and alert someone nearby.',
              'Do not attempt to drive yourself to the hospital.',
            ],
            sources: [],
          },
          disclaimer:
            'HealthCopilot is strictly for informational health support. Never delay emergency care.',
        }
      } else if (isGibberish(promptText)) {
        // 2. GIBBERISH / UNCLEAR INPUT HANDLING (No fake record cross-reference)
        assistantMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          isUnclear: true,
          unclearMessage: {
            heading: L("I didn't quite understand that.", "मुझे यह समझ नहीं आया।"),
            body: L(
              'Try asking me about your reports, medicines, health conditions, appointments, or health trends.',
              'अपनी रिपोर्ट, दवाओं, स्वास्थ्य स्थितियों, अपॉइंटमेंट या ट्रेंड्स के बारे में पूछने का प्रयास करें।'
            ),
          },
          disclaimer: L(
            'HealthCopilot is designed to answer questions about your health records and wellness.',
            'HealthCopilot आपके स्वास्थ्य रिकॉर्ड और स्वास्थ्य के बारे में सवालों के जवाब देने के लिए डिज़ाइन किया गया है।'
          ),
        }
      } else if (isGreeting(normalized)) {
        // 3. FRIENDLY GREETING
        assistantMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          isGreeting: true,
          unclearMessage: {
            heading: L(`Hello ${userName}! How can I help with your health?`, `नमस्ते ${userName}! मैं आपके स्वास्थ्य में कैसे मदद कर सकता हूँ?`),
            body: L(
              'Ask questions about your health records, reports, medicines, appointments, or health trends.',
              'अपने स्वास्थ्य रिकॉर्ड, रिपोर्ट, दवाओं, अपॉइंटमेंट या स्वास्थ्य ट्रेंड्स के बारे में प्रश्न पूछें।'
            ),
          },
          disclaimer: L(
            'HealthCopilot is designed to answer questions about your health records and wellness.',
            'HealthCopilot आपके स्वास्थ्य रिकॉर्ड और स्वास्थ्य के बारे में सवालों के जवाब देने के लिए डिज़ाइन किया गया है।'
          ),
        }
      } else if (!hasRecords) {
        // ==========================================
        // 4. NEW USER / NO DATA STATE
        // AI must NOT pretend to know user's health when no records exist.
        // ==========================================
        const asksAboutPersonalHealth =
          normalized.includes('my') ||
          normalized.includes('me') ||
          normalized.includes('mine') ||
          normalized.includes('i have') ||
          normalized.includes('report') ||
          normalized.includes('cbc') ||
          normalized.includes('hemoglobin') ||
          normalized.includes('medicine') ||
          normalized.includes('medication') ||
          normalized.includes('pill') ||
          normalized.includes('prescription') ||
          normalized.includes('bp') ||
          normalized.includes('pressure') ||
          normalized.includes('sugar') ||
          normalized.includes('glucose') ||
          normalized.includes('appointment') ||
          normalized.includes('doctor') ||
          normalized.includes('result') ||
          normalized.includes('test') ||
          normalized.includes('trend') ||
          normalized.includes('history') ||
          normalized.includes('vault')

        if (asksAboutPersonalHealth) {
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            isMissingRecord: true,
            missingRecordMessage: {
              heading: L(
                "I don't have enough information in your health records to answer that personally.",
                "व्यक्तिगत रूप से इसका उत्तर देने के लिए आपके स्वास्थ्य रिकॉर्ड में पर्याप्त जानकारी नहीं है।"
              ),
              body: L(
                'Your health record is currently empty. Upload a medical report, prescription, or diagnostic document to start asking personalized health questions.',
                'आपका स्वास्थ्य रिकॉर्ड वर्तमान में खाली है। व्यक्तिगत स्वास्थ्य प्रश्न पूछने के लिए मेडिकल रिपोर्ट, पर्चा या डायग्नोस्टिक दस्तावेज़ अपलोड करें।'
              ),
            },
            generalAnswer: getGeneralGuidance(normalized),
            disclaimer: L(
              'HealthCopilot does not diagnose or prescribe treatments. Always consult your doctor.',
              'HealthCopilot बीमारी का निदान या दवा नहीं लिखता। कृपया अपने डॉक्टर से परामर्श करें।'
            ),
          }
        } else {
          // General health information query from user with no records
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            generalAnswer: getGeneralGuidance(normalized),
            disclaimer: L(
              'HealthCopilot provides health literacy and information. Always consult your doctor for medical advice.',
              'HealthCopilot स्वास्थ्य जागरूकता और जानकारी प्रदान करता है। चिकित्सा सलाह के लिए हमेशा डॉक्टर से परामर्श करें।'
            ),
          }
        }
      } else {
        // ==========================================
        // 5. USER HAS RECORDS (DEMO ACCOUNT)
        // Check for unuploaded topics vs verified records
        // ==========================================
        const missingTopic = detectMissingHealthTopic(normalized)
        const isAskingAboutMissingRecord =
          missingTopic &&
          (normalized.includes('my') ||
            normalized.includes('me') ||
            normalized.includes('report') ||
            normalized.includes('result') ||
            normalized.includes('level') ||
            normalized.includes('number') ||
            normalized.includes('test'))

        if (isAskingAboutMissingRecord && missingTopic) {
          // User asked for a metric NOT present in records -> NEVER INVENT DATA
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            isMissingRecord: true,
            missingRecordMessage: {
              heading: L(
                "I don't have enough information in your health records to answer that personally.",
                "व्यक्तिगत रूप से इसका उत्तर देने के लिए आपके स्वास्थ्य रिकॉर्ड में पर्याप्त जानकारी नहीं है।"
              ),
              body: L(
                `HealthCopilot currently only has your CBC blood test, 4 prescriptions, blood pressure, and blood sugar records on file. We do not have a ${missingTopic} in your records. Upload this document to view personalized answers.`,
                `HealthCopilot के पास वर्तमान में केवल CBC ब्लड टेस्ट, 4 नुस्खे, ब्लड प्रेशर और ब्लड शुगर रिकॉर्ड हैं। आपके रिकॉर्ड में कोई ${missingTopic} नहीं है। व्यक्तिगत उत्तर पाने के लिए यह दस्तावेज़ अपलोड करें।`
              ),
              missingItem: missingTopic,
            },
            generalAnswer: getGeneralGuidance(normalized, missingTopic),
            disclaimer: L(
              'HealthCopilot does not diagnose medical conditions. Always review lab tests with your doctor.',
              'HealthCopilot बीमारी का निदान नहीं करता। हमेशा डॉक्टर से परामर्श करें।'
            ),
          }
        } else if (
          normalized.includes('report') ||
          normalized.includes('cbc') ||
          normalized.includes('hemoglobin') ||
          normalized.includes('blood test') ||
          normalized.includes('latest test')
        ) {
          // LAB REPORT / CBC / HEMOGLOBIN
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            recordAnswer: {
              shortAnswer:
                'Based on your records, your latest CBC report dated 7 October shows hemoglobin of 10.8 g/dL.',
              keyMeasurement: {
                label: 'Your latest result',
                value: '10.8 g/dL',
                context: 'Usual reference range: 12.0 – 15.5 g/dL',
              },
              whatThisMeans: [
                'Hemoglobin is the protein in red blood cells that carries oxygen to your body.',
                'A result of 10.8 g/dL is mildly lower than typical targets, which can sometimes cause mild tiredness.',
                'Your White Blood Cells (7.2 ×10³/µL) and Platelets (245 ×10³/µL) are healthy and normal.',
                'Because one result can have many causes, it is worth discussing this with your doctor.',
              ],
              whatToDoNext: [
                'Discuss this result with Dr. Menon during your consultation tomorrow.',
                'Ask if a follow-up blood count or iron check is advised in 4 to 6 weeks.',
                'Include iron-rich foods (spinach, lentils, beans) alongside vitamin C in your meals.',
              ],
              sources: [
                {
                  title: 'CBC Blood Test',
                  date: '07 Oct 2026',
                  kind: 'lab',
                  regionKey: 'hb',
                  targetView: 'summary',
                },
              ],
            },
            generalAnswer: {
              shortAnswer:
                'Iron from meals is absorbed much more effectively when paired with vitamin C.',
              details: [
                'Foods like citrus fruits, tomatoes, and bell peppers help your body absorb plant iron.',
                'Tea or coffee taken right after meals can reduce iron absorption.',
              ],
              helpfulTip:
                'A squeeze of fresh lemon juice over lentils or spinach significantly boosts natural iron absorption.',
            },
            disclaimer:
              'HealthCopilot does not diagnose medical conditions. Always review lab tests with your doctor.',
          }
        } else if (
          normalized.includes('medicine') ||
          normalized.includes('medication') ||
          normalized.includes('pill') ||
          normalized.includes('prescription') ||
          normalized.includes('amoxicillin') ||
          normalized.includes('pantoprazole') ||
          normalized.includes('dose')
        ) {
          // MEDICATIONS
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            recordAnswer: {
              shortAnswer:
                'Based on your records, your latest prescription dated 04 October from Dr. R. Menon lists 4 medicines: Amoxicillin 500 mg, Pantoprazole 40 mg, Vitamin D3 60,000 IU, and Paracetamol 650 mg.',
              keyMeasurement: {
                label: 'Active medicines',
                value: '4 prescriptions',
                context: '1 completing tomorrow, 3 ongoing / as-needed',
              },
              whatThisMeans: [
                'Amoxicillin 500 mg: Antibiotic taken twice daily with meals. Finishing tomorrow (Day 4 of 5).',
                'Pantoprazole 40 mg: Stomach acid protection taken once daily 30 minutes before breakfast.',
                'Vitamin D3 60,000 IU: Once weekly replenishment taken with milk or after a meal.',
                'Paracetamol 650 mg: Only taken as needed for fever or body ache.',
              ],
              whatToDoNext: [
                'Finish the final 24 hours of Amoxicillin on schedule as prescribed.',
                'Take Pantoprazole on an empty stomach first thing in the morning.',
                'Confirm the handwritten medicine on your 04 Oct prescription with Dr. Menon tomorrow.',
              ],
              sources: [
                {
                  title: 'Prescription by Dr. R. Menon',
                  date: '04 Oct 2026',
                  kind: 'rx',
                  regionKey: 'med1',
                  targetView: 'medications',
                },
                {
                  title: 'Hospital Discharge Summary',
                  date: '12 Sep 2026',
                  kind: 'vitals',
                  targetView: 'timeline',
                },
              ],
            },
            generalAnswer: {
              shortAnswer:
                'Completing prescribed antibiotics is essential even if symptoms have cleared.',
              details: [
                'Stopping antibiotics early can allow bacteria to regain strength and develop resistance.',
                'Proton-pump medicines like Pantoprazole work best when taken before food activates stomach acid pumps.',
              ],
              helpfulTip:
                'Always keep prescriptions in their original strips so you can check expiration dates and doctor instructions.',
            },
            disclaimer:
              'Never change or stop your prescribed medication dosages without consulting your doctor.',
          }
        } else if (
          normalized.includes('blood pressure') ||
          normalized.includes('bp') ||
          normalized.includes('hypertension') ||
          normalized.includes('pulse')
        ) {
          // BLOOD PRESSURE
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            recordAnswer: {
              shortAnswer:
                'Based on your records, your latest recorded blood pressure from your 28 September clinic checkup note is 118/76 mmHg with a resting pulse of 68 bpm (healthy normal).',
              keyMeasurement: {
                label: 'Latest blood pressure',
                value: '118/76 mmHg',
                context: 'Resting pulse: 68 bpm (Normal & stable)',
              },
              whatThisMeans: [
                'Healthy blood pressure is generally under 120 mmHg systolic and under 80 mmHg diastolic.',
                'Your reading of 118/76 mmHg shows that your heart and blood vessels are under healthy resting pressure.',
                'Your resting heart rate of 68 beats per minute indicates a calm, normal rhythm.',
              ],
              whatToDoNext: [
                'Continue moderate hydration and daily movement.',
                'Because your readings are optimal, routine checks every few months are usually plenty.',
              ],
              sources: [
                {
                  title: 'Clinic Checkup Note',
                  date: '28 Sep 2026',
                  kind: 'vitals',
                  targetView: 'conditions',
                  targetExtra: { conditionId: 'blood_pressure' },
                },
                {
                  title: 'Hospital Discharge Summary',
                  date: '12 Sep 2026',
                  kind: 'vitals',
                  targetView: 'timeline',
                },
              ],
            },
            generalAnswer: {
              shortAnswer:
                'Everyday habits like sodium moderation and regular sleep help keep blood pressure steady.',
              details: [
                'Limiting excess salt to under 2,000 mg a day protects blood vessels.',
                'Regular walking helps keep arteries flexible and resilient.',
              ],
              helpfulTip:
                'Rest for 5 minutes before taking a blood pressure reading to ensure the number reflects your true resting baseline.',
            },
            disclaimer:
              'HealthCopilot stores and visualizes your readings. Check with your doctor for diagnostic evaluation.',
          }
        } else if (
          normalized.includes('sugar') ||
          normalized.includes('glucose') ||
          normalized.includes('diabetes') ||
          normalized.includes('hba1c')
        ) {
          // BLOOD SUGAR
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            recordAnswer: {
              shortAnswer:
                'Based on your records, your latest metabolic log dated 07 October shows fasting blood sugar of 118 mg/dL and post-meal glucose of 156 mg/dL, with HbA1c at 6.4%.',
              keyMeasurement: {
                label: 'Latest post-meal reading',
                value: '156 mg/dL',
                context: 'Target: < 140 mg/dL · Fasting: 118 mg/dL',
              },
              whatThisMeans: [
                'Fasting blood sugar of 118 mg/dL is slightly above the standard healthy target of under 100 mg/dL.',
                'Post-meal glucose of 156 mg/dL indicates your body takes slightly longer to clear sugar after carbohydrate meals.',
                'Your 3-month HbA1c of 6.4% sits at the upper edge of the prediabetes range (5.7 – 6.4%).',
                'This is not a sudden diagnosis of diabetes, but a pattern that can often improve with simple daily adjustments.',
              ],
              whatToDoNext: [
                'Take a gentle 10 to 15 minute walk after lunch and dinner.',
                'Pair carbohydrates with vegetables, lentils, or nuts to blunt glucose spikes.',
                'Discuss dietary suggestions and follow-up screening with Dr. Ananya Sen.',
              ],
              sources: [
                {
                  title: 'Metabolic Log',
                  date: '07 Oct 2026',
                  kind: 'lab',
                  regionKey: 'hb',
                  targetView: 'conditions',
                  targetExtra: { conditionId: 'diabetes' },
                },
                {
                  title: 'Laboratory Panel',
                  date: '12 Sep 2026',
                  kind: 'lab',
                  targetView: 'conditions',
                  targetExtra: { conditionId: 'diabetes' },
                },
              ],
            },
            generalAnswer: {
              shortAnswer:
                'Gentle movement after meals helps muscles absorb blood sugar naturally without requiring extra insulin.',
              details: [
                'Walking 10 minutes after eating can lower peak blood sugar rises by up to 20%.',
                'Eating fiber and protein first before rice or bread helps smooth digestion.',
              ],
              helpfulTip:
                'Drinking a glass of water before meals also aids digestion and satiety.',
            },
            disclaimer:
              'Consult your physician or endocrinologist before making major dietary or medical changes.',
          }
        } else if (
          normalized.includes('discuss with doctor') ||
          normalized.includes('what should i discuss') ||
          normalized.includes('doctor') ||
          normalized.includes('appointment') ||
          normalized.includes('dr. menon') ||
          normalized.includes('menon')
        ) {
          // DOCTOR APPOINTMENT PREPARATION
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            recordAnswer: {
              shortAnswer:
                'Based on your records, you have an upcoming consultation with Dr. R. Menon tomorrow at 10:30 AM at Sunrise Family Clinic.',
              keyMeasurement: {
                label: 'Upcoming appointment',
                value: 'Tomorrow · 10:30 AM',
                context: 'Dr. R. Menon · Sunrise Family Clinic',
              },
              whatThisMeans: [
                'Hemoglobin 10.8 g/dL: Mildly lower than the usual 12.0 – 15.5 g/dL target.',
                'Amoxicillin completion: Finishes tomorrow (Day 5 of 5) for respiratory recovery.',
                'Post-meal glucose 156 mg/dL: Suggests discussing simple nutrition or follow-up tests.',
              ],
              whatToDoNext: [
                'Question 1: "Should I repeat the CBC blood test or check ferritin in 4 to 6 weeks to ensure my hemoglobin recovers?"',
                'Question 2: "Can you confirm the handwritten medicine name on my 04 Oct prescription?"',
                'Question 3: "Do you recommend any dietary changes or follow-up for my 156 mg/dL post-meal glucose reading?"',
              ],
              sources: [
                {
                  title: 'Doctor Appointment Schedule',
                  date: 'Tomorrow · 10:30 AM',
                  kind: 'vitals',
                  targetView: 'appointments',
                },
                {
                  title: 'CBC Blood Test',
                  date: '07 Oct 2026',
                  kind: 'lab',
                  regionKey: 'hb',
                  targetView: 'summary',
                },
                {
                  title: 'Prescription by Dr. R. Menon',
                  date: '04 Oct 2026',
                  kind: 'rx',
                  regionKey: 'med1',
                  targetView: 'medications',
                },
              ],
            },
            generalAnswer: {
              shortAnswer:
                'Doctors appreciate short, organized questions that connect your symptoms, medications, and test numbers.',
              details: [
                'Write down your top 2 or 3 questions before stepping into the consultation room.',
                'Mention how you have been feeling physically since finishing your medicines.',
              ],
              helpfulTip:
                'You can show this screen directly to your doctor during your consultation.',
            },
            disclaimer:
              'HealthCopilot helps you organize your thoughts for your doctor. Your doctor makes all clinical decisions.',
          }
        } else if (
          normalized.includes('change') ||
          normalized.includes('month') ||
          normalized.includes('summarize') ||
          normalized.includes('recently')
        ) {
          // RECENT HEALTH SHIFTS
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            recordAnswer: {
              shortAnswer:
                'Based on your records over the past 30 days, your health shows steady recovery with stable vitals (BP 118/76 mmHg) and one hemoglobin result (10.8 g/dL) to review.',
              keyMeasurement: {
                label: 'Recent status',
                value: 'Recovering & Stable',
                context: '4 verified records in your health record',
              },
              whatThisMeans: [
                'Infection inflammation has cleared (white blood cells normal at 7.2 ×10³/µL).',
                'Blood pressure has remained stable and normal at 118/76 mmHg.',
                'Hemoglobin is mildly lower at 10.8 g/dL, which frequently happens during recovery.',
              ],
              whatToDoNext: [
                'Attend your scheduled clinic follow-up tomorrow with Dr. Menon.',
                'Complete the remaining day of your prescribed antibiotics.',
                'Maintain daily hydration and nourishing meals.',
              ],
              sources: [
                {
                  title: 'CBC Blood Test',
                  date: '07 Oct 2026',
                  kind: 'lab',
                  regionKey: 'hb',
                  targetView: 'summary',
                },
                {
                  title: 'Clinic Prescription',
                  date: '04 Oct 2026',
                  kind: 'rx',
                  regionKey: 'med1',
                  targetView: 'medications',
                },
                {
                  title: 'Hospital Discharge Summary',
                  date: '12 Sep 2026',
                  kind: 'vitals',
                  targetView: 'timeline',
                },
              ],
            },
            generalAnswer: {
              shortAnswer:
                'Tracking health records over time makes it easy to spot small shifts before they turn into bigger concerns.',
              details: [
                'Comparing discharge notes and follow-up lab tests confirms whether recovery is on track.',
                'Regular vital tracking provides peace of mind.',
              ],
            },
            disclaimer:
              'All records shown are summarized directly from documents in your health vault.',
          }
        } else if (
          normalized.includes('kidney') ||
          normalized.includes('egfr') ||
          normalized.includes('creatinine') ||
          normalized.includes('renal')
        ) {
          // KIDNEY HEALTH
          assistantMsg = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            recordAnswer: {
              shortAnswer:
                'Based on your records, your kidney function from your 12 September discharge panel is well functioning with eGFR of 104 mL/min and creatinine of 0.88 mg/dL.',
              keyMeasurement: {
                label: 'eGFR Filtration Rate',
                value: '104 mL/min',
                context: 'Normal target: > 90 mL/min (Optimal filtration)',
              },
              whatThisMeans: [
                'eGFR of 104 mL/min indicates excellent natural blood filtration by your kidneys.',
                'Serum creatinine is 0.88 mg/dL, well within the normal healthy range (0.70 – 1.30 mg/dL).',
                'Blood Urea Nitrogen (BUN) is 14 mg/dL (target 7 – 20 mg/dL), showing healthy protein waste processing.',
              ],
              whatToDoNext: [
                'Maintain daily water hydration (2 to 2.5 liters) to support natural renal function.',
                'No special follow-up or kidney interventions are required at this time.',
              ],
              sources: [
                {
                  title: 'Laboratory Panel',
                  date: '12 Sep 2026',
                  kind: 'lab',
                  targetView: 'conditions',
                  targetExtra: { conditionId: 'kidney' },
                },
              ],
            },
            generalAnswer: {
              shortAnswer:
                'Staying well hydrated and keeping blood pressure normal are the two most protective habits for kidney longevity.',
              details: [
                'Drinking sufficient water helps the kidneys filter waste products from your blood.',
                'Avoiding overuse of NSAID pain medications helps preserve kidney filtration filters over time.',
              ],
              helpfulTip:
                'Pale clear-yellow urine is usually a quick sign of healthy daily hydration.',
            },
            disclaimer:
              'HealthCopilot stores and visualizes your lab records. Consult your doctor for diagnosis.',
          }
        } else {
          // GENERAL HEALTH / CUSTOM INQUIRY
          const asksPersonalRecord =
            normalized.includes('my') ||
            normalized.includes('me') ||
            normalized.includes('mine') ||
            normalized.includes('record') ||
            normalized.includes('vault') ||
            normalized.includes('profile') ||
            normalized.includes('history') ||
            normalized.includes('result') ||
            normalized.includes('test')

          if (asksPersonalRecord) {
            // NEVER invent personal health data when information is not in records
            assistantMsg = {
              id: `bot-${Date.now()}`,
              sender: 'assistant',
              timestamp: 'Just now',
              isMissingRecord: true,
              missingRecordMessage: {
                heading: L(
                  "I don't have enough information in your health records to answer that personally.",
                  "व्यक्तिगत रूप से इसका उत्तर देने के लिए आपके स्वास्थ्य रिकॉर्ड में पर्याप्त जानकारी नहीं है।"
                ),
                body: L(
                  "HealthCopilot only accesses verified documents currently in your records. There is no uploaded document or measurement for this on file. You can upload this report to view personalized insights.",
                  "HealthCopilot केवल आपके वर्तमान रिकॉर्ड में मौजूद सत्यापित दस्तावेज़ों का संदर्भ लेता है। आपके रिकॉर्ड में इस संबंध में कोई दस्तावेज़ नहीं है। व्यक्तिगत उत्तर पाने के लिए रिपोर्ट अपलोड करें।"
                ),
              },
              generalAnswer: getGeneralGuidance(normalized),
              disclaimer: L(
                'HealthCopilot provides health literacy and information. Always consult your doctor for medical advice.',
                'HealthCopilot स्वास्थ्य जागरूकता और जानकारी प्रदान करता है। चिकित्सा सलाह के लिए हमेशा डॉक्टर से परामर्श करें।'
              ),
            }
          } else {
            // Purely general educational query
            assistantMsg = {
              id: `bot-${Date.now()}`,
              sender: 'assistant',
              timestamp: 'Just now',
              generalAnswer: getGeneralGuidance(normalized),
              disclaimer: L(
                'HealthCopilot provides health literacy and information. Always consult your doctor for medical advice.',
                'HealthCopilot स्वास्थ्य जागरूकता और जानकारी प्रदान करता है। चिकित्सा सलाह के लिए हमेशा डॉक्टर से परामर्श करें।'
              ),
            }
          }
        }
      }

      setMessages((prev) => {
        const next = [...prev, assistantMsg]
        saveCurrentConversation(next, currentChatId)
        return next
      })
    }

    askAiHealthChat(promptText, currentChatId)
      .then((res) => {
        setIsTyping(false)
        const assistantMsg: ChatMessage = {
          id: `bot-${res.messageId || Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          text: res.text,
          isEmergency: res.isEmergency,
          recordAnswer: {
            shortAnswer: res.shortAnswer || res.text,
            keyMeasurement: res.keyMeasurement || undefined,
            whatThisMeans:
              res.whatThisMeans && res.whatThisMeans.length > 0
                ? res.whatThisMeans
                : ['Information verified and extracted from your personal health database.'],
            whatToDoNext:
              res.whatToDoNext && res.whatToDoNext.length > 0
                ? res.whatToDoNext
                : ['Discuss these findings with your doctor during your next scheduled appointment.'],
            sources: (res.sources || []).map((s) => ({
              title: s.title,
              date: s.date,
              kind: s.kind,
              detail: s.detail,
            })),
          },
          disclaimer: res.disclaimer,
        }
        setMessages((prev) => {
          const next = [...prev, assistantMsg]
          saveCurrentConversation(next, currentChatId)
          return next
        })
      })
      .catch((err) => {
        console.warn('Backend AI chat request error, running local safety processor:', err)
        runLocalFallback()
      })
  }

  const handleResetChat = () => {
    if (messages.length > 0) {
      saveCurrentConversation(messages, currentChatId)
    }
    setMessages([])
    setCurrentChatId(`chat-${Date.now()}`)
    setIsHistoryOpen(false)
    toast('Started a new health conversation', 'ok')
  }

  return (
    <div className="anim-fade-up mx-auto max-w-4xl space-y-6">
      {/* 1. Chat Page Hierarchy: Clear purpose at the top */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <Sparkles size={14} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              {L('AI Health Assistant', 'AI स्वास्थ्य सहायक')}
            </span>
          </div>

          {/* Simple clear heading */}
          <h1 className="font-display text-[26px] sm:text-[32px] font-bold text-[#0b1b33] tracking-tight leading-tight">
            {L('How can I help with your health?', 'मैं आपके स्वास्थ्य में कैसे मदद कर सकता हूँ?')}
          </h1>

          {/* Short explanation */}
          <p className="mt-1 text-sm sm:text-[15px] text-slate-600 leading-relaxed">
            {L(
              'Ask questions about your health records, reports, medicines, or appointments.',
              'अपने स्वास्थ्य रिकॉर्ड, रिपोर्ट, दवाओं या अपॉइंटमेंट के बारे में पूछें।'
            )}
          </p>

          {/* Visually secondary disclaimer statement */}
          <p className="mt-1.5 text-xs text-slate-600 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-teal-600 shrink-0" />
            <span>
              {L(
                'HealthCopilot supports your understanding and does not replace your doctor.',
                'HealthCopilot आपकी समझ में मदद करता है और आपके डॉक्टर का विकल्प नहीं है।'
              )}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end text-right mr-1">
            <button
              type="button"
              onClick={() => {
                const nextState = !hasRecords
                setHasRecords(nextState)
                if (!nextState) {
                  setMessages([])
                  setConversations([])
                } else {
                  setConversations(DEFAULT_CONVERSATIONS)
                }
                toast(
                  nextState
                    ? 'Switched to Demo Account (4 connected records)'
                    : 'Switched to New User (Empty records state)',
                  'ok'
                )
              }}
              title={L(
                'Click to toggle between Demo Records and New User (Empty) state',
                'डेमो रिकॉर्ड और नए उपयोगकर्ता के बीच स्विच करने के लिए क्लिक करें'
              )}
              className={cx(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-2xs transition cursor-pointer',
                hasRecords
                  ? 'text-teal-800 bg-teal-50 border-teal-200/70 hover:bg-teal-100'
                  : 'text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200'
              )}
            >
              <span
                className={cx(
                  'h-2 w-2 rounded-full',
                  hasRecords ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'
                )}
              />
              <span>
                {hasRecords
                  ? L('Records connected', 'रिकॉर्ड कनेक्टेड')
                  : L('No records connected', 'कोई रिकॉर्ड कनेक्टेड नहीं')}
              </span>
            </button>
            <span className="text-[11px] text-slate-500 mt-1">
              {hasRecords
                ? L('CBC tests, 4 medicines & vitals', 'CBC टेस्ट, 4 दवाएँ और विटल्स')
                : L('Empty health record · General answers only', 'खाली स्वास्थ्य रिकॉर्ड · केवल सामान्य उत्तर')}
            </span>
          </div>

          {/* Chat History Entry Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-300 text-xs font-semibold text-slate-700 hover:text-teal-900 transition shadow-2xs cursor-pointer"
          >
            <History size={14} className="text-teal-600" />
            <span>{L('Chat History', 'बातचीत इतिहास')}</span>
            {conversations.length > 0 && (
              <span className="ml-0.5 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                {conversations.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <Btn v="secondary" sm onClick={handleResetChat} className="shadow-2xs">
            <RotateCcw size={14} />
            {L('New Chat', 'नई बातचीत')}
          </Btn>
        </div>
      </div>

      {/* Welcome State (if no messages yet) */}
      {messages.length === 0 && (
        <div className="py-4 space-y-6">
          {/* Explanation banner */}
          <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/60 via-sky-50/40 to-white p-4 text-xs text-slate-700 flex items-start gap-3">
            <Info size={16} className="text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-900">
                {L('How HealthCopilot answers your questions:', 'HealthCopilot आपके प्रश्नों के उत्तर कैसे देता है:')}
              </p>
              <p className="text-slate-600 leading-relaxed">
                {L(
                  'Personal answers are labeled "BASED ON YOUR RECORDS" with direct links to your test documents. General educational advice is labeled "GENERAL HEALTH INFORMATION".',
                  'व्यक्तिगत उत्तर "आपके स्वास्थ्य रिकॉर्ड के आधार पर" लेबल के साथ आते हैं और दस्तावेज़ लिंक दिखाते हैं। सामान्य जानकारी "सामान्य स्वास्थ्य जानकारी" के रूप में अलग दिखती है।'
                )}
              </p>
            </div>
          </div>

          {/* If New User / No Data State */}
          {!hasRecords && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-6 sm:p-8 text-center space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80">
                <FileText size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  {L('Your health record is empty', 'आपका स्वास्थ्य रिकॉर्ड खाली है')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {L(
                    'Upload a medical report, prescription, or diagnostic document to start asking personalized health questions.',
                    'व्यक्तिगत स्वास्थ्य प्रश्न पूछने के लिए मेडिकल रिपोर्ट, पर्चा या डायग्नोस्टिक दस्तावेज़ अपलोड करें।'
                  )}
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('documents')
                    } else {
                      toast('Navigating to Documents upload', 'ok')
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{L('Upload a document', 'दस्तावेज़ अपलोड करें')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick starter question cards */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              {hasRecords
                ? L('Suggested questions based on your records:', 'आपके रिकॉर्ड पर आधारित सुझाए गए प्रश्न:')
                : L('General health questions to get started:', 'शुरुआत के लिए सामान्य स्वास्थ्य प्रश्न:')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(hasRecords ? ACTION_CARDS : GENERAL_ACTION_CARDS).map((card) => {
                const Icon = card.icon
                return (
                  <button
                    key={card.id}
                    onClick={() => handleSendPrompt(card.prompt)}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-teal-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={cx('grid h-8 w-8 place-items-center rounded-lg', card.iconColor)}>
                          <Icon size={16} strokeWidth={2} />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-teal-800 transition">
                          {card.kicker}
                        </span>
                      </div>

                      <p className="font-display text-[14.5px] font-bold text-slate-900 group-hover:text-[#0f3057] transition leading-snug">
                        "{card.prompt}"
                      </p>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-3.5 flex items-center gap-1 text-xs font-semibold text-teal-800 opacity-90 group-hover:opacity-100">
                      <span>{L('Ask this question', 'यह सवाल पूछें')}</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Connected Health Records (only when user has verified records) */}
          {hasRecords && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {L('CONNECTED HEALTH RECORDS', 'कनेक्टेड स्वास्थ्य रिकॉर्ड')}
                </p>
                <p className="text-[11px] text-slate-500">
                  {L('Records currently available to HealthCopilot', 'HealthCopilot के पास वर्तमान में उपलब्ध रिकॉर्ड')}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-0.5">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/70">
                  <FlaskConical size={16} className="text-teal-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">CBC Blood Test</p>
                    <p className="text-[11px] text-slate-600">07 Oct 2026</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/70">
                  <Pill size={16} className="text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">Prescriptions</p>
                    <p className="text-[11px] text-slate-600">4 Medicines</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/70">
                  <Heart size={16} className="text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">Blood Pressure</p>
                    <p className="text-[11px] text-slate-600">118/76 mmHg</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/70">
                  <Activity size={16} className="text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">Blood Sugar</p>
                    <p className="text-[11px] text-slate-600">118 mg/dL fasting</p>
                  </div>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400">
                {L(
                  'Note: Records reflect uploaded diagnostic documents and prescriptions on file.',
                  'नोट: रिकॉर्ड फ़ाइल में उपलब्ध डायग्नोस्टिक दस्तावेज़ों और पर्चों को दर्शाते हैं।'
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Messages Feed */}
      {messages.length > 0 && (
        <div className="space-y-6 pb-6">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end anim-fade-up">
                  <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-xs bg-[#0f3057] px-4 py-3 text-white shadow-sm">
                    <p className="text-[14.5px] font-medium leading-relaxed">{msg.text}</p>
                    <span className="mt-1 block text-right text-[10px] text-slate-300">{msg.timestamp}</span>
                  </div>
                </div>
              )
            }

            // Emergency Warning Message
            if (msg.isEmergency) {
              return (
                <div key={msg.id} className="anim-fade-up space-y-4">
                  <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/80 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white animate-pulse">
                        <AlertTriangle size={20} />
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-bold text-rose-950">
                          {L('Emergency Medical Attention Recommended', 'आपातकालीन चिकित्सा सहायता की सिफ़ारिश')}
                        </h3>
                        <p className="text-xs text-rose-800">
                          {L('Please seek immediate in-person emergency care', 'कृपया तुरंत आपातकालीन चिकित्सा सहायता लें')}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-rose-900 leading-relaxed bg-white/90 p-3.5 rounded-xl border border-rose-200">
                      {msg.recordAnswer?.shortAnswer}
                    </p>

                    <div className="mt-3.5 space-y-1.5 text-xs text-rose-950">
                      {msg.recordAnswer?.whatToDoNext.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
                          <span className="font-medium">{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <a
                        href="tel:112"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm transition"
                      >
                        <PhoneCall size={16} />
                        <span>{L('Call Emergency (112 / 108 / 911)', 'आपातकालीन नंबर पर कॉल करें')}</span>
                      </a>
                    </div>
                  </div>
                </div>
              )
            }

            // Unclear / Gibberish or Friendly Greeting Response
            if (msg.isUnclear || msg.isGreeting) {
              return (
                <div key={msg.id} className="anim-fade-up flex gap-3 max-w-full">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0f3057] text-white shrink-0 mt-1 shadow-xs">
                    <Sparkles size={16} />
                  </span>

                  <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs p-5 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          <Sparkles size={12} className="text-teal-600" />
                          <span>{msg.isGreeting ? L('HELLO', 'नमस्ते') : L('ASSISTANT HELP', 'सहायक मार्गदर्शन')}</span>
                        </span>
                        <span className="text-[11px] text-slate-600">{msg.timestamp}</span>
                      </div>

                      <h3 className="text-base sm:text-[17px] font-bold text-slate-900 leading-snug">
                        {msg.unclearMessage?.heading || L("I didn't quite understand that.", "मुझे यह समझ नहीं आया।")}
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {msg.unclearMessage?.body ||
                          L(
                            'Try asking me about your reports, medicines, health conditions, appointments, or health trends.',
                            'अपनी रिपोर्ट, दवाओं, स्वास्थ्य स्थितियों, अपॉइंटमेंट या ट्रेंड्स के बारे में पूछने का प्रयास करें।'
                          )}
                      </p>
                    </div>

                    {/* Quick actions using existing quick-question functionality */}
                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {L('Try one of these quick questions:', 'इनमें से कोई त्वरित प्रश्न आज़माएं:')}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SUGGESTED_HEALTH_ACTIONS.map((action) => {
                          const ActionIcon = action.icon
                          return (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => handleSendPrompt(action.prompt)}
                              className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/70 hover:border-teal-300 text-left transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={cx('grid h-7 w-7 place-items-center rounded-lg shrink-0', action.iconColor)}>
                                  <ActionIcon size={14} />
                                </span>
                                <span className="text-xs sm:text-[13px] font-semibold text-slate-800 group-hover:text-teal-900 truncate">
                                  {L(action.label, action.labelHi)}
                                </span>
                              </div>
                              <ArrowRight size={13} className="text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition shrink-0" />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      {L(
                        'HealthCopilot provides health literacy and information. Always consult your doctor for medical advice.',
                        'HealthCopilot स्वास्थ्य जागरूकता और जानकारी प्रदान करता है। चिकित्सा सलाह के लिए हमेशा डॉक्टर से परामर्श करें।'
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            // Standard Health Assistant Response with CLEAR SEPARATION OF THE TWO ANSWER TYPES
            return (
              <div key={msg.id} className="anim-fade-up flex gap-3 max-w-full">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0f3057] text-white shrink-0 mt-1 shadow-xs">
                  <Sparkles size={16} />
                </span>

                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  {/* MISSING RECORD / NOT IN YOUR RECORDS */}
                  {msg.isMissingRecord && msg.missingRecordMessage && (
                    <div className="p-5 border-b border-slate-100 bg-amber-50/30 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-200/80">
                          <AlertTriangle size={12} className="text-amber-700" />
                          <span>{L('NOT IN YOUR RECORDS', 'आपके रिकॉर्ड में नहीं')}</span>
                        </span>
                        <span className="text-[11px] text-slate-600">{msg.timestamp}</span>
                      </div>

                      <h3 className="text-[15px] sm:text-base font-bold text-slate-900 leading-snug">
                        {msg.missingRecordMessage.heading}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {msg.missingRecordMessage.body}
                      </p>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('documents')
                            } else {
                              toast('Navigating to Documents', 'ok')
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                          <Upload size={13} />
                          <span>{L('Upload a document', 'दस्तावेज़ अपलोड करें')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TYPE 1: BASED ON YOUR RECORDS */}
                  {msg.recordAnswer && (
                    <div className="p-5 border-b border-slate-100 space-y-4">
                      {/* Explicit Badge */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-teal-50 text-teal-800 border border-teal-200/80">
                          <FileText size={12} className="text-teal-600" />
                          <span>{L('BASED ON YOUR RECORDS', 'आपके स्वास्थ्य रिकॉर्ड के आधार पर')}</span>
                        </span>
                        <span className="text-[11px] text-slate-600">{msg.timestamp}</span>
                      </div>

                      {/* 1. Short Answer */}
                      <p className="text-[15px] sm:text-base font-semibold text-slate-900 leading-snug">
                        {msg.recordAnswer.shortAnswer}
                      </p>

                      {/* Key Measurement Highlight (if present) */}
                      {msg.recordAnswer.keyMeasurement && (
                        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-100/70 text-teal-800 shrink-0">
                              <Activity size={15} />
                            </span>
                            <div>
                              <p className="text-[11px] font-medium text-slate-600">
                                {msg.recordAnswer.keyMeasurement.label}
                              </p>
                              <p className="text-sm font-bold text-slate-900">
                                {msg.recordAnswer.keyMeasurement.value}
                              </p>
                            </div>
                          </div>
                          {msg.recordAnswer.keyMeasurement.context && (
                            <span className="text-xs text-slate-600 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200/70">
                              {msg.recordAnswer.keyMeasurement.context}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 2. What this means */}
                      {msg.recordAnswer.whatThisMeans.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {L('What this means', 'इसका क्या अर्थ है')}
                          </p>
                          <ul className="space-y-1.5 text-xs sm:text-[13.5px] text-slate-700">
                            {msg.recordAnswer.whatThisMeans.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 leading-relaxed">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 3. What you may want to do next */}
                      {msg.recordAnswer.whatToDoNext.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {L('What you may want to do next', 'आगे क्या कर सकते हैं')}
                          </p>
                          <div className="space-y-2">
                            {msg.recordAnswer.whatToDoNext.map((step, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-xs sm:text-[13px] text-slate-800"
                              >
                                <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-600 text-white font-bold text-[10px] shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Grounded Sources & View Source action */}
                      {msg.recordAnswer.sources.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            {L('Source:', 'स्रोत:')}
                          </span>
                          {msg.recordAnswer.sources.map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                if (src.targetView && onNavigate) {
                                  onNavigate(src.targetView, src.targetExtra)
                                } else if (src.regionKey) {
                                  ev({ kind: src.kind === 'rx' ? 'rx' : 'cbc', region: src.regionKey })
                                } else {
                                  toast(`Viewing record: ${src.title}`)
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-semibold transition cursor-pointer shadow-2xs group"
                            >
                              <FileText size={12} className="text-teal-700 shrink-0" />
                              <span>{L('View source', 'स्रोत देखें')}: {src.title} · {src.date}</span>
                              <ExternalLink size={11} className="text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TYPE 2: GENERAL HEALTH INFORMATION */}
                  {msg.generalAnswer && (
                    <div className="p-5 border-b border-slate-100 bg-sky-50/30 space-y-3">
                      {/* Explicit Badge */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-sky-100 text-sky-900 border border-sky-200/80">
                          <Sparkles size={12} className="text-sky-700" />
                          <span>{L('GENERAL HEALTH INFORMATION', 'सामान्य स्वास्थ्य जानकारी')}</span>
                        </span>
                        {!msg.recordAnswer && <span className="text-[11px] text-slate-600">{msg.timestamp}</span>}
                      </div>

                      <p className="text-[14px] sm:text-[15px] font-medium text-slate-800 leading-relaxed">
                        {msg.generalAnswer.shortAnswer}
                      </p>

                      {msg.generalAnswer.details.length > 0 && (
                        <ul className="space-y-1.5 text-xs sm:text-[13px] text-slate-700">
                          {msg.generalAnswer.details.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {msg.generalAnswer.helpfulTip && (
                        <p className="text-xs text-sky-900 bg-white/80 p-2.5 rounded-lg border border-sky-200/70 leading-relaxed">
                          💡 <span className="font-semibold">{L('Helpful tip:', 'उपयोगी सुझाव:')}</span>{' '}
                          {msg.generalAnswer.helpfulTip}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Secondary Safe Boundary Disclaimer */}
                  <div className="bg-slate-50/80 px-5 py-2.5 text-[11px] text-slate-600">
                    {msg.disclaimer ||
                      L(
                        'HealthCopilot does not diagnose or prescribe treatments. Always consult your doctor.',
                        'HealthCopilot बीमारी का निदान या दवा नहीं लिखता। कृपया अपने डॉक्टर से परामर्श करें।'
                      )}
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
                <p className="text-xs font-semibold text-slate-800">
                  {L('HealthCopilot is thinking…', 'HealthCopilot सोच रहा है…')}
                </p>
                <p className="text-[11px] text-slate-600">
                  {L('Preparing clear answer', 'स्पष्ट उत्तर तैयार किया जा रहा है')}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Bar with Voice Support */}
      <div className="sticky bottom-4 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendPrompt(input)
          }}
          className={cx(
            'relative flex items-center rounded-2xl border bg-white/95 backdrop-blur-md shadow-lg overflow-hidden transition',
            isListening
              ? 'border-red-400 ring-4 ring-red-100'
              : 'border-slate-200/90 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100/70 shadow-slate-200/50'
          )}
        >
          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isListening ? 'Stop listening' : 'Ask by voice'}
            className={cx(
              'ml-2.5 grid h-10 w-10 place-items-center rounded-xl transition cursor-pointer shrink-0',
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? L('Listening... Speak your question now', 'सुन रहा हूँ... अपना प्रश्न बोलें')
                : L(
                    'Ask about your reports, medicines, or health... (or tap mic to speak)',
                    'अपनी रिपोर्ट, दवाओं या स्वास्थ्य के बारे में पूछें... (बोलने के लिए माइक दबाएँ)'
                  )
            }
            className="w-full h-14 pl-3 pr-28 text-sm sm:text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0f3057] hover:bg-[#0b2444] text-white font-semibold text-xs transition disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <span>{L('Ask', 'पूछें')}</span>
              <Send size={13} />
            </button>
          </div>
        </form>

        <p className="mt-2 text-center text-[11px] text-slate-600">
          🔒 {L('Encrypted health reasoning. HealthCopilot does not diagnose or replace professional medical advice.', 'सुरक्षित स्वास्थ्य विश्लेषण। HealthCopilot पेशेवर चिकित्सा सलाह का विकल्प नहीं है।')}
        </p>
      </div>

      {/* 2. Chat History Drawer Panel */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsHistoryOpen(false)}
          />

          {/* Drawer content */}
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200/90 anim-slide-left">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-50 text-teal-700">
                      <History size={14} />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      {L('CHAT HISTORY', 'बातचीत इतिहास')}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {L('Recent conversations', 'हाल की बातचीत')}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {conversations.length} {L('chats', 'बातचीत')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title={L('Close', 'बंद करें')}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Start new conversation button inside drawer */}
              <div className="p-3 bg-white border-b border-slate-100">
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 text-xs font-semibold text-slate-800 hover:text-teal-900 transition shadow-2xs cursor-pointer"
                >
                  <Plus size={14} className="text-teal-600" />
                  <span>{L('Start a fresh conversation', 'नई बातचीत शुरू करें')}</span>
                </button>
              </div>

              {/* Conversation items list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {conversations.length === 0 ? (
                  /* 8. Empty history state */
                  <div className="py-16 px-6 text-center space-y-3">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <MessageSquare size={22} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">
                        {L('No previous chats yet.', 'अभी तक कोई पिछला चैट नहीं है।')}
                      </p>
                      <p className="text-xs text-slate-600 max-w-xs mx-auto">
                        {L(
                          'Your conversations with HealthCopilot will appear here.',
                          'HealthCopilot के साथ आपकी बातचीत यहाँ दिखाई देगी।'
                        )}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Btn v="secondary" sm onClick={handleResetChat}>
                        <Plus size={14} />
                        {L('New Chat', 'नई बातचीत')}
                      </Btn>
                    </div>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const categoryMeta = CATEGORY_ICON_MAP[conv.category] || CATEGORY_ICON_MAP.general
                    const CategoryIcon = categoryMeta.icon
                    const isActive = conv.id === currentChatId && messages.length > 0

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={cx(
                          'group relative rounded-2xl border p-3.5 transition cursor-pointer flex items-start justify-between gap-3 text-left',
                          isActive
                            ? 'border-teal-400 bg-teal-50/40 shadow-xs ring-1 ring-teal-200'
                            : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50/70 hover:shadow-xs'
                        )}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span
                            className={cx(
                              'grid h-8 w-8 place-items-center rounded-xl shrink-0 mt-0.5',
                              categoryMeta.color
                            )}
                          >
                            <CategoryIcon size={15} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-[14px] text-slate-900 truncate group-hover:text-[#0f3057] transition">
                                {L(conv.title, conv.titleHi || conv.title)}
                              </h3>
                              {isActive && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-1.5 py-0.2 rounded-md shrink-0">
                                  {L('Active', 'सक्रिय')}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                              {L(conv.dateLabel, conv.dateLabelHi || conv.dateLabel)}
                            </p>

                            <p className="mt-1 text-xs text-slate-600 line-clamp-1 italic">
                              "{conv.latestUserMessage}"
                            </p>
                          </div>
                        </div>

                        {/* 9. Delete action button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConversationToDelete(conv)
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                          title={L('Delete conversation', 'बातचीत हटाएँ')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-600 text-center">
                {L(
                  'Conversations are stored privately on your device.',
                  'बातचीत आपके डिवाइस पर सुरक्षित रूप से संग्रहीत होती है।'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Dialog */}
      {conversationToDelete && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setConversationToDelete(null)}
            />

            {/* Dialog Card */}
            <div className="relative rounded-2xl bg-white max-w-sm w-full p-5 shadow-2xl border border-slate-200 anim-scale-up space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
                  <Trash2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {L('Delete this conversation?', 'क्या यह बातचीत हटाएँ?')}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {L(
                      'This chat will be removed from your chat history.',
                      'यह बातचीत आपके चैट इतिहास से हटा दी जाएगी।'
                    )}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200/80 truncate">
                    "{conversationToDelete.title}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConversationToDelete(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  {L('Keep chat', 'रखें')}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(conversationToDelete.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
                >
                  {L('Delete', 'हटाएँ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
