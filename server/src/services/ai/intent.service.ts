export type FarmIntent =
  | 'livestock'
  | 'health'
  | 'vaccination'
  | 'breeding'
  | 'milk'
  | 'feed'
  | 'finance'
  | 'reminders'
  | 'notifications'
  | 'general';

interface KeywordRule {
  intent: FarmIntent;
  keywords: string[];
}

const INTENT_RULES: KeywordRule[] = [
  {
    intent: 'vaccination',
    keywords: [
      'vaccin', 'vaccine', 'vaccination', 'booster', 'fmd', 'hs', 'bq', 'brucellosis',
      'overdue', 'due soon', 'लस', 'लसीकरण', 'टीका', 'टीकाकरण', 'लसी', 'बूस्टर',
      'टिका', 'लसीची तारीख', 'लंबित लस'
    ],
  },
  {
    intent: 'milk',
    keywords: [
      'milk', 'yield', 'dairy', 'morning', 'evening', 'litres', 'liters', 'fat', 'snf',
      'producer', 'highest producer', 'दूध', 'दुध', 'दुग्ध', 'लिटर', 'लीटर', 'मलाई',
      'फॅट', 'फैट', 'दुधाळ', 'डेअरी', 'उत्पादन'
    ],
  },
  {
    intent: 'breeding',
    keywords: [
      'breed', 'breeding', 'pregnant', 'pregnancy', 'calv', 'calving', 'gestation',
      'inseminat', 'semen', 'artificial insemination', 'heat', 'bull', 'deliver',
      'गर्भवती', 'गाभण', 'प्रसव', 'ब्यांत', 'सीमेन', 'कृत्रिम गर्भाधान', 'माजावर',
      'वेळ', 'प्रसूती', 'गाईचे वासरू', 'गर्भधारणा'
    ],
  },
  {
    intent: 'health',
    keywords: [
      'health', 'sick', 'ill', 'symptom', 'disease', 'fever', 'temperature', 'treatment',
      'medicine', 'doctor', 'vet', 'veterinarian', 'mastitis', 'infection', 'wound',
      'बीमार', 'तबीयत', 'बुखार', 'ताप', 'डॉक्टर', 'वैद्यकीय', 'औषध', 'दवा', 'उपचार',
      'लक्षण', 'थनैला', 'मस्तूल', 'जखम', 'रोग', 'संसर्ग'
    ],
  },
  {
    intent: 'feed',
    keywords: [
      'feed', 'fodder', 'ration', 'silage', 'dry fodder', 'green fodder', 'concentrate',
      'mineral', 'straw', 'hay', 'diet', 'चारा', 'पशु आहार', 'भूसा', 'कुट्टी',
      'मुरघास', 'साइलेज', 'हिरवा चारा', 'सुका चारा', 'दाणा', 'पेंड', 'खुराक', 'आहार'
    ],
  },
  {
    intent: 'finance',
    keywords: [
      'money', 'cost', 'spend', 'expense', 'income', 'revenue', 'profit', 'loss',
      'earning', 'price', 'rupee', 'rs', 'inr', 'kharch', 'kamai', 'paid', 'bill',
      'खर्च', 'कमाई', 'नफा', 'तोटा', 'उत्पन्न', 'आय', 'रुपये', 'पैसे', 'बिक्री',
      'लेखा', 'खर्चा', 'नुकसान', 'बचत'
    ],
  },
  {
    intent: 'reminders',
    keywords: [
      'reminder', 'task', 'chore', 'todo', 'schedule', 'alert', 'pending',
      'अनुस्मारक', 'कार्य', 'काम', 'स्मरण', 'लंबित कार्य', 'वेळापत्रक', 'रिमाइंडर'
    ],
  },
  {
    intent: 'livestock',
    keywords: [
      'animal', 'cow', 'cattle', 'buffalo', 'bull', 'calf', 'herd', 'species', 'breed',
      'total animals', 'how many', 'count', 'पशु', 'गाय', 'भैंस', 'बैल', 'बछड़ा',
      'वासरू', 'म्हैस', 'जनावरे', 'पशुधन', 'गोठे', 'प्राणी', 'संख्या'
    ],
  },
];

/**
 * Lightweight multilingual intent detector for agricultural and farm queries
 */
export function detectIntents(message: string): FarmIntent[] {
  const lowerMsg = message.toLowerCase().trim();
  const matchedIntents = new Set<FarmIntent>();

  for (const rule of INTENT_RULES) {
    for (const kw of rule.keywords) {
      if (lowerMsg.includes(kw)) {
        matchedIntents.add(rule.intent);
        break;
      }
    }
  }

  // If no specific domain detected, mark as general
  if (matchedIntents.size === 0) {
    matchedIntents.add('general');
  }

  return Array.from(matchedIntents);
}

/**
 * Derives a clean concise conversation title from the first query and detected intents
 */
export function deriveConversationTitle(message: string, intents: FarmIntent[], language: string = 'en'): string {
  const primaryIntent = intents[0] || 'general';

  const titleMap: Record<FarmIntent, Record<string, string>> = {
    vaccination: { en: 'Vaccination Schedule', hi: 'टीकाकरण स्थिति', mr: 'लसीकरण माहिती' },
    milk: { en: 'Milk Production Inquiry', hi: 'दूध उत्पादन विवरण', mr: 'दूध उत्पादन चौकशी' },
    breeding: { en: 'Breeding & Pregnancy', hi: 'प्रजनन एवं गर्भावस्था', mr: 'प्रजनन व गाभण स्थिती' },
    health: { en: 'Livestock Health Query', hi: 'पशु स्वास्थ्य परामर्श', mr: 'जनावरांचे आरोग्य' },
    feed: { en: 'Feed & Nutrition', hi: 'चारा एवं आहार', mr: 'चारा व आहार व्यवस्थापन' },
    finance: { en: 'Farm Financial Overview', hi: 'फार्म वित्तीय विवरण', mr: 'शेतीचे आर्थिक हिशोब' },
    reminders: { en: 'Tasks & Reminders', hi: 'फार्म अनुस्मारक व कार्य', mr: 'कामे आणि रिमाइंडर' },
    livestock: { en: 'Herd Information', hi: 'पशुधन विवरण', mr: 'पशुधनाची माहिती' },
    notifications: { en: 'Farm Alerts', hi: 'फार्म सूचनाएं', mr: 'फार्म सूचना' },
    general: { en: 'Farm Assistant Chat', hi: 'फार्म सहायक चर्चा', mr: 'शेतकरी सहाय्यक चर्चा' },
  };

  const localizedIntentTitle = titleMap[primaryIntent]?.[language] || titleMap[primaryIntent]?.['en'];

  // If message is short, clean it up as title
  const cleanSnippet = message.trim().replace(/[?!.,;]/g, '').slice(0, 35);
  if (cleanSnippet.length > 5 && cleanSnippet.length <= 30) {
    return cleanSnippet;
  }

  return localizedIntentTitle || 'Farm Consultation';
}
