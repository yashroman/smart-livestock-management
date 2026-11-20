import { Response } from 'express';
import mongoose from 'mongoose';
import { FinanceRecord, FinanceType } from '../models/FinanceRecord';
import { AuthenticatedRequest } from '../types/express';

// ==========================================
// Generic Helper for Listing Transactions
// ==========================================
const listTransactions = async (
  type: FinanceType,
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { category, range, startDate, endDate, search } = req.query;

    const query: any = {
      userId: req.user!.id,
      farmId: req.user!.farmId,
      type,
    };

    if (category && typeof category === 'string' && category.trim() !== '') {
      query.category = category.trim();
    }

    const now = new Date();
    if (range === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (range === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      query.date = { $gte: start };
    } else if (range === 'month') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      query.date = { $gte: start };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { category: searchRegex },
        { description: searchRegex },
        { reference: searchRegex },
        { paymentMethod: searchRegex },
      ];
    }

    const records = await FinanceRecord.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);

    res.status(200).json({
      success: true,
      count: records.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || `Error fetching ${type} records`,
    });
  }
};

// ==========================================
// Helper for Periodic Summary of one Type
// ==========================================
const getSingleTypeSummary = async (
  type: FinanceType,
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [todayAgg, weekAgg, monthAgg, totalAgg, categoryAgg] = await Promise.all([
      FinanceRecord.aggregate([
        { $match: { farmId, type, date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      FinanceRecord.aggregate([
        { $match: { farmId, type, date: { $gte: sevenDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      FinanceRecord.aggregate([
        { $match: { farmId, type, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      FinanceRecord.aggregate([
        { $match: { farmId, type } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      FinanceRecord.aggregate([
        { $match: { farmId, type } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: todayAgg[0]?.total ? Number(todayAgg[0].total.toFixed(2)) : 0,
        thisWeek: weekAgg[0]?.total ? Number(weekAgg[0].total.toFixed(2)) : 0,
        thisMonth: monthAgg[0]?.total ? Number(monthAgg[0].total.toFixed(2)) : 0,
        total: totalAgg[0]?.total ? Number(totalAgg[0].total.toFixed(2)) : 0,
        count: totalAgg[0]?.count || 0,
        byCategory: categoryAgg.map((c) => ({
          category: c._id,
          amount: Number(c.total.toFixed(2)),
          count: c.count,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || `Error fetching ${type} summary`,
    });
  }
};

// ==========================================
// INCOME CONTROLLER HANDLERS
// ==========================================

export const getIncomeRecords = async (req: AuthenticatedRequest, res: Response) => {
  await listTransactions('income', req, res);
};

export const getIncomeSummary = async (req: AuthenticatedRequest, res: Response) => {
  await getSingleTypeSummary('income', req, res);
};

export const getIncomeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const record = await FinanceRecord.findOne({
      _id: id,
      farmId: req.user!.farmId,
      type: 'income',
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Income record not found' });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching income record' });
  }
};

export const createIncome = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { date, category, amount, description, paymentMethod, reference, notes } = req.body;

    if (!category || typeof category !== 'string' || category.trim() === '') {
      res.status(400).json({ success: false, message: 'Category is required' });
      return;
    }

    if (amount === undefined || amount === null || Number(amount) < 0 || isNaN(Number(amount))) {
      res.status(400).json({ success: false, message: 'Valid positive amount is required' });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      res.status(400).json({ success: false, message: 'Description is required' });
      return;
    }

    const record = new FinanceRecord({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      type: 'income',
      date: date ? new Date(date) : new Date(),
      category: category.trim(),
      amount: Number(amount),
      description: description.trim(),
      paymentMethod: paymentMethod ? paymentMethod.trim() : 'Cash',
      reference: reference ? reference.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
    });

    await record.save();

    res.status(201).json({
      success: true,
      message: 'Income record created successfully',
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating income record' });
  }
};

export const updateIncome = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const record = await FinanceRecord.findOne({
      _id: id,
      farmId: req.user!.farmId,
      type: 'income',
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Income record not found' });
      return;
    }

    const { date, category, amount, description, paymentMethod, reference, notes } = req.body;

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim() === '') {
        res.status(400).json({ success: false, message: 'Category cannot be empty' });
        return;
      }
      record.category = category.trim();
    }

    if (amount !== undefined) {
      if (Number(amount) < 0 || isNaN(Number(amount))) {
        res.status(400).json({ success: false, message: 'Amount cannot be negative' });
        return;
      }
      record.amount = Number(amount);
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        res.status(400).json({ success: false, message: 'Description cannot be empty' });
        return;
      }
      record.description = description.trim();
    }

    if (date !== undefined) record.date = new Date(date);
    if (paymentMethod !== undefined) record.paymentMethod = paymentMethod.trim();
    if (reference !== undefined) record.reference = reference ? reference.trim() : undefined;
    if (notes !== undefined) record.notes = notes ? notes.trim() : undefined;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Income record updated successfully',
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating income record' });
  }
};

export const deleteIncome = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const record = await FinanceRecord.findOneAndDelete({
      _id: id,
      farmId: req.user!.farmId,
      type: 'income',
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Income record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Income record deleted successfully',
      data: { id: record._id },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting income record' });
  }
};

// ==========================================
// EXPENSE CONTROLLER HANDLERS
// ==========================================

export const getExpenseRecords = async (req: AuthenticatedRequest, res: Response) => {
  await listTransactions('expense', req, res);
};

export const getExpenseSummary = async (req: AuthenticatedRequest, res: Response) => {
  await getSingleTypeSummary('expense', req, res);
};

export const getExpenseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const record = await FinanceRecord.findOne({
      _id: id,
      farmId: req.user!.farmId,
      type: 'expense',
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Expense record not found' });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching expense record' });
  }
};

export const createExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { date, category, amount, description, paymentMethod, reference, notes } = req.body;

    if (!category || typeof category !== 'string' || category.trim() === '') {
      res.status(400).json({ success: false, message: 'Category is required' });
      return;
    }

    if (amount === undefined || amount === null || Number(amount) < 0 || isNaN(Number(amount))) {
      res.status(400).json({ success: false, message: 'Valid positive amount is required' });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      res.status(400).json({ success: false, message: 'Description is required' });
      return;
    }

    const record = new FinanceRecord({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      type: 'expense',
      date: date ? new Date(date) : new Date(),
      category: category.trim(),
      amount: Number(amount),
      description: description.trim(),
      paymentMethod: paymentMethod ? paymentMethod.trim() : 'Cash',
      reference: reference ? reference.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
    });

    await record.save();

    res.status(201).json({
      success: true,
      message: 'Expense record created successfully',
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating expense record' });
  }
};

export const updateExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const record = await FinanceRecord.findOne({
      _id: id,
      farmId: req.user!.farmId,
      type: 'expense',
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Expense record not found' });
      return;
    }

    const { date, category, amount, description, paymentMethod, reference, notes } = req.body;

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim() === '') {
        res.status(400).json({ success: false, message: 'Category cannot be empty' });
        return;
      }
      record.category = category.trim();
    }

    if (amount !== undefined) {
      if (Number(amount) < 0 || isNaN(Number(amount))) {
        res.status(400).json({ success: false, message: 'Amount cannot be negative' });
        return;
      }
      record.amount = Number(amount);
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        res.status(400).json({ success: false, message: 'Description cannot be empty' });
        return;
      }
      record.description = description.trim();
    }

    if (date !== undefined) record.date = new Date(date);
    if (paymentMethod !== undefined) record.paymentMethod = paymentMethod.trim();
    if (reference !== undefined) record.reference = reference ? reference.trim() : undefined;
    if (notes !== undefined) record.notes = notes ? notes.trim() : undefined;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Expense record updated successfully',
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating expense record' });
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const record = await FinanceRecord.findOneAndDelete({
      _id: id,
      farmId: req.user!.farmId,
      type: 'expense',
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Expense record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Expense record deleted successfully',
      data: { id: record._id },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting expense record' });
  }
};

// ==========================================
// AUTHORITATIVE FINANCIAL SUMMARY & NET INCOME
// GET /api/finance/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Formula: Net Income = Total Income - Total Expenses
// ==========================================
export const getFinanceSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const { from, to } = req.query;

    const dateFilter: any = {};
    if (from) dateFilter.$gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate;
    }

    const matchStage: any = { farmId };
    if (from || to) {
      matchStage.date = dateFilter;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      rangeIncomeAgg,
      rangeExpenseAgg,
      todayIncomeAgg,
      todayExpenseAgg,
      weekIncomeAgg,
      weekExpenseAgg,
      monthIncomeAgg,
      monthExpenseAgg,
      expenseByCategoryAgg,
      incomeByCategoryAgg,
    ] = await Promise.all([
      // Range/Total Income
      FinanceRecord.aggregate([
        { $match: { ...matchStage, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Range/Total Expenses
      FinanceRecord.aggregate([
        { $match: { ...matchStage, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Today Income
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'income', date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Today Expenses
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'expense', date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Week Income
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'income', date: { $gte: sevenDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Week Expenses
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'expense', date: { $gte: sevenDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Month Income
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'income', date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Month Expenses
      FinanceRecord.aggregate([
        { $match: { farmId, type: 'expense', date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Expense Categories (all or range)
      FinanceRecord.aggregate([
        { $match: { ...matchStage, type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      // Income Categories (all or range)
      FinanceRecord.aggregate([
        { $match: { ...matchStage, type: 'income' } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const totalIncome = rangeIncomeAgg[0]?.total ? Number(rangeIncomeAgg[0].total.toFixed(2)) : 0;
    const totalExpenses = rangeExpenseAgg[0]?.total ? Number(rangeExpenseAgg[0].total.toFixed(2)) : 0;
    const netIncome = Number((totalIncome - totalExpenses).toFixed(2));

    const todayIncome = todayIncomeAgg[0]?.total ? Number(todayIncomeAgg[0].total.toFixed(2)) : 0;
    const todayExpenses = todayExpenseAgg[0]?.total ? Number(todayExpenseAgg[0].total.toFixed(2)) : 0;

    const weekIncome = weekIncomeAgg[0]?.total ? Number(weekIncomeAgg[0].total.toFixed(2)) : 0;
    const weekExpenses = weekExpenseAgg[0]?.total ? Number(weekExpenseAgg[0].total.toFixed(2)) : 0;

    const monthIncome = monthIncomeAgg[0]?.total ? Number(monthIncomeAgg[0].total.toFixed(2)) : 0;
    const monthExpenses = monthExpenseAgg[0]?.total ? Number(monthExpenseAgg[0].total.toFixed(2)) : 0;

    // Special category highlights (Feed, Vet, etc.)
    const feedCostEntry = expenseByCategoryAgg.find(
      (c) => c._id.toLowerCase() === 'feed'
    );
    const vetCostEntry = expenseByCategoryAgg.find(
      (c) => c._id.toLowerCase() === 'veterinary' || c._id.toLowerCase() === 'medicine' || c._id.toLowerCase() === 'vaccination'
    );

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netIncome,
        todayIncome,
        todayExpenses,
        todayNet: Number((todayIncome - todayExpenses).toFixed(2)),
        weekIncome,
        weekExpenses,
        weekNet: Number((weekIncome - weekExpenses).toFixed(2)),
        monthIncome,
        monthExpenses,
        monthNet: Number((monthIncome - monthExpenses).toFixed(2)),
        feedCost: feedCostEntry ? Number(feedCostEntry.total.toFixed(2)) : 0,
        vetCost: vetCostEntry ? Number(vetCostEntry.total.toFixed(2)) : 0,
        otherExpenses: Number((totalExpenses - (feedCostEntry?.total || 0) - (vetCostEntry?.total || 0)).toFixed(2)),
        categoryBreakdown: {
          income: incomeByCategoryAgg.map((c) => ({
            category: c._id,
            amount: Number(c.total.toFixed(2)),
            count: c.count,
          })),
          expenses: expenseByCategoryAgg.map((c) => ({
            category: c._id,
            amount: Number(c.total.toFixed(2)),
            count: c.count,
          })),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating financial summary',
    });
  }
};
