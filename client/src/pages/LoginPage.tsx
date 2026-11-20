import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types';
import { 
  LogIn, 
  Layers, 
  AlertCircle, 
  Globe, 
  Lock, 
  Mail, 
  ShieldCheck 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuth();
  const { language, setLanguage, languageNames, t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim() || !password) {
      setFormError(t('validation.required'));
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message || t('errors.unauthorized'));
    } finally {
      setIsSubmitting(false);
    }
  };

 

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-farm-800 text-emerald-300 rounded-xl shadow-sm mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t('auth.smartLivestockSystem')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
          {t('auth.pblTagline')}
        </p>

        {/* Language Quick Selector */}
        <div className="mt-3 inline-flex items-center space-x-1.5 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-xs text-xs text-slate-600">
          <Globe className="w-3.5 h-3.5 text-farm-700" />
          <span className="text-slate-400">{t('navigation.language')}:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            aria-label={t('navigation.language')}
            className="bg-transparent font-medium text-slate-800 border-none outline-none cursor-pointer"
          >
            <option value="en">{languageNames.en}</option>
            <option value="hi">{languageNames.hi}</option>
            <option value="mr">{languageNames.mr}</option>
          </select>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">{t('auth.signIn')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('auth.welcomeBack')}
            </p>
          </div>

          {(formError || error) && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3.5 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{formError || error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh.patil@shreekrishnadairy.in"
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full farm-btn-primary py-2.5 text-xs sm:text-sm font-semibold cursor-pointer"
            >
              {isSubmitting ? (
                <span>{t('auth.loggingIn')}</span>
              ) : (
                <span className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4 mr-1" />
                  <span>{t('auth.signIn')}</span>
                </span>
              )}
            </button>
          </form>

         

          <div className="mt-6 text-center text-xs text-slate-600">
            <span>{t('auth.dontHaveAccount')} </span>
            <Link
              to="/register"
              className="font-semibold text-farm-800 hover:text-farm-900 underline"
            >
              {t('auth.createAccount')}
            </Link>
          </div>
        </div>

        {/* Security Isolation Footnote */}
        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Session • Scoped Multi-Tenant Isolation</span>
        </div>
      </div>
    </div>
  );
};
