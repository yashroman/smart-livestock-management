import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage, AppNotification } from '../../types';
import {
  LogOut,
  Globe,
  UserCheck,
  ShieldCheck,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Syringe,
  Heart,
  Calendar,
  AlertTriangle,
  Info,
  Menu,
} from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../../api/notification.api';

export interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, languageNames, t, formatDate } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Background fetch error - fail silently if backend/db is not active
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Periodic check every 45s
    const timer = setInterval(() => {
      fetchNotifications();
    }, 45000);

    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await handleMarkAsRead(notif._id);
    }
    setIsOpen(false);

    // Navigate to related module if applicable
    if (notif.relatedEntity === 'Vaccination') {
      navigate('/vaccinations');
    } else if (notif.relatedEntity === 'Breeding') {
      navigate('/breeding');
    } else if (notif.relatedEntity === 'Reminder') {
      navigate('/reminders');
    } else if (notif.relatedEntity === 'Health') {
      navigate('/health');
    } else if (notif.relatedEntity === 'Livestock') {
      navigate('/livestock');
    }
  };

  const getNotificationIcon = (type: string, relatedEntity?: string) => {
    if (relatedEntity === 'Vaccination' || type === 'Vaccination') {
      return <Syringe className="w-4 h-4 text-amber-600" />;
    }
    if (relatedEntity === 'Breeding' || type === 'Breeding') {
      return <Heart className="w-4 h-4 text-purple-600" />;
    }
    if (relatedEntity === 'Reminder' || type === 'Reminder') {
      return <Calendar className="w-4 h-4 text-blue-600" />;
    }
    if (type === 'warning' || type === 'alert') {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    return <Info className="w-4 h-4 text-emerald-600" />;
  };

  return (
    <header className="bg-farm-900 border-b border-farm-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Farm Identity */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              type="button"
              className="lg:hidden p-1.5 rounded-lg bg-farm-800 hover:bg-farm-700 text-farm-200 hover:text-white transition-colors border border-farm-700 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="bg-farm-700 text-emerald-300 p-2 rounded-lg font-bold text-xs sm:text-sm">
            SLM
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm sm:text-base text-white">
                {user?.farmName || t('auth.farmName')}
              </span>
              <span className="farm-badge bg-farm-800 text-emerald-300 border border-farm-700 text-[10px] hidden sm:inline-flex">
                <ShieldCheck className="w-3 h-3 mr-1" /> Isolated Tenant
              </span>
            </div>
            <p className="text-xs text-farm-300">
              {user?.location ? `${user.location} • ` : ''}
              {t('auth.smartLivestockSystem')}
            </p>
          </div>
        </div>

        {/* Right: Notifications, Language Selector, User Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notification Center Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setIsOpen(!isOpen);
                if (!isOpen) fetchNotifications();
              }}
              title={t('navigation.notifications')}
              aria-label={t('navigation.notifications')}
              className="relative p-2 rounded-lg bg-farm-800 hover:bg-farm-700 text-farm-200 hover:text-white transition-colors border border-farm-700 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {t('notifications.title')}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
                        {unreadCount} {t('notifications.unread').toLowerCase()}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-0.5" />
                      <span>{t('notifications.markAllRead')}</span>
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {isLoading && notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      {t('common.loading')}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">{t('notifications.noNotifications')}</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 ${
                          !notif.read ? 'bg-emerald-50/40' : 'bg-white'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type, notif.relatedEntity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p
                              className={`text-xs ${
                                !notif.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                              } truncate`}
                            >
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                            <span>
                              {formatDate(notif.createdAt, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <div className="flex items-center space-x-2">
                              {!notif.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notif._id, e)}
                                  title={t('notifications.read')}
                                  aria-label={t('notifications.read')}
                                  className="text-slate-400 hover:text-emerald-700 p-0.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(notif._id, e)}
                                title={t('common.delete')}
                                aria-label={t('common.delete')}
                                className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer link to Reminders */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/reminders');
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    {t('common.viewAll')} {t('navigation.reminders')} &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-1.5 bg-farm-800 border border-farm-700 rounded-md px-2.5 py-1">
            <Globe className="w-3.5 h-3.5 text-farm-300" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              aria-label={t('navigation.language')}
              className="bg-transparent text-xs text-farm-100 font-medium border-none focus:ring-0 cursor-pointer outline-none"
            >
              <option value="en" className="text-slate-800">
                {languageNames.en}
              </option>
              <option value="hi" className="text-slate-800">
                {languageNames.hi}
              </option>
              <option value="mr" className="text-slate-800">
                {languageNames.mr}
              </option>
            </select>
          </div>

          {/* User Info */}
          <div className="hidden md:flex items-center space-x-2 text-xs border-l border-farm-800 pl-3">
            <div className="w-8 h-8 rounded-full bg-farm-800 text-emerald-300 flex items-center justify-center font-semibold border border-farm-700">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <p className="font-semibold text-white leading-none">{user?.fullName}</p>
              <p className="text-[11px] text-farm-300 leading-tight mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title={t('auth.logout')}
            aria-label={t('auth.logout')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-farm-800 hover:bg-farm-700 text-farm-200 hover:text-white transition-colors border border-farm-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('auth.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
