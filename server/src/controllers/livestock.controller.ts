import { Response } from 'express';
import mongoose from 'mongoose';
import { Livestock, ILivestock } from '../models/Livestock';
import { HealthRecord } from '../models/HealthRecord';
import { Vaccination } from '../models/Vaccination';
import { BreedingRecord } from '../models/BreedingRecord';
import { MilkRecord } from '../models/MilkRecord';
import { AuthenticatedRequest } from '../types/express';

// Helper to calculate age in human-readable format
export const calculateAge = (dob: Date): { years: number; months: number; text: string } => {
  const now = new Date();
  const birth = new Date(dob);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);

  let text = '';
  if (years > 0 && months > 0) {
    text = `${years}y ${months}m`;
  } else if (years > 0) {
    text = `${years} ${years === 1 ? 'year' : 'years'}`;
  } else {
    text = `${months} ${months === 1 ? 'month' : 'months'}`;
  }

  return { years, months, text };
};

export const getLivestockList = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable',
      });
      return;
    }

    const { search, species, status, gender, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Strict user & farm scoping
    const query: any = {
      userId: req.user!.id,
      farmId: req.user!.farmId,
    };

    if (species && species !== 'all') {
      query.species = species;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (gender && gender !== 'all') {
      query.gender = gender;
    }

    if (search && typeof search === 'string') {
      const term = search.trim();
      query.$or = [
        { animalId: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { breed: { $regex: term, $options: 'i' } },
      ];
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const animals = await Livestock.find(query).sort(sortOptions).lean();

    const formatted = animals.map((animal) => ({
      ...animal,
      calculatedAge: calculateAge(animal.dateOfBirth),
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching livestock records',
    });
  }
};

export const getLivestockById = async (
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
      res.status(400).json({ success: false, message: 'Invalid animal ID format' });
      return;
    }

    // Strict multi-tenant query
    const animal = await Livestock.findOne({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    }).lean();

    if (!animal) {
      res.status(404).json({ success: false, message: 'Livestock not found or access denied' });
      return;
    }

    // Retrieve related records exclusively for this animal within this farm
    const [healthRecords, vaccinations, breedingRecords, milkRecords] = await Promise.all([
      HealthRecord.find({
        livestockId: animal._id,
        farmId: req.user!.farmId,
      })
        .sort({ date: -1 })
        .limit(10)
        .lean(),
      Vaccination.find({
        livestockId: animal._id,
        farmId: req.user!.farmId,
      })
        .sort({ vaccinationDate: -1 })
        .limit(10)
        .lean(),
      BreedingRecord.find({
        livestockId: animal._id,
        farmId: req.user!.farmId,
      })
        .sort({ breedingDate: -1 })
        .limit(10)
        .lean(),
      MilkRecord.find({
        livestockId: animal._id,
        farmId: req.user!.farmId,
      })
        .sort({ date: -1 })
        .limit(10)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...animal,
        calculatedAge: calculateAge(animal.dateOfBirth),
        recentHealth: healthRecords,
        recentVaccinations: vaccinations,
        recentBreeding: breedingRecords,
        recentMilk: milkRecords,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching livestock details',
    });
  }
};

export const createLivestock = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      animalId,
      name,
      species,
      breed,
      gender,
      dateOfBirth,
      weight,
      color,
      purchaseDate,
      purchasePrice,
      source = 'Born on Farm',
      status = 'Healthy',
      photo,
      notes,
    } = req.body;

    // Field Validations
    if (!animalId || !name || !species || !breed || !gender || !dateOfBirth || weight === undefined || !color) {
      res.status(400).json({
        success: false,
        message: 'Required fields: animalId, name, species, breed, gender, dateOfBirth, weight, color',
      });
      return;
    }

    if (Number(weight) < 0) {
      res.status(400).json({ success: false, message: 'Weight cannot be negative' });
      return;
    }

    if (purchasePrice !== undefined && Number(purchasePrice) < 0) {
      res.status(400).json({ success: false, message: 'Purchase price cannot be negative' });
      return;
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid dateOfBirth' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    // Check duplicate animal tag/ID within this farm
    const duplicate = await Livestock.findOne({
      farmId: req.user!.farmId,
      animalId: animalId.trim(),
    });

    if (duplicate) {
      res.status(409).json({
        success: false,
        message: `Animal with ID/Tag "${animalId}" already exists in your farm`,
      });
      return;
    }

    const newAnimal = await Livestock.create({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      animalId: animalId.trim(),
      name: name.trim(),
      species,
      breed: breed.trim(),
      gender,
      dateOfBirth: dob,
      weight: Number(weight),
      color: color.trim(),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      purchasePrice: purchasePrice !== undefined ? Number(purchasePrice) : undefined,
      source: source.trim(),
      status,
      photo: photo || '',
      notes: notes ? notes.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Livestock record added successfully',
      data: {
        ...newAnimal.toObject(),
        calculatedAge: calculateAge(newAnimal.dateOfBirth),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating livestock record',
    });
  }
};

export const updateLivestock = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid animal ID format' });
      return;
    }

    const {
      animalId,
      name,
      species,
      breed,
      gender,
      dateOfBirth,
      weight,
      color,
      purchaseDate,
      purchasePrice,
      source,
      status,
      photo,
      notes,
    } = req.body;

    if (weight !== undefined && Number(weight) < 0) {
      res.status(400).json({ success: false, message: 'Weight cannot be negative' });
      return;
    }

    if (purchasePrice !== undefined && Number(purchasePrice) < 0) {
      res.status(400).json({ success: false, message: 'Purchase price cannot be negative' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    // Verify animal tag uniqueness if changed
    if (animalId) {
      const duplicate = await Livestock.findOne({
        _id: { $ne: id },
        farmId: req.user!.farmId,
        animalId: animalId.trim(),
      });
      if (duplicate) {
        res.status(409).json({
          success: false,
          message: `Another animal already has Tag/ID "${animalId}"`,
        });
        return;
      }
    }

    const updated = await Livestock.findOneAndUpdate(
      {
        _id: id,
        userId: req.user!.id,
        farmId: req.user!.farmId,
      },
      {
        ...(animalId && { animalId: animalId.trim() }),
        ...(name && { name: name.trim() }),
        ...(species && { species }),
        ...(breed && { breed: breed.trim() }),
        ...(gender && { gender }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(weight !== undefined && { weight: Number(weight) }),
        ...(color && { color: color.trim() }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined }),
        ...(purchasePrice !== undefined && { purchasePrice: Number(purchasePrice) }),
        ...(source && { source: source.trim() }),
        ...(status && { status }),
        ...(photo !== undefined && { photo }),
        ...(notes !== undefined && { notes: notes.trim() }),
      },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Animal not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Livestock updated successfully',
      data: {
        ...updated.toObject(),
        calculatedAge: calculateAge(updated.dateOfBirth),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating livestock record',
    });
  }
};

export const deleteLivestock = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid animal ID format' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    // Strict multi-tenant query
    const deleted = await Livestock.findOneAndDelete({
      _id: id,
      userId: req.user!.id,
      farmId: req.user!.farmId,
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Animal not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Animal "${deleted.name}" (${deleted.animalId}) deleted successfully`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting livestock record',
    });
  }
};
