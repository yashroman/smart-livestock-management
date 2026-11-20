import { Response } from 'express';
import mongoose from 'mongoose';
import { Reminder } from '../models/Reminder';
import { Livestock } from '../models/Livestock';
import { AuthenticatedRequest } from '../types/express';
import { syncAutomaticReminders } from '../services/reminderNotificationSync.service';

export const getReminders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const userId = req.user!.id;
    const farmId = req.user!.farmId;

    // Trigger deterministic auto-generation of reminders from vaccines, breeding, and health records
    await syncAutomaticReminders(userId, farmId);

    const { status, type, priority, tab, search, startDate, endDate } = req.query;

    const query: any = {
      farmId: new mongoose.Types.ObjectId(farmId),
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (tab === 'overdue') {
      query.status = 'Pending';
      query.dueDate = { $lt: todayStart };
    } else if (tab === 'today') {
      query.dueDate = { $gte: todayStart, $lte: todayEnd };
    } else if (tab === 'upcoming') {
      query.status = 'Pending';
      query.dueDate = { $gt: todayEnd };
    } else if (tab === 'completed') {
      query.status = 'Completed';
    } else if (status && typeof status === 'string' && status.trim() !== '') {
      query.status = status.trim();
    }

    if (type && typeof type === 'string' && type.trim() !== '') {
      query.type = type.trim();
    }

    if (priority && typeof priority === 'string' && priority.trim() !== '') {
      query.priority = priority.trim();
    }

    if (startDate || endDate) {
      query.dueDate = query.dueDate || {};
      if (startDate) query.dueDate.$gte = new Date(startDate as string);
      if (endDate) {
        const eDate = new Date(endDate as string);
        eDate.setHours(23, 59, 59, 999);
        query.dueDate.$lte = eDate;
      }
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { type: searchRegex },
        { notes: searchRegex },
      ];
    }

    const reminders = await Reminder.find(query)
      .populate('relatedLivestockId', 'animalId name species breed')
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    // Summary counts for tabs and dashboard
    const [pendingCount, completedCount, overdueCount, todayCount] = await Promise.all([
      Reminder.countDocuments({ farmId, status: 'Pending' }),
      Reminder.countDocuments({ farmId, status: 'Completed' }),
      Reminder.countDocuments({ farmId, status: 'Pending', dueDate: { $lt: todayStart } }),
      Reminder.countDocuments({ farmId, dueDate: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    res.status(200).json({
      success: true,
      count: reminders.length,
      counts: {
        pending: pendingCount,
        completed: completedCount,
        overdue: overdueCount,
        today: todayCount,
      },
      data: reminders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching reminders',
    });
  }
};

export const getUpcomingReminders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = req.user!.farmId;
    const now = new Date();

    const reminders = await Reminder.find({
      farmId,
      status: 'Pending',
      dueDate: { $gte: now },
    })
      .populate('relatedLivestockId', 'animalId name species breed')
      .sort({ dueDate: 1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching upcoming reminders',
    });
  }
};

export const getOverdueReminders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = req.user!.farmId;
    const now = new Date();

    const reminders = await Reminder.find({
      farmId,
      status: 'Pending',
      dueDate: { $lt: now },
    })
      .populate('relatedLivestockId', 'animalId name species breed')
      .sort({ dueDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching overdue reminders',
    });
  }
};

export const getReminderById = async (
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
      res.status(400).json({ success: false, message: 'Invalid reminder ID' });
      return;
    }

    const reminder = await Reminder.findOne({
      _id: id,
      farmId: req.user!.farmId,
    }).populate('relatedLivestockId', 'animalId name species breed');

    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found' });
      return;
    }

    res.status(200).json({ success: true, data: reminder });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching reminder',
    });
  }
};

