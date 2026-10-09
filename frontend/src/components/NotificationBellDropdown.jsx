import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Check,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';

export default function NotificationBellDropdown({ onNavigateNotifications, onSelectTask }) {
  const {
    notifications,
    unreadCount,
    criticalUnacknowledgedCount,
    markAsRead,
    markAllAsRead,
    acknowledgeAlert
  } = useNotifications();
  const { t } = useSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'critical' | 'warning' | 'info'
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.severity === activeFilter;
  });

  const criticalCount = notifications.filter((n) => n.severity === 'critical').length;
  const warningCount = notifications.filter((n) => n.severity === 'warning').length;
  const infoCount = notifications.filter((n) => n.severity === 'info').length;

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide-mono bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40">
            {t('notif.critical', null, 'Critical')}
          </span>
        );
      case 'warning':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide-mono bg-[#F5B94A]/20 text-[#F5B94A] border border-[#F5B94A]/40">
            {t('notif.warning', null, 'Warning')}
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide-mono bg-[#7FB2FF]/20 text-[#7FB2FF] border border-[#7FB2FF]/40">
            {t('notif.info', null, 'Info')}
          </span>
        );
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-[#FF4D5E] shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-[#F5B94A] shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-[#7FB2FF] shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-control text-cb-textMuted hover:text-cb-text hover:bg-cb-surface2 border border-cb-border transition-colors cursor-pointer ${
          isOpen ? 'bg-cb-surface2 text-cb-text' : ''
        }`}
        aria-label={t('notif.bellAria', null, 'Operator Notifications')}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="bg-red-500 absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono font-bold flex items-center justify-center bg-[#FF4D5E] text-[#050505] shadow-glow-coral animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 sm:w-[420px] glass-card bg-cb-bg/95 border border-cb-border z-50 overflow-hidden animate-fade-in shadow-delicate">
          {/* Header */}
          <div className="p-3.5 bg-cb-surface2 border-b border-cb-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-syne font-bold text-sm text-cb-text">
                {t('notif.headerTitle', null, 'Notifications')}
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FF4D5E]/20 text-[#FF4D5E]">
                  {unreadCount} {t('notif.unreadCount', null, 'unread')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#55D6A2] hover:underline px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{t('notif.markAllRead', null, 'Mark all read')}</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-cb-textMuted hover:text-cb-text rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="px-3 py-2 bg-cb-surface border-b border-cb-border flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-control font-mono text-[11px] font-bold uppercase tracking-wide-mono transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#FF6242] text-[#050505] shadow-glow-coral'
                  : 'bg-cb-surface2 text-cb-textMuted border border-cb-border hover:bg-white/10'
              }`}
            >
              {t('notif.filterAll', null, 'All')} ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-2.5 py-1 rounded-control font-mono text-[11px] font-bold uppercase tracking-wide-mono transition-colors flex items-center gap-1 cursor-pointer ${
                activeFilter === 'critical'
                  ? 'bg-[#FF4D5E] text-[#050505]'
                  : 'bg-cb-surface2 text-[#FF4D5E] border border-cb-border hover:bg-[#FF4D5E]/10'
              }`}
            >
              <span>{t('notif.filterCritical', null, 'Critical')}</span>
              {criticalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF4D5E]/20 text-[#FF4D5E] font-bold">
                  {criticalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('warning')}
              className={`px-2.5 py-1 rounded-control font-mono text-[11px] font-bold uppercase tracking-wide-mono transition-colors flex items-center gap-1 cursor-pointer ${
                activeFilter === 'warning'
                  ? 'bg-[#F5B94A] text-[#050505]'
                  : 'bg-cb-surface2 text-[#F5B94A] border border-cb-border hover:bg-[#F5B94A]/10'
              }`}
            >
              <span>{t('notif.filterWarning', null, 'Warnings')}</span>
              {warningCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#F5B94A]/20 text-[#F5B94A] font-bold">
                  {warningCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('info')}
              className={`px-2.5 py-1 rounded-control font-mono text-[11px] font-bold uppercase tracking-wide-mono transition-colors cursor-pointer ${
                activeFilter === 'info'
                  ? 'bg-[#7FB2FF] text-[#050505]'
                  : 'bg-cb-surface2 text-[#7FB2FF] border border-cb-border hover:bg-[#7FB2FF]/10'
              }`}
            >
              {t('notif.filterInfo', null, 'Info')} ({infoCount})
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-cb-border">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-cb-textMuted text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-cb-textFaint" />
                <p>{t('notif.emptyState', null, 'No notifications in this category.')}</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !notif.read_at;
                const isCritical = notif.severity === 'critical';
                const isAcknowledged = !!notif.acknowledged_by;

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (isUnread) markAsRead(notif.id);
                      if (notif.task_id && onSelectTask) onSelectTask(notif.task_id);
                    }}
                    className={`p-3 text-left transition-colors cursor-pointer relative ${
                      isUnread
                        ? isCritical
                          ? 'bg-[#FF4D5E]/10 hover:bg-[#FF4D5E]/15 border-l-2 border-l-[#FF4D5E]'
                          : 'bg-[#55D6A2]/5 hover:bg-[#55D6A2]/10 border-l-2 border-l-[#55D6A2]'
                        : 'bg-transparent hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {getSeverityIcon(notif.severity)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            {getSeverityBadge(notif.severity)}
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#FF6242] shrink-0"></span>
                            )}
                          </div>
                          <span className="text-[11px] text-cb-textMuted font-mono">
                            {formatTimestamp(notif.created_at)}
                          </span>
                        </div>

                        {/* Localized Message Text */}
                        <p className={`text-xs ${isUnread ? 'font-bold text-cb-text' : 'text-cb-textMuted'} leading-relaxed`}>
                          {t(notif.title_code, notif.params, notif.title_code)}
                        </p>

                        {/* Patient / Task Reference info */}
                        {notif.params?.patient && (
                          <p className="text-[11px] text-cb-textMuted mt-0.5">
                            {t('notif.patientLabel', null, 'Patient')}: <span className="font-semibold text-cb-text">{notif.params.patient}</span>
                          </p>
                        )}

                        {/* Critical Action: Acknowledge Button */}
                        {isCritical && (
                          <div className="mt-2 flex items-center justify-between pt-1 border-t border-cb-border">
                            {isAcknowledged ? (
                              <span className="text-[11px] text-[#55D6A2] font-mono font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>{t('notif.acknowledged', null, 'Acknowledged')}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acknowledgeAlert(notif.id);
                                }}
                                className="px-2.5 py-1 bg-[#FF4D5E] hover:bg-[#FF6242] text-[#050505] text-[11px] font-mono font-bold rounded-control transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{t('notif.acknowledgeButton', null, 'Acknowledge Alert')}</span>
                              </button>
                            )}

                            {notif.task_id && onSelectTask && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTask(notif.task_id);
                                  setIsOpen(false);
                                }}
                                className="text-[11px] text-[#55D6A2] hover:underline font-mono flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>{t('notif.viewTask', null, 'View task')}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Full Notifications Page Link */}
          <div className="p-2.5 bg-cb-surface2 border-t border-cb-border text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onNavigateNotifications) onNavigateNotifications();
              }}
              className="w-full py-1.5 px-3 text-xs font-mono font-semibold text-[#55D6A2] hover:underline rounded-control hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t('notif.viewAllCenter', null, 'Open Full Notification Center')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
