import { Response } from 'express';
import mongoose from 'mongoose';
import { Livestock } from '../models/Livestock';
import { HealthRecord } from '../models/HealthRecord';
import { Vaccination } from '../models/Vaccination';
import { BreedingRecord } from '../models/BreedingRecord';
import { MilkRecord } from '../models/MilkRecord';
import { FeedRecord } from '../models/FeedRecord';
import { FinanceRecord } from '../models/FinanceRecord';
import { Reminder } from '../models/Reminder';
import { AuthenticatedRequest } from '../types/express';
import { validateDateRange } from '../utils/dateValidation';

const escapeCsv = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportModuleCsv = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { module } = req.params;
    const { from, to } = req.query;

    const validation = validateDateRange(from, to);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: validation.error });
      return;
    }

    const validModules = ['livestock', 'milk', 'health', 'vaccinations', 'breeding', 'feed', 'finance', 'income', 'expenses', 'reminders'];
    if (!validModules.includes(module)) {
      res.status(400).json({ success: false, message: `Invalid export module: ${module}` });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database service unavailable' });
      return;
    }

    const farmId = new mongoose.Types.ObjectId(req.user!.farmId);
    const dateFilter: any = {};
    if (validation.startDate) dateFilter.$gte = validation.startDate;
    if (validation.endDate) dateFilter.$lte = validation.endDate;

    const matchQuery: any = { farmId };
    if (Object.keys(dateFilter).length > 0) {
      // Different schemas use different date field names
      if (['milk', 'health', 'feed', 'finance', 'income', 'expenses'].includes(module)) {
        matchQuery.date = dateFilter;
      } else if (module === 'vaccinations') {
        matchQuery.vaccinationDate = dateFilter;
      } else if (module === 'breeding') {
        matchQuery.breedingDate = dateFilter;
      } else if (module === 'reminders') {
        matchQuery.dueDate = dateFilter;
      }
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    let fileName = `${module}-report.csv`;

    switch (module) {
      case 'livestock': {
        const records = await Livestock.find({ farmId }).sort({ animalId: 1 }).lean();
        const headers = ['Tag ID', 'Name', 'Species', 'Breed', 'Gender', 'DOB', 'Weight (kg)', 'Color', 'Status', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          csvContent += [
            r.animalId,
            r.name,
            r.species,
            r.breed,
            r.gender,
            r.dateOfBirth ? new Date(r.dateOfBirth).toISOString().split('T')[0] : '',
            r.weight,
            r.color,
            r.status,
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'livestock-inventory-report.csv';
        break;
      }

      case 'milk': {
        const records = await MilkRecord.find(matchQuery)
          .populate('livestockId', 'animalId name species')
          .sort({ date: -1 })
          .lean();
        const headers = ['Date', 'Animal Tag', 'Animal Name', 'Morning (L)', 'Evening (L)', 'Total (L)', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          const a = r.livestockId as any;
          csvContent += [
            r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            a?.animalId || 'Herd',
            a?.name || '',
            r.morningQuantity,
            r.eveningQuantity,
            r.totalQuantity,
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'milk-production-report.csv';
        break;
      }

      case 'health': {
        const records = await HealthRecord.find(matchQuery)
          .populate('livestockId', 'animalId name')
          .sort({ date: -1 })
          .lean();
        const headers = ['Date', 'Animal Tag', 'Diagnosis / Condition', 'Symptoms', 'Treatment', 'Medicine', 'Veterinarian', 'Follow-up Date', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          const a = r.livestockId as any;
          csvContent += [
            r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            a?.animalId || '',
            r.healthCondition,
            r.symptoms,
            r.treatment,
            r.medicine,
            r.veterinarian,
            r.followUpDate ? new Date(r.followUpDate).toISOString().split('T')[0] : '',
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'health-records-report.csv';
        break;
      }

      case 'vaccinations': {
        const records = await Vaccination.find(matchQuery)
          .populate('livestockId', 'animalId name')
          .sort({ vaccinationDate: -1 })
          .lean();
        const headers = ['Vaccination Date', 'Animal Tag', 'Vaccine', 'Dose', 'Next Due Date', 'Veterinarian', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          const a = r.livestockId as any;
          csvContent += [
            r.vaccinationDate ? new Date(r.vaccinationDate).toISOString().split('T')[0] : '',
            a?.animalId || '',
            r.vaccine,
            r.dose,
            r.nextDueDate ? new Date(r.nextDueDate).toISOString().split('T')[0] : '',
            r.veterinarian,
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'vaccination-report.csv';
        break;
      }

      case 'breeding': {
        const records = await BreedingRecord.find(matchQuery)
          .populate('livestockId', 'animalId name')
          .sort({ breedingDate: -1 })
          .lean();
        const headers = ['Breeding Date', 'Animal Tag', 'Method', 'Partner / Sire', 'Pregnancy Status', 'Confirmation Date', 'Expected Delivery Date', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          const a = r.livestockId as any;
          csvContent += [
            r.breedingDate ? new Date(r.breedingDate).toISOString().split('T')[0] : '',
            a?.animalId || '',
            r.method,
            r.partner,
            r.pregnancyStatus,
            r.confirmationDate ? new Date(r.confirmationDate).toISOString().split('T')[0] : '',
            r.expectedDeliveryDate ? new Date(r.expectedDeliveryDate).toISOString().split('T')[0] : '',
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'breeding-report.csv';
        break;
      }

      case 'feed': {
        const records = await FeedRecord.find(matchQuery)
          .populate('livestockId', 'animalId name')
          .sort({ date: -1 })
          .lean();
        const headers = ['Date', 'Animal Tag / Group', 'Feed Type', 'Quantity', 'Unit', 'Cost (₹)', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          const a = r.livestockId as any;
          csvContent += [
            r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            a?.animalId ? `${a.animalId} (${a.name})` : r.group || 'Whole Herd',
            r.feedType,
            r.quantity,
            r.unit,
            r.cost || 0,
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'feed-allocation-report.csv';
        break;
      }

      case 'income': {
        const records = await FinanceRecord.find({ ...matchQuery, type: 'income' })
          .sort({ date: -1 })
          .lean();
        const headers = ['Date', 'Category', 'Description', 'Amount (₹)', 'Payment Method', 'Reference', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          csvContent += [
            r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            r.category,
            r.description,
            r.amount,
            r.paymentMethod || 'Cash',
            r.reference || '',
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'farm-income-report.csv';
        break;
      }

      case 'expenses': {
        const records = await FinanceRecord.find({ ...matchQuery, type: 'expense' })
          .sort({ date: -1 })
          .lean();
        const headers = ['Date', 'Category', 'Description', 'Amount (₹)', 'Payment Method', 'Reference', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          csvContent += [
            r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            r.category,
            r.description,
            r.amount,
            r.paymentMethod || 'Cash',
            r.reference || '',
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'farm-expenses-report.csv';
        break;
      }

      case 'finance': {
        const records = await FinanceRecord.find(matchQuery).sort({ date: -1 }).lean();
        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (₹)', 'Payment Method', 'Reference'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          csvContent += [
            r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            r.type.toUpperCase(),
            r.category,
            r.description,
            r.type === 'income' ? `+${r.amount}` : `-${r.amount}`,
            r.paymentMethod || 'Cash',
            r.reference || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'farm-financial-ledger.csv';
        break;
      }

      case 'reminders': {
        const records = await Reminder.find(matchQuery)
          .populate('relatedLivestockId', 'animalId name')
          .sort({ dueDate: 1 })
          .lean();
        const headers = ['Due Date', 'Due Time', 'Title', 'Type', 'Priority', 'Status', 'Linked Animal', 'Description', 'Notes'];
        csvContent += headers.map(escapeCsv).join(',') + '\n';
        records.forEach((r) => {
          const a = r.relatedLivestockId as any;
          csvContent += [
            r.dueDate ? new Date(r.dueDate).toISOString().split('T')[0] : '',
            r.dueTime || '',
            r.title,
            r.type,
            r.priority,
            r.status,
            a?.animalId ? `${a.animalId} (${a.name})` : '',
            r.description || '',
            r.notes || '',
          ].map(escapeCsv).join(',') + '\n';
        });
        fileName = 'farm-reminders-schedule.csv';
        break;
      }

      default:
        res.status(400).json({ success: false, message: `Unknown report module: ${module}` });
        return;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating CSV report',
    });
  }
};
