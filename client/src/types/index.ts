// Common & User Types
export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface User {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  farmName: string;
  farmId: string;
  location: string;
  preferredLanguage: SupportedLanguage;
  createdAt: string;
}

// Livestock Types
export type LivestockSpecies = 'Cow' | 'Buffalo' | 'Goat' | 'Sheep' | 'Other';
export type LivestockGender = 'Female' | 'Male';
export type LivestockStatus =
  | 'Healthy'
  | 'Needs Attention'
  | 'Sick'
  | 'Quarantined'
  | 'Pregnant'
  | 'Lactating'
  | 'Dry'
  | 'Sold'
  | 'Other';

export interface CalculatedAge {
  years: number;
  months: number;
  text: string;
}

export interface Livestock {
  _id: string;
  animalId: string;
  name: string;
  species: LivestockSpecies;
  breed: string;
  gender: LivestockGender;
  dateOfBirth: string;
  calculatedAge?: CalculatedAge;
  weight: number;
  color: string;
  purchaseDate?: string;
  purchasePrice?: number;
  source: string;
  status: LivestockStatus;
  photo?: string;
  notes?: string;
  userId: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

// Referenced Animal summary inside records
export interface AnimalSummary {
  _id: string;
  animalId: string;
  name: string;
  species: LivestockSpecies;
  breed: string;
  gender?: LivestockGender;
}

// Health Record
export interface HealthRecord {
  _id: string;
  livestockId: string | AnimalSummary;
  date: string;
  symptoms: string;
  healthCondition: string;
  temperature?: number;
  treatment: string;
  medicine: string;
  dosage: string;
  veterinarian: string;
  followUpDate?: string;
  notes?: string;
  userId: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

// Vaccination
export type VaccinationStatus = 'Completed' | 'Due Soon' | 'Overdue';

export interface Vaccination {
  _id: string;
  livestockId: string | AnimalSummary;
  vaccine: string;
  vaccinationDate: string;
  nextDueDate: string;
  dose: string;
  veterinarian: string;
  status: VaccinationStatus;
  notes?: string;
  userId: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

// Breeding & Pregnancy
export type BreedingMethod = 'Artificial Insemination' | 'Natural Service';
export type PregnancyStatus =
  | 'Pending Check'
  | 'Not Confirmed'
  | 'Confirmed Pregnant'
  | 'Pregnant'
  | 'Not Pregnant'
  | 'Delivered';

export interface BreedingRecord {
  _id: string;
  livestockId: string | AnimalSummary;
  breedingDate: string;
  method: BreedingMethod;
  partner: string;
  pregnancyStatus: PregnancyStatus;
  confirmationDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  userId: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

// Milk Production
export interface MilkRecord {
  _id: string;
  livestockId: string | AnimalSummary;
  date: string;
  morningQuantity: number;
  eveningQuantity: number;
  totalQuantity: number;
  notes?: string;
  userId: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

// Feed Record
export interface FeedRecord {
  _id: string;
  livestockId?: string | AnimalSummary;
  group?: string;
  feedType: string;
  quantity: number;
  unit: string;
  date: string;
  cost: number;
  notes?: string;
  userId: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedSummary {
  todayQuantity: number;
  todayCost: number;
  todayEntries: number;
  weekCost: number;
  weekQuantity: number;
  monthCost: number;
  monthQuantity: number;
  byFeedType: Array<{
    feedType: string;
    totalQuantity: number;
    totalCost: number;
    count: number;
  }>;
}

// Finance Record
export type TransactionType = 'income' | 'expense';

export interface FinanceRecord {
  _id: string;
  type: TransactionType;
  date: string;
  category: string;
  amount: number;
  description: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  userId: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategoryTotal {
  category: string;
  amount: number;
  count: number;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  todayIncome: number;
  todayExpenses: number;
  todayNet: number;
  weekIncome: number;
  weekExpenses: number;
  weekNet: number;
  monthIncome: number;
  monthExpenses: number;
  monthNet: number;
  feedCost: number;
  vetCost: number;
  otherExpenses: number;
  categoryBreakdown?: {
    income: FinanceCategoryTotal[];
    expenses: FinanceCategoryTotal[];
  };
}

export interface SingleTypeSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  count: number;
  byCategory: FinanceCategoryTotal[];
}

// Reminder
export type ReminderPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ReminderStatus = 'Pending' | 'Completed' | 'Cancelled';

export interface Reminder {
  _id: string;
  type: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  relatedLivestockId?: string | AnimalSummary;
  notes?: string;
  autoGeneratedKey?: string;
  userId: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderCounts {
  pending: number;
  completed: number;
  overdue: number;
  today: number;
}

// Notification
export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedEntity?: string;
  relatedEntityId?: string;
  createdAt: string;
  userId: string;
  farmId: string;
}

// Dashboard KPI Stats
export interface DashboardStats {
  // Livestock KPIs
  totalLivestock: number;
  healthyAnimals: number;
  attentionAnimals: number;
  todayMilkProduction: number;
  upcomingVaccinations: number;
  overdueVaccinations: number;
  recentAnimals: Livestock[];
  // Finance KPIs
  totalIncome?: number;
  totalExpenses?: number;
  netIncome?: number;
  feedCost?: number;
  vetCost?: number;
  otherExpenses?: number;
  // Tasks KPIs
  pendingRemindersCount?: number;
  unreadNotificationsCount?: number;
}

// ==========================================
// Phase 5: Analytics & Reports Interfaces
// ==========================================

export interface AttentionAlert {
  type: string;
  title: string;
  description: string;
  severity: 'urgent' | 'warning' | 'info';
  link: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'livestock' | 'milk' | 'health' | 'finance';
  title: string;
  description: string;
  date: string;
  link: string;
}

export interface AnalyticsOverview {
  kpis: {
    totalLivestock: number;
    healthyAnimals: number;
    attentionAnimals: number;
    pregnantAnimals: number;
    todayMilk: number;
    monthMilk: number;
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    upcomingVaccinations: number;
    overdueVaccinations: number;
  };
  alerts: AttentionAlert[];
  recentActivity: ActivityFeedItem[];
}

export interface LivestockAnalytics {
  total: number;
  healthy: number;
  needsAttention: number;
  pregnant: number;
  bySpecies: Array<{ species: string; count: number }>;
  byGender: Array<{ gender: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

export interface MilkAnalyticsTimelinePoint {
  date: string;
  totalQuantity: number;
  morningQuantity: number;
  eveningQuantity: number;
}

export interface MilkAnalytics {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  periodTotal: number;
  dailyAverage: number;
  highestProducer: {
    animalId: string;
    name: string;
    species: string;
    quantity: number;
  } | null;
  timeline: MilkAnalyticsTimelinePoint[];
  byAnimal: Array<{
    animalId: string;
    name: string;
    species: string;
    totalQuantity: number;
    count: number;
  }>;
}

export interface VaccinationAnalytics {
  total: number;
  completed: number;
  dueSoon: number;
  overdue: number;
  dueWithin30Days: number;
  byVaccineType: Array<{ type: string; count: number }>;
  byAnimal: Array<{ animalId: string; name: string; count: number }>;
}

export interface HealthAnalytics {
  totalRecords: number;
  followupsDue: number;
  conditions: Array<{ condition: string; count: number }>;
  eventsOverTime: Array<{ period: string; count: number }>;
}

export interface BreedingAnalytics {
  totalRecords: number;
  pregnantCount: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  deliveriesByMonth: Array<{ month: string; count: number }>;
}

export interface FeedAnalyticsTimelinePoint {
  date: string;
  quantity: number;
  cost: number;
}

export interface FeedAnalytics {
  totalQuantity: number;
  totalCost: number;
  timeline: FeedAnalyticsTimelinePoint[];
  byType: Array<{
    feedType: string;
    quantity: number;
    cost: number;
    count: number;
  }>;
}

export interface FinanceAnalyticsTimelinePoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinanceAnalytics {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  feedCost: number;
  vetCost: number;
  otherExpenses: number;
  timeline: FinanceAnalyticsTimelinePoint[];
  incomeCategories: Array<{ category: string; amount: number; count: number }>;
  expenseCategories: Array<{ category: string; amount: number; count: number }>;
}
