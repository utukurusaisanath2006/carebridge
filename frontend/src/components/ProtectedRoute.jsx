import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function ProtectedRoute({ children, requiredRoles = null, onNavigateDashboard = null }) {
  const { isAuthenticated, role, loading } = useAuth();
  const { t } = useSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-slate-700">Loading Clinical Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const effectiveRole = role || user?.role;

  if (requiredRoles && !requiredRoles.includes(effectiveRole)) {
    return (
      <div className="p-8 max-w-lg mx-auto my-12 bg-white rounded-2xl border border-red-200/80 shadow-sm text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
          <ShieldX className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {t('auth.accessDenied', null, 'Access Restricted')}
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          {t('auth.accessDeniedDetail', { role: role || 'Viewer', required: requiredRoles.join(', ') },
            `Your current role (${role}) does not have permission to view this section. Requires: ${requiredRoles.join(', ')}.`
          )}
        </p>
        {onNavigateDashboard && (
          <button
            onClick={onNavigateDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('auth.backToDashboard', null, 'Return to Dashboard')}</span>
          </button>
        )}
      </div>
    );
  }

  return children;
}
