import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  HeartPulse,
  Syringe,
  GitBranch,
  Milk,
  Wheat,
  TrendingUp,
  TrendingDown,
  BellRing,
  BarChart3,
  Bot,
  Layers,
} from 'lucide-react';

interface NavItemConfig {
  translationKey: string;
  defaultName: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  comingSoon?: string;
}

const navItemConfigs: NavItemConfig[] = [
  // Phase 1 - 3 Core Livestock Modules
  { translationKey: 'navigation.dashboard', defaultName: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, enabled: true },
  { translationKey: 'navigation.livestock', defaultName: 'Livestock Herd', path: '/livestock', icon: Layers, enabled: true },
  { translationKey: 'navigation.health', defaultName: 'Health Records', path: '/health', icon: HeartPulse, enabled: true },
  { translationKey: 'navigation.vaccination', defaultName: 'Vaccination', path: '/vaccination', icon: Syringe, enabled: true },
  { translationKey: 'navigation.breeding', defaultName: 'Breeding & Calving', path: '/breeding', icon: GitBranch, enabled: true },
  { translationKey: 'navigation.milk', defaultName: 'Milk Production', path: '/milk', icon: Milk, enabled: true },

  // Phase 4 Feed, Finance & Reminders Modules
  { translationKey: 'navigation.feed', defaultName: 'Feed Management', path: '/feed', icon: Wheat, enabled: true },
  { translationKey: 'navigation.income', defaultName: 'Farm Income', path: '/income', icon: TrendingUp, enabled: true },
  { translationKey: 'navigation.expenses', defaultName: 'Farm Expenses', path: '/expenses', icon: TrendingDown, enabled: true },
  { translationKey: 'navigation.reminders', defaultName: 'Reminders & Tasks', path: '/reminders', icon: BellRing, enabled: true },

  // Phase 5 Reports & Analytics Module
  { translationKey: 'navigation.reports', defaultName: 'Reports & Analytics', path: '/reports', icon: BarChart3, enabled: true },

  // Phase 7 AI Farm Assistant Module
  { translationKey: 'navigation.aiAssistant', defaultName: 'AI Farm Assistant', path: '/ai-assistant', icon: Bot, enabled: true },
];

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4">
      <div className="px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {t('navigation.dashboard')} &amp; {t('navigation.reports')}
        </div>
        {navItemConfigs.map((item) => {
          const Icon = item.icon;
          const displayName = t(item.translationKey) || item.defaultName;

          if (item.enabled) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-farm-50 text-farm-900 border border-farm-200 font-semibold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 text-farm-700" />
                  <span>{displayName}</span>
                </div>
              </NavLink>
            );
          }

          return (
            <div
              key={item.path}
              title={`${displayName} (${item.comingSoon})`}
              className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-slate-400 cursor-not-allowed opacity-60"
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{displayName}</span>
              </div>
              {item.comingSoon && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                  {item.comingSoon}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 mx-3 rounded-lg bg-farm-50 border border-farm-100 text-[11px] text-farm-800">
        <p className="font-semibold text-farm-900 mb-0.5">Multi-Tenant Scoping</p>
        <p className="text-farm-700 leading-relaxed">
          Active tenant session. All herd, health, milk, feed, finance, and reminder records isolated to this farm.
        </p>
      </div>
    </aside>
  );
};
