export interface FoodRecommendation {
  suitable: { item: string; itemHi: string; note: string; noteHi: string }[]
  limit: { item: string; itemHi: string; note: string; noteHi: string }[]
  mealIdeas: { meal: string; mealHi: string; description: string; descriptionHi: string }[]
  hydration: { title: string; titleHi: string; guideline: string; guidelineHi: string }
}

export interface ExerciseRecommendation {
  suitableActivities: { activity: string; activityHi: string; benefit: string; benefitHi: string }[]
  suggestedDuration: string
  suggestedDurationHi: string
  suggestedFrequency: string
  suggestedFrequencyHi: string
  beginnerOptions: { title: string; titleHi: string; description: string; descriptionHi: string }[]
}

export interface WellnessRecommendationPlan {
  conditionId: string
  title: string
  titleHi: string
  food: FoodRecommendation
  exercise: ExerciseRecommendation
  reason: {
    title: string
    titleHi: string
    groundedMeasurement: string
    groundedMeasurementHi: string
    sourceDocument: string
    sourceDocumentHi: string
    explanation: string
    explanationHi: string
  }
}

export const CONDITION_RECOMMENDATIONS: Record<string, WellnessRecommendationPlan> = {
  diabetes: {
    conditionId: 'diabetes',
    title: 'Blood Sugar Balance Guidance',
    titleHi: 'रक्त शर्करा संतुलन सुझाव',
    reason: {
      title: 'Why am I seeing this?',
      titleHi: 'मुझे यह सुझाव क्यों दिखाई दे रहे हैं?',
      groundedMeasurement: 'Fasting blood glucose 118 mg/dL and HbA1c 6.4%',
      groundedMeasurementHi: 'फास्टिंग ब्लड ग्लूकोज 118 mg/dL और HbA1c 6.4%',
      sourceDocument: 'CBC & Metabolic Panel (07 Oct 2026) and Dr. Menon Prescription',
      sourceDocumentHi: 'सीबीसी व मेटाबोलिक पैनल (07 अक्टूबर 2026) और डॉ. मेनन का पर्चा',
      explanation:
        'Your verified laboratory report recorded a fasting blood sugar slightly outside the reference range (118 mg/dL). These gentle dietary and movement habits support steady daytime energy and carbohydrate balance.',
      explanationHi:
        'आपकी सत्यापित लैब रिपोर्ट में फास्टिंग ब्लड शुगर संदर्भ सीमा से थोड़ी ऊपर (118 mg/dL) दर्ज की गई है। ये सरल भोजन और व्यायाम सुझाव शरीर में शर्करा को संतुलित रखने में मदद करते हैं।',
    },
    food: {
      suitable: [
        {
          item: 'High-Fiber Whole Grains',
          itemHi: 'उच्च फाइबर वाले साबुत अनाज',
          note: 'Barley, steel-cut oats, brown rice, or multigrain rotis slow glucose absorption.',
          noteHi: 'जौ, ओट्स, ब्राउन राइस या मल्टीग्रेन रोटी जो शुगर को धीरे-धीरे सोखने में मदद करते हैं।',
        },
        {
          item: 'Non-Starchy Vegetables',
          itemHi: 'हरी पत्तेदार व गैर-स्टार्च वाली सब्जियाँ',
          note: 'Spinach (palak), methi, cucumbers, gourds, and bitter gourd (karela).',
          noteHi: 'पालक, मेथी, खीरा, लौकी और करेला जो शर्करा नहीं बढ़ाते।',
        },
        {
          item: 'Plant & Lean Protein',
          itemHi: 'दालें और प्रोटीन युक्त आहार',
          note: 'Sprouted moong, lentils (dal), roasted chana, tofu, and boiled eggs.',
          noteHi: 'अंकुरित मूंग, दालें, भुना चना और उबले अंडे।',
        },
        {
          item: 'Healthy Fats in Moderation',
          itemHi: 'स्वस्थ वसा (सीमित मात्रा में)',
          note: 'Small handful of almonds or walnuts, chia seeds, and light mustard or olive oil.',
          noteHi: 'मुट्ठी भर बादाम, अखरोट, चिया बीज और हल्का सरसों या जैतून का तेल।',
        },
      ],
      limit: [
        {
          item: 'Refined Flours & Sugars',
          itemHi: 'मैदा और अतिरिक्त चीनी',
          note: 'White breads, bakery biscuits, sweets (mithai), and sugary snacks.',
          noteHi: 'सफेद ब्रेड, बिस्कुट, मिठाइयाँ और डिब्बाबंद स्नैक्स।',
        },
        {
          item: 'Sweetened Beverages',
          itemHi: 'मीठे पेय व सोडे',
          note: 'Packaged fruit juices, sodas, energy drinks, and heavily sweetened tea/coffee.',
          noteHi: 'डिब्बाबंद जूस, कोल्ड ड्रिंक्स और ज्यादा चीनी वाली चाय।',
        },
        {
          item: 'Deep-Fried Fried Snacks',
          itemHi: 'तले-भुने पकवान',
          note: 'Pakoras, samosas, and commercial chips that cause delayed glucose spikes.',
          noteHi: 'समोसे, पकोड़े और चिप्स जो पेट में भारीपन और शुगर स्पाइक करते हैं।',
        },
      ],
      mealIdeas: [
        {
          meal: 'Breakfast: Sprouted Moong Bowl or Veggie Dalia',
          mealHi: 'नाश्ता: अंकुरित मूंग चाट या दलिया',
          description:
            'Warm dalia with carrots and beans, or sprouted moong with lemon and pinch of jeera. Provides sustained energy without blood sugar spikes.',
          descriptionHi:
            'गाजर व बीन्स के साथ दलिया, या नींबू व जीरे के साथ अंकुरित मूंग। रक्त शर्करा को स्थिर रखता है।',
        },
        {
          meal: 'Lunch: Balanced Rainbow Plate',
          mealHi: 'दोपहर का भोजन: संतुलित थाली',
          description:
            'Half plate seasonal greens/salad, quarter plate cooked dal or paneer, quarter plate 1–2 multigrain rotis or brown rice.',
          descriptionHi:
            'आधी थाली सलाद व हरी सब्जी, एक चौथाई दाल या पनीर, और एक चौथाई भाग में 1-2 मल्टीग्रेन रोटी।',
        },
        {
          meal: 'Evening Snack: Roasted Chana & Green Tea',
          mealHi: 'शाम का नाश्ता: भुना चना व ग्रीन टी',
          description:
            'A small cup of roasted unsalted chana or roasted makhana (foxnuts) with herbal tea.',
          descriptionHi:
            'बिना नमक का भुना चना या मखाना और बिना चीनी की हर्बल चाय।',
        },
        {
          meal: 'Dinner: Light Lauki/Tinda Sabzi with Moong Dal',
          mealHi: 'रात का खाना: लौकी की सब्जी और पतली मूंग दाल',
          description:
            'Light, easily digestible meal taken at least 2 hours before sleep.',
          descriptionHi:
            'हल्का, सुपाच्य भोजन जो सोने से कम से कम 2 घंटे पहले लिया जाए।',
        },
      ],
      hydration: {
        title: 'Hydration Guidance',
        titleHi: 'पानी पीने का नियम',
        guideline:
          'Aim for 8 to 10 glasses (2 to 2.5 liters) of plain water daily spread evenly throughout the day. Water assists the kidneys in clearing excess circulating glucose naturally. Avoid sweetened syrups.',
        guidelineHi:
          'दिन भर में 8 से 10 गिलास (2 से 2.5 लीटर) सादा पानी पिएं। पर्याप्त पानी किडनी को अतिरिक्त शर्करा निकालने में मदद करता है। मीठे शर्बतों से बचें।',
      },
    },
    exercise: {
      suitableActivities: [
        {
          activity: 'Brisk Post-Meal Walking',
          activityHi: 'भोजन के बाद तेज टहलना (ब्रिस्क वॉक)',
          benefit: 'Helps working muscles absorb glucose directly from the bloodstream without heavy insulin demand.',
          benefitHi: 'मांसपेशियों को रक्त से सीधे शर्करा सोखने में मदद करता है।',
        },
        {
          activity: 'Gentle Yoga & Stretching',
          activityHi: 'सरल योगासन और स्ट्रेचिंग',
          benefit: 'Asanas like Mandukasana, Tadasana, and gentle sun salutations improve circulation and reduce stress hormones.',
          benefitHi: 'मंडूकासन और ताड़ासन तनाव कम करने और पाचन सुधारने में सहायक हैं।',
        },
        {
          activity: 'Light Bodyweight Calisthenics',
          activityHi: 'हल्का शारीरिक व्यायाम',
          benefit: 'Chair sit-to-stands, wall push-ups, and gentle calf raises preserve vital muscle mass.',
          benefitHi: 'कुर्सी से उठना-बैठना और दीवार के सहारे पुश-अप मांसपेशियों को मजबूत रखते हैं।',
        },
      ],
      suggestedDuration: '20 to 30 minutes daily (can be split into 10–15 min sessions)',
      suggestedDurationHi: 'प्रतिदिन 20 से 30 मिनट (10-15 मिनट के दो हिस्सों में भी कर सकते हैं)',
      suggestedFrequency: '5 days a week',
      suggestedFrequencyHi: 'सप्ताह में 5 दिन',
      beginnerOptions: [
        {
          title: 'The 15-Minute Post-Meal Stroll',
          titleHi: 'भोजन के बाद 15 मिनट की सैर',
          description:
            'Start by walking at a relaxed pace for just 10–15 minutes after lunch or dinner. No special equipment or gym required.',
          descriptionHi:
            'दोपहर या रात के भोजन के बाद 10-15 मिनट धीमी गति से टहलने से शुरुआत करें। किसी उपकरण की आवश्यकता नहीं।',
        },
        {
          title: 'Chair-Assisted Squats',
          titleHi: 'कुर्सी पर बैठकर उठने का अभ्यास',
          description:
            'Sit down on a sturdy chair, stand up fully, and repeat 8 to 10 times. Rest for 1 minute and do a second round.',
          descriptionHi:
            'मजबूत कुर्सी पर बैठें, फिर खड़े हों। इसे 8 से 10 बार दोहराएं। यह पैरों की मांसपेशियों को सक्रिय करता है।',
        },
        {
          title: 'Deep Diaphragmatic Breathing (Pranayama)',
          titleHi: 'गहरी सांस लेने का अभ्यास (अनुलोम-विलोम)',
          description:
            '5 to 10 minutes of slow rhythmic breathing morning or evening to lower cortisol and steady autonomic heart tone.',
          descriptionHi:
            'सुबह या शाम 5-10 मिनट शांत बैठकर अनुलोम-विलोम करें, जिससे मानसिक तनाव कम होता है।',
        },
      ],
    },
  },

  blood_pressure: {
    conditionId: 'blood_pressure',
    title: 'Healthy Circulation & Vascular Guidance',
    titleHi: 'स्वस्थ रक्तचाप व संचरण सुझाव',
    reason: {
      title: 'Why am I seeing this?',
      titleHi: 'मुझे यह सुझाव क्यों दिखाई दे रहे हैं?',
      groundedMeasurement: 'Blood pressure 118/76 mmHg (Normotensive)',
      groundedMeasurementHi: 'ब्लड प्रेशर 118/76 mmHg (सामान्य)',
      sourceDocument: 'Sunrise Family Clinic Consultation Note (28 Sep 2026)',
      sourceDocumentHi: 'सनराइज फैमिली क्लिनिक परामर्श नोट (28 सितम्बर 2026)',
      explanation:
        'Your verified checkup confirmed healthy normal blood pressure (118/76 mmHg). These suggestions focus on preserving this optimal arterial flexibility through modest sodium and consistent daily movement.',
      explanationHi:
        'आपकी क्लिनिक रिपोर्ट में ब्लड प्रेशर पूरी तरह सामान्य (118/76 mmHg) पाया गया। ये सुझाव कम नमक और नियमित टहलने के जरिए इस स्वस्थ स्थिति को बनाए रखने के लिए हैं।',
    },
    food: {
      suitable: [
        {
          item: 'Potassium-Rich Foods',
          itemHi: 'पोटेशियम युक्त प्राकृतिक फल व सब्जियाँ',
          note: 'Bananas, coconut water, sweet potatoes, and oranges help balance sodium in the body.',
          noteHi: 'केला, नारियल पानी, शकरकंद और संतरा जो शरीर में सोडियम का संतुलन बनाते हैं।',
        },
        {
          item: 'Garlic & Mild Natural Herbs',
          itemHi: 'लहसुन और प्राकृतिक मसाले',
          note: 'Fresh garlic, coriander, ginger, and cumin enhance food flavor without extra table salt.',
          noteHi: 'लहसुन, धनिया, अदरक और जीरा जो बिना अतिरिक्त नमक के स्वाद बढ़ाते हैं।',
        },
        {
          item: 'Leafy Greens & Beetroot',
          itemHi: 'हरी सब्जियाँ और चुकंदर',
          note: 'Natural dietary nitrates support nitric oxide production, relaxing blood vessel walls.',
          noteHi: 'प्राकृतिक नाइट्रेट्स जो रक्त धमनियों को शिथिल और लचीला रखते हैं।',
        },
        {
          item: 'Low-Fat Yogurt / Curd',
          itemHi: 'ताजा दही व छाछ',
          note: 'Unsalted buttermilk (chaas) with roasted jeera provides calcium and gut probiotics.',
          noteHi: 'बिना नमक की भुने जीरे वाली छाछ जो पाचन और कैल्शियम के लिए उत्तम है।',
        },
      ],
      limit: [
        {
          item: 'Excess Table Salt & Pickles',
          itemHi: 'अतिरिक्त नमक और तीखा अचार',
          note: 'Limit papads, commercial pickles (achar), and salting food at the dining table.',
          noteHi: 'पापड़, ज्यादा नमक वाले अचार और खाने पर ऊपर से कच्चा नमक डालने से बचें।',
        },
        {
          item: 'Preserved & Canned Soups/Sauces',
          itemHi: 'डिब्बाबंद सूप और सॉस',
          note: 'High in hidden sodium preservatives like monosodium glutamate and sodium benzoate.',
          noteHi: 'छिपे हुए सोडियम प्रिजर्वेटिव्स जो रक्तचाप को बढ़ा सकते हैं।',
        },
        {
          item: 'Excessive Caffeine Intake',
          itemHi: 'ज्यादा चाय या कॉफी',
          note: 'Limit strong teas or coffees to no more than 2 cups per day.',
          noteHi: 'दिन में 2 कप से ज्यादा तेज चाय या कॉफी न लें।',
        },
      ],
      mealIdeas: [
        {
          meal: 'Breakfast: Oats Porridge with Walnuts & Fruit',
          mealHi: 'नाश्ता: ओट्स दलिया बादाम व फल के साथ',
          description:
            'Warm cooked oats with skim milk or water, topped with sliced banana and a few chopped walnuts. Very low in sodium.',
          descriptionHi:
            'हल्के दूध में पके ओट्स, ऊपर से केला व अखरोट। बहुत कम सोडियम युक्त स्वस्थ नाश्ता।',
        },
        {
          meal: 'Lunch: Steamed Rice, Dal & Beetroot Salad',
          mealHi: 'दोपहर का भोजन: दाल, चावल और चुकंदर सलाद',
          description:
            'Freshly cooked arhar or moong dal with turmeric, steamed brown or white rice, and cucumber-beetroot salad seasoned with lemon juice instead of salt.',
          descriptionHi:
            'हल्दी वाली ताजी दाल, चावल और नमक की जगह नींबू से तैयार खीरा-चुकंदर सलाद।',
        },
        {
          meal: 'Evening: Fresh Roasted Makhana with Herbs',
          mealHi: 'शाम: भुने मखाने पुदीने के साथ',
          description:
            'Crisp dry-roasted foxnuts seasoned with mint powder and black pepper.',
          descriptionHi:
            'सूखे भुने मखाने, पुदीना पाउडर और काली मिर्च के साथ।',
        },
        {
          meal: 'Dinner: Vegetable Khichdi with Plain Curd',
          mealHi: 'रात का खाना: पौष्टिक वेज खिचड़ी व दही',
          description:
            'Light moong dal khichdi prepared with carrots, peas, and a light spoon of ghee.',
          descriptionHi:
            'गाजर, मटर और मूंग दाल से बनी हल्की खिचड़ी और एक कटोरी ताजा दही।',
        },
      ],
      hydration: {
        title: 'Hydration Guidance',
        titleHi: 'तरल पदार्थ और पानी',
        guideline:
          'Drink roughly 2 to 2.5 liters of clean water daily. Steady hydration prevents hemoconcentration and keeps cardiac output smooth. Avoid salty packaged electrolytes unless recommended by your physician.',
        guidelineHi:
          'रोजाना लगभग 2 से 2.5 लीटर साफ पानी पिएं। पर्याप्त पानी धमनियों के तनाव को कम रखता है। पैकेट वाले नमकीन ओआरएस या इलेक्ट्रोलाइट बिना डॉक्टर सलाह न लें।',
      },
    },
    exercise: {
      suitableActivities: [
        {
          activity: 'Moderate Aerobic Walking',
          activityHi: 'मध्यम गति से टहलना',
          benefit: 'Consistent rhythmic walking reduces arterial stiffness and lowers resting peripheral resistance.',
          benefitHi: 'धमनियों के लचीलेपन को बढ़ाकर विश्राम अवस्था में दबाव को नियंत्रित रखता है।',
        },
        {
          activity: 'Swimming or Water Aerobics',
          activityHi: 'तैरना या हल्का वाटर व्यायाम',
          benefit: 'Gentle whole-body cardiovascular conditioning with zero joint impact.',
          benefitHi: 'जोड़ों पर बिना दबाव डाले पूरे शरीर का व्यायाम।',
        },
        {
          activity: 'Calm Breathing Meditation (Shavasana)',
          activityHi: 'शवासन और ध्यान',
          benefit: 'Down-regulates sympathetic adrenaline tone within 10 minutes.',
          benefitHi: '10 मिनट में नर्वस सिस्टम को शांत करके रक्तचाप को स्थिर करता है।',
        },
      ],
      suggestedDuration: '30 minutes on most days',
      suggestedDurationHi: 'अधिकांश दिनों में 30 मिनट',
      suggestedFrequency: '5 to 6 days per week',
      suggestedFrequencyHi: 'सप्ताह में 5 से 6 दिन',
      beginnerOptions: [
        {
          title: 'Daily Morning Park Walk',
          titleHi: 'सुबह की 20 मिनट की सैर',
          description:
            'Stroll in morning fresh air for 20 minutes at a pace where you can comfortably speak without losing breath.',
          descriptionHi:
            'सुबह खुली हवा में 20 मिनट इस गति से टहलें कि आप बिना हांफे सामान्य बातचीत कर सकें।',
        },
        {
          title: 'Gentle Ankle & Shoulder Rotations',
          titleHi: 'कंधे और टखने के सरल व्यायाम',
          description:
            '5 minutes of standing or seated rotations to improve peripheral venous return.',
          descriptionHi:
            'बैठकर या खड़े होकर 5 मिनट हाथ-पैरों को घुमाना, जिससे नसों में खून का दौरा बेहतर होता है।',
        },
        {
          title: 'Evening 10-Minute Wind Down',
          titleHi: 'शाम का 10 मिनट का शांत विश्राम',
          description:
            'Lie flat in a quiet room, close your eyes, and take slow 4-second inhales and 6-second exhales.',
          descriptionHi:
            'शांत कमरे में सीधे लेटकर 4 सेकंड में सांस लें और 6 सेकंड में छोड़ें।',
        },
      ],
    },
  },

  heart: {
    conditionId: 'heart',
    title: 'Cardiovascular Longevity & Heart Rhythm Guidance',
    titleHi: 'हृदय स्वास्थ्य व दीर्घायु सुझाव',
    reason: {
      title: 'Why am I seeing this?',
      titleHi: 'मुझे यह सुझाव क्यों दिखाई दे रहे हैं?',
      groundedMeasurement: 'Resting pulse 68 bpm and total cholesterol 182 mg/dL',
      groundedMeasurementHi: 'आराम के समय पल्स 68 bpm और कुल कोलेस्ट्रॉल 182 mg/dL',
      sourceDocument: 'Hospital Discharge Summary & Routine Lipid Panel (12 Sep 2026)',
      sourceDocumentHi: 'अस्पताल डिस्चार्ज सारांश व लिपिड प्रोफाइल (12 सितम्बर 2026)',
      explanation:
        'Your records demonstrate a steady resting rhythm and lipid levels within target limits. These wellness recommendations protect cardiac endurance and healthy blood vessel lining.',
      explanationHi:
        'आपकी रिपोर्ट में आराम की धड़कन (68 bpm) और कोलेस्ट्रॉल (182 mg/dL) सुरक्षित स्तर में हैं। ये सुझाव हृदय की मांसपेशियों और नसों की लंबी उम्र के लिए हैं।',
    },
    food: {
      suitable: [
        {
          item: 'Heart-Healthy Monounsaturated Fats',
          itemHi: 'हृदय के लिए उत्तम वसा (मोनोअनसैचुरेटेड)',
          note: 'A small handful of raw walnuts, almonds, flaxseed powder (alsi), or mustard oil.',
          noteHi: 'कच्चे अखरोट, बादाम, अलसी का पाउडर और शुद्ध सरसों का तेल।',
        },
        {
          item: 'Soluble Oat Beta-Glucan & Apples',
          itemHi: 'घुलनशील फाइबर (ओट्स व सेब)',
          note: 'Soluble fiber binds to bile acids in the intestine to help maintain healthy cholesterol.',
          noteHi: 'घुलनशील फाइबर जो खून में खराब कोलेस्ट्रॉल को जमने से रोकता है।',
        },
        {
          item: 'Antioxidant-Rich Berries & Amla',
          itemHi: 'आंवला और एंटीऑक्सीडेंट फल',
          note: 'Fresh Indian gooseberry (amla), pomegranates, and guavas support vascular elasticity.',
          noteHi: 'ताजा आंवला, अनार और अमरूद जो धमनियों की दीवारों को स्वस्थ रखते हैं।',
        },
        {
          item: 'Legumes & High-Folate Beans',
          itemHi: 'दालें और राजमा/चना',
          note: 'Rich in dietary magnesium and folate for smooth rhythmic heartbeat.',
          noteHi: 'मैग्नीशियम और फोलेट से भरपूर जो दिल की धड़कन को लयबद्ध रखते हैं।',
        },
      ],
      limit: [
        {
          item: 'Trans-Fats & Vanaspati Ghee',
          itemHi: 'वनस्पति घी और डालडा',
          note: 'Commercial bakeries and re-heated cooking oils that oxidize LDL particles.',
          noteHi: 'बार-बार गर्म किया गया तेल और बाजार की पेस्ट्री/पफ जो नसों को सख्त करते हैं।',
        },
        {
          item: 'Processed Meats & Heavy Cream',
          itemHi: 'अत्यधिक मलाई व प्रसंस्कृत मांस',
          note: 'High in saturated palmitic fats that put workload on cardiovascular circulation.',
          noteHi: 'ज्यादा वसायुक्त भारी भोजन जो दिल पर दबाव डालता है।',
        },
        {
          item: 'Refined Table Sugars',
          itemHi: 'अतिरिक्त चीनी वाले खाद्य',
          note: 'Excess simple sugars convert directly into serum triglycerides in the liver.',
          noteHi: 'ज्यादा चीनी जो लीवर में ट्राइग्लिसराइड्स में बदल जाती है।',
        },
      ],
      mealIdeas: [
        {
          meal: 'Breakfast: Warm Amla-Infused Oats or Idli Sambar',
          mealHi: 'नाश्ता: आंवला ओट्स या स्टीम्ड इडली सांभर',
          description:
            'Steamed fermented rice-dal idlis with vegetable-rich sambar (plenty of drumstick, pumpkin, tomatoes). Zero heavy fat, very high in heart nutrients.',
          descriptionHi:
            'सब्जियों से भरपूर सांभर के साथ 2 भाप में पकी इडली। शून्य भारी वसा और हृदय के लिए अत्यंत सुपाच्य।',
        },
        {
          meal: 'Lunch: Mixed Grain Roti, Methi Sabzi & Moong Dal',
          mealHi: 'दोपहर का भोजन: मेथी की सब्जी, मूंग दाल और रोटी',
          description:
            'Fenugreek leaves (methi) cooked lightly with tomatoes and garlic, served with yellow moong dal.',
          descriptionHi:
            'टमाटर व लहसुन के साथ बनी मेथी की सब्जी और पीली मूंग दाल।',
        },
        {
          meal: 'Snack: Handful of Soaked Walnuts & Fresh Papaya',
          mealHi: 'शाम: भीगे अखरोट और पपीता',
          description:
            '3–4 soaked walnut halves with a bowl of fresh seasonal papaya or apple slices.',
          descriptionHi:
            '3-4 भीगे हुए अखरोट और एक कटोरी ताजा पपीता।',
        },
        {
          meal: 'Dinner: Vegetable Clear Soup with Paneer & Steamed Rice',
          mealHi: 'रात का खाना: वेज क्लियर सूप और हल्का भोजन',
          description:
            'Warm broth soup with carrots, spinach, and a few paneer cubes. Light on digestion.',
          descriptionHi:
            'गाजर और पालक का हल्का गर्म सूप और थोड़ा पनीर। रात के लिए हल्का और पौष्टिक।',
        },
      ],
      hydration: {
        title: 'Hydration Guidance',
        titleHi: 'हृदय के लिए पर्याप्त पानी',
        guideline:
          'Keep to standard daily fluid intake (about 2 to 2.5 liters) unless your cardiologist has placed you on a specific fluid restriction. Sip water steadily throughout the daytime.',
        guidelineHi:
          'प्रतिदिन 2 से 2.5 लीटर पानी पिएं (जब तक कि डॉक्टर ने कोई तरल सीमा न बताई हो)। दिन भर थोड़ा-थोड़ा पानी पीते रहें।',
      },
    },
    exercise: {
      suitableActivities: [
        {
          activity: 'Continuous Low-Impact Walking',
          activityHi: 'लगातार धीमी व स्थिर सैर',
          benefit: 'Strengthens cardiac stroke volume without spiking blood pressure spikes.',
          benefitHi: 'हृदय की पंपिंग क्षमता को मजबूत करता है बिना अचानक दबाव बढ़ाए।',
        },
        {
          activity: 'Light Stationary Cycling',
          activityHi: 'हल्की साइकिलिंग',
          benefit: 'Smooth continuous aerobic load at conversational breathing effort.',
          benefitHi: 'पैरों और दिल के लिए सुरक्षित और सहज कार्डियो व्यायाम।',
        },
        {
          activity: 'Gentle Yoga and Posture Alignment',
          activityHi: 'सरल योग और ताड़ासन',
          benefit: 'Expands thoracic lung capacity, easing venous heart return.',
          benefitHi: 'छाती और फेफड़ों को खोलकर दिल तक ऑक्सीजन का प्रवाह सुगम बनाता है।',
        },
      ],
      suggestedDuration: '25 to 30 minutes',
      suggestedDurationHi: '25 से 30 मिनट',
      suggestedFrequency: '4 to 5 days weekly',
      suggestedFrequencyHi: 'सप्ताह में 4 से 5 दिन',
      beginnerOptions: [
        {
          title: 'The Conversational Walk',
          titleHi: 'बातचीत की गति पर टहलना',
          description:
            'Walk at a pace where you can easily speak full sentences. If you feel breathless, slow down immediately.',
          descriptionHi:
            'उस गति से चलें जहाँ आप आसानी से पूरे वाक्य बोल सकें। सांस फूलने पर तुरंत गति धीमी करें।',
        },
        {
          title: 'Seated Arm Reaches',
          titleHi: 'कुर्सी पर बैठकर हाथ ऊपर उठाना',
          description:
            'Sit upright, breathe in while gently raising both arms overhead, breathe out while lowering them. 10 gentle repetitions.',
          descriptionHi:
            'सीधे बैठें, सांस लेते हुए दोनों हाथ ऊपर उठाएं, छोड़ते हुए नीचे लाएं। 10 बार दोहराएं।',
        },
        {
          title: 'Slow Calf Pumps',
          titleHi: 'एड़ी उठाना (काफ पंप्स)',
          description:
            'While holding a table for balance, rise onto your toes for 2 seconds and gently lower. Activates the "second heart" in your calves.',
          descriptionHi:
            'मेज का सहारा लेकर पंजों के बल 2 सेकंड उठें और नीचे आएं। यह पैरों की नसों से खून को ऊपर दिल तक भेजता है।',
        },
      ],
    },
  },

  kidney: {
    conditionId: 'kidney',
    title: 'Renal Filtration & Hydration Guidance',
    titleHi: 'किडनी फिल्ट्रेशन व जल संतुलन सुझाव',
    reason: {
      title: 'Why am I seeing this?',
      titleHi: 'मुझे यह सुझाव क्यों दिखाई दे रहे हैं?',
      groundedMeasurement: 'eGFR 104 mL/min and Serum Creatinine 0.9 mg/dL',
      groundedMeasurementHi: 'eGFR 104 mL/min और सीरम क्रिएटिनिन 0.9 mg/dL',
      sourceDocument: 'Comprehensive Metabolic Panel (CMP) (12 Sep 2026)',
      sourceDocumentHi: 'व्यापक मेटाबोलिक पैनल (12 सितम्बर 2026)',
      explanation:
        'Your verified metabolic report showed optimal Stage-1 kidney filtration (eGFR > 90). These recommendations emphasize steady hydration and avoiding unverified over-the-counter painkillers.',
      explanationHi:
        'आपकी लैब रिपोर्ट में किडनी फिल्ट्रेशन पूरी तरह उत्तम (eGFR 104) दर्ज है। ये सुझाव पर्याप्त पानी पीने और बिना पर्चे के दर्द निवारक दवाओं से बचने पर जोर देते हैं।',
    },
    food: {
      suitable: [
        {
          item: 'Fresh Hydrating Fruits & Vegetables',
          itemHi: 'ताजा पानीदार फल व सब्जियाँ',
          note: 'Cucumbers (kheera), bottle gourd (lauki), ridge gourd (turai), apples, and watermelon.',
          noteHi: 'खीरा, लौकी, तोरई, सेब और तरबूज जो शरीर को प्राकृतिक रूप से हाइड्रेटेड रखते हैं।',
        },
        {
          item: 'Adequate Quality Protein (Not Excess)',
          itemHi: 'संतुलित मात्रा में प्रोटीन (अत्यधिक नहीं)',
          note: 'Moderate portions of moong dal, paneer, and eggs; avoid massive unprescribed protein powders.',
          noteHi: 'मूंग दाल, थोड़ा पनीर और अंडे की संतुलित मात्रा। बिना डॉक्टर की सलाह भारी प्रोटीन पाउडर न लें।',
        },
        {
          item: 'Garlic, Onions & Fresh Herbs',
          itemHi: 'लहसुन, प्याज और ताजा धनिया',
          note: 'Add aroma and anti-inflammatory flavonoids without burdening renal filtration.',
          noteHi: 'प्राकृतिक सुगंध और गुण जो किडनी पर बिना किसी बोझ के स्वादिष्ट भोजन बनाते हैं।',
        },
        {
          item: 'Whole Grains in Normal Portions',
          itemHi: 'सामान्य मात्रा में साबुत अनाज',
          note: 'Barley water (jau ka paani), oats, and wheat rotis.',
          noteHi: 'जौ का पानी, ओट्स और गेहूं की सामान्य रोटियां।',
        },
      ],
      limit: [
        {
          item: 'Excessive Sodium & Salty Namkeens',
          itemHi: 'अत्यधिक नमक और नमकीन भुजिया',
          note: 'High sodium forces kidneys to work harder to balance extracellular fluid pressure.',
          noteHi: 'ज्यादा नमक किडनी को अतिरिक्त काम करने पर मजबूर करता है।',
        },
        {
          item: 'Unverified OTC Painkillers (NSAIDs)',
          itemHi: 'बिना पर्चे के दर्द निवारक दवाएं (पेनकिलर)',
          note: 'Drugs like ibuprofen or diclofenac taken frequently can damage renal filtration.',
          noteHi: 'ब्रुफेन या डाइक्लोफेनाक जैसी दवाओं का बार-बार सेवन किडनी को नुकसान पहुंचा सकता है।',
        },
        {
          item: 'Extreme Artificial Sweeteners & Sodas',
          itemHi: 'कोल्ड ड्रिंक्स और कृत्रिम मीठे उत्पाद',
          note: 'Phosphoric acid in dark sodas is associated with renal stress.',
          noteHi: 'काले सोडे में मौजूद फॉस्फोरिक एसिड किडनी पर तनाव डालता है।',
        },
      ],
      mealIdeas: [
        {
          meal: 'Breakfast: Soothing Dalia or Moong Cheela',
          mealHi: 'नाश्ता: हल्का दलिया या मूंग दाल चीला',
          description:
            'Thin moong dal pancake cooked with minimal oil, served with mint-coriander chutney. Light on renal clearance.',
          descriptionHi:
            'कम तेल में बना मूंग दाल का चीला और पुदीने की ताजी चटनी। किडनी के लिए हल्का और पौष्टिक।',
        },
        {
          meal: 'Lunch: Steamed Lauki Sabzi, Tur Dal & Rice',
          mealHi: 'दोपहर का भोजन: लौकी की सब्जी, तुअर दाल व चावल',
          description:
            'Bottle gourd cooked with cumin and a pinch of turmeric, accompanied by thin dal and warm rice.',
          descriptionHi:
            'जीरा और हल्दी में बनी लौकी, पतली दाल और ताजा भात।',
        },
        {
          meal: 'Evening: Barley Water or Coconut Water',
          mealHi: 'शाम: जौ का पानी या ताजा नारियल पानी',
          description:
            'A glass of light strained barley water or fresh coconut water for natural fluid replenishment.',
          descriptionHi:
            'एक गिलास हल्का जौ का पानी या नारियल पानी जो प्राकृतिक रूप से सफाई करता है।',
        },
        {
          meal: 'Dinner: Vegetable Soup with Soft Phulka',
          mealHi: 'रात का खाना: सब्जियों का सूप और नरम फुल्का',
          description:
            'Light mixed vegetable soup with 1–2 soft rotis. Keep dinner salt very low.',
          descriptionHi:
            'सब्जियों का हल्का सूप और 1-2 नरम रोटियां। रात में नमक बहुत कम रखें।',
        },
      ],
      hydration: {
        title: 'Hydration Guidance (Crucial for Kidneys)',
        titleHi: 'किडनी के लिए पानी का नियम (अति महत्वपूर्ण)',
        guideline:
          'Drink 2.5 to 3 liters of fresh drinking water every day, especially while taking prescribed medications like antibiotics. Drink a glass upon waking and keep a water bottle visible nearby.',
        guidelineHi:
          'प्रतिदिन 2.5 से 3 लीटर साफ पानी पिएं, विशेष रूप से जब एंटीबायोटिक या अन्य दवाएं चल रही हों। सुबह उठते ही एक गिलास पानी पिएं और पास में पानी की बोतल रखें।',
      },
    },
    exercise: {
      suitableActivities: [
        {
          activity: 'Low-Impact Brisk Walking',
          activityHi: 'धीमी व संतुलित सैर',
          benefit: 'Promotes microvascular blood flow to the renal cortex without dehydration stress.',
          benefitHi: 'किडनी में खून के दौरे को सुचारू रखता है बिना शरीर को थकाए।',
        },
        {
          activity: 'Gentle Pilates or Core Conditioning',
          activityHi: 'सरल कोर व्यायाम',
          benefit: 'Builds trunk stabilization and pelvic floor support.',
          benefitHi: 'पेट और कमर की मांसपेशियों को सहारा देता है।',
        },
        {
          activity: 'Mindful Breathing in Fresh Air',
          activityHi: 'खुली हवा में गहरी सांस',
          benefit: 'Reduces autonomic stress hormones that constrict renal arterioles.',
          benefitHi: 'तनाव कम करके किडनी की सूक्ष्म नसों को खुला और स्वस्थ रखता है।',
        },
      ],
      suggestedDuration: '20 to 30 minutes',
      suggestedDurationHi: '20 से 30 मिनट',
      suggestedFrequency: '4 to 5 days a week',
      suggestedFrequencyHi: 'सप्ताह में 4 से 5 दिन',
      beginnerOptions: [
        {
          title: 'Hydrated 20-Minute Stroll',
          titleHi: 'पानी पीकर 20 मिनट की सैर',
          description:
            'Drink half a glass of water before starting, walk at a comfortable pace, and sip water after finishing.',
          descriptionHi:
            'शुरू करने से पहले आधा गिलास पानी पिएं, सहज गति से टहलें और खत्म होने पर थोड़ा पानी पिएं।',
        },
        {
          title: 'Seated Leg Lifts',
          titleHi: 'कुर्सी पर बैठकर पैर उठाना',
          description:
            'While seated upright, slowly straighten one leg out, hold for 3 seconds, and lower. 10 times each side.',
          descriptionHi:
            'कुर्सी पर बैठकर एक पैर सीधा करें, 3 सेकंड रोकें और नीचे करें। दोनों पैरों से 10-10 बार।',
        },
        {
          title: 'Gentle Cat-Cow Stretch',
          titleHi: 'सरल मार्जरी आसन (कैट-काउ स्ट्रेच)',
          description:
            'Gentle arching and rounding of the back on a soft mat for 3–5 minutes to release lumbar stiffness.',
          descriptionHi:
            'नरम चटाई पर पीठ को धीरे-धीरे ऊपर-नीचे मोड़ना जिससे कमर का तनाव दूर होता है।',
        },
      ],
    },
  },
}

