import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Check,
  CheckCheck,
  Flame,
  Clock,
  Radio,
  Search,
  RefreshCw,
  Sparkles,
  Sliders,
  ChevronRight
} from 'lucide-react';

export default function NotificationsView({ onSelectTask }) {
  const {
    notifications,
    unreadCount,
    criticalUnacknowledgedCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    acknowledgeAlert,
    simulateEscalation,
    simulateMissedDose,
    sendTestNotification,
    fetchNotifications
  } = useNotifications();
  const { t } = useSettings();
  const { canReview } = useAuth();

  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all' | 'critical' | 'warning' | 'info' | 'unread'
  const [searchQuery, setSearchQuery] = useState('');
  const [simulating, setSimulating] = useState(false);

  const filtered = notifications.filter((item) => {
    if (filterSeverity === 'unread' && item.read_at) return false;
    if (filterSeverity !== 'all' && filterSeverity !== 'unread' && item.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = t(item.title_code, item.params, item.title_code).toLowerCase();
      const patient = (item.params?.patient || '').toLowerCase();
      return title.includes(q) || patient.includes(q) || item.type.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSimulate = async (fn) => {
    setSimulating(true);
    try {
      await fn();
    } finally {
      setTimeout(() => setSimulating(false), 500);
    }
  };

  const formatFullDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 shadow-delicate flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF6242]/15 border border-[#FF6242]/30 flex items-center justify-center text-[#FF6242] shadow-glow-coral">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-syne font-bold text-xl text-cb-text tracking-tight flex items-center gap-2">
                <span>{t('notif.centerTitle', null, 'Operator Notification Center')}</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/30">
                    {unreadCount} {t('notif.newBadge', null, 'New')}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-cb-textMuted font-mono">
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-[#55D6A2] shadow-glow-mint' : 'bg-[#F5B94A]'
                    }`}
                  ></span>
                  {isConnected
                    ? t('notif.streamActive', null, 'Real-time SSE Stream Active')
                    : t('notif.pollingActive', null, '15s Polling Fallback Active')}
                </span>
                <span>•</span>
                <span>{notifications.length} {t('notif.totalLogged', null, 'total recorded')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-3.5 py-2 bg-cb-surface2 hover:bg-white/10 text-cb-text text-xs font-mono font-semibold rounded-control border border-cb-border transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-[#55D6A2]" />
              <span>{t('notif.markAllRead', null, 'Mark All as Read')}</span>
            </button>
          )}

          <button
            onClick={() => fetchNotifications()}
            className="p-2 bg-cb-surface2 hover:bg-white/10 text-cb-textMuted hover:text-cb-text rounded-control border border-cb-border transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Demo Simulation Bar for Hackathon Judges */}
      {canReview && (
        <div className="glass-card p-5 border-l-4 border-l-[#FF6242] shadow-delicate">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#FF6242]/15 text-[#FF6242] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-syne font-bold text-sm text-cb-text">
                  {t('notif.judgeToolsTitle', null, 'Judge Live Alert Simulation')}
                </p>
                <p className="text-xs text-cb-textMuted leading-relaxed">
                  {t('notif.judgeToolsDesc', null, 'Trigger simulated clinical events to test operator sound, red toast, and auto-notification dispatch.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulate(simulateEscalation)}
                className="px-3.5 py-2 bg-[#FF4D5E] hover:bg-[#FF6242] text-[#050505] text-xs font-mono font-bold rounded-control transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{t('notif.simEscalationBtn', null, 'Simulate Escalation')}</span>
              </button>

              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulate(simulateMissedDose)}
                className="px-3.5 py-2 bg-[#F5B94A] hover:bg-[#F7C66B] text-[#050505] text-xs font-mono font-bold rounded-control transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t('notif.simMissedBtn', null, 'Simulate Missed Dose')}</span>
              </button>

              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulate(sendTestNotification)}
                className="px-3.5 py-2 bg-[#55D6A2] hover:bg-[#6FE0B2] text-[#050505] text-xs font-mono font-bold rounded-control transition-all cursor-pointer"
              >
                <span>{t('notif.testAlertBtn', null, 'Test Alert')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: t('notif.tabAll', null, 'All'), count: notifications.length },
            { id: 'unread', label: t('notif.tabUnread', null, 'Unread'), count: unreadCount },
            { id: 'critical', label: t('notif.tabCritical', null, 'Critical'), count: notifications.filter((n) => n.severity === 'critical').length },
            { id: 'warning', label: t('notif.tabWarning', null, 'Warnings'), count: notifications.filter((n) => n.severity === 'warning').length },
            { id: 'info', label: t('notif.tabInfo', null, 'Info'), count: notifications.filter((n) => n.severity === 'info').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterSeverity(tab.id)}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold uppercase tracking-wide-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                filterSeverity === tab.id
                  ? 'bg-[#FF6242] text-[#050505] shadow-glow-coral'
                  : 'bg-cb-surface2 text-cb-textMuted border border-cb-border hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterSeverity === tab.id ? 'bg-[#050505]/20 text-[#050505]' : 'bg-white/10 text-cb-textMuted'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-cb-textMuted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts or patients..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-cb-surface2 border border-cb-border rounded-control text-cb-text placeholder:text-cb-textFaint focus:border-[#55D6A2] transition-colors"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card py-16 text-center text-cb-textMuted text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-cb-textFaint" />
            <p>{t('notif.emptyState', null, 'No notifications found matching your filter.')}</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isUnread = !item.read_at;
            const isCritical = item.severity === 'critical';
            const isAcknowledged = !!item.acknowledged_by;

            return (
              <div
                key={item.id}
                className={`glass-card p-4 transition-all relative ${
                  isCritical ? 'border-l-4 border-l-[#FF4D5E]' : ''
                } ${isUnread ? 'bg-cb-surface2' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-control bg-cb-surface2 border border-cb-border shrink-0 mt-0.5">
                      {isCritical ? (
                        <AlertTriangle className="w-5 h-5 text-[#FF4D5E]" />
                      ) : item.severity === 'warning' ? (
                        <AlertCircle className="w-5 h-5 text-[#F5B94A]" />
                      ) : (
                        <Info className="w-5 h-5 text-[#7FB2FF]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide-mono border ${
                          isCritical
                            ? 'bg-[#FF4D5E]/15 text-[#FF4D5E] border-[#FF4D5E]/30'
                            : item.severity === 'warning'
                            ? 'bg-[#F5B94A]/15 text-[#F5B94A] border-[#F5B94A]/30'
                            : 'bg-[#7FB2FF]/15 text-[#7FB2FF] border-[#7FB2FF]/30'
                        }`}>
                          {item.severity}
                        </span>

                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#FF6242]"></span>
                        )}

                        <span className="text-xs font-mono text-cb-textMuted">
                          {formatFullDate(item.created_at)}
                        </span>
                      </div>

                      <p className={`text-sm ${isUnread ? 'font-bold text-cb-text' : 'text-cb-textMuted'} leading-relaxed`}>
                        {t(item.title_code, item.params, item.title_code)}
                      </p>

                      {item.params?.patient && (
                        <p className="text-xs text-cb-textMuted font-mono">
                          {t('notif.patientLabel', null, 'Patient')}: <span className="font-bold text-cb-text">{item.params.patient}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCritical && !isAcknowledged && (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(item.id)}
                        className="px-3 py-1.5 bg-[#FF4D5E] hover:bg-[#FF6242] text-[#050505] text-xs font-mono font-bold rounded-control transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="p-1.5 text-cb-textMuted hover:text-cb-text rounded-control hover:bg-white/10 transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
