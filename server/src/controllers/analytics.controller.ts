import { Response } from 'express';
import mongoose from 'mongoose';
import { Livestock } from '../models/Livestock';
import { MilkRecord } from '../models/MilkRecord';
import { HealthRecord } from '../models/HealthRecord';
import { Vaccination } from '../models/Vaccination';
import { BreedingRecord } from '../models/BreedingRecord';
import { FeedRecord } from '../models/FeedRecord';
import { FinanceRecord } from '../models/FinanceRecord';
import { Reminder } from '../models/Reminder';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../types/express';
import { computeVaccinationStatus } from './vaccination.controller';
import { validateDateRange } from '../utils/dateValidation';

// ====================================================
// 1. GET /api/analytics/overview
// Centralized farm metrics, alerts, and recent activity
// ====================================================
export const getAnalyticsOverview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAhead = new Date(now);
    sevenDaysAhead.setDate(now.getDate() + 7);
    const fourteenDaysAhead = new Date(now);
    fourteenDaysAhead.setDate(now.getDate() + 14);

    // Parallel aggregate queries strictly scoped to tenant farm
    const [
      totalLivestock,
      healthyAnimals,
      attentionAnimals,
      pregnantAnimals,
      todayMilkAgg,
      monthMilkAgg,
      incomeAgg,
      expenseAgg,
      vaccinations,
      breedingDue,
      healthFollowups,
      pendingReminders,
      recentLivestock,
      recentMilk,
      recentHealth,
      recentIncome,
      recentExpense,
    ] = await Promise.all([
      Livestock.countDocuments({ farmId, userId }),
      Livestock.countDocuments({ farmId, userId, status: 'Healthy' }),
      Livestock.countDocuments({
        farmId,
        userId,
        status: { $in: ['Needs Attention', 'Sick', 'Quarantined'] },
      }),
      Livestock.countDocuments({ farmId, userId, status: 'Pregnant' }),
      // Milk today
      MilkRecord.aggregate([
        { $match: { farmId, date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$totalQuantity' } } },
      ]),
      // Milk this month
      MilkRecord.aggregate([
        { $match: { farmId, date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalQuantity' } } },
      ]),
      // Finance income
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Finance expense
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Vaccinations for status calculation
      Vaccination.find({ farmId }).populate('livestockId', 'animalId name').lean(),
      // Breeding upcoming calving
      BreedingRecord.find({
        farmId,
        pregnancyStatus: { $in: ['Confirmed Pregnant', 'Pregnant'] },
        expectedDeliveryDate: { $gte: now, $lte: fourteenDaysAhead },
      })
        .populate('livestockId', 'animalId name')
        .lean(),
      // Health follow-ups
      HealthRecord.find({
        farmId,
        followUpDate: { $gte: now, $lte: sevenDaysAhead },
      })
        .populate('livestockId', 'animalId name')
        .lean(),
      // Overdue reminders
      Reminder.find({ farmId, status: 'Pending', dueDate: { $lt: now } }).lean(),
      // Recent activities components
      Livestock.find({ farmId }).sort({ createdAt: -1 }).limit(3).lean(),
      MilkRecord.find({ farmId }).populate('livestockId', 'animalId').sort({ date: -1 }).limit(3).lean(),
      HealthRecord.find({ farmId }).populate('livestockId', 'animalId').sort({ date: -1 }).limit(3).lean(),
      FinanceRecord.find({ farmId, type: 'income' }).sort({ date: -1 }).limit(3).lean(),
      FinanceRecord.find({ farmId, type: 'expense' }).sort({ date: -1 }).limit(3).lean(),
    ]);

    // Compute vaccination status counts
    let upcomingVaccinations = 0;
    let overdueVaccinations = 0;
    const attentionAlerts: Array<{
      type: string;
      title: string;
      description: string;
      severity: 'urgent' | 'warning' | 'info';
      link: string;
    }> = [];

    vaccinations.forEach((v) => {
      const status = computeVaccinationStatus(v.nextDueDate);
      const animalTag = (v.livestockId as any)?.animalId || 'Livestock';
      if (status === 'Overdue') {
        overdueVaccinations++;
        attentionAlerts.push({
          type: 'Vaccination',
          title: `Overdue Vaccine: ${v.vaccine}`,
          description: `Vaccine for animal ${animalTag} is overdue.`,
          severity: 'urgent',
          link: '/vaccination',
        });
      } else if (status === 'Due Soon') {
        upcomingVaccinations++;
        attentionAlerts.push({
          type: 'Vaccination',
          title: `Vaccine Due Soon: ${v.vaccine}`,
          description: `Vaccine for animal ${animalTag} is due within 7 days.`,
          severity: 'warning',
          link: '/vaccination',
        });
      }
    });

    breedingDue.forEach((b) => {
      const animalTag = (b.livestockId as any)?.animalId || 'Livestock';
      attentionAlerts.push({
        type: 'Breeding',
        title: `Calving Approaching: ${animalTag}`,
        description: `Expected delivery on ${new Date(b.expectedDeliveryDate!).toLocaleDateString()}.`,
        severity: 'info',
        link: '/breeding',
      });
    });

    healthFollowups.forEach((h) => {
      const animalTag = (h.livestockId as any)?.animalId || 'Livestock';
      attentionAlerts.push({
        type: 'Health',
        title: `Health Checkup Due: ${animalTag}`,
        description: `Follow-up evaluation for ${h.healthCondition || 'Recovery'}.`,
        severity: 'info',
        link: '/health',
      });
    });

    pendingReminders.forEach((r) => {
      attentionAlerts.push({
        type: 'Reminder',
        title: `Overdue Task: ${r.title}`,
        description: `Scheduled chore is past due.`,
        severity: 'warning',
        link: '/reminders',
      });
    });

    // Compile Recent Activity timeline
    const activityFeed: Array<{
      id: string;
      type: 'livestock' | 'milk' | 'health' | 'finance';
      title: string;
      description: string;
      date: string;
      link: string;
    }> = [];

    recentLivestock.forEach((a) => {
      activityFeed.push({
        id: a._id.toString(),
        type: 'livestock',
        title: `New Animal Registered: ${a.animalId}`,
        description: `${a.name} (${a.species}, ${a.breed}) added to herd.`,
        date: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
        link: `/livestock/${a._id}`,
      });
    });

    recentMilk.forEach((m) => {
      activityFeed.push({
        id: m._id.toString(),
        type: 'milk',
        title: `Milk Recorded: ${m.totalQuantity} L`,
        description: `Logged yield for animal ${(m.livestockId as any)?.animalId || 'herd'}.`,
        date: new Date(m.date).toISOString(),
        link: '/milk',
      });
    });

    recentHealth.forEach((h) => {
      activityFeed.push({
        id: h._id.toString(),
        type: 'health',
        title: `Medical Check: ${h.healthCondition || 'Health Event'}`,
        description: `Treatment logged for ${(h.livestockId as any)?.animalId || 'animal'}.`,
        date: new Date(h.date).toISOString(),
        link: '/health',
      });
    });

    recentIncome.forEach((inc) => {
      activityFeed.push({
        id: inc._id.toString(),
        type: 'finance',
        title: `Revenue Recorded: +₹${inc.amount.toLocaleString()}`,
        description: `${inc.category}: ${inc.description}`,
        date: new Date(inc.date).toISOString(),
        link: '/income',
      });
    });

    recentExpense.forEach((exp) => {
      activityFeed.push({
        id: exp._id.toString(),
        type: 'finance',
        title: `Expense Logged: -₹${exp.amount.toLocaleString()}`,
        description: `${exp.category}: ${exp.description}`,
        date: new Date(exp.date).toISOString(),
        link: '/expenses',
      });
    });

    // Sort combined activity by date descending
    activityFeed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalIncome = incomeAgg[0]?.total ? Number(incomeAgg[0].total.toFixed(2)) : 0;
    const totalExpenses = expenseAgg[0]?.total ? Number(expenseAgg[0].total.toFixed(2)) : 0;
    const netIncome = Number((totalIncome - totalExpenses).toFixed(2));
    const todayMilk = todayMilkAgg[0]?.total ? Number(todayMilkAgg[0].total.toFixed(2)) : 0;
    const monthMilk = monthMilkAgg[0]?.total ? Number(monthMilkAgg[0].total.toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalLivestock,
          healthyAnimals,
          attentionAnimals,
          pregnantAnimals,
          todayMilk,
          monthMilk,
          totalIncome,
          totalExpenses,
          netIncome,
          upcomingVaccinations,
          overdueVaccinations,
        },
        alerts: attentionAlerts.slice(0, 8),
        recentActivity: activityFeed.slice(0, 10),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating overview analytics',
    });
  }
};