export const createReminder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const {
      title,
      type,
      description,
      dueDate,
      dueTime,
      relatedLivestockId,
      priority,
      status,
      notes,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ success: false, message: 'Reminder title is required' });
      return;
    }

    if (!dueDate) {
      res.status(400).json({ success: false, message: 'Due date is required' });
      return;
    }

    let animalObjId: mongoose.Types.ObjectId | undefined = undefined;
    if (relatedLivestockId && typeof relatedLivestockId === 'string' && relatedLivestockId.trim() !== '') {
      if (!mongoose.Types.ObjectId.isValid(relatedLivestockId)) {
        res.status(400).json({ success: false, message: 'Invalid livestock ID' });
        return;
      }
      const animal = await Livestock.findOne({
        _id: relatedLivestockId,
        farmId: req.user!.farmId,
      });
      if (!animal) {
        res.status(404).json({
          success: false,
          message: 'Related animal not found or does not belong to your farm',
        });
        return;
      }
      animalObjId = animal._id as mongoose.Types.ObjectId;
    }

    const reminder = new Reminder({
      userId: req.user!.id,
      farmId: req.user!.farmId,
      title: title.trim(),
      type: type ? type.trim() : 'Other',
      description: description ? description.trim() : undefined,
      dueDate: new Date(dueDate),
      dueTime: dueTime ? dueTime.trim() : undefined,
      relatedLivestockId: animalObjId,
      priority: priority && ['Low', 'Medium', 'High', 'Urgent'].includes(priority) ? priority : 'Medium',
      status: status && ['Pending', 'Completed', 'Cancelled'].includes(status) ? status : 'Pending',
      notes: notes ? notes.trim() : undefined,
    });

    await reminder.save();

    const populated = await Reminder.findById(reminder._id).populate(
      'relatedLivestockId',
      'animalId name species breed'
    );

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating reminder',
    });
  }
};

export const updateReminder = async (
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
      res.status(400).json({ success: false, message: 'Invalid reminder ID' });
      return;
    }

    const reminder = await Reminder.findOne({
      _id: id,
      farmId: req.user!.farmId,
    });

    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found' });
      return;
    }

    const {
      title,
      type,
      description,
      dueDate,
      dueTime,
      relatedLivestockId,
      priority,
      status,
      notes,
    } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ success: false, message: 'Title cannot be empty' });
        return;
      }
      reminder.title = title.trim();
    }

    if (dueDate !== undefined) reminder.dueDate = new Date(dueDate);
    if (type !== undefined) reminder.type = type.trim();
    if (description !== undefined) reminder.description = description ? description.trim() : undefined;
    if (dueTime !== undefined) reminder.dueTime = dueTime ? dueTime.trim() : undefined;
    if (priority !== undefined && ['Low', 'Medium', 'High', 'Urgent'].includes(priority)) {
      reminder.priority = priority;
    }
    if (status !== undefined && ['Pending', 'Completed', 'Cancelled'].includes(status)) {
      reminder.status = status;
    }
    if (notes !== undefined) reminder.notes = notes ? notes.trim() : undefined;

    if (relatedLivestockId !== undefined) {
      if (relatedLivestockId && typeof relatedLivestockId === 'string' && relatedLivestockId.trim() !== '') {
        if (!mongoose.Types.ObjectId.isValid(relatedLivestockId)) {
          res.status(400).json({ success: false, message: 'Invalid livestock ID' });
          return;
        }
        const animal = await Livestock.findOne({
          _id: relatedLivestockId,
          farmId: req.user!.farmId,
        });
        if (!animal) {
          res.status(404).json({
            success: false,
            message: 'Related animal not found or does not belong to your farm',
          });
          return;
        }
        reminder.relatedLivestockId = animal._id as mongoose.Types.ObjectId;
      } else {
        reminder.relatedLivestockId = undefined;
      }
    }

    await reminder.save();

    const populated = await Reminder.findById(reminder._id).populate(
      'relatedLivestockId',
      'animalId name species breed'
    );

    res.status(200).json({
      success: true,
      message: 'Reminder updated successfully',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating reminder',
    });
  }
};

export const completeReminder = async (
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
      res.status(400).json({ success: false, message: 'Invalid reminder ID' });
      return;
    }

    const reminder = await Reminder.findOne({
      _id: id,
      farmId: req.user!.farmId,
    });

    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found' });
      return;
    }

    // Toggle or explicitly mark as Completed
    reminder.status = reminder.status === 'Completed' ? 'Pending' : 'Completed';
    await reminder.save();

    res.status(200).json({
      success: true,
      message: `Reminder marked as ${reminder.status.toLowerCase()}`,
      data: reminder,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating reminder status',
    });
  }
};

export const deleteReminder = async (
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
      res.status(400).json({ success: false, message: 'Invalid reminder ID' });
      return;
    }

    const reminder = await Reminder.findOneAndDelete({
      _id: id,
      farmId: req.user!.farmId,
    });

    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully',
      data: { id: reminder._id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting reminder',
    });
  }
};
