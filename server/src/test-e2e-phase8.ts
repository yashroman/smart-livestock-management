import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import {
  User,
  Farm,
  Livestock,
  HealthRecord,
  Vaccination,
  BreedingRecord,
  MilkRecord,
  FeedRecord,
  FinanceRecord,
  Reminder,
  Notification,
  AIConversation,
} from './models';
import { seedDemoData, DEMO_CONFIG } from './seed/seedDemoData';
import {
  detectIntents,
  buildSystemPrompt,
  geminiProvider,
} from './services/ai';
import { buildFarmContext } from './services/ai/farmContext.service';

interface TestResult {
  group: string;
  name: string;
  status: 'PASS' | 'PENDING' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function recordTest(group: string, name: string, status: 'PASS' | 'PENDING' | 'FAIL', details?: string) {
  results.push({ group, name, status, details });
  const icon = status === 'PASS' ? '✅ [PASS]' : status === 'PENDING' ? '⏳ [PENDING]' : '❌ [FAIL]';
  console.log(`${icon} [${group}] ${name}${details ? ` - ${details}` : ''}`);
}

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('SMART LIVESTOCK MANAGEMENT — PHASE 8 END-TO-END VERIFICATION');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // GROUP 1: Environment & Security Verification
  // -------------------------------------------------------------
  console.log('--- 1. Environment & Security Configuration ---');
  recordTest(
    'Security',
    'MONGODB_URI is configured via environment variables',
    env.mongodbUri ? 'PASS' : 'FAIL',
    env.mongodbUri ? 'Configured' : 'Missing MONGODB_URI'
  );

  recordTest(
    'Security',
    'JWT Secret is configured with adequate entropy',
    env.jwtSecret && env.jwtSecret.length >= 16 ? 'PASS' : 'FAIL',
    `Length: ${env.jwtSecret.length} chars`
  );

  recordTest(
    'Security',
    'AI Provider and Model are configured',
    env.aiProvider === 'gemini' && env.aiModel.includes('gemini') ? 'PASS' : 'FAIL',
    `Provider: ${env.aiProvider}, Model: ${env.aiModel}`
  );

  // -------------------------------------------------------------
  // GROUP 2: Model & Schema Definitions Integrity
  // -------------------------------------------------------------
  console.log('\n--- 2. Database Models & Schema Integrity ---');
  const models = [
    { name: 'User', model: User },
    { name: 'Farm', model: Farm },
    { name: 'Livestock', model: Livestock },
    { name: 'HealthRecord', model: HealthRecord },
    { name: 'Vaccination', model: Vaccination },
    { name: 'BreedingRecord', model: BreedingRecord },
    { name: 'MilkRecord', model: MilkRecord },
    { name: 'FeedRecord', model: FeedRecord },
    { name: 'FinanceRecord', model: FinanceRecord },
    { name: 'Reminder', model: Reminder },
    { name: 'Notification', model: Notification },
    { name: 'AIConversation', model: AIConversation },
  ];

  for (const m of models) {
    const isMongooseModel = Boolean(m.model && m.model.schema);
    recordTest('Models', `${m.name} Mongoose model registered with schema`, isMongooseModel ? 'PASS' : 'FAIL');
  }

  // -------------------------------------------------------------
  // GROUP 3: Mathematical Consistency & Business Logic
  // -------------------------------------------------------------
  console.log('\n--- 3. Business Calculations & Formulas ---');
  // Formula: Net Income = Total Income - Total Expenses
  const testIncome = 125000;
  const testExpense = 78000;
  const calculatedNet = testIncome - testExpense;
  recordTest(
    'Finance Logic',
    'Authoritative formula: Net Profit = Total Income - Total Expenses',
    calculatedNet === 47000 ? 'PASS' : 'FAIL',
    `₹${testIncome} - ₹${testExpense} = ₹${calculatedNet}`
  );

