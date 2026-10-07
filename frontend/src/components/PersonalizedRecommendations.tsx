import React, { useState } from 'react'
import {
  Utensils,
  Activity,
  Droplets,
  HelpCircle,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowRight,
  Flame,
  Heart,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Card, cx, useL } from '../ui'
import {
  CONDITION_RECOMMENDATIONS,
  type WellnessRecommendationPlan,
} from '../data/recommendationData'
import type { HealthConditionId } from '../types'

interface PersonalizedRecommendationsProps {
  conditionId?: HealthConditionId | string
  hasRecords?: boolean
  onAskAi: (prompt: string) => void
  onNavigate?: (viewId: string, extra?: any) => void
  onViewSourceDoc?: (title: string) => void
}

export function PersonalizedRecommendations({
  conditionId = 'diabetes',
  hasRecords = true,
  onAskAi,
  onNavigate,
  onViewSourceDoc,
}: PersonalizedRecommendationsProps) {
  const L = useL()
  const [activeTab, setActiveTab] = useState<'food' | 'exercise'>('food')
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false)

  // Requirement 6 & 11: Insufficient records / New user empty state
  if (!hasRecords) {
    return (
      <Card className="p-6 md:p-8 border-dashed border-slate-300 bg-slate-50/70 text-center space-y-4">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-display text-lg font-bold text-slate-900">
            {L(
              'We need more health information to personalize recommendations.',
              'सुझाव व्यक्तिगत बनाने के लिए हमें और स्वास्थ्य जानकारी की आवश्यकता है।'
            )}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {L(
              'Upload a relevant medical report, lab test, or doctor prescription to unlock record-grounded food and exercise guidance tailored to your actual numbers.',
              'अपनी सटीक रिपोर्ट पर आधारित व्यक्तिगत आहार और व्यायाम मार्गदर्शन पाने के लिए मेडिकल रिपोर्ट या पर्चा अपलोड करें।'
            )}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('documents')
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Upload size={14} />
            <span>{L('Upload medical report', 'मेडिकल रिपोर्ट अपलोड करें')}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 max-w-sm mx-auto pt-1 leading-relaxed">
          {L(
            'HealthCopilot never invents dietary or fitness advice without verified records.',
            'HealthCopilot बिना सत्यापित रिकॉर्ड के कोई काल्पनिक खान-पान सलाह नहीं देता।'
          )}
        </p>
      </Card>
    )
  }

  const plan: WellnessRecommendationPlan | undefined =
    CONDITION_RECOMMENDATIONS[conditionId] || CONDITION_RECOMMENDATIONS['diabetes']

  if (!plan) return null

  return (
    <div className="space-y-5">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
              <Sparkles size={11} className="text-teal-600" />
              <span>{L('Personalized Wellness Recommendations', 'व्यक्तिगत स्वास्थ्य एवं जीवनशैली सुझाव')}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {L('Record-Grounded', 'सत्यापित रिकॉर्ड आधारित')}
            </span>
          </div>

          <h3 className="font-display text-xl font-bold text-slate-900 tracking-tight">
            {L(plan.title, plan.titleHi)}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {L(
              'Simple, practical everyday food and movement guidance grounded in your verified readings.',
              'आपकी सत्यापित जांच रिपोर्ट पर आधारित सरल, व्यावहारिक खान-पान और व्यायाम मार्गदर्शन।'
            )}
          </p>
        </div>

        {/* Requirement 8: "Why am I seeing this?" Button */}
        <button
          type="button"
          onClick={() => setShowWhyModal(!showWhyModal)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-semibold border border-sky-200/80 transition cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <HelpCircle size={13} className="text-sky-700" />
          <span>{L('Why am I seeing this?', 'मुझे यह सुझाव क्यों दिखाई दे रहे हैं?')}</span>
          {showWhyModal ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Requirement 8: "Why am I seeing this?" Explanation Box */}
      {showWhyModal && (
        <div className="anim-fade-up rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5 text-xs text-slate-800 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-sky-700 shrink-0" />
              <h4 className="font-bold text-sky-950 text-sm">
                {L(plan.reason.title, plan.reason.titleHi)}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowWhyModal(false)}
              className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="leading-relaxed text-slate-700 font-medium">
            {L(plan.reason.explanation, plan.reason.explanationHi)}
          </p>

          <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px]">
            <div>
              <span className="text-slate-500 font-semibold">{L('Verified Measurement: ', 'सत्यापित माप: ')}</span>
              <span className="font-bold text-slate-900">
                {L(plan.reason.groundedMeasurement, plan.reason.groundedMeasurementHi)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">{L('Source Record: ', 'स्रोत दस्तावेज़: ')}</span>
              <span className="font-bold text-teal-800">
                {L(plan.reason.sourceDocument, plan.reason.sourceDocumentHi)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB SELECTOR: Food vs Exercise */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab('food')}
          className={cx(
            'flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer',
            activeTab === 'food'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Utensils size={14} className={activeTab === 'food' ? 'text-teal-700' : 'text-slate-500'} />
          <span>{L('Food Guidance', 'आहार व खान-पान')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exercise')}
          className={cx(
            'flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer',
            activeTab === 'exercise'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Activity size={14} className={activeTab === 'exercise' ? 'text-teal-700' : 'text-slate-500'} />
          <span>{L('Exercise & Movement', 'व्यायाम व गतिविधि')}</span>
        </button>
      </div>

      {/* TAB CONTENT: FOOD RECOMMENDATIONS */}
      {activeTab === 'food' && (
        <div className="anim-fade-up space-y-5">
          {/* 1. Suitable Foods vs Foods to Limit (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Suitable Foods */}
            <Card className="p-5 border-emerald-200/80 bg-gradient-to-br from-emerald-50/30 via-white to-white space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0 font-bold">
                  ✓
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-900">
                    {L('Foods That May Be Suitable', 'अनुकूल खाद्य पदार्थ (लेने योग्य)')}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {L('Nutritious options grounded in your health profile', 'आपकी प्रोफ़ाइल के अनुकूल पौष्टिक विकल्प')}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {plan.food.suitable.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-emerald-100/90 shadow-2xs text-xs space-y-0.5"
                  >
                    <p className="font-bold text-emerald-950 flex items-center justify-between">
                      <span>{L(item.item, item.itemHi)}</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {L('Encouraged', 'उपयुक्त')}
                      </span>
                    </p>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      {L(item.note, item.noteHi)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Foods to Limit */}
            <Card className="p-5 border-amber-200/80 bg-gradient-to-br from-amber-50/30 via-white to-white space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-900 shrink-0 font-bold">
                  !
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-900">
                    {L('Foods to Limit or Moderate', 'सीमित करने योग्य खाद्य पदार्थ')}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {L('Gentle boundaries to keep readings in healthy brackets', 'रीडिंग को नियंत्रित रखने के लिए सावधानियाँ')}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {plan.food.limit.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-amber-100/90 shadow-2xs text-xs space-y-0.5"
                  >
                    <p className="font-bold text-amber-950 flex items-center justify-between">
                      <span>{L(item.item, item.itemHi)}</span>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {L('Limit intake', 'सीमित रखें')}
                      </span>
                    </p>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      {L(item.note, item.noteHi)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 2. Simple Meal Ideas */}
          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Utensils size={16} className="text-teal-700" />
                  <h4 className="font-display text-base font-bold text-slate-900">
                    {L('Simple Meal Ideas for the Day', 'दिन भर के लिए सरल थाली विचार')}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {L('Easy-to-prepare everyday Indian meals with no complex ingredients', 'सरल घरेलू व्यंजन जो आसानी से बनाए जा सकते हैं')}
                </p>
              </div>

              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 hidden sm:inline">
                {L('4 Routine Ideas', '4 दैनिक विचार')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {plan.food.mealIdeas.map((meal, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1"
                >
                  <p className="font-bold text-slate-900">{L(meal.meal, meal.mealHi)}</p>
                  <p className="text-slate-600 leading-relaxed text-[11.5px]">
                    {L(meal.description, meal.descriptionHi)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* 3. Hydration Guidance */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-start gap-3 text-xs text-sky-950">
            <Droplets size={18} className="text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-sky-900">
                {L(plan.food.hydration.title, plan.food.hydration.titleHi)}
              </p>
              <p className="text-slate-700 leading-relaxed">
                {L(plan.food.hydration.guideline, plan.food.hydration.guidelineHi)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EXERCISE RECOMMENDATIONS */}
      {activeTab === 'exercise' && (
        <div className="anim-fade-up space-y-5">
          {/* Quick Metrics: Duration & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200/80 flex items-center gap-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-white shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  {L('Suggested Duration', 'सुझाई गई अवधि')}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {L(plan.exercise.suggestedDuration, plan.exercise.suggestedDurationHi)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 flex items-center gap-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-600 text-white shrink-0">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                  {L('Suggested Frequency', 'सुझाई गई आवृत्ति')}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {L(plan.exercise.suggestedFrequency, plan.exercise.suggestedFrequencyHi)}
                </p>
              </div>
            </div>
          </div>

          {/* Suitable Activities */}
          <Card className="p-5 border-slate-200 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-teal-700" />
                <h4 className="font-display text-base font-bold text-slate-900">
                  {L('Suitable Activity Types', 'उपयुक्त गतिविधि प्रकार')}
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {L('Low-strain physical activities selected for your verified health status', 'सत्यापित स्वास्थ्य स्थिति के अनुसार सुरक्षित और प्रभावी व्यायाम')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {plan.exercise.suitableActivities.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5"
                >
                  <p className="font-bold text-slate-900 text-[12.5px]">
                    {L(act.activity, act.activityHi)}
                  </p>
                  <p className="text-slate-600 text-[11.5px] leading-relaxed">
                    {L(act.benefit, act.benefitHi)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Beginner Friendly Options */}
          <Card className="p-5 border-teal-200/70 bg-gradient-to-br from-teal-50/20 via-white to-white space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-600" />
                <h4 className="font-display text-base font-bold text-slate-900">
                  {L('Beginner-Friendly Starting Steps', 'शुरुआती लोगों के लिए सरल चरण')}
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {L('No gym membership or equipment needed — start right from your home', 'किसी जिम या उपकरण की ज़रूरत नहीं — घर से ही शुरुआत करें')}
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {plan.exercise.beginnerOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-3 text-xs"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-100 text-teal-800 shrink-0 font-bold text-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">{L(opt.title, opt.titleHi)}</p>
                    <p className="text-slate-600 text-[11.5px] leading-relaxed mt-0.5">
                      {L(opt.description, opt.descriptionHi)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Requirement 9: "Ask HealthCopilot" follow-up questions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-50/50 via-sky-50/40 to-teal-50/30 border border-violet-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
            <Sparkles size={14} className="text-violet-700" />
            <span>{L('Have Questions About These Recommendations?', 'इन सुझावों के बारे में कोई सवाल है?')}</span>
          </div>
          <p className="text-xs text-slate-600">
            {L(
              'Ask HealthCopilot to clarify specific foods, portion sizes, or safe exercise paces grounded in your records.',
              'अपने रिकॉर्ड के अनुसार विशिष्ट भोजन, मात्रा या व्यायाम गति के बारे में AI से पूछें।'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onAskAi(
              `Can you explain the personalized ${activeTab === 'food' ? 'food' : 'exercise'} recommendations for my ${conditionId === 'diabetes' ? 'blood sugar' : conditionId === 'blood_pressure' ? 'blood pressure' : conditionId === 'heart' ? 'heart health' : 'kidney function'} based on my verified records?`
            )
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Sparkles size={13} />
          <span>
            {L(
              `Ask about ${activeTab === 'food' ? 'diet' : 'exercise'}`,
              `${activeTab === 'food' ? 'खान-पान' : 'व्यायाम'} के बारे में पूछें`
            )}
          </span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Requirement 7: Safety & Non-Prescription Guardrail */}
      <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
        <ShieldCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold">
            {L('Important Wellness Safety Notice: ', 'महत्वपूर्ण सुरक्षा सूचना: ')}
          </span>
          {L(
            'These are general, record-informed wellness suggestions. They do not replace formal medical prescriptions or dietetic treatment. Follow your doctor’s advice, especially if you have a medical condition, take prescription medicines, or have physical exercise restrictions. Never stop or alter medications on your own.',
            'ये सामान्य, रिकॉर्ड-आधारित स्वास्थ्य सुझाव हैं। ये किसी डॉक्टर के पर्चे या उपचार का विकल्प नहीं हैं। हमेशा अपने चिकित्सक की सलाह का पालन करें, विशेषकर यदि आपकी दवाएं चल रही हों या व्यायाम संबंधी कोई रोक हो। खुद से कभी दवा न बदलें।'
          )}
        </p>
      </div>
    </div>
  )
}
