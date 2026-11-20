import { Response } from 'express';
import mongoose from 'mongoose';
import { Livestock } from '../models/Livestock';
import { Vaccination } from '../models/Vaccination';
import { MilkRecord } from '../models/MilkRecord';
import { FinanceRecord } from '../models/FinanceRecord';
import { Reminder } from '../models/Reminder';
import { Notification } from '../models/Notification';
import { computeVaccinationStatus } from './vaccination.controller';
import { AuthenticatedRequest } from '../types/express';

export const getDashboardStats = async (
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

    // Parallel aggregate queries strictly scoped to current farm & user
    const [
      totalLivestock,
      healthyAnimals,
      attentionAnimals,
      todayMilkAgg,
      vaccinations,
      recentAnimals,
      incomeAgg,
      expenseAgg,
      expenseByCategoryAgg,
      pendingRemindersCount,
      unreadNotificationsCount,
    ] = await Promise.all([
      Livestock.countDocuments({ farmId, userId }),
      Livestock.countDocuments({ farmId, userId, status: 'Healthy' }),
      Livestock.countDocuments({
        farmId,
        userId,
        status: { $in: ['Needs Attention', 'Sick', 'Quarantined'] },
      }),
      MilkRecord.aggregate([
        { $match: { farmId, date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$totalQuantity' } } },
      ]),
      Vaccination.find({ farmId, userId }).select('nextDueDate').lean(),
      Livestock.find({ farmId, userId }).sort({ createdAt: -1 }).limit(5).lean(),
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      Reminder.countDocuments({ farmId, status: 'Pending' }),
      Notification.countDocuments({ farmId, read: false }),
    ]);

    // Compute vaccination status counts
    let upcomingVaccinations = 0;
    let overdueVaccinations = 0;

    vaccinations.forEach((v) => {
      const status = computeVaccinationStatus(v.nextDueDate);
      if (status === 'Due Soon') upcomingVaccinations++;
      if (status === 'Overdue') overdueVaccinations++;
    });

    const todayMilkProduction =
      todayMilkAgg.length > 0 ? Number(todayMilkAgg[0].total.toFixed(2)) : 0;

    // Financial calculations
    const totalIncome = incomeAgg[0]?.total ? Number(incomeAgg[0].total.toFixed(2)) : 0;
    const totalExpenses = expenseAgg[0]?.total ? Number(expenseAgg[0].total.toFixed(2)) : 0;
    const netIncome = Number((totalIncome - totalExpenses).toFixed(2));

    const feedCostEntry = expenseByCategoryAgg.find(
      (c) => c._id.toLowerCase() === 'feed'
    );
    const vetCostEntry = expenseByCategoryAgg.find(
      (c) =>
        c._id.toLowerCase() === 'veterinary' ||
        c._id.toLowerCase() === 'medicine' ||
        c._id.toLowerCase() === 'vaccination'
    );

    const feedCost = feedCostEntry ? Number(feedCostEntry.total.toFixed(2)) : 0;
    const vetCost = vetCostEntry ? Number(vetCostEntry.total.toFixed(2)) : 0;
    const otherExpenses = Number((totalExpenses - feedCost - vetCost).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        // Livestock KPIs
        totalLivestock,
        healthyAnimals,
        attentionAnimals,
        todayMilkProduction,
        upcomingVaccinations,
        overdueVaccinations,
        recentAnimals,
        // Finance KPIs
        totalIncome,
        totalExpenses,
        netIncome,
        feedCost,
        vetCost,
        otherExpenses,
        // Reminders & Notifications KPIs
        pendingRemindersCount,
        unreadNotificationsCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating dashboard metrics',
    });
  }
};