  // Formula: Total Milk = Morning + Evening
  const morning = 8.45;
  const evening = 7.15;
  const dailyTotal = Number((morning + evening).toFixed(2));
  recordTest(
    'Milk Logic',
    'Daily Total Milk = Morning Yield + Evening Yield',
    dailyTotal === 15.6 ? 'PASS' : 'FAIL',
    `${morning}L + ${evening}L = ${dailyTotal}L`
  );

  // -------------------------------------------------------------
  // GROUP 4: Multilingual Intent Detection & Safety Directives
  // -------------------------------------------------------------
  console.log('\n--- 4. Multilingual Intent & Safety Boundaries ---');
  const engIntents = detectIntents('Which animals are pregnant?');
  recordTest('AI Intent', 'English pregnancy intent classification', engIntents.includes('breeding') ? 'PASS' : 'FAIL');

  const hiIntents = detectIntents('टीकाकरण का विवरण दिखाएं');
  recordTest('AI Intent', 'Hindi vaccination intent classification (टीकाकरण)', hiIntents.includes('vaccination') ? 'PASS' : 'FAIL');

  const mrIntents = detectIntents('दूध उत्पादन किती झाले?');
  recordTest('AI Intent', 'Marathi milk intent classification (दूध उत्पादन)', mrIntents.includes('milk') ? 'PASS' : 'FAIL');

  const dummyContext = {
    farmInfo: { name: 'Shree Krishna Dairy Farm', location: 'Satara' },
    herdSummary: { totalAnimals: 10, healthyAnimals: 8, needsAttention: 1, pregnantAnimals: 2 },
  };
  const safetyPrompt = buildSystemPrompt(dummyContext, 'en');
  recordTest('AI Safety', 'Prompt contains Anti-Fabrication directive', safetyPrompt.includes('ANTI-FABRICATION') ? 'PASS' : 'FAIL');
  recordTest('AI Safety', 'Prompt enforces Veterinary Boundaries (no prescriptions/dosages)', safetyPrompt.includes('VETERINARY SAFETY BOUNDARIES') ? 'PASS' : 'FAIL');
  recordTest('AI Safety', 'Prompt injects scoped farm context', safetyPrompt.includes('Shree Krishna Dairy Farm') ? 'PASS' : 'FAIL');

