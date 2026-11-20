import { Response } from 'express';
import mongoose from 'mongoose';
import { FeedRecord } from '../models/FeedRecord';
import { Livestock } from '../models/Livestock';
import { AuthenticatedRequest } from '../types/express';

export const getFeedRecords = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { livestockId, feedType, range, startDate, endDate, search, group } = req.query;

    const query: any = {
      userId: req.user!.id,
      farmId: req.user!.farmId,
    };

    if (livestockId && mongoose.Types.ObjectId.isValid(livestockId as string)) {
      query.livestockId = livestockId;
    }

    if (feedType && typeof feedType === 'string' && feedType.trim() !== '') {
      query.feedType = feedType.trim();
    }

    if (group && typeof group === 'string' && group.trim() !== '') {
      query.group = new RegExp(group.trim(), 'i');
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
        { feedType: searchRegex },
        { notes: searchRegex },
        { group: searchRegex },
        { unit: searchRegex },
      ];
    }

    const records = await FeedRecord.find(query)
      .populate('livestockId', 'animalId name species breed')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const totalQuantity = records.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    res.status(200).json({
      success: true,
      count: records.length,
      totalQuantity: Number(totalQuantity.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching feed records',
    });
  }
};

export const getFeedSummary = async (
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

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [todayAgg, weekAgg, monthAgg, feedTypeAgg] = await Promise.all([
      FeedRecord.aggregate([
        { $match: { farmId, date: { $gte: todayStart, $lte: todayEnd } } },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalCost: { $sum: '$cost' },
            count: { $sum: 1 },
          },
        },
      ]),
      FeedRecord.aggregate([
        { $match: { farmId, date: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalCost: { $sum: '$cost' },
            count: { $sum: 1 },
          },
        },
      ]),
      FeedRecord.aggregate([
        { $match: { farmId, date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalCost: { $sum: '$cost' },
            count: { $sum: 1 },
          },
        },
      ]),
      FeedRecord.aggregate([
        { $match: { farmId } },
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
    ]);

    res.status(200).json({
      success: true,
      data: {
        todayQuantity: todayAgg[0]?.totalQuantity ? Number(todayAgg[0].totalQuantity.toFixed(2)) : 0,
        todayCost: todayAgg[0]?.totalCost ? Number(todayAgg[0].totalCost.toFixed(2)) : 0,
        todayEntries: todayAgg[0]?.count || 0,
        weekCost: weekAgg[0]?.totalCost ? Number(weekAgg[0].totalCost.toFixed(2)) : 0,
        weekQuantity: weekAgg[0]?.totalQuantity ? Number(weekAgg[0].totalQuantity.toFixed(2)) : 0,
        monthCost: monthAgg[0]?.totalCost ? Number(monthAgg[0].totalCost.toFixed(2)) : 0,
        monthQuantity: monthAgg[0]?.totalQuantity ? Number(monthAgg[0].totalQuantity.toFixed(2)) : 0,
        byFeedType: feedTypeAgg.map((item) => ({
          feedType: item._id,
          totalQuantity: Number(item.totalQuantity.toFixed(2)),
          totalCost: Number(item.totalCost.toFixed(2)),
          count: item.count,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating feed summary',
    });
  }
};

export const getFeedRecordById = async (
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
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const record = await FeedRecord.findOne({
      _id: id,
      farmId: req.user!.farmId,
    }).populate('livestockId', 'animalId name species breed');

    if (!record) {
      res.status(404).json({ success: false, message: 'Feed record not found' });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching feed record',
    });
  }
};

export const createFeedRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { livestockId, group, feedType, quantity, unit, date, cost, notes } = req.body;

    if (!feedType || typeof feedType !== 'string' || feedType.trim() === '') {
      res.status(400).json({ success: false, message: 'Feed type is required' });
      return;
    }

    if (quantity === undefined || quantity === null || Number(quantity) < 0) {
      res.status(400).json({ success: false, message: 'Valid feed quantity (>= 0) is required' });
      return;
    }

    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      res.status(400).json({ success: false, message: 'Feed unit is required' });
      return;
    }

    if (cost !== undefined && cost !== null && Number(cost) < 0) {
      res.status(400).json({ success: false, message: 'Cost cannot be negative' });
      return;
    }

    // Verify animal ownership if an animal ID is provided
    let animalObjectId: mongoose.Types.ObjectId | undefined = undefined;
    if (livestockId && typeof livestockId === 'string' && livestockId.trim() !== '') {
      if (!mongoose.Types.ObjectId.isValid(livestockId)) {
        res.status(400).json({ success: false, message: 'Invalid livestock ID' });
        return;
      }
      const animal = await Livestock.findOne({
        _id: livestockId,
        farmId: req.user!.farmId,
      });
      if (!animal) {
        res.status(404).json({
          success: false,
          message: 'Selected livestock not found or does not belong to your farm',
        });
        return;
      }
      animalObjectId = animal._id as mongoose.Types.ObjectId;
    }

    const feedRecord = new FeedRecord({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      livestockId: animalObjectId,
      group: group ? group.trim() : undefined,
      feedType: feedType.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
      date: date ? new Date(date) : new Date(),
      cost: cost !== undefined && cost !== null ? Number(cost) : 0,
      notes: notes ? notes.trim() : undefined,
    });

    await feedRecord.save();

    const populated = await FeedRecord.findById(feedRecord._id).populate(
      'livestockId',
      'animalId name species breed'
    );

    res.status(201).json({
      success: true,
      message: 'Feed record created successfully',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating feed record',
    });
  }
};

