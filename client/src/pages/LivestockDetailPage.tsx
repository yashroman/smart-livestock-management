import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LivestockDetailData,
  getLivestockByIdApi,
  updateLivestockApi,
  deleteLivestockApi,
} from '../api/livestock.api';
import { useLanguage } from '../context/LanguageContext';
import { createHealthRecordApi } from '../api/health.api';
import { createVaccinationApi } from '../api/vaccination.api';
import { createBreedingRecordApi } from '../api/breeding.api';
import { createMilkRecordApi } from '../api/milk.api';
import { AnimalModal } from '../components/livestock/AnimalModal';
import { HealthRecordModal } from '../components/health/HealthRecordModal';
import { VaccinationModal } from '../components/vaccination/VaccinationModal';
import { BreedingModal } from '../components/breeding/BreedingModal';
import { MilkRecordModal } from '../components/milk/MilkRecordModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  ArrowLeft,
  HeartPulse,
  Syringe,
  GitBranch,
  Milk,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
} from 'lucide-react';

export const LivestockDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, formatDate, formatCurrency } = useLanguage();

  const [animalData, setAnimalData] = useState<LivestockDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'vaccine' | 'breeding' | 'milk'>('overview');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [isBreedingModalOpen, setIsBreedingModalOpen] = useState(false);
  const [isMilkModalOpen, setIsMilkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnimal = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLivestockByIdApi(id);
      if (res.success) {
        setAnimalData(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('errors.somethingWentWrong', 'Error loading animal details'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchAnimal();
  }, [fetchAnimal]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <RefreshCw className="w-8 h-8 text-farm-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">{t('common.loading', 'Loading animal profile...')}</p>
      </div>
    );
  }

  if (error || !animalData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{t('errors.notFound', 'Animal Record Not Found')}</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          {error || t('errors.somethingWentWrong', 'The requested animal does not exist or you do not have permission to view it.')}
        </p>
        <button onClick={() => navigate('/livestock')} className="farm-btn-secondary text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>{t('common.back', 'Back to Herd List')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/livestock')}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title={t('common.back', 'Back')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {animalData.animalId}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {animalData.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              {animalData.species} • {animalData.breed} • {animalData.gender}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="farm-btn-secondary text-xs"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('livestock.editAnimal', 'Edit Profile')}</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-xs font-medium border border-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('common.delete', 'Delete Animal')}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Photo & Quick Tag */}
          <div className="md:col-span-1 flex flex-col items-center text-center">
            {animalData.photo ? (
              <img
                src={animalData.photo}
                alt={animalData.name}
                className="w-36 h-36 object-cover rounded-xl border border-slate-200 shadow-xs mb-3"
              />
            ) : (
              <div className="w-36 h-36 bg-farm-50 text-farm-700 rounded-xl border border-farm-200 flex flex-col items-center justify-center p-3 mb-3">
                <span className="text-3xl font-bold font-mono text-farm-800">
                  {animalData.animalId}
                </span>
                <span className="text-xs text-farm-600 mt-1">{animalData.species}</span>
              </div>
            )}
            <span
              className={`farm-badge border text-xs px-3 py-1 ${
                animalData.status === 'Healthy'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : animalData.status === 'Needs Attention' || animalData.status === 'Sick'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {animalData.status}
            </span>
          </div>

          {/* Core Physiological Parameters */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">{t('livestock.age', 'Calculated Age')}</span>
              <span className="text-sm font-bold text-slate-900">
                {animalData.calculatedAge?.text || 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {t('livestock.dateOfBirth', 'DOB')}: {formatDate(animalData.dateOfBirth)}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">{t('livestock.weight', 'Weight')}</span>
              <span className="text-sm font-bold text-slate-900">
                {animalData.weight} kg
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Live scale measurement</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">{t('livestock.color', 'Color / Markings')}</span>
              <span className="text-sm font-bold text-slate-900 truncate block">
                {animalData.color}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Physical trait</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">{t('livestock.source', 'Acquisition Source')}</span>
              <span className="text-sm font-bold text-slate-900">
                {animalData.source || t('livestock.bornOnFarm', 'Born on Farm')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Origin history</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">{t('livestock.purchasePrice', 'Purchase Price')}</span>
              <span className="text-sm font-bold text-slate-900">
                {animalData.purchasePrice ? formatCurrency(animalData.purchasePrice) : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {animalData.purchaseDate
                  ? `${t('livestock.purchased', 'Bought')}: ${formatDate(animalData.purchaseDate)}`
                  : t('livestock.bornOnFarm', 'Self-reared')}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">{t('common.date', 'Record Timestamp')}</span>
              <span className="text-sm font-bold text-slate-900">
                {formatDate(animalData.createdAt)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Database registration</span>
            </div>

            {animalData.notes && (
              <div className="col-span-2 sm:col-span-3 bg-amber-50/60 border border-amber-200 p-3 rounded-lg">
                <span className="text-xs font-semibold text-amber-900 block mb-0.5">
                  {t('common.notes', 'Clinical & Management Notes')}
                </span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {animalData.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Shortcuts Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          <button
            onClick={() => setIsHealthModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200 transition-colors"
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>{t('dashboard.logHealth', 'Log Health Event')}</span>
          </button>
          <button
            onClick={() => setIsVaccineModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-xs font-medium border border-amber-200 transition-colors"
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>{t('vaccination.addVaccination', 'Schedule Vaccination')}</span>
          </button>
          {animalData.gender === 'Female' && (
            <>
              <button
                onClick={() => setIsBreedingModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-xs font-medium border border-purple-200 transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>{t('breeding.addRecord', 'Record Breeding (AI)')}</span>
              </button>
              <button
                onClick={() => setIsMilkModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-medium border border-blue-200 transition-colors"
              >
                <Milk className="w-3.5 h-3.5" />
                <span>{t('dashboard.recordMilk', 'Record Milk Yield')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs for Animal's Historical Records */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-farm-700 text-farm-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('livestock.basicInfo', 'Historical Summary')}
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'health'
                ? 'border-farm-700 text-farm-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('livestock.healthHistory', 'Health History')} ({animalData.recentHealth?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('vaccine')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'vaccine'
                ? 'border-farm-700 text-farm-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('livestock.vaccinationHistory', 'Vaccinations')} ({animalData.recentVaccinations?.length || 0})
          </button>
          {animalData.gender === 'Female' && (
            <>
              <button
                onClick={() => setActiveTab('breeding')}
                className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'breeding'
                    ? 'border-farm-700 text-farm-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('livestock.breedingHistory', 'Breeding & Pregnancy')} ({animalData.recentBreeding?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('milk')}
                className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'milk'
                    ? 'border-farm-700 text-farm-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('livestock.milkRecords', 'Milk Logs')} ({animalData.recentMilk?.length || 0})
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                    <HeartPulse className="w-4 h-4 text-red-600" />
                    <span>{t('health.title', 'Recent Health Observation')}</span>
                  </h4>
                  {animalData.recentHealth && animalData.recentHealth.length > 0 ? (
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-slate-900">{animalData.recentHealth[0].healthCondition}</p>
                      <p className="text-slate-600">{animalData.recentHealth[0].treatment}</p>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(animalData.recentHealth[0].date)} • Dr. {animalData.recentHealth[0].veterinarian}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">{t('health.noHealthRecords', 'No medical treatments logged yet.')}</p>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                    <Syringe className="w-4 h-4 text-amber-600" />
                    <span>{t('vaccination.upcomingSchedule', 'Vaccination Schedule')}</span>
                  </h4>
                  {animalData.recentVaccinations && animalData.recentVaccinations.length > 0 ? (
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-slate-900">{animalData.recentVaccinations[0].vaccine}</p>
                      <p className="text-slate-600">
                        {t('vaccination.nextDueDate', 'Next Due')}: {formatDate(animalData.recentVaccinations[0].nextDueDate)}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {t('vaccination.dose', 'Dose')}: {animalData.recentVaccinations[0].dose}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">{t('vaccination.noVaccinations', 'No vaccinations recorded.')}</p>
                  )}
                </div>

                {animalData.gender === 'Female' && (
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                      <Milk className="w-4 h-4 text-blue-600" />
                      <span>{t('milk.title', 'Latest Milk Production')}</span>
                    </h4>
                    {animalData.recentMilk && animalData.recentMilk.length > 0 ? (
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-slate-900">
                          {animalData.recentMilk[0].totalQuantity} {t('common.unitLitre', 'L')} {t('common.total', 'Total')}
                        </p>
                        <p className="text-slate-600">
                          M: {animalData.recentMilk[0].morningQuantity}L | E: {animalData.recentMilk[0].eveningQuantity}L
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(animalData.recentMilk[0].date)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">{t('milk.noMilkRecords', 'No milk yields logged.')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Records Tab */}
          {activeTab === 'health' && (
            <div>
              {animalData.recentHealth?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  {t('health.noHealthRecords', 'No health records found for this animal.')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">{t('common.date', 'Date')}</th>
                        <th className="py-2.5 px-3">{t('health.condition', 'Condition / Diagnosis')}</th>
                        <th className="py-2.5 px-3">{t('health.symptoms', 'Symptoms')}</th>
                        <th className="py-2.5 px-3">{t('health.treatment', 'Treatment & Medicine')}</th>
                        <th className="py-2.5 px-3">{t('health.dosage', 'Dosage')}</th>
                        <th className="py-2.5 px-3">{t('health.veterinarian', 'Veterinarian')}</th>
                        <th className="py-2.5 px-3">{t('health.followUpDate', 'Follow-up')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {animalData.recentHealth?.map((hr) => (
                        <tr key={hr._id}>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {formatDate(hr.date)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {hr.healthCondition}
                            {hr.temperature && (
                              <span className="block text-[11px] text-slate-500 font-normal">
                                Temp: {hr.temperature}°F
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs truncate">{hr.symptoms}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-800">{hr.medicine}</span>
                            <span className="block text-[11px] text-slate-500">{hr.treatment}</span>
                          </td>
                          <td className="py-2.5 px-3">{hr.dosage}</td>
                          <td className="py-2.5 px-3">{hr.veterinarian}</td>
                          <td className="py-2.5 px-3">
                            {hr.followUpDate ? formatDate(hr.followUpDate) : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Vaccination Tab */}
          {activeTab === 'vaccine' && (
            <div>
              {animalData.recentVaccinations?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  {t('vaccination.noVaccinations', 'No vaccinations recorded for this animal.')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">{t('vaccination.vaccine', 'Vaccine')}</th>
                        <th className="py-2.5 px-3">{t('vaccination.vaccinationDate', 'Administered Date')}</th>
                        <th className="py-2.5 px-3">{t('vaccination.nextDueDate', 'Next Due Date')}</th>
                        <th className="py-2.5 px-3">{t('vaccination.dose', 'Dose')}</th>
                        <th className="py-2.5 px-3">{t('vaccination.veterinarian', 'Veterinarian')}</th>
                        <th className="py-2.5 px-3">{t('common.notes', 'Notes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {animalData.recentVaccinations?.map((vac) => (
                        <tr key={vac._id}>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{vac.vaccine}</td>
                          <td className="py-2.5 px-3">
                            {formatDate(vac.vaccinationDate)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {formatDate(vac.nextDueDate)}
                          </td>
                          <td className="py-2.5 px-3">{vac.dose}</td>
                          <td className="py-2.5 px-3">{vac.veterinarian}</td>
                          <td className="py-2.5 px-3 text-slate-500">{vac.notes || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Breeding Tab */}
          {activeTab === 'breeding' && animalData.gender === 'Female' && (
            <div>
              {animalData.recentBreeding?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  {t('breeding.noBreedingRecords', 'No breeding records found for this animal.')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">{t('breeding.breedingDate', 'Breeding Date')}</th>
                        <th className="py-2.5 px-3">{t('breeding.breedingMethod', 'Method')}</th>
                        <th className="py-2.5 px-3">{t('breeding.bullId', 'Sire / Bull Straw')}</th>
                        <th className="py-2.5 px-3">{t('common.status', 'Status')}</th>
                        <th className="py-2.5 px-3">{t('breeding.expectedDelivery', 'Expected Calving')}</th>
                        <th className="py-2.5 px-3">{t('breeding.actualDelivery', 'Actual Calving')}</th>
                        <th className="py-2.5 px-3">{t('common.notes', 'Notes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {animalData.recentBreeding?.map((br) => (
                        <tr key={br._id}>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {formatDate(br.breedingDate)}
                          </td>
                          <td className="py-2.5 px-3">{br.method}</td>
                          <td className="py-2.5 px-3 font-mono">{br.partner}</td>
                          <td className="py-2.5 px-3">
                            <span className="farm-badge bg-purple-50 text-purple-700 border border-purple-200">
                              {br.pregnancyStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {br.expectedDeliveryDate
                              ? formatDate(br.expectedDeliveryDate)
                              : '--'}
                          </td>
                          <td className="py-2.5 px-3">
                            {br.actualDeliveryDate
                              ? formatDate(br.actualDeliveryDate)
                              : 'Pending'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{br.notes || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Milk Tab */}
          {activeTab === 'milk' && animalData.gender === 'Female' && (
            <div>
              {animalData.recentMilk?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  {t('milk.noMilkRecords', 'No milk logs recorded for this animal.')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">{t('common.date', 'Date')}</th>
                        <th className="py-2.5 px-3">{t('milk.morningQuantity', 'Morning Yield')}</th>
                        <th className="py-2.5 px-3">{t('milk.eveningQuantity', 'Evening Yield')}</th>
                        <th className="py-2.5 px-3">{t('milk.totalQuantity', 'Total Yield')}</th>
                        <th className="py-2.5 px-3">{t('common.notes', 'Notes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {animalData.recentMilk?.map((mr) => (
                        <tr key={mr._id}>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {formatDate(mr.date)}
                          </td>
                          <td className="py-2.5 px-3">{mr.morningQuantity} L</td>
                          <td className="py-2.5 px-3">{mr.eveningQuantity} L</td>
                          <td className="py-2.5 px-3 font-bold text-blue-700">
                            {mr.totalQuantity} L
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{mr.notes || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Animal Modal */}
      <AnimalModal
        isOpen={isEditModalOpen}
        initialData={animalData}
        isSubmitting={isSubmitting}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={async (formData) => {
          setIsSubmitting(true);
          try {
            await updateLivestockApi(animalData._id, formData);
            setIsEditModalOpen(false);
            await fetchAnimal();
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {/* Quick Add Health Modal */}
      <HealthRecordModal
        isOpen={isHealthModalOpen}
        animals={[animalData]}
        preselectedLivestockId={animalData._id}
        isSubmitting={isSubmitting}
        onClose={() => setIsHealthModalOpen(false)}
        onSubmit={async (formData) => {
          setIsSubmitting(true);
          try {
            await createHealthRecordApi(formData);
            setIsHealthModalOpen(false);
            await fetchAnimal();
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {/* Quick Add Vaccination Modal */}
      <VaccinationModal
        isOpen={isVaccineModalOpen}
        animals={[animalData]}
        preselectedLivestockId={animalData._id}
        isSubmitting={isSubmitting}
        onClose={() => setIsVaccineModalOpen(false)}
        onSubmit={async (formData) => {
          setIsSubmitting(true);
          try {
            await createVaccinationApi(formData);
            setIsVaccineModalOpen(false);
            await fetchAnimal();
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {/* Quick Add Breeding Modal */}
      <BreedingModal
        isOpen={isBreedingModalOpen}
        animals={[animalData]}
        preselectedLivestockId={animalData._id}
        isSubmitting={isSubmitting}
        onClose={() => setIsBreedingModalOpen(false)}
        onSubmit={async (formData) => {
          setIsSubmitting(true);
          try {
            await createBreedingRecordApi(formData);
            setIsBreedingModalOpen(false);
            await fetchAnimal();
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {/* Quick Add Milk Modal */}
      <MilkRecordModal
        isOpen={isMilkModalOpen}
        animals={[animalData]}
        preselectedLivestockId={animalData._id}
        isSubmitting={isSubmitting}
        onClose={() => setIsMilkModalOpen(false)}
        onSubmit={async (formData) => {
          setIsSubmitting(true);
          try {
            await createMilkRecordApi(formData);
            setIsMilkModalOpen(false);
            await fetchAnimal();
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('livestock.deleteAnimal', 'Delete Livestock Record')}
        message={t('common.confirmDelete', 'Are you sure you want to delete this animal? This will remove the animal from your active farm herd.')}
        itemName={`${animalData.name} (${animalData.animalId})`}
        isDeleting={isSubmitting}
        onConfirm={async () => {
          setIsSubmitting(true);
          try {
            await deleteLivestockApi(animalData._id);
            navigate('/livestock');
          } catch (err: any) {
            alert(err.response?.data?.message || t('errors.failedToDelete', 'Error deleting animal'));
          } finally {
            setIsSubmitting(false);
          }
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