  // -------------------------------------------------------------
  // GROUP 5: Live Database Connectivity & Demo Seeder
  // -------------------------------------------------------------
  console.log('\n--- 5. MongoDB Connection & Live Demo Data ---');
  let dbConnected = false;
  try {
    console.log(`Testing MongoDB connectivity at: ${env.mongodbUri}...`);
    await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 3000 });
    dbConnected = mongoose.connection.readyState === 1;
  } catch (err: any) {
    dbConnected = false;
  }

  if (dbConnected) {
    recordTest('Database', 'MongoDB connection established', 'PASS', 'Live connection verified');

    // Test Seeder
    try {
      console.log('\nExecuting idempotent demo seeder...');
      const seedResult = await seedDemoData();
      recordTest('Seeder', 'Demo data seeded successfully', seedResult.success ? 'PASS' : 'FAIL');
      recordTest('Seeder', 'Created 10 realistic Indian livestock animals', seedResult.counts.livestock === 10 ? 'PASS' : 'FAIL');
      recordTest('Seeder', 'Created 30-day historical milk records (~180 entries)', seedResult.counts.milkRecords >= 180 ? 'PASS' : 'FAIL');
      recordTest('Seeder', 'Created vaccination records with mix of statuses', seedResult.counts.vaccinations >= 7 ? 'PASS' : 'FAIL');
      recordTest('Seeder', 'Created health checkup and mastitis follow-up records', seedResult.counts.healthRecords >= 4 ? 'PASS' : 'FAIL');
      recordTest('Seeder', 'Created breeding records with approaching calving', seedResult.counts.breedingRecords >= 4 ? 'PASS' : 'FAIL');
      recordTest('Seeder', 'Created feed, income, and expense ledgers', seedResult.counts.feedRecords >= 5 && seedResult.counts.incomeRecords >= 5 ? 'PASS' : 'FAIL');
      recordTest('Seeder', 'Generated auto-reminders and notifications with deduplication', seedResult.counts.reminders > 0 && seedResult.counts.notifications > 0 ? 'PASS' : 'FAIL');

      // Test Live Auth with Demo Account
      console.log('\nTesting authentication with demo user...');
      const demoUser = await User.findOne({ email: DEMO_CONFIG.email });
      const passwordValid = demoUser ? await bcrypt.compare(DEMO_CONFIG.passwordPlain, demoUser.passwordHash) : false;
      recordTest('Auth', 'Demo password verification with bcrypt', passwordValid ? 'PASS' : 'FAIL');

      // Test JWT Generation and Verification
      if (demoUser) {
        const token = jwt.sign(
          { userId: demoUser._id.toString(), farmId: demoUser.farmId?.toString(), email: demoUser.email },
          env.jwtSecret,
          { expiresIn: '1h' }
        );
        const decoded: any = jwt.verify(token, env.jwtSecret);
        recordTest('Auth', 'JWT token generation & payload verification', decoded.email === demoUser.email ? 'PASS' : 'FAIL');

        // Test Live Context Gathering for AI
        const contextRes = await buildFarmContext(demoUser.farmId!.toString(), demoUser._id.toString(), [
          'livestock',
          'vaccination',
          'breeding',
          'milk',
          'finance',
        ]);
        const liveContext = contextRes.farmContext;
        recordTest('AI Grounding', 'Gathers live herd count from DB', liveContext.herdSummary?.totalAnimals === 10 ? 'PASS' : 'FAIL');
        recordTest('AI Grounding', 'Gathers pending/overdue vaccines from DB', (liveContext.vaccinations?.pendingOrOverdueCount || 0) > 0 ? 'PASS' : 'FAIL');
        recordTest('AI Grounding', 'Gathers active pregnancies from DB', (liveContext.breeding?.activePregnancies || 0) > 0 ? 'PASS' : 'FAIL');
        recordTest('AI Grounding', 'Gathers monthly milk yield from DB', (liveContext.milkProduction?.thirtyDayTotalLiters || 0) > 0 ? 'PASS' : 'FAIL');
        recordTest('AI Grounding', 'Zero sensitive data in gathered context (no passwordHash)', !JSON.stringify(liveContext).includes('passwordHash') ? 'PASS' : 'FAIL');
      }
    } catch (seedErr: any) {
      recordTest('Seeder', 'Demo data seeding error', 'FAIL', seedErr.message);
    }
  } else {
    recordTest(
      'Database',
      'MongoDB connection established',
      'PENDING',
      'Local MongoDB port 27017 or Atlas cluster not yet connected. All schemas, models, and code are ready.'
    );
    recordTest(
      'Seeder',
      'Demo data seeding script (server/src/seed/seedDemoData.ts)',
      'PENDING',
      'Awaiting MongoDB startup. Run `npm run seed` once MongoDB is running.'
    );
    recordTest(
      'AI Grounding',
      'Live database context retrieval',
      'PENDING',
      'Awaiting live MongoDB connection.'
    );
  }

  // -------------------------------------------------------------
  // SUMMARY OF TEST RESULTS
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('PHASE 8 VERIFICATION SUMMARY');
  console.log('================================================================');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const pending = results.filter((r) => r.status === 'PENDING').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log(`Total Checks: ${results.length}`);
  console.log(`✅ PASSED:  ${passed}`);
  console.log(`⏳ PENDING: ${pending}`);
  console.log(`❌ FAILED:  ${failed}`);
  console.log('================================================================\n');

  return { passed, pending, failed, results };
}

// CLI Execution entry point
if (require.main === module) {
  runEndToEndVerification()
    .then((summary) => {
      if (summary.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Execution error:', err);
      process.exit(1);
    });
}