// ====================================================
// 2. GET /api/analytics/livestock
// Species, Gender, Status breakdowns
// ====================================================
export const getLivestockAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);

    const [total, bySpecies, byGender, byStatus] = await Promise.all([
      Livestock.countDocuments({ farmId }),
      Livestock.aggregate([
        { $match: { farmId } },
        { $group: { _id: '$species', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Livestock.aggregate([
        { $match: { farmId } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]),
      Livestock.aggregate([
        { $match: { farmId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const healthyCount = byStatus.find((s) => s._id === 'Healthy')?.count || 0;
    const pregnantCount = byStatus.find((s) => s._id === 'Pregnant')?.count || 0;
    const needsAttentionCount = byStatus
      .filter((s) => ['Needs Attention', 'Sick', 'Quarantined'].includes(s._id))
      .reduce((sum, item) => sum + item.count, 0);

    res.status(200).json({
      success: true,
      data: {
        total,
        healthy: healthyCount,
        needsAttention: needsAttentionCount,
        pregnant: pregnantCount,
        bySpecies: bySpecies.map((s) => ({ species: s._id, count: s.count })),
        byGender: byGender.map((g) => ({ gender: g._id, count: g.count })),
        byStatus: byStatus.map((st) => ({ status: st._id, count: st.count })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating livestock analytics',
    });
  }
};

// ====================================================
// 3. GET /api/analytics/milk
// Time series, morning vs evening, animal production
// ====================================================
export const getMilkAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { from, to, range } = req.query;

    const validation = validateDateRange(from, to);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: validation.error });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const now = new Date();

    const dateFilter: any = {};
    if (validation.startDate) dateFilter.$gte = validation.startDate;
    if (validation.endDate) dateFilter.$lte = validation.endDate;

    if (!from && !to) {
      if (range === '7d' || !range) {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        dateFilter.$gte = d;
      } else if (range === '30d') {
        const d = new Date(now);
        d.setDate(now.getDate() - 30);
        dateFilter.$gte = d;
      }
    }

    const matchQuery: any = { farmId };
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.date = dateFilter;
    }

    const [timeSeriesAgg, animalWiseAgg, todayAgg, weekAgg, monthAgg] = await Promise.all([
      // Daily yield over time
      MilkRecord.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalQuantity: { $sum: '$totalQuantity' },
            morningQuantity: { $sum: '$morningQuantity' },
            eveningQuantity: { $sum: '$eveningQuantity' },
            entries: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Animal-wise yield in the period
      MilkRecord.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$livestockId',
            totalQuantity: { $sum: '$totalQuantity' },
            morningQuantity: { $sum: '$morningQuantity' },
            eveningQuantity: { $sum: '$eveningQuantity' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'livestocks',
            localField: '_id',
            foreignField: '_id',
            as: 'animal',
          },
        },
        { $unwind: { path: '$animal', preserveNullAndEmptyArrays: true } },
      ]),
      // Today total
      MilkRecord.aggregate([
        {
          $match: {
            farmId,
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalQuantity' } } },
      ]),
      // Week total
      MilkRecord.aggregate([
        {
          $match: {
            farmId,
            date: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalQuantity' } } },
      ]),
      // Month total
      MilkRecord.aggregate([
        {
          $match: {
            farmId,
            date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalQuantity' } } },
      ]),
    ]);

    const periodTotal = timeSeriesAgg.reduce((sum, item) => sum + item.totalQuantity, 0);
    const dayCount = timeSeriesAgg.length || 1;
    const dailyAverage = Number((periodTotal / dayCount).toFixed(2));

    const topAnimal = animalWiseAgg[0];
    const highestProducer = topAnimal
      ? {
          animalId: topAnimal.animal?.animalId || 'Unknown',
          name: topAnimal.animal?.name || 'Unnamed',
          species: topAnimal.animal?.species || '',
          quantity: Number(topAnimal.totalQuantity.toFixed(2)),
        }
      : null;

    res.status(200).json({
      success: true,
      data: {
        todayTotal: todayAgg[0]?.total ? Number(todayAgg[0].total.toFixed(2)) : 0,
        weekTotal: weekAgg[0]?.total ? Number(weekAgg[0].total.toFixed(2)) : 0,
        monthTotal: monthAgg[0]?.total ? Number(monthAgg[0].total.toFixed(2)) : 0,
        periodTotal: Number(periodTotal.toFixed(2)),
        dailyAverage,
        highestProducer,
        timeline: timeSeriesAgg.map((item) => ({
          date: item._id,
          totalQuantity: Number(item.totalQuantity.toFixed(2)),
          morningQuantity: Number(item.morningQuantity.toFixed(2)),
          eveningQuantity: Number(item.eveningQuantity.toFixed(2)),
        })),
        byAnimal: animalWiseAgg.map((item) => ({
          animalId: item.animal?.animalId || 'Unknown',
          name: item.animal?.name || 'Unnamed',
          species: item.animal?.species || '',
          totalQuantity: Number(item.totalQuantity.toFixed(2)),
          count: item.count,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating milk analytics',
    });
  }
};

// ====================================================
// 4. GET /api/analytics/vaccinations
// Completed, Due soon, Overdue using existing status logic
// ====================================================
export const getVaccinationAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const now = new Date();
    const thirtyDaysAhead = new Date(now);
    thirtyDaysAhead.setDate(now.getDate() + 30);

    const vaccinations = await Vaccination.find({ farmId })
      .populate('livestockId', 'animalId name species')
      .lean();

    let completed = 0;
    let dueSoon = 0;
    let overdue = 0;
    let dueWithin30Days = 0;

    const vaccineTypeMap: Record<string, number> = {};
    const animalMap: Record<string, { animalId: string; name: string; count: number }> = {};

    vaccinations.forEach((v) => {
      const status = computeVaccinationStatus(v.nextDueDate);
      if (status === 'Completed') completed++;
      if (status === 'Due Soon') dueSoon++;
      if (status === 'Overdue') overdue++;

      if (v.nextDueDate) {
        const d = new Date(v.nextDueDate);
        if (d >= now && d <= thirtyDaysAhead) {
          dueWithin30Days++;
        }
      }

      // Vaccine type count
      if (v.vaccine) {
        vaccineTypeMap[v.vaccine] = (vaccineTypeMap[v.vaccine] || 0) + 1;
      }

      // Animal count
      const a = v.livestockId as any;
      if (a?._id) {
        const idStr = a._id.toString();
        if (!animalMap[idStr]) {
          animalMap[idStr] = { animalId: a.animalId, name: a.name, count: 0 };
        }
        animalMap[idStr].count++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total: vaccinations.length,
        completed,
        dueSoon,
        overdue,
        dueWithin30Days,
        byVaccineType: Object.entries(vaccineTypeMap).map(([type, count]) => ({
          type,
          count,
        })),
        byAnimal: Object.values(animalMap).sort((a, b) => b.count - a.count).slice(0, 10),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating vaccination analytics',
    });
  }
};

// ====================================================
// 5. GET /api/analytics/health
// Events over time, common conditions, follow-ups
// ====================================================
export const getHealthAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const now = new Date();

    const [totalRecords, conditionsAgg, timelineAgg, followupsDueCount] = await Promise.all([
      HealthRecord.countDocuments({ farmId }),
      HealthRecord.aggregate([
        { $match: { farmId } },
        { $group: { _id: '$healthCondition', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      HealthRecord.aggregate([
        { $match: { farmId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      HealthRecord.countDocuments({ farmId, followUpDate: { $gte: now } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        followupsDue: followupsDueCount,
        conditions: conditionsAgg.map((c) => ({
          condition: c._id || 'Unspecified',
          count: c.count,
        })),
        eventsOverTime: timelineAgg.map((t) => ({
          period: t._id,
          count: t.count,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating health analytics',
    });
  }
};

// ====================================================
// 6. GET /api/analytics/breeding
// Pregnancy breakdown, upcoming deliveries by month
// ====================================================
export const getBreedingAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const now = new Date();

    const [totalRecords, pregnantCount, statusAgg, deliveriesAgg] = await Promise.all([
      BreedingRecord.countDocuments({ farmId }),
      BreedingRecord.countDocuments({
        farmId,
        pregnancyStatus: { $in: ['Confirmed Pregnant', 'Pregnant'] },
      }),
      BreedingRecord.aggregate([
        { $match: { farmId } },
        { $group: { _id: '$pregnancyStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      BreedingRecord.aggregate([
        {
          $match: {
            farmId,
            expectedDeliveryDate: { $gte: now },
            pregnancyStatus: { $in: ['Confirmed Pregnant', 'Pregnant'] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$expectedDeliveryDate' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        pregnantCount,
        statusBreakdown: statusAgg.map((s) => ({
          status: s._id || 'Pending Check',
          count: s.count,
        })),
        deliveriesByMonth: deliveriesAgg.map((d) => ({
          month: d._id,
          count: d.count,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating breeding analytics',
    });
  }
};

// ====================================================
// 7. GET /api/analytics/feed
// Quantity over time, cost over time, feed type breakdown
// ====================================================
export const getFeedAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { from, to, range } = req.query;

    const validation = validateDateRange(from, to);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: validation.error });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const now = new Date();

    const dateFilter: any = {};
    if (validation.startDate) dateFilter.$gte = validation.startDate;
    if (validation.endDate) dateFilter.$lte = validation.endDate;

    if (!from && !to) {
      if (range === '7d' || !range) {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        dateFilter.$gte = d;
      } else if (range === '30d') {
        const d = new Date(now);
        d.setDate(now.getDate() - 30);
        dateFilter.$gte = d;
      }
    }

    const matchQuery: any = { farmId };
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.date = dateFilter;
    }

    const [timelineAgg, typeAgg, totalAgg] = await Promise.all([
      FeedRecord.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalQuantity: { $sum: '$quantity' },
            totalCost: { $sum: '$cost' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      FeedRecord.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$feedType',
            totalQuantity: { $sum: '$quantity' },
            totalCost: { $sum: '$cost' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalQuantity: -1 } },
      ]),
      FeedRecord.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalCost: { $sum: '$cost' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalQuantity: totalAgg[0]?.totalQuantity ? Number(totalAgg[0].totalQuantity.toFixed(2)) : 0,
        totalCost: totalAgg[0]?.totalCost ? Number(totalAgg[0].totalCost.toFixed(2)) : 0,
        timeline: timelineAgg.map((item) => ({
          date: item._id,
          quantity: Number(item.totalQuantity.toFixed(2)),
          cost: Number(item.totalCost.toFixed(2)),
        })),
        byType: typeAgg.map((item) => ({
          feedType: item._id,
          quantity: Number(item.totalQuantity.toFixed(2)),
          cost: Number(item.totalCost.toFixed(2)),
          count: item.count,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating feed analytics',
    });
  }
};

// ====================================================
// 8. GET /api/analytics/finance
// Income vs expenses over time, net trend, category breakdowns
// ====================================================
export const getFinanceAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { from, to, range } = req.query;

    const validation = validateDateRange(from, to);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: validation.error });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const now = new Date();

    const dateFilter: any = {};
    if (validation.startDate) dateFilter.$gte = validation.startDate;
    if (validation.endDate) dateFilter.$lte = validation.endDate;

    if (!from && !to) {
      if (range === '7d' || !range) {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        dateFilter.$gte = d;
      } else if (range === '30d') {
        const d = new Date(now);
        d.setDate(now.getDate() - 30);
        dateFilter.$gte = d;
      }
    }

    const matchQuery: any = { farmId };
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.date = dateFilter;
    }

    const [dailyAgg, incomeCategoryAgg, expenseCategoryAgg, totalIncomeAgg, totalExpenseAgg] =
      await Promise.all([
        // Daily timeline grouping
        FinanceRecord.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                type: '$type',
              },
              amount: { $sum: '$amount' },
            },
          },
          { $sort: { '_id.date': 1 } },
        ]),
        // Income categories
        FinanceRecord.aggregate([
          { $match: { ...matchQuery, type: 'income' } },
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ]),
        // Expense categories
        FinanceRecord.aggregate([
          { $match: { ...matchQuery, type: 'expense' } },
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ]),
        // Overall Income
        FinanceRecord.aggregate([
          { $match: { ...matchQuery, type: 'income' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        // Overall Expense
        FinanceRecord.aggregate([
          { $match: { ...matchQuery, type: 'expense' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    // Reshape daily timeline to { date, income, expense, net }
    const dailyMap: Record<string, { date: string; income: number; expense: number; net: number }> =
      {};

    dailyAgg.forEach((item) => {
      const d = item._id.date;
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, income: 0, expense: 0, net: 0 };
      }
      if (item._id.type === 'income') {
        dailyMap[d].income = Number(item.amount.toFixed(2));
      } else if (item._id.type === 'expense') {
        dailyMap[d].expense = Number(item.amount.toFixed(2));
      }
      dailyMap[d].net = Number((dailyMap[d].income - dailyMap[d].expense).toFixed(2));
    });

    const timeline = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const totalIncome = totalIncomeAgg[0]?.total ? Number(totalIncomeAgg[0].total.toFixed(2)) : 0;
    const totalExpenses = totalExpenseAgg[0]?.total ? Number(totalExpenseAgg[0].total.toFixed(2)) : 0;
    const netIncome = Number((totalIncome - totalExpenses).toFixed(2));

    const feedCostEntry = expenseCategoryAgg.find((c) => c._id.toLowerCase() === 'feed');
    const vetCostEntry = expenseCategoryAgg.find(
      (c) =>
        c._id.toLowerCase() === 'veterinary' ||
        c._id.toLowerCase() === 'medicine' ||
        c._id.toLowerCase() === 'vaccination'
    );

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netIncome,
        feedCost: feedCostEntry ? Number(feedCostEntry.total.toFixed(2)) : 0,
        vetCost: vetCostEntry ? Number(vetCostEntry.total.toFixed(2)) : 0,
        otherExpenses: Number((totalExpenses - (feedCostEntry?.total || 0) - (vetCostEntry?.total || 0)).toFixed(2)),
        timeline,
        incomeCategories: incomeCategoryAgg.map((c) => ({
          category: c._id,
          amount: Number(c.total.toFixed(2)),
          count: c.count,
        })),
        expenseCategories: expenseCategoryAgg.map((c) => ({
          category: c._id,
          amount: Number(c.total.toFixed(2)),
          count: c.count,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating finance analytics',
    });
  }
};
