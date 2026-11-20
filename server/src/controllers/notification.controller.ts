import { Response } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../types/express';
import { syncAutomaticNotifications } from '../services/reminderNotificationSync.service';

export const getNotifications = async (
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

    // Trigger deterministic generation of alerts without duplicates
    await syncAutomaticNotifications(userId, farmId);

    const { unreadOnly, limit = 50 } = req.query;

    const query: any = {
      farmId: new mongoose.Types.ObjectId(farmId),
    };

    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    const unreadCount = await Notification.countDocuments({
      farmId: new mongoose.Types.ObjectId(farmId),
      read: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notifications',
    });
  }
};

export const markAsRead = async (
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
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        farmId: req.user!.farmId,
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    const unreadCount = await Notification.countDocuments({
      farmId: req.user!.farmId,
      read: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      unreadCount,
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating notification',
    });
  }
};

export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    await Notification.updateMany(
      {
        farmId: req.user!.farmId,
        read: false,
      },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating notifications',
    });
  }
};

export const deleteNotification = async (
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
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      farmId: req.user!.farmId,
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    const unreadCount = await Notification.countDocuments({
      farmId: req.user!.farmId,
      read: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      unreadCount,
      data: { id: notification._id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting notification',
    });
  }
};
