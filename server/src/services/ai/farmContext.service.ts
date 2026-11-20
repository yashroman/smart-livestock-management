import mongoose from 'mongoose';
import { FarmIntent } from './intent.service';
import {
  Farm,
  Livestock,
  HealthRecord,
  Vaccination,
  BreedingRecord,
  MilkRecord,
  FeedRecord,
  FinanceRecord,
  Reminder,
} from '../../models';

export interface FarmContextResult {
  farmContext: Record<string, any>;
  hasRecords: boolean;
  intentsRetrieved: FarmIntent[];
}

/**
 * Builds safe, targeted, and aggregated farm context for AI grounding.
 * Strictly scopes all queries by farmId and userId to prevent multi-tenant cross-contamination.
 */
export async function buildFarmContext(
  farmId: string,
  userId: string,
  intents: FarmIntent[]
): Promise<FarmContextResult> {
  // If mongoose is disconnected, safely indicate database is unavailable
  if (mongoose.connection.readyState !== 1) {
    return {
      farmContext: { status: 'DATABASE_OFFLINE' },
      hasRecords: false,
      intentsRetrieved: intents,
    };
  }

  const farmOid = new mongoose.Types.ObjectId(farmId);
  const userOid = new mongoose.Types.ObjectId(userId);

  // 1. Fetch Farm Identity
  const farm = await Farm.findOne({ _id: farmOid, userId: userOid }).select('farmName location').lean();

  const contextData: Record<string, any> = {
    farmInfo: {
      name: farm?.farmName || 'Registered Dairy Farm',
      location: farm?.location || 'Unspecified',
    },
  };

  let totalRecordsFound = 0;

  // 2. Core Livestock Herd Summary (Always retrieved for baseline grounding)
  const totalLivestock = await Livestock.countDocuments({ farmId: farmOid });
  totalRecordsFound += totalLivestock;

  const healthyCount = await Livestock.countDocuments({ farmId: farmOid, status: 'Healthy' });
  const attentionCount = await Livestock.countDocuments({
    farmId: farmOid,
    status: { $in: ['Sick', 'Treatment', 'Quarantined'] },
  });
  const pregnantCount = await Livestock.countDocuments({ farmId: farmOid, status: 'Pregnant' });

  contextData.herdSummary = {
    totalAnimals: totalLivestock,
    healthyAnimals: healthyCount,
    needsAttention: attentionCount,
    pregnantAnimals: pregnantCount,
  };

  const shouldFetchLivestock =
    intents.includes('livestock') ||
    intents.includes('general') ||
    intents.includes('vaccination') ||
    intents.includes('health') ||
    intents.includes('breeding');

  if (shouldFetchLivestock && totalLivestock > 0) {
    const animals = await Livestock.find({ farmId: farmOid })
      .select('animalId name species breed gender status weight dateOfBirth')
      .limit(15)
      .lean();

    contextData.livestockSample = animals.map((a) => ({
      animalId: a.animalId,
      name: a.name,
      species: a.species,
      breed: a.breed,
      gender: a.gender,
      status: a.status,
      weightKg: a.weight,
    }));
  }

  // 3. Vaccination Context
  if (intents.includes('vaccination') || intents.includes('general')) {
    const pendingVaccinations = await Vaccination.find({
      farmId: farmOid,
      status: { $in: ['Overdue', 'Due Soon'] },
    })
      .populate('livestockId', 'animalId name species')
      .sort({ nextDueDate: 1 })
      .limit(10)
      .lean();

    totalRecordsFound += pendingVaccinations.length;

    contextData.vaccinations = {
      pendingOrOverdueCount: pendingVaccinations.length,
      upcomingSchedule: pendingVaccinations.map((v: any) => ({
        animalId: v.livestockId?.animalId || 'General',
        animalName: v.livestockId?.name || '',
        vaccine: v.vaccineName,
        dueDate: v.nextDueDate ? new Date(v.nextDueDate).toISOString().split('T')[0] : 'N/A',
        status: v.status,
      })),
    };
  }

  // 4. Milk Production Context
  if (intents.includes('milk') || intents.includes('general')) {
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Month Total
    const monthAgg = await MilkRecord.aggregate([
      { $match: { farmId: farmOid, date: { $gte: monthStart } } },
      { $group: { _id: null, totalQuantity: { $sum: '$totalQuantity' }, avgYield: { $avg: '$totalQuantity' } } },
    ]);

    // Top producing animals (past 30 days)
    const topProducers = await MilkRecord.aggregate([
      { $match: { farmId: farmOid, date: { $gte: monthStart } } },
      {
        $group: {
          _id: '$livestockId',
          totalMilk: { $sum: '$totalQuantity' },
          avgYield: { $avg: '$totalQuantity' },
        },
      },
      { $sort: { totalMilk: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'livestocks',
          localField: '_id',
          foreignField: '_id',
          as: 'animal',
        },
      },
      { $unwind: '$animal' },
      {
        $project: {
          animalId: '$animal.animalId',
          name: '$animal.name',
          totalMilk: 1,
          avgYield: { $round: ['$avgYield', 1] },
        },
      },
    ]);

    const totalMonthMilk = monthAgg[0]?.totalQuantity || 0;
    if (totalMonthMilk > 0) totalRecordsFound++;

    contextData.milkProduction = {
      monthTotalLitres: totalMonthMilk,
      monthAverageDailyLitres: Math.round((monthAgg[0]?.avgYield || 0) * 10) / 10,
      topMilkProducers: topProducers,
    };
  }

  // 5. Breeding & Calving Context
  if (intents.includes('breeding') || intents.includes('general')) {
    const activePregnancies = await BreedingRecord.find({
      farmId: farmOid,
      pregnancyStatus: { $in: ['Confirmed Pregnant', 'Suspected Pregnant'] },
    })
      .populate('livestockId', 'animalId name species')
      .sort({ expectedDeliveryDate: 1 })
      .limit(10)
      .lean();

    totalRecordsFound += activePregnancies.length;

    contextData.breeding = {
      pregnantCount: activePregnancies.length,
      upcomingCalvings: activePregnancies.map((b: any) => ({
        animalId: b.livestockId?.animalId || 'Unknown',
        animalName: b.livestockId?.name || '',
        breedingMethod: b.breedingMethod,
        pregnancyStatus: b.pregnancyStatus,
        expectedDeliveryDate: b.expectedDeliveryDate
          ? new Date(b.expectedDeliveryDate).toISOString().split('T')[0]
          : 'N/A',
      })),
    };
  }

  // 6. Health & Medical Context
  if (intents.includes('health')) {
    const recentHealth = await HealthRecord.find({ farmId: farmOid })
      .populate('livestockId', 'animalId name species')
      .sort({ date: -1 })
      .limit(8)
      .lean();

    totalRecordsFound += recentHealth.length;

    contextData.recentHealthEvents = recentHealth.map((h: any) => ({
      animalId: h.livestockId?.animalId || 'General',
      animalName: h.livestockId?.name || '',
      date: new Date(h.date).toISOString().split('T')[0],
      diagnosis: h.diagnosis || 'Clinical Checkup',
      symptoms: h.symptoms || [],
      treatment: h.treatment || 'None recorded',
      veterinarian: h.veterinarianName || 'Unspecified',
      followUpDate: h.followUpDate ? new Date(h.followUpDate).toISOString().split('T')[0] : null,
    }));
  }

  // 7. Feed & Nutrition Context
  if (intents.includes('feed')) {
    const recentFeed = await FeedRecord.find({ farmId: farmOid })
      .sort({ date: -1 })
      .limit(6)
      .lean();

    totalRecordsFound += recentFeed.length;

    contextData.recentFeedAllocations = recentFeed.map((f) => ({
      date: new Date(f.date).toISOString().split('T')[0],
      feedType: f.feedType,
      quantity: f.quantity,
      unit: f.unit,
      costRupees: f.cost,
      group: f.group || 'All Animals',
    }));
  }

  // 8. Finance Context
  if (intents.includes('finance') || intents.includes('general')) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const financeSummary = await FinanceRecord.aggregate([
      { $match: { farmId: farmOid, date: { $gte: monthStart } } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    let monthIncome = 0;
    let monthExpenses = 0;

    for (const item of financeSummary) {
      if (item._id === 'income') monthIncome = item.totalAmount;
      if (item._id === 'expense') monthExpenses = item.totalAmount;
    }

    if (monthIncome > 0 || monthExpenses > 0) totalRecordsFound++;

    contextData.finance = {
      currentMonthIncomeRupees: monthIncome,
      currentMonthExpensesRupees: monthExpenses,
      netProfitLossRupees: monthIncome - monthExpenses,
    };
  }

  // 9. Reminders Context
  if (intents.includes('reminders') || intents.includes('general')) {
    const now = new Date();
    const overdueReminders = await Reminder.find({
      farmId: farmOid,
      status: 'Pending',
      dueDate: { $lt: now },
    })
      .sort({ dueDate: 1 })
      .limit(6)
      .lean();

    totalRecordsFound += overdueReminders.length;

    contextData.overdueReminders = overdueReminders.map((r) => ({
      title: r.title,
      type: r.type,
      priority: r.priority,
      dueDate: new Date(r.dueDate).toISOString().split('T')[0],
    }));
  }

  return {
    farmContext: contextData,
    hasRecords: totalRecordsFound > 0,
    intentsRetrieved: intents,
  };
}