export const updateFeedRecord = async (
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
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const existingRecord = await FeedRecord.findOne({
      _id: id,
      farmId: req.user!.farmId,
    });

    if (!existingRecord) {
      res.status(404).json({ success: false, message: 'Feed record not found' });
      return;
    }

    const { livestockId, group, feedType, quantity, unit, date, cost, notes } = req.body;

    if (feedType !== undefined) {
      if (typeof feedType !== 'string' || feedType.trim() === '') {
        res.status(400).json({ success: false, message: 'Feed type cannot be empty' });
        return;
      }
      existingRecord.feedType = feedType.trim();
    }

    if (quantity !== undefined) {
      if (Number(quantity) < 0) {
        res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
        return;
      }
      existingRecord.quantity = Number(quantity);
    }

    if (unit !== undefined) {
      if (typeof unit !== 'string' || unit.trim() === '') {
        res.status(400).json({ success: false, message: 'Unit cannot be empty' });
        return;
      }
      existingRecord.unit = unit.trim();
    }

    if (cost !== undefined) {
      if (Number(cost) < 0) {
        res.status(400).json({ success: false, message: 'Cost cannot be negative' });
        return;
      }
      existingRecord.cost = Number(cost);
    }

    if (date !== undefined) {
      existingRecord.date = new Date(date);
    }

    if (notes !== undefined) {
      existingRecord.notes = notes ? notes.trim() : undefined;
    }

    if (group !== undefined) {
      existingRecord.group = group ? group.trim() : undefined;
    }

    if (livestockId !== undefined) {
      if (livestockId && typeof livestockId === 'string' && livestockId.trim() !== '') {
        if (!mongoose.Types.ObjectId.isValid(livestockId)) {
          res.status(400).json({ success: false, message: 'Invalid livestock ID' });
          return;
        }
        const animal = await Livestock.findOne({
          _id: livestockId,
          farmId: req.user!.farmId,
        });
        if (!animal) {
          res.status(404).json({
            success: false,
            message: 'Selected livestock not found or does not belong to your farm',
          });
          return;
        }
        existingRecord.livestockId = animal._id as mongoose.Types.ObjectId;
      } else {
        existingRecord.livestockId = undefined;
      }
    }

    await existingRecord.save();

    const populated = await FeedRecord.findById(existingRecord._id).populate(
      'livestockId',
      'animalId name species breed'
    );

    res.status(200).json({
      success: true,
      message: 'Feed record updated successfully',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating feed record',
    });
  }
};

export const deleteFeedRecord = async (
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
      res.status(400).json({ success: false, message: 'Invalid record ID' });
      return;
    }

    const record = await FeedRecord.findOneAndDelete({
      _id: id,
      farmId: req.user!.farmId,
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Feed record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Feed record deleted successfully',
      data: { id: record._id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting feed record',
    });
  }
};
