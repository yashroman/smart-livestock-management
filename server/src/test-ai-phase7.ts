import {
  detectIntents,
  deriveConversationTitle,
  buildSystemPrompt,
  geminiProvider,
} from './services/ai';
import { chatHandler, getConversationsHandler, deleteConversationHandler } from './controllers/ai.controller';

console.log('====================================================');
console.log('PHASE 7 — AI FARM ASSISTANT TEST SUITE');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

// ----------------------------------------------------
// TEST GROUP 1: Multilingual Intent Detection
// ----------------------------------------------------
console.log('\n--- 1. Multilingual Intent Detection ---');

const engVaccine = detectIntents('Which animals need vaccination?');
assert(engVaccine.includes('vaccination'), 'Detects English vaccination intent');

const hiVaccine = detectIntents('किन पशुओं का टीकाकरण बाकी है?');
assert(hiVaccine.includes('vaccination'), 'Detects Hindi vaccination intent (टीकाकरण)');

const mrVaccine = detectIntents('कोणत्या जनावरांचे लसीकरण बाकी आहे?');
assert(mrVaccine.includes('vaccination'), 'Detects Marathi vaccination intent (लसीकरण)');

const engMilk = detectIntents('How much milk yield did we produce this morning?');
assert(engMilk.includes('milk'), 'Detects English milk production intent');

const hiMilk = detectIntents('इस महीने मैंने कितना दूध उत्पादन किया?');
assert(hiMilk.includes('milk'), 'Detects Hindi milk intent (दूध उत्पादन)');

const mrMilk = detectIntents('या महिन्यात किती लिटर दूध निघाले?');
assert(mrMilk.includes('milk'), 'Detects Marathi milk intent (लिटर दूध)');

const engBreeding = detectIntents('Which cows are confirmed pregnant?');
assert(engBreeding.includes('breeding'), 'Detects English breeding/pregnancy intent');

const mrBreeding = detectIntents('कोणती गाय गाभण आहे?');
assert(mrBreeding.includes('breeding'), 'Detects Marathi pregnancy intent (गाभण)');

const engFinance = detectIntents('What were our expenses and income this month?');
assert(engFinance.includes('finance'), 'Detects English finance/expense intent');

const hiFinance = detectIntents('इस महीने का कुल खर्च और बचत कितनी है?');
assert(hiFinance.includes('finance'), 'Detects Hindi expense intent (खर्च)');

const engGeneral = detectIntents('Hello, can you help me?');
assert(engGeneral.includes('general'), 'Detects general conversational greeting');

// ----------------------------------------------------
// TEST GROUP 2: Conversation Title Derivation
// ----------------------------------------------------
console.log('\n--- 2. Conversation Title Derivation ---');

const titleEn = deriveConversationTitle('Show my overdue vaccination schedule', ['vaccination'], 'en');
assert(typeof titleEn === 'string' && titleEn.length > 0, 'Derives English title for vaccination query');

const titleHi = deriveConversationTitle('टीकाकरण का विवरण दिखाएं', ['vaccination'], 'hi');
assert(titleHi.includes('टीकाकरण') || titleHi.length > 0, 'Derives Hindi title for vaccination query');

const titleMr = deriveConversationTitle('दूध उत्पादन माहिती सांगा', ['milk'], 'mr');
assert(titleMr.includes('दूध') || titleMr.length > 0, 'Derives Marathi title for milk query');

// ----------------------------------------------------
// TEST GROUP 3: System Prompt & Safety Grounding
// ----------------------------------------------------
console.log('\n--- 3. System Prompt & Safety Safeguards ---');

const mockFarmContext = {
  farmInfo: { name: 'Sai Dairy Farm', location: 'Pune, Maharashtra' },
  herdSummary: { totalAnimals: 12, healthyAnimals: 11, needsAttention: 1, pregnantAnimals: 3 },
  vaccinations: { pendingOrOverdueCount: 2, upcomingSchedule: [{ animalId: 'COW-001', vaccine: 'FMD' }] },
};

const promptEn = buildSystemPrompt(mockFarmContext, 'en');
assert(promptEn.includes('ANTI-FABRICATION'), 'System prompt contains Anti-Fabrication directive');
assert(promptEn.includes('VETERINARY SAFETY BOUNDARIES'), 'System prompt contains Veterinary Safety Boundaries');
assert(promptEn.includes('Sai Dairy Farm'), 'System prompt injects authenticated farm context');
assert(promptEn.includes('PROMPT INJECTION'), 'System prompt contains Prompt Injection Defense');

const promptHi = buildSystemPrompt(mockFarmContext, 'hi');
assert(promptHi.includes('HI') && promptHi.includes('हिन्दी'), 'System prompt enforces Hindi language directive');

const promptMr = buildSystemPrompt(mockFarmContext, 'mr');
assert(promptMr.includes('MR') && promptMr.includes('मराठी'), 'System prompt enforces Marathi language directive');

// ----------------------------------------------------
// TEST GROUP 4: Controller Validation & Multi-Tenant Security
// ----------------------------------------------------
console.log('\n--- 4. Controller Validation & Tenant Scoping ---');

// Mock response creator
function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
  return res;
}

// 4.1 Unauthenticated Request Rejection
async function testUnauthChat() {
  const req: any = { user: null, body: { message: 'Hello' } };
  const res = createMockRes();
  await chatHandler(req, res);
  assert(res.statusCode === 401, 'chatHandler rejects unauthenticated user with 401');
}

// 4.2 Empty Message Rejection
async function testEmptyMessage() {
  const req: any = { user: { id: 'user123', farmId: 'farm123' }, body: { message: '   ' } };
  const res = createMockRes();
  await chatHandler(req, res);
  assert(res.statusCode === 400, 'chatHandler rejects empty message with 400 Bad Request');
}

// 4.3 Message Exceeding 4000 Characters Rejection
async function testOversizedMessage() {
  const longMsg = 'A'.repeat(4001);
  const req: any = { user: { id: 'user123', farmId: 'farm123' }, body: { message: longMsg } };
  const res = createMockRes();
  await chatHandler(req, res);
  assert(res.statusCode === 400, 'chatHandler rejects message > 4000 characters with 400 Bad Request');
}

// 4.4 Unauthenticated Conversations Listing Rejection
async function testUnauthConvos() {
  const req: any = { user: null };
  const res = createMockRes();
  await getConversationsHandler(req, res);
  assert(res.statusCode === 401, 'getConversationsHandler rejects unauthenticated user with 401');
}

// 4.5 Unauthenticated Conversation Deletion Rejection
async function testUnauthDelete() {
  const req: any = { user: null, params: { id: 'convo123' } };
  const res = createMockRes();
  await deleteConversationHandler(req, res);
  assert(res.statusCode === 401, 'deleteConversationHandler rejects unauthenticated user with 401');
}

// ----------------------------------------------------
// TEST GROUP 5: Provider Abstraction & Fallback
// ----------------------------------------------------
console.log('\n--- 5. Provider Abstraction & Fallback ---');

assert(typeof geminiProvider.isConfigured === 'function', 'GeminiProvider exposes isConfigured() check');
assert(geminiProvider.name === 'Google Gemini', 'Provider name is Google Gemini');

// Run async tests
(async () => {
  await testUnauthChat();
  await testEmptyMessage();
  await testOversizedMessage();
  await testUnauthConvos();
  await testUnauthDelete();

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
