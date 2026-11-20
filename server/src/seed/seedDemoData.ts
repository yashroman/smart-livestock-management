import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
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
} from '../models';
import {
  syncAutomaticReminders,
  syncAutomaticNotifications,
} from '../services/reminderNotificationSync.service';

export interface SeedResult {
  success: boolean;
  message: string;
  counts: {
    users: number;
    farms: number;
    livestock: number;
    healthRecords: number;
    vaccinations: number;
    breedingRecords: number;
    milkRecords: number;
    feedRecords: number;
    incomeRecords: number;
    expenseRecords: number;
    reminders: number;
    notifications: number;
    aiConversations: number;
  };
  demoUser: {
    email: string;
    passwordPlain: string;
    farmName: string;
    location: string;
  };
}

export const DEMO_CONFIG = {
  email: 'demo@smartlivestock.local',
  passwordPlain: 'DemoFarmer@123',
  fullName: 'Rajesh Patil',
  mobile: '+91 98220 12345',
  farmName: 'Shree Krishna Dairy Farm',
  location: 'Satara, Maharashtra',
  preferredLanguage: 'en' as const,
};

export async function seedDemoData(): Promise<SeedResult> {
  console.log('====================================================');
  console.log('SMART LIVESTOCK MANAGEMENT — DEMO DATA SEEDER');
  console.log('====================================================');

  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    console.log(`Connecting to MongoDB at: ${env.mongodbUri}...`);
    try {
      await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to MongoDB successfully.');
    } catch (err: any) {
      console.error(`❌ MongoDB Connection Failed: ${err.message}`);
      throw new Error(`Cannot seed demo data. MongoDB connection failed: ${err.message}`);
    }
  }

  // 1. Check for existing demo user to ensure IDEMPOTENT seeding
  console.log(`Checking for existing demo records for: ${DEMO_CONFIG.email}...`);
  const existingUser = await User.findOne({ email: DEMO_CONFIG.email });

  if (existingUser) {
    const existingFarm = await Farm.findOne({ userId: existingUser._id });
    const farmId = existingFarm?._id || existingUser.farmId;

    console.log(`Found existing demo dataset (User: ${existingUser._id}, Farm: ${farmId}).`);
    console.log('Safely cleaning ONLY existing demo data (preserving all other real users)...');

    if (farmId) {
      await Promise.all([
        Livestock.deleteMany({ farmId }),
        HealthRecord.deleteMany({ farmId }),
        Vaccination.deleteMany({ farmId }),
        BreedingRecord.deleteMany({ farmId }),
        MilkRecord.deleteMany({ farmId }),
        FeedRecord.deleteMany({ farmId }),
        FinanceRecord.deleteMany({ farmId }),
        Reminder.deleteMany({ farmId }),
        Notification.deleteMany({ farmId }),
        AIConversation.deleteMany({ farmId }),
        Farm.deleteOne({ _id: farmId }),
      ]);
    }
    await User.deleteOne({ _id: existingUser._id });
    console.log('✅ Cleaned previous demo dataset.');
  }

  // 2. Create Demo User with bcrypt hashed password
  console.log('Creating demo farmer account...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(DEMO_CONFIG.passwordPlain, salt);

  const demoUser = await User.create({
    fullName: DEMO_CONFIG.fullName,
    mobile: DEMO_CONFIG.mobile,
    email: DEMO_CONFIG.email,
    passwordHash,
    farmName: DEMO_CONFIG.farmName,
    location: DEMO_CONFIG.location,
    preferredLanguage: DEMO_CONFIG.preferredLanguage,
  });

  // 3. Create Demo Farm
  const demoFarm = await Farm.create({
    userId: demoUser._id,
    farmName: DEMO_CONFIG.farmName,
    location: DEMO_CONFIG.location,
  });

  // Link farm back to user
  demoUser.farmId = demoFarm._id as mongoose.Types.ObjectId;
  await demoUser.save();

  const userId = demoUser._id;
  const farmId = demoFarm._id;

  console.log(`✅ Demo User created: ${demoUser.email} (ID: ${userId})`);
  console.log(`✅ Demo Farm created: ${demoFarm.farmName} (ID: ${farmId})`);

  // Helper date generators
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date;
  };
  const daysFromNow = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date;
  };

  // 4. Create 10 Realistic Indian Livestock Records
  console.log('Seeding 10 realistic Indian livestock animals...');
  const animalsData = [
    {
      userId,
      farmId,
      animalId: 'COW-001',
      name: 'Gauri',
      species: 'Cow' as const,
      breed: 'Gir',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 3.5),
      weight: 420,
      color: 'Reddish Brown',
      purchaseDate: daysAgo(365 * 1.5),
      purchasePrice: 65000,
      source: 'Purchased from Taluka Fair',
      status: 'Healthy' as const,
      notes: 'High milk yield Gir cow. Docile temperament and regular lactation cycle.',
    },
    {
      userId,
      farmId,
      animalId: 'COW-002',
      name: 'Radha',
      species: 'Cow' as const,
      breed: 'Sahiwal',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 4),
      weight: 450,
      color: 'Brownish Red',
      purchaseDate: daysAgo(365 * 2),
      purchasePrice: 72000,
      source: 'Purchased from Karnal Dairy',
      status: 'Pregnant' as const,
      notes: 'Confirmed pregnant in final trimester. Expected delivery within 25 days.',
    },
    {
      userId,
      farmId,
      animalId: 'COW-003',
      name: 'Lakshmi',
      species: 'Cow' as const,
      breed: 'Gir',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 5),
      weight: 480,
      color: 'Red with White Patches',
      purchaseDate: daysAgo(365 * 3),
      purchasePrice: 68000,
      source: 'Purchased locally',
      status: 'Healthy' as const,
      notes: 'Steady producer in second lactation. Good appetite and maternal instinct.',
    },
    {
      userId,
      farmId,
      animalId: 'COW-004',
      name: 'Kapila',
      species: 'Cow' as const,
      breed: 'Red Sindhi',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 2.5),
      weight: 390,
      color: 'Deep Red',
      purchaseDate: daysAgo(365 * 1),
      purchasePrice: 58000,
      source: 'Born on Farm',
      status: 'Needs Attention' as const,
      notes: 'Under recovery from mild mastitis in right rear quarter. Follow-up pending.',
    },
    {
      userId,
      farmId,
      animalId: 'COW-005',
      name: 'Nandi',
      species: 'Cow' as const,
      breed: 'Gir',
      gender: 'Male' as const,
      dateOfBirth: daysAgo(365 * 3),
      weight: 560,
      color: 'Dark Reddish Brown',
      purchaseDate: daysAgo(365 * 2),
      purchasePrice: 85000,
      source: 'Purchased from Breeding Center',
      status: 'Healthy' as const,
      notes: 'Active pedigree Gir breeding bull with certified lineage.',
    },
    {
      userId,
      farmId,
      animalId: 'COW-006',
      name: 'Anandi',
      species: 'Cow' as const,
      breed: 'Kankrej',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 3),
      weight: 430,
      color: 'Silver Grey',
      purchaseDate: daysAgo(365 * 1.2),
      purchasePrice: 60000,
      source: 'Purchased at Agricultural Expo',
      status: 'Healthy' as const,
      notes: 'Hardy indigenous breed. Recently serviced via AI.',
    },
    {
      userId,
      farmId,
      animalId: 'COW-007',
      name: 'Sita',
      species: 'Cow' as const,
      breed: 'Deoni',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 4.5),
      weight: 440,
      color: 'Black and White Spotted',
      purchaseDate: daysAgo(365 * 2.5),
      purchasePrice: 55000,
      source: 'Purchased from Marathwada',
      status: 'Healthy' as const,
      notes: 'Dual-purpose Deoni cow. Very resilient and heat-tolerant.',
    },
    {
      userId,
      farmId,
      animalId: 'BUFF-001',
      name: 'Kalyani',
      species: 'Buffalo' as const,
      breed: 'Murrah',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 4),
      weight: 530,
      color: 'Jet Black',
      purchaseDate: daysAgo(365 * 2),
      purchasePrice: 88000,
      source: 'Purchased from Haryana Dairy Farm',
      status: 'Healthy' as const,
      notes: 'Top milk producer. Rich 7.5% fat milk, yields 18+ litres daily.',
    },
    {
      userId,
      farmId,
      animalId: 'BUFF-002',
      name: 'Bhavani',
      species: 'Buffalo' as const,
      breed: 'Jaffrabadi',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 5),
      weight: 590,
      color: 'Black',
      purchaseDate: daysAgo(365 * 3),
      purchasePrice: 92000,
      source: 'Purchased from Gujarat Fair',
      status: 'Pregnant' as const,
      notes: 'Heavy Jaffrabadi buffalo. Confirmed pregnant, expected delivery in 75 days.',
    },
    {
      userId,
      farmId,
      animalId: 'BUFF-003',
      name: 'Yamuna',
      species: 'Buffalo' as const,
      breed: 'Mehsana',
      gender: 'Female' as const,
      dateOfBirth: daysAgo(365 * 3.5),
      weight: 510,
      color: 'Dark Blackish Brown',
      purchaseDate: daysAgo(365 * 1.5),
      purchasePrice: 76000,
      source: 'Purchased locally',
      status: 'Healthy' as const,
      notes: 'Consistent milker with excellent feed conversion efficiency.',
    },
  ];

  const livestockDocs = await Livestock.insertMany(animalsData);
  console.log(`✅ Seeded ${livestockDocs.length} livestock animals.`);

  // Create quick lookup map: animalId -> Mongo ObjectId
  const animalMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const doc of livestockDocs) {
    animalMap[doc.animalId] = doc._id as mongoose.Types.ObjectId;
  }

  // 5. Create Realistic Health Records
  console.log('Seeding health records...');
  const healthData = [
    {
      userId,
      farmId,
      livestockId: animalMap['COW-004'],
      date: daysAgo(2),
      symptoms: 'Swelling and warmth in right rear udder quarter, clot traces in morning milk.',
      healthCondition: 'Mild Clinical Mastitis',
      temperature: 39.2,
      treatment: 'Intramammary antibiotic infusion and cold compression',
      medicine: 'Ceftiofur intramammary + Meloxicam injection',
      dosage: '1 tube intramammary daily for 3 days; 15ml Meloxicam once',
      veterinarian: 'Dr. Suresh Deshmukh (B.V.Sc)',
      followUpDate: daysFromNow(3),
      notes: 'Symptom intensity decreased after 2nd dose. Milk withholding observed.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['COW-001'],
      date: daysAgo(20),
      symptoms: 'Routine postpartum health and lactation vigor inspection.',
      healthCondition: 'Healthy / Postpartum Check',
      temperature: 38.5,
      treatment: 'Nutritional and calcium metabolic supplementation',
      medicine: 'Cal-Up D3 Gel + Chelated Mineral Mixture',
      dosage: '100g daily in concentrate feed for 30 days',
      veterinarian: 'Dr. Suresh Deshmukh (B.V.Sc)',
      notes: 'Uterine involution complete. Cow in prime lactation health.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['COW-003'],
      date: daysAgo(14),
      symptoms: 'Slight limping on left hind leg after rainy field walking.',
      healthCondition: 'Interdigital Dermatitis (Foot Rot)',
      temperature: 38.6,
      treatment: 'Hoof cleaning, antiseptic wash, and topical antibiotic bandage',
      medicine: 'Copper sulphate footbath 5% + CTC antiseptic spray',
      dosage: 'Spray twice daily for 5 days',
      veterinarian: 'Dr. Nitin Shinde (M.V.Sc)',
      notes: 'Hoof cleaned and treated. Limp resolved within 4 days.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['BUFF-001'],
      date: daysAgo(28),
      symptoms: 'Preventive pre-monsoon herd deworming.',
      healthCondition: 'Routine Deworming',
      temperature: 38.3,
      treatment: 'Broad spectrum anti-parasitic drench',
      medicine: 'Albendazole Oral Suspension (Fasinex)',
      dosage: '100ml single oral drench',
      veterinarian: 'Dr. Suresh Deshmukh (B.V.Sc)',
      notes: 'Administered in the morning on empty stomach.',
    },
  ];

  const healthDocs = await HealthRecord.insertMany(healthData);
  console.log(`✅ Seeded ${healthDocs.length} health records.`);

  // 6. Create Realistic Vaccination Records (Completed, Due Soon, Overdue)
  console.log('Seeding vaccination records...');
  const vaccinationData = [
    {
      userId,
      farmId,
      livestockId: animalMap['COW-001'],
      vaccine: 'Foot and Mouth Disease (FMD)',
      vaccinationDate: daysAgo(175),
      nextDueDate: daysFromNow(5), // Due Soon (within 7 days!)
      dose: '2 ml Subcutaneous',
      veterinarian: 'Dr. Suresh Deshmukh',
      notes: 'Bi-annual Raksha-Ovac booster scheduled.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['COW-002'],
      vaccine: 'Haemorrhagic Septicaemia (HS)',
      vaccinationDate: daysAgo(375),
      nextDueDate: daysAgo(10), // Overdue!
      dose: '3 ml Subcutaneous',
      veterinarian: 'Dr. Nitin Shinde',
      notes: 'Annual booster delayed due to veterinary camp postponement.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['COW-003'],
      vaccine: 'Foot and Mouth Disease (FMD)',
      vaccinationDate: daysAgo(176),
      nextDueDate: daysFromNow(4), // Due Soon!
      dose: '2 ml Subcutaneous',
      veterinarian: 'Dr. Suresh Deshmukh',
      notes: 'Scheduled alongside Gauri for mass farm booster administration.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['COW-004'],
      vaccine: 'Black Quarter (BQ)',
      vaccinationDate: daysAgo(380),
      nextDueDate: daysAgo(15), // Overdue!
      dose: '2 ml Subcutaneous',
      veterinarian: 'Dr. Nitin Shinde',
      notes: 'Must be administered once mastitis antibiotic course concludes.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['COW-006'],
      vaccine: 'Haemorrhagic Septicaemia (HS)',
      vaccinationDate: daysAgo(150),
      nextDueDate: daysFromNow(35), // Completed (future)
      dose: '3 ml Subcutaneous',
      veterinarian: 'Dr. Suresh Deshmukh',
      notes: 'Pre-monsoon immunization administered on schedule.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['BUFF-001'],
      vaccine: 'Black Quarter (BQ)',
      vaccinationDate: daysAgo(160),
      nextDueDate: daysFromNow(25), // Completed (future)
      dose: '2 ml Subcutaneous',
      veterinarian: 'Dr. Suresh Deshmukh',
      notes: 'Administered during village veterinary vaccination drive.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['BUFF-002'],
      vaccine: 'Brucellosis (Cotton Strain 19)',
      vaccinationDate: daysAgo(365 * 3),
      nextDueDate: daysFromNow(180), // Completed (long term immunity)
      dose: '2 ml Subcutaneous',
      veterinarian: 'Dr. Nitin Shinde',
      notes: 'Calfhood vaccination completed with official ear tag certificate.',
    },
  ];

  const vaccineDocs = await Vaccination.insertMany(vaccinationData);
  console.log(`✅ Seeded ${vaccineDocs.length} vaccination records.`);

  // 7. Create Realistic Breeding Records
  console.log('Seeding breeding records...');
  const breedingData = [
    {
      userId,
      farmId,
      livestockId: animalMap['COW-002'], // Radha
      breedingDate: daysAgo(255),
      method: 'Artificial Insemination' as const,
      partner: 'Gir Premium Pedigree Straw (NDDB #GIR-704)',
      pregnancyStatus: 'Confirmed Pregnant' as const,
      confirmationDate: daysAgo(195),
      expectedDeliveryDate: daysFromNow(25), // Upcoming Calving in 25 days!
      notes: 'Confirmed pregnant via rectal palpation. Healthy fetal development observed.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['BUFF-002'], // Bhavani
      breedingDate: daysAgo(230),
      method: 'Natural Service' as const,
      partner: 'Murrah Stud Bull (Tag BUFF-M10)',
      pregnancyStatus: 'Confirmed Pregnant' as const,
      confirmationDate: daysAgo(170),
      expectedDeliveryDate: daysFromNow(78), // Expected delivery in ~78 days
      notes: 'Confirmed pregnant by Dr. Suresh Deshmukh. Gestation progressing normally.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['COW-001'], // Gauri
      breedingDate: daysAgo(420),
      method: 'Artificial Insemination' as const,
      partner: 'Gir Straw #3301',
      pregnancyStatus: 'Delivered' as const,
      confirmationDate: daysAgo(360),
      expectedDeliveryDate: daysAgo(140),
      actualDeliveryDate: daysAgo(138),
      notes: 'Delivered healthy female calf. Normal parturition, no dystocia.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['COW-006'], // Anandi
      breedingDate: daysAgo(18),
      method: 'Artificial Insemination' as const,
      partner: 'Kankrej Pure Straw',
      pregnancyStatus: 'Pending Check' as const,
      notes: 'First service. Pregnancy diagnosis scheduled 60 days post-insemination.',
    },
  ];

  const breedingDocs = await BreedingRecord.insertMany(breedingData);
  console.log(`✅ Seeded ${breedingDocs.length} breeding records.`);

  // 8. Create Realistic 30 Days of Daily Milk Production Data
  console.log('Seeding 30 consecutive days of milk production data for lactating herd...');
  const milkData: any[] = [];
  const lactatingAnimals = [
    { tag: 'COW-001', morningBase: 7.2, eveningBase: 6.1 },
    { tag: 'COW-003', morningBase: 7.8, eveningBase: 6.8 },
    { tag: 'COW-006', morningBase: 6.2, eveningBase: 5.1 },
    { tag: 'COW-007', morningBase: 5.5, eveningBase: 4.8 },
    { tag: 'BUFF-001', morningBase: 9.8, eveningBase: 8.4 }, // Top producer Murrah buffalo
    { tag: 'BUFF-003', morningBase: 7.8, eveningBase: 7.0 },
  ];

  for (let d = 29; d >= 0; d--) {
    const recordDate = daysAgo(d);
    // Slight deterministic variation based on day index
    for (const a of lactatingAnimals) {
      const variation = Math.sin((d + a.morningBase) * 0.7) * 0.5;
      const morningQuantity = Number((a.morningBase + variation).toFixed(2));
      const eveningQuantity = Number((a.eveningBase + variation * 0.8).toFixed(2));
      const totalQuantity = Number((morningQuantity + eveningQuantity).toFixed(2));

      milkData.push({
        userId,
        farmId,
        livestockId: animalMap[a.tag],
        date: recordDate,
        morningQuantity,
        eveningQuantity,
        totalQuantity,
        notes: d === 0 ? 'Today morning and evening collection' : undefined,
      });
    }
  }

  const milkDocs = await MilkRecord.insertMany(milkData);
  console.log(`✅ Seeded ${milkDocs.length} milk production records across 30 days.`);

  // 9. Create Realistic Feed Records
  console.log('Seeding feed ration records...');
  const feedData = [
    {
      userId,
      farmId,
      group: 'Milking Herd',
      feedType: 'Green Fodder',
      quantity: 160,
      unit: 'kg',
      date: daysAgo(1),
      cost: 480,
      notes: 'Freshly harvested Hybrid Napier green grass distributed.',
    },
    {
      userId,
      farmId,
      group: 'Milking Herd',
      feedType: 'Concentrate',
      quantity: 36,
      unit: 'kg',
      date: daysAgo(1),
      cost: 864,
      notes: 'Amul 20% bypass protein cattle pellet feed.',
    },
    {
      userId,
      farmId,
      group: 'All Herd',
      feedType: 'Dry Fodder',
      quantity: 85,
      unit: 'kg',
      date: daysAgo(2),
      cost: 425,
      notes: 'Chopped wheat straw (Kadbi) roughage.',
    },
    {
      userId,
      farmId,
      livestockId: animalMap['BUFF-001'],
      feedType: 'Mineral Mixture',
      quantity: 5,
      unit: 'kg',
      date: daysAgo(3),
      cost: 450,
      notes: 'Chelated mineral mixture for high lactation Murrah buffalo.',
    },
    {
      userId,
      farmId,
      group: 'Dry Cows & Calves',
      feedType: 'Silage',
      quantity: 60,
      unit: 'kg',
      date: daysAgo(5),
      cost: 360,
      notes: 'Fermented corn silage provided as energy supplement.',
    },
    {
      userId,
      farmId,
      group: 'Milking Herd',
      feedType: 'Green Fodder',
      quantity: 150,
      unit: 'kg',
      date: daysAgo(7),
      cost: 450,
      notes: 'Green maize fodder mixed with sorghum.',
    },
    {
      userId,
      farmId,
      group: 'Milking Herd',
      feedType: 'Concentrate',
      quantity: 35,
      unit: 'kg',
      date: daysAgo(7),
      cost: 840,
      notes: 'Commercial cattle mash ration.',
    },
  ];

  const feedDocs = await FeedRecord.insertMany(feedData);
  console.log(`✅ Seeded ${feedDocs.length} feed records.`);

  // 10. Create Realistic Income Records
  console.log('Seeding income records...');
  const incomeData = [
    {
      userId,
      farmId,
      type: 'income' as const,
      date: daysAgo(1),
      category: 'Milk Sales',
      amount: 32400,
      description: 'Weekly milk settlement from Sahyadri Farmers Dairy Cooperative',
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-MILK-WK4',
      notes: 'Average rate ₹42/L cow milk, ₹68/L buffalo milk.',
    },
    {
      userId,
      farmId,
      type: 'income' as const,
      date: daysAgo(8),
      category: 'Milk Sales',
      amount: 31800,
      description: 'Weekly milk settlement from Sahyadri Farmers Dairy Cooperative',
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-MILK-WK3',
    },
    {
      userId,
      farmId,
      type: 'income' as const,
      date: daysAgo(15),
      category: 'Milk Sales',
      amount: 33100,
      description: 'Weekly milk settlement from Sahyadri Farmers Dairy Cooperative',
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-MILK-WK2',
    },
    {
      userId,
      farmId,
      type: 'income' as const,
      date: daysAgo(22),
      category: 'Milk Sales',
      amount: 32200,
      description: 'Weekly milk settlement from Sahyadri Farmers Dairy Cooperative',
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-MILK-WK1',
    },
    {
      userId,
      farmId,
      type: 'income' as const,
      date: daysAgo(10),
      category: 'Manure Sale',
      amount: 5400,
      description: 'Sold 60 bags of organic vermicompost / aged cow dung to local vineyard',
      paymentMethod: 'Cash',
      reference: 'CASH-REC-102',
    },
    {
      userId,
      farmId,
      type: 'income' as const,
      date: daysAgo(18),
      category: 'Breeding Service',
      amount: 2500,
      description: 'Natural service fee for pedigree Gir bull Nandi (COW-005)',
      paymentMethod: 'UPI',
      reference: 'UPI-77884411',
    },
  ];

  const incomeDocs = await FinanceRecord.insertMany(incomeData);
  console.log(`✅ Seeded ${incomeDocs.length} income records.`);

  // 11. Create Realistic Expense Records
  console.log('Seeding expense records...');
  const expenseData = [
    {
      userId,
      farmId,
      type: 'expense' as const,
      date: daysAgo(4),
      category: 'Feed',
      amount: 21600,
      description: 'Bulk purchase: 25 bags of 20% protein cattle concentrate pellets',
      paymentMethod: 'Bank Transfer',
      reference: 'INV-FEED-9921',
      notes: 'Purchased from Krishi Seva Kendra at wholesale discount.',
    },
    {
      userId,
      farmId,
      type: 'expense' as const,
      date: daysAgo(12),
      category: 'Feed',
      amount: 8500,
      description: 'Tractor load of dry wheat straw (Kadbi) delivered from farm harvest',
      paymentMethod: 'Cash',
      reference: 'CASH-EXP-088',
    },
    {
      userId,
      farmId,
      type: 'expense' as const,
      date: daysAgo(2),
      category: 'Veterinary',
      amount: 2400,
      description: 'Mastitis treatment, antibiotic infusion & vet visit fee for COW-004',
      paymentMethod: 'UPI',
      reference: 'UPI-VET-4432',
      notes: 'Includes visit charges and intramammary medicine.',
    },
    {
      userId,
      farmId,
      type: 'expense' as const,
      date: daysAgo(15),
      category: 'Vaccination',
      amount: 1200,
      description: 'Pre-monsoon vaccine doses and consumables purchased from pharmacy',
      paymentMethod: 'Cash',
      reference: 'CASH-MED-551',
    },
    {
      userId,
      farmId,
      type: 'expense' as const,
      date: daysAgo(5),
      category: 'Labour',
      amount: 16000,
      description: 'Monthly wages for 2 full-time farm assistants (milking and barn upkeep)',
      paymentMethod: 'Bank Transfer',
      reference: 'SALARY-M1',
    },
    {
      userId,
      farmId,
      type: 'expense' as const,
      date: daysAgo(9),
      category: 'Electricity',
      amount: 3650,
      description: 'Monthly electricity bill for milking machine, chilling tank & borewell pump',
      paymentMethod: 'Online Payment',
      reference: 'MSEDCL-88741',
    },
    {
      userId,
      farmId,
      type: 'expense' as const,
      date: daysAgo(19),
      category: 'Maintenance',
      amount: 1800,
      description: 'Servicing of 2-bucket milking machine and replacing rubber teat liners',
      paymentMethod: 'Cash',
      reference: 'CASH-MAINT-12',
    },
  ];

  const expenseDocs = await FinanceRecord.insertMany(expenseData);
  console.log(`✅ Seeded ${expenseDocs.length} expense records.`);

  // Verify financial formula consistency:
  const totalIncome = incomeData.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenseData.reduce((acc, curr) => acc + curr.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  console.log(`💰 Financials: Income ₹${totalIncome} - Expenses ₹${totalExpenses} = Net Profit ₹${netIncome}`);

  // 12. Create Realistic Manual Reminders
  console.log('Seeding farm chore reminders...');
  const reminderData = [
    {
      userId,
      farmId,
      type: 'Health Check',
      title: 'Mastitis recovery check for Kapila (COW-004)',
      description: 'Inspect right rear udder quarter for temperature and milk clarity.',
      dueDate: daysFromNow(2),
      priority: 'Urgent' as const,
      status: 'Pending' as const,
      relatedLivestockId: animalMap['COW-004'],
    },
    {
      userId,
      farmId,
      type: 'Breeding',
      title: 'Prepare clean maternity stall for Radha (COW-002)',
      description: 'Disinfect maternity pen, lay dry paddy straw bedding, prepare iodine dip.',
      dueDate: daysFromNow(15),
      priority: 'High' as const,
      status: 'Pending' as const,
      relatedLivestockId: animalMap['COW-002'],
    },
    {
      userId,
      farmId,
      type: 'Feeding',
      title: 'Order cattle concentrate feed pellet bags',
      description: 'Stock buffer is low; order 30 bags before weekend.',
      dueDate: daysFromNow(4),
      priority: 'Medium' as const,
      status: 'Pending' as const,
    },
    {
      userId,
      farmId,
      type: 'Vaccination',
      title: 'Overdue HS vaccination booster for COW-002',
      description: 'Contact Dr. Nitin Shinde to schedule overdue Haemorrhagic Septicaemia vaccination.',
      dueDate: daysAgo(5),
      priority: 'Urgent' as const,
      status: 'Pending' as const,
      relatedLivestockId: animalMap['COW-002'],
    },
    {
      userId,
      farmId,
      type: 'Veterinary Visit',
      title: 'Sanitize bulk milk cooler and replace water filtration filters',
      description: 'Quarterly sanitation check completed successfully.',
      dueDate: daysAgo(10),
      priority: 'Medium' as const,
      status: 'Completed' as const,
    },
  ];

  const reminderDocs = await Reminder.insertMany(reminderData);
  console.log(`✅ Seeded ${reminderDocs.length} farm chore reminders.`);

  // 13. Trigger Deterministic Automatic Reminders & Notifications
  console.log('Executing deterministic auto-sync for reminders and notifications...');
  await syncAutomaticReminders(userId.toString(), farmId.toString());
  await syncAutomaticNotifications(userId.toString(), farmId.toString());

  // Count current reminders & notifications
  const totalRemindersCount = await Reminder.countDocuments({ farmId });
  const totalNotificationsCount = await Notification.countDocuments({ farmId });
  console.log(`✅ Total active reminders after auto-sync: ${totalRemindersCount}`);
  console.log(`✅ Total notifications generated: ${totalNotificationsCount}`);

  // Test deduplication: run again to prove zero duplicates
  console.log('Testing deduplication logic (re-running auto-sync)...');
  await syncAutomaticReminders(userId.toString(), farmId.toString());
  await syncAutomaticNotifications(userId.toString(), farmId.toString());
  const deduplicatedReminders = await Reminder.countDocuments({ farmId });
  const deduplicatedNotifs = await Notification.countDocuments({ farmId });

  if (deduplicatedReminders === totalRemindersCount && deduplicatedNotifs === totalNotificationsCount) {
    console.log('✅ Deduplication confirmed: zero duplicate records generated on subsequent sync.');
  } else {
    console.warn('⚠️ Warning: Record count changed during second sync.');
  }

  // 14. Create Realistic Multilingual AI Conversation History
  console.log('Seeding realistic AI conversation thread...');
  const aiConversationData = {
    userId,
    farmId,
    title: 'Farm Production & Vaccination Advisory',
    language: 'en',
    messages: [
      {
        role: 'user' as const,
        content: 'Which animals in my farm have vaccinations due or overdue?',
        language: 'en',
        timestamp: daysAgo(1),
      },
      {
        role: 'assistant' as const,
        content: `Based on your farm records for **Shree Krishna Dairy Farm**, you have **2 overdue** and **2 due soon** vaccinations:

### ⚠️ Overdue Vaccinations:
- **COW-002 (Radha)**: *Haemorrhagic Septicaemia (HS)* was due on ${daysAgo(10).toISOString().split('T')[0]}.
- **COW-004 (Kapila)**: *Black Quarter (BQ)* was due on ${daysAgo(15).toISOString().split('T')[0]}.

### 📅 Due Soon (Next 7 Days):
- **COW-001 (Gauri)**: *Foot and Mouth Disease (FMD)* is due on ${daysFromNow(5).toISOString().split('T')[0]}.
- **COW-003 (Lakshmi)**: *Foot and Mouth Disease (FMD)* is due on ${daysFromNow(4).toISOString().split('T')[0]}.

*Advisory*: Please coordinate with Dr. Suresh Deshmukh or Dr. Nitin Shinde to schedule vaccination. Note that Kapila (COW-004) should complete her mastitis treatment before receiving the BQ vaccine.`,
        language: 'en',
        isGrounded: true,
        intent: 'vaccination',
        timestamp: daysAgo(1),
      },
      {
        role: 'user' as const,
        content: 'किन गायों का दूध उत्पादन सबसे अधिक है?',
        language: 'hi',
        timestamp: daysAgo(1),
      },
      {
        role: 'assistant' as const,
        content: `आपके फार्म रिकॉर्ड के अनुसार, सबसे अधिक दूध देने वाले पशु इस प्रकार हैं:

1. **BUFF-001 (कल्याणी - मुर्रा भैंस)**: औसत दैनिक उत्पादन **18.2 लीटर** (सुबह ~9.8L, शाम ~8.4L)।
2. **COW-003 (लक्ष्मी - गीर गाय)**: औसत दैनिक उत्पादन **14.6 लीटर** (सुबह ~7.8L, शाम ~6.8L)।
3. **COW-001 (गौरी - गीर गाय)**: औसत दैनिक उत्पादन **13.3 लीटर** (सुबह ~7.2L, शाम ~6.1L)।

सभी दुधारू पशुओं का कुल दैनिक उत्पादन लगभग **82 से 86 लीटर** के बीच दर्ज है।`,
        language: 'hi',
        isGrounded: true,
        intent: 'milk',
        timestamp: daysAgo(1),
      },
      {
        role: 'user' as const,
        content: 'कोणती गाय गाभण आहे आणि प्रसूती कधी अपेक्षित आहे?',
        language: 'mr',
        timestamp: daysAgo(1),
      },
      {
        role: 'assistant' as const,
        content: `तुमच्या फार्म रेकॉर्डनुसार खालील जनावरे गाभण (Pregnant) आहेत:

1. **COW-002 (राधा - साहिवाल गाय)**:
   - **स्थिती**: पुष्टी झालेली (Confirmed Pregnant)
   - **अपेक्षित प्रसूती तारीख**: **${daysFromNow(25).toISOString().split('T')[0]}** (अंदाजे २५ दिवसांत)
   - *सूचना*: कृपया राधासाठी स्वतंत्र व स्वच्छ प्रसूती गोठा तयार ठेवा.

2. **BUFF-002 (भवानी - जाफराबादी म्हैस)**:
   - **स्थिती**: पुष्टी झालेली (Confirmed Pregnant)
   - **अपेक्षित प्रसूती तारीख**: **${daysFromNow(78).toISOString().split('T')[0]}** (अंदाजे ७८ दिवसांत)

*वैद्यकीय सूचना*: प्रसूती जवळ आल्यावर जनावरांच्या आहारातील कॅल्शियम आणि ऊर्जेचे प्रमाण तपासण्यासाठी पशुवैद्यकांचा सल्ला घ्या.`,
        language: 'mr',
        isGrounded: true,
        intent: 'breeding',
        timestamp: daysAgo(1),
      },
    ],
  };

  const aiConvDoc = await AIConversation.create(aiConversationData);
  console.log(`✅ Seeded realistic multilingual AI conversation thread (ID: ${aiConvDoc._id}).`);

  console.log('====================================================');
  console.log('DEMO DATA SEEDING COMPLETE & VERIFIED!');
  console.log('====================================================');

  return {
    success: true,
    message: 'Demo dataset seeded successfully.',
    counts: {
      users: 1,
      farms: 1,
      livestock: livestockDocs.length,
      healthRecords: healthDocs.length,
      vaccinations: vaccineDocs.length,
      breedingRecords: breedingDocs.length,
      milkRecords: milkDocs.length,
      feedRecords: feedDocs.length,
      incomeRecords: incomeDocs.length,
      expenseRecords: expenseDocs.length,
      reminders: deduplicatedReminders,
      notifications: deduplicatedNotifs,
      aiConversations: 1,
    },
    demoUser: {
      email: DEMO_CONFIG.email,
      passwordPlain: DEMO_CONFIG.passwordPlain,
      farmName: DEMO_CONFIG.farmName,
      location: DEMO_CONFIG.location,
    },
  };
}

// CLI Execution entry point
if (require.main === module) {
  seedDemoData()
    .then((result) => {
      console.log('\nSeed Summary:');
      console.log(`- Demo Account: ${result.demoUser.email} / ${result.demoUser.passwordPlain}`);
      console.log(`- Farm: ${result.demoUser.farmName}, ${result.demoUser.location}`);
      console.log(`- Livestock: ${result.counts.livestock} animals`);
      console.log(`- 30-Day Milk: ${result.counts.milkRecords} records`);
      console.log(`- Vaccinations: ${result.counts.vaccinations} records`);
      console.log(`- Health: ${result.counts.healthRecords} records`);
      console.log(`- Breeding: ${result.counts.breedingRecords} records`);
      console.log(`- Feed Rations: ${result.counts.feedRecords} records`);
      console.log(`- Income Entries: ${result.counts.incomeRecords} records`);
      console.log(`- Expense Entries: ${result.counts.expenseRecords} records`);
      console.log(`- Reminders: ${result.counts.reminders} chores`);
      console.log(`- Notifications: ${result.counts.notifications} alerts`);
      console.log(`- AI Threads: ${result.counts.aiConversations} conversations`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Seeding failed:', err.message);
      process.exit(1);
    });
}
