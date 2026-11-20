import { Response } from 'express';
import mongoose from 'mongoose';
import { MilkRecord } from '../models/MilkRecord';
import { Livestock } from '../models/Livestock';
import { AuthenticatedRequest } from '../types/express';

export const getMilkRecords = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { range, livestockId, startDate, endDate } = req.query;

    const query: any = {
      userId: req.user!.id,
      farmId: req.user!.farmId,
    };

    if (livestockId && mongoose.Types.ObjectId.isValid(livestockId as string)) {
      query.livestockId = livestockId;
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

    const records = await MilkRecord.find(query)
      .populate('livestockId', 'animalId name species breed')
      .sort({ date: -1 })
      .lean();

    // Calculate sum of totalQuantity
    const overallTotal = records.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);

    res.status(200).json({
      success: true,
      count: records.length,
      overallTotal: Number(overallTotal.toFixed(2)),
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching milk production records',
    });
  }
};

export const getMilkSummary = async (
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

    // 1. Today's start and end
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 2. 7 days ago
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 3. 30 days ago
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Aggregations
    const [todayAgg, weekAgg, monthAgg, animalAgg] = await Promise.all([
      MilkRecord.aggregate([
        { $match: { farmId, date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$totalQuantity' }, count: { $sum: 1 } } },
      ]),
      MilkRecord.aggregate([
        { $match: { farmId, date: { $gte: sevenDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$totalQuantity' }, count: { $sum: 1 } } },
      ]),
      MilkRecord.aggregate([
        { $match: { farmId, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$totalQuantity' }, count: { $sum: 1 } } },
      ]),
      MilkRecord.aggregate([
        { $match: { farmId, date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$livestockId',
            totalYield: { $sum: '$totalQuantity' },
            recordCount: { $sum: 1 },
          },
        },
        { $lookup: { from: 'livestocks', localField: '_id', foreignField: '_id', as: 'animal' } },
        { $unwind: { path: '$animal', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            animalId: '$animal.animalId',
            name: '$animal.name',
            species: '$animal.species',
            totalYield: { $round: ['$totalYield', 2] },
            avgDaily: { $round: [{ $divide: ['$totalYield', '$recordCount'] }, 2] },
          },
        },
        { $sort: { totalYield: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const todayTotal = todayAgg.length > 0 ? Number(todayAgg[0].total.toFixed(2)) : 0;
    const weekTotal = weekAgg.length > 0 ? Number(weekAgg[0].total.toFixed(2)) : 0;
    const monthTotal = monthAgg.length > 0 ? Number(monthAgg[0].total.toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        todayTotal,
        weekTotal,
        monthTotal,
        animalBreakdown: animalAgg,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating milk summary',
    });
  }
};

export const getMilkRecordById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid milk record ID' });
      return;
    }

    const record = await MilkRecord.findOne({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    })
      .populate('livestockId', 'animalId name species breed')
      .lean();

    if (!record) {
      res.status(404).json({ success: false, message: 'Milk record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching milk record',
    });
  }
};

export const createMilkRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { livestockId, date, morningQuantity, eveningQuantity, notes } = req.body;

    if (!livestockId) {
      res.status(400).json({ success: false, message: 'Livestock ID is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(livestockId)) {
      res.status(400).json({ success: false, message: 'Invalid animal ID format' });
      return;
    }

    const morning = Number(morningQuantity || 0);
    const evening = Number(eveningQuantity || 0);

    if (morning < 0 || evening < 0) {
      res.status(400).json({ success: false, message: 'Milk quantities cannot be negative' });
      return;
    }

    if (morning === 0 && evening === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one session (morning or evening) must have quantity > 0',
      });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    // Verify animal belongs to user/farm
    const animal = await Livestock.findOne({
      _id: livestockId,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!animal) {
      res.status(404).json({ success: false, message: 'Referenced livestock not found in your farm' });
      return;
    }

    // Auto-calculate total quantity
    const totalQuantity = Number((morning + evening).toFixed(2));

    const record = await MilkRecord.create({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      livestockId,
      date: date ? new Date(date) : new Date(),
      morningQuantity: morning,
      eveningQuantity: evening,
      totalQuantity,
      notes: notes ? notes.trim() : '',
    });

    const populated = await MilkRecord.findById(record._id)
      .populate('livestockId', 'animalId name species breed')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Milk record logged successfully',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error recording milk production',
    });
  }
};

export const updateMilkRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid milk record ID format' });
      return;
    }

    const { livestockId, date, morningQuantity, eveningQuantity, notes } = req.body;

    const morning = morningQuantity !== undefined ? Number(morningQuantity) : undefined;
    const evening = eveningQuantity !== undefined ? Number(eveningQuantity) : undefined;

    if ((morning !== undefined && morning < 0) || (evening !== undefined && evening < 0)) {
      res.status(400).json({ success: false, message: 'Milk quantities cannot be negative' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    // Load existing record to recompute total if only one quantity passed
    const existing = await MilkRecord.findOne({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Milk record not found or unauthorized' });
      return;
    }

    const m = morning !== undefined ? morning : existing.morningQuantity;
    const e = evening !== undefined ? evening : existing.eveningQuantity;
    const newTotal = Number((m + e).toFixed(2));

    const updated = await MilkRecord.findOneAndUpdate(
      {
        _id: id,
        userId: req.user!.id,
        farmId: req.user!.farmId,
      },
      {
        ...(livestockId && { livestockId }),
        ...(date && { date: new Date(date) }),
        ...(morning !== undefined && { morningQuantity: morning }),
        ...(evening !== undefined && { eveningQuantity: evening }),
        totalQuantity: newTotal,
        ...(notes !== undefined && { notes: notes.trim() }),
      },
      { new: true }
    ).populate('livestockId', 'animalId name species breed');

    res.status(200).json({
      success: true,
      message: 'Milk record updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating milk record',
    });
  }
};

export const deleteMilkRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid milk record ID format' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const deleted = await MilkRecord.findOneAndDelete({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Milk record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Milk record deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting milk record',
    });
  }
};
