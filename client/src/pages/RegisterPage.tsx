import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage, languageNames } from '../context/LanguageContext';
import { SupportedLanguage } from '../types';
import { 
  UserPlus, 
  Layers, 
  AlertCircle, 
  Globe, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Home, 
  MapPin 
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    farmName: '',
    location: '',
    preferredLanguage: language,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Client-side validations
    if (
      !formData.fullName.trim() ||
      !formData.mobile.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.farmName.trim() ||
      !formData.location.trim()
    ) {
      setFormError(t('validation.required'));
      return;
    }

    if (formData.password.length < 6) {
      setFormError(t('validation.passwordLength'));
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: formData.fullName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        password: formData.password,
        farmName: formData.farmName.trim(),
        location: formData.location.trim(),
        preferredLanguage: formData.preferredLanguage as SupportedLanguage,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message || t('errors.somethingWentWrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex items-center justify-center p-3 bg-farm-800 text-emerald-300 rounded-xl shadow-sm mb-3">
          <Layers className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {t('auth.createAccount')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          {t('auth.pblTagline')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {(formError || error) && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3.5 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{formError || error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.fullName')} *
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ramesh Patil"
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.mobile')} *
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Account Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.email')} *
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="farmer@dairyfarm.com"
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.password')} *
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Farm Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.farmName')} *
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Home className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="farmName"
                    required
                    value={formData.farmName}
                    onChange={handleChange}
                    placeholder="Patil Dairy Farm"
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.location')} *
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Kolhapur, Maharashtra"
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.preferredLanguage')}
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <select
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={(e) => {
                    handleChange(e);
                    setLanguage(e.target.value as SupportedLanguage);
                  }}
                  aria-label={t('auth.preferredLanguage')}
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white cursor-pointer"
                >
                  <option value="en">{languageNames.en}</option>
                  <option value="hi">{languageNames.hi}</option>
                  <option value="mr">{languageNames.mr}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full farm-btn-primary py-2.5 text-xs sm:text-sm font-semibold mt-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{t('auth.registering')}</span>
              ) : (
                <span className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 mr-1" />
                  <span>{t('auth.createAccount')}</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            <span>{t('auth.alreadyHaveAccount')} </span>
            <Link
              to="/login"
              className="font-semibold text-farm-800 hover:text-farm-900 underline"
            >
              {t('auth.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
