import { Response } from 'express';
import mongoose from 'mongoose';
import { Vaccination, IVaccination } from '../models/Vaccination';
import { Livestock } from '../models/Livestock';
import { AuthenticatedRequest } from '../types/express';

// Automatic Vaccination Status Calculator
export const computeVaccinationStatus = (nextDueDate: Date): 'Overdue' | 'Due Soon' | 'Completed' => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(nextDueDate);
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  if (due < today) {
    return 'Overdue';
  } else if (due <= sevenDaysLater) {
    return 'Due Soon';
  } else {
    return 'Completed';
  }
};

export const getVaccinations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const { status, livestockId, startDate, endDate, search } = req.query;

    const query: any = {
      userId: req.user!.id,
      farmId: req.user!.farmId,
    };

    if (livestockId && mongoose.Types.ObjectId.isValid(livestockId as string)) {
      query.livestockId = livestockId;
    }

    if (startDate || endDate) {
      query.vaccinationDate = {};
      if (startDate) query.vaccinationDate.$gte = new Date(startDate as string);
      if (endDate) query.vaccinationDate.$lte = new Date(endDate as string);
    }

    if (search && typeof search === 'string') {
      const term = search.trim();
      query.$or = [
        { vaccine: { $regex: term, $options: 'i' } },
        { veterinarian: { $regex: term, $options: 'i' } },
      ];
    }

    const records = await Vaccination.find(query)
      .populate('livestockId', 'animalId name species breed')
      .sort({ nextDueDate: 1 })
      .lean();

    // Dynamically assign real calculated status
    let formatted = records.map((rec) => {
      const calculatedStatus = computeVaccinationStatus(rec.nextDueDate);
      return {
        ...rec,
        status: calculatedStatus,
      };
    });

    // Filter by calculated status if requested
    if (status && status !== 'all') {
      formatted = formatted.filter(
        (rec) => rec.status.toLowerCase() === (status as string).toLowerCase()
      );
    }

    // Summary counts for quick tab display
    const allRecords = records.map((r) => computeVaccinationStatus(r.nextDueDate));
    const summary = {
      total: allRecords.length,
      completed: allRecords.filter((s) => s === 'Completed').length,
      dueSoon: allRecords.filter((s) => s === 'Due Soon').length,
      overdue: allRecords.filter((s) => s === 'Overdue').length,
    };

    res.status(200).json({
      success: true,
      count: formatted.length,
      summary,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching vaccinations',
    });
  }
};

export const getVaccinationById = async (
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
      res.status(400).json({ success: false, message: 'Invalid vaccination ID format' });
      return;
    }

    const record = await Vaccination.findOne({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    })
      .populate('livestockId', 'animalId name species breed')
      .lean();

    if (!record) {
      res.status(404).json({ success: false, message: 'Vaccination record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...record,
        status: computeVaccinationStatus(record.nextDueDate),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching vaccination record',
    });
  }
};

export const createVaccination = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      livestockId,
      vaccine,
      vaccinationDate,
      nextDueDate,
      dose,
      veterinarian,
      notes,
    } = req.body;

    if (!livestockId || !vaccine || !vaccinationDate || !nextDueDate || !dose || !veterinarian) {
      res.status(400).json({
        success: false,
        message: 'Required fields: livestockId, vaccine, vaccinationDate, nextDueDate, dose, veterinarian',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(livestockId)) {
      res.status(400).json({ success: false, message: 'Invalid animal ID' });
      return;
    }

    const vDate = new Date(vaccinationDate);
    const nDate = new Date(nextDueDate);

    if (isNaN(vDate.getTime()) || isNaN(nDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    if (nDate < vDate) {
      res.status(400).json({ success: false, message: 'Next due date must be on or after vaccination date' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    // Verify animal belongs to user's farm
    const animal = await Livestock.findOne({
      _id: livestockId,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!animal) {
      res.status(404).json({ success: false, message: 'Referenced livestock not found in your farm' });
      return;
    }

    const record = await Vaccination.create({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      livestockId,
      vaccine: vaccine.trim(),
      vaccinationDate: vDate,
      nextDueDate: nDate,
      dose: dose.trim(),
      veterinarian: veterinarian.trim(),
      notes: notes ? notes.trim() : '',
    });

    const populated = await Vaccination.findById(record._id)
      .populate('livestockId', 'animalId name species breed')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Vaccination scheduled successfully',
      data: {
        ...populated,
        status: computeVaccinationStatus(record.nextDueDate),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating vaccination record',
    });
  }
};

export const updateVaccination = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid vaccination ID format' });
      return;
    }

    const {
      livestockId,
      vaccine,
      vaccinationDate,
      nextDueDate,
      dose,
      veterinarian,
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

    const updated = await Vaccination.findOneAndUpdate(
      {
        _id: id,
        userId: req.user!.id,
        farmId: req.user!.farmId,
      },
      {
        ...(livestockId && { livestockId }),
        ...(vaccine && { vaccine: vaccine.trim() }),
        ...(vaccinationDate && { vaccinationDate: new Date(vaccinationDate) }),
        ...(nextDueDate && { nextDueDate: new Date(nextDueDate) }),
        ...(dose && { dose: dose.trim() }),
        ...(veterinarian && { veterinarian: veterinarian.trim() }),
        ...(notes !== undefined && { notes: notes.trim() }),
      },
      { new: true }
    ).populate('livestockId', 'animalId name species breed');

    if (!updated) {
      res.status(404).json({ success: false, message: 'Vaccination record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Vaccination updated successfully',
      data: {
        ...updated.toObject(),
        status: computeVaccinationStatus(updated.nextDueDate),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating vaccination record',
    });
  }
};

export const deleteVaccination = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid vaccination ID format' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const deleted = await Vaccination.findOneAndDelete({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Vaccination record not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Vaccination record deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting vaccination record',
    });
  }
};
