import { Response } from 'express';
import mongoose from 'mongoose';
import { BreedingRecord } from '../models/BreedingRecord';
import { Livestock } from '../models/Livestock';
import { AuthenticatedRequest } from '../types/express';

// Helper to calculate gestation period by species
export const estimateDeliveryDate = (breedingDate: Date, species?: string): Date => {
  const delivery = new Date(breedingDate);
  let gestationDays = 283; // Default bovine/cattle gestation

  if (species) {
    const s = species.toLowerCase();
    if (s.includes('buffalo')) {
      gestationDays = 310;
    } else if (s.includes('goat') || s.includes('sheep')) {
      gestationDays = 150;
    } else if (s.includes('cow')) {
      gestationDays = 283;
    }
  }

  delivery.setDate(delivery.getDate() + gestationDays);
  return delivery;
};

export const getBreedingRecords = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { pregnancyStatus, livestockId, startDate, endDate } = req.query;

    const query: any = {
      userId: req.user!.id,
      farmId: req.user!.farmId,
    };

    if (pregnancyStatus && pregnancyStatus !== 'all') {
      query.pregnancyStatus = pregnancyStatus;
    }

    if (livestockId && mongoose.Types.ObjectId.isValid(livestockId as string)) {
      query.livestockId = livestockId;
    }

    if (startDate || endDate) {
      query.breedingDate = {};
      if (startDate) query.breedingDate.$gte = new Date(startDate as string);
      if (endDate) query.breedingDate.$lte = new Date(endDate as string);
    }

    const records = await BreedingRecord.find(query)
      .populate('livestockId', 'animalId name species breed gender')
      .sort({ breedingDate: -1 })
      .lean();

    // Summary calculations
    const pregnantCount = records.filter(
      (r) => r.pregnancyStatus === 'Confirmed Pregnant' || r.pregnancyStatus === 'Pregnant'
    ).length;

    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const upcomingDeliveries = records.filter((r) => {
      if (!r.expectedDeliveryDate || r.actualDeliveryDate) return false;
      const d = new Date(r.expectedDeliveryDate);
      return d >= now && d <= thirtyDaysLater;
    });

    res.status(200).json({
      success: true,
      count: records.length,
      summary: {
        total: records.length,
        pregnantCount,
        upcomingDeliveriesCount: upcomingDeliveries.length,
      },
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching breeding records',
    });
  }
};

export const getBreedingRecordById = async (
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
      res.status(400).json({ success: false, message: 'Invalid breeding record ID format' });
      return;
    }

    const record = await BreedingRecord.findOne({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    })
      .populate('livestockId', 'animalId name species breed gender')
      .lean();

    if (!record) {
      res.status(404).json({ success: false, message: 'Breeding record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching breeding record',
    });
  }
};

export const createBreedingRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      livestockId,
      breedingDate,
      method,
      partner,
      pregnancyStatus = 'Pending Check',
      confirmationDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      notes,
    } = req.body;

    if (!livestockId || !breedingDate || !method || !partner) {
      res.status(400).json({
        success: false,
        message: 'Required fields: livestockId, breedingDate, method, partner',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(livestockId)) {
      res.status(400).json({ success: false, message: 'Invalid livestock ID' });
      return;
    }

    const bDate = new Date(breedingDate);
    if (isNaN(bDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid breeding date' });
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
      res.status(404).json({ success: false, message: 'Livestock not found in your farm' });
      return;
    }

    // Auto-calculate expectedDeliveryDate if not supplied
    let computedDelivery = expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined;
    if (!computedDelivery) {
      computedDelivery = estimateDeliveryDate(bDate, animal.species);
    }

    const record = await BreedingRecord.create({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      livestockId,
      breedingDate: bDate,
      method,
      partner: partner.trim(),
      pregnancyStatus,
      confirmationDate: confirmationDate ? new Date(confirmationDate) : undefined,
      expectedDeliveryDate: computedDelivery,
      actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : undefined,
      notes: notes ? notes.trim() : '',
    });

    // If confirmed pregnant, update animal status to 'Pregnant'
    if (pregnancyStatus === 'Confirmed Pregnant' || pregnancyStatus === 'Pregnant') {
      await Livestock.findByIdAndUpdate(livestockId, { status: 'Pregnant' });
    }

    const populated = await BreedingRecord.findById(record._id)
      .populate('livestockId', 'animalId name species breed gender')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Breeding record registered successfully',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating breeding record',
    });
  }
};

export const updateBreedingRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid breeding record ID format' });
      return;
    }

    const {
      livestockId,
      breedingDate,
      method,
      partner,
      pregnancyStatus,
      confirmationDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      notes,
    } = req.body;

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    if (livestockId) {
      const animal = await Livestock.findOne({
        _id: livestockId,
        userId: req.user!.id,
        farmId: req.user!.farmId,
      });
      if (!animal) {
        res.status(404).json({ success: false, message: 'Referenced livestock not found in your farm' });
        return;
      }
    }

    const updated = await BreedingRecord.findOneAndUpdate(
      {
        _id: id,
        userId: req.user!.id,
        farmId: req.user!.farmId,
      },
      {
        ...(livestockId && { livestockId }),
        ...(breedingDate && { breedingDate: new Date(breedingDate) }),
        ...(method && { method }),
        ...(partner && { partner: partner.trim() }),
        ...(pregnancyStatus && { pregnancyStatus }),
        ...(confirmationDate !== undefined && { confirmationDate: confirmationDate ? new Date(confirmationDate) : undefined }),
        ...(expectedDeliveryDate !== undefined && { expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined }),
        ...(actualDeliveryDate !== undefined && { actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : undefined }),
        ...(notes !== undefined && { notes: notes.trim() }),
      },
      { new: true }
    ).populate('livestockId', 'animalId name species breed gender');

    if (!updated) {
      res.status(404).json({ success: false, message: 'Breeding record not found or unauthorized' });
      return;
    }

    // Auto-update animal status based on pregnancy transition
    if (pregnancyStatus === 'Confirmed Pregnant' || pregnancyStatus === 'Pregnant') {
      await Livestock.findByIdAndUpdate(updated.livestockId, { status: 'Pregnant' });
    } else if (pregnancyStatus === 'Delivered') {
      await Livestock.findByIdAndUpdate(updated.livestockId, { status: 'Lactating' });
    }

    res.status(200).json({
      success: true,
      message: 'Breeding record updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating breeding record',
    });
  }
};

export const deleteBreedingRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid breeding record ID format' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const deleted = await BreedingRecord.findOneAndDelete({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Breeding record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Breeding record deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting breeding record',
    });
  }
};
