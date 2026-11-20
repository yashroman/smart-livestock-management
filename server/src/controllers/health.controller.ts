import { Response } from 'express';
import mongoose from 'mongoose';
import { HealthRecord } from '../models/HealthRecord';
import { Livestock } from '../models/Livestock';
import { AuthenticatedRequest } from '../types/express';

export const getHealthRecords = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { livestockId, search, startDate, endDate } = req.query;

    const query: any = {
      userId: req.user!.id,
      farmId: req.user!.farmId,
    };

    if (livestockId && mongoose.Types.ObjectId.isValid(livestockId as string)) {
      query.livestockId = livestockId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (search && typeof search === 'string') {
      const term = search.trim();
      query.$or = [
        { symptoms: { $regex: term, $options: 'i' } },
        { healthCondition: { $regex: term, $options: 'i' } },
        { treatment: { $regex: term, $options: 'i' } },
        { medicine: { $regex: term, $options: 'i' } },
        { veterinarian: { $regex: term, $options: 'i' } },
      ];
    }

    const records = await HealthRecord.find(query)
      .populate('livestockId', 'animalId name species breed')
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching health records',
    });
  }
};

export const getHealthRecordById = async (
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
      res.status(400).json({ success: false, message: 'Invalid health record ID' });
      return;
    }

    const record = await HealthRecord.findOne({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    })
      .populate('livestockId', 'animalId name species breed')
      .lean();

    if (!record) {
      res.status(404).json({ success: false, message: 'Health record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching health record',
    });
  }
};

export const createHealthRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      livestockId,
      date,
      symptoms,
      healthCondition,
      temperature,
      treatment,
      medicine,
      dosage,
      veterinarian,
      followUpDate,
      notes,
    } = req.body;

    // Validations
    if (
      !livestockId ||
      !symptoms ||
      !healthCondition ||
      !treatment ||
      !medicine ||
      !dosage ||
      !veterinarian
    ) {
      res.status(400).json({
        success: false,
        message: 'Required fields: livestockId, symptoms, healthCondition, treatment, medicine, dosage, veterinarian',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(livestockId)) {
      res.status(400).json({ success: false, message: 'Invalid animal ID' });
      return;
    }

    if (temperature !== undefined && (Number(temperature) < 80 || Number(temperature) > 120)) {
      res.status(400).json({ success: false, message: 'Temperature (°F) must be between 80 and 120' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    // Verify livestock belongs to this user & farm
    const animal = await Livestock.findOne({
      _id: livestockId,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!animal) {
      res.status(404).json({
        success: false,
        message: 'Associated animal not found in your farm',
      });
      return;
    }

    const record = await HealthRecord.create({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      livestockId,
      date: date ? new Date(date) : new Date(),
      symptoms: symptoms.trim(),
      healthCondition: healthCondition.trim(),
      temperature: temperature !== undefined ? Number(temperature) : undefined,
      treatment: treatment.trim(),
      medicine: medicine.trim(),
      dosage: dosage.trim(),
      veterinarian: veterinarian.trim(),
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      notes: notes ? notes.trim() : '',
    });

    const populated = await HealthRecord.findById(record._id)
      .populate('livestockId', 'animalId name species breed')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Health record added successfully',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating health record',
    });
  }
};

export const updateHealthRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid health record ID' });
      return;
    }

    const {
      livestockId,
      date,
      symptoms,
      healthCondition,
      temperature,
      treatment,
      medicine,
      dosage,
      veterinarian,
      followUpDate,
      notes,
    } = req.body;

    if (temperature !== undefined && (Number(temperature) < 80 || Number(temperature) > 120)) {
      res.status(400).json({ success: false, message: 'Temperature (°F) must be between 80 and 120' });
      return;
    }

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

    const updated = await HealthRecord.findOneAndUpdate(
      {
        _id: id,
        userId: req.user!.id,
        farmId: req.user!.farmId,
      },
      {
        ...(livestockId && { livestockId }),
        ...(date && { date: new Date(date) }),
        ...(symptoms && { symptoms: symptoms.trim() }),
        ...(healthCondition && { healthCondition: healthCondition.trim() }),
        ...(temperature !== undefined && { temperature: Number(temperature) }),
        ...(treatment && { treatment: treatment.trim() }),
        ...(medicine && { medicine: medicine.trim() }),
        ...(dosage && { dosage: dosage.trim() }),
        ...(veterinarian && { veterinarian: veterinarian.trim() }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : undefined }),
        ...(notes !== undefined && { notes: notes.trim() }),
      },
      { new: true }
    ).populate('livestockId', 'animalId name species breed');

    if (!updated) {
      res.status(404).json({ success: false, message: 'Health record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Health record updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating health record',
    });
  }
};

export const deleteHealthRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid health record ID' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const deleted = await HealthRecord.findOneAndDelete({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Health record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Health record deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting health record',
    });
  }
};
