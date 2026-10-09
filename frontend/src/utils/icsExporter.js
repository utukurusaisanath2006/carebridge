/**
 * Browser-side iCalendar (.ics) RFC 5545 exporter for DischargeAI.
 */

export function downloadIcsCalendar(patientName, tasks = [], enabledLanguages = ['en'], currentLang = 'en') {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const today = new Date();
  const extraLangs = (enabledLanguages || []).filter(l => l !== currentLang);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Care Bridge//Care Schedule Coordinator//EN',
    `X-WR-CALNAME:Care Bridge Follow-up Plan - ${patientName || 'Patient'}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const escapeIcs = (str) => {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  };

  tasks.forEach((task, idx) => {
    const times = (task.times_of_day && task.times_of_day.length > 0) ? task.times_of_day : ['09:00'];
    const durationDays = task.duration_days || (task.type === 'Medication' ? 14 : 7);

    // Primary text in current language
    const primaryText = (currentLang !== 'en' && task.translations?.[currentLang]) || task.simple_language || task.original_text || '';

    let transStr = '';
    extraLangs.forEach((lang) => {
      const text = task.translations?.[lang] || (lang === 'hi' ? task.hindi_translation : lang === 'ta' ? task.tamil_translation : null);
      if (text && text !== primaryText) {
        transStr += `\\n\\n[${lang.toUpperCase()}]: ${escapeIcs(text)}`;
      }
    });

    for (let dayOffset = 0; dayOffset < Math.min(durationDays, 14); dayOffset++) {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + dayOffset);

      times.forEach((timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const startDate = new Date(eventDate);
        startDate.setHours(hours || 9, minutes || 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + (task.type === 'Medication' ? 15 : 60));

        const formatIso = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const uid = `carebridge-${task.id || idx}-${dayOffset}-${timeStr.replace(':', '')}@carebridge.local`;
        const summary = escapeIcs(`[${task.type}] ${primaryText.slice(0, 60)}`);
        const description = `${escapeIcs(primaryText)}${transStr}\\n\\nSource: ${escapeIcs(task.source_line || task.original_text || '')}`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${now}`);
        lines.push(`DTSTART:${formatIso(startDate)}`);
        lines.push(`DTEND:${formatIso(endDate)}`);
        lines.push(`SUMMARY:${summary}`);
        lines.push(`DESCRIPTION:${description}`);
        lines.push('STATUS:CONFIRMED');
        lines.push('BEGIN:VALARM');
        lines.push('TRIGGER:-PT15M');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:Reminder: ${summary}`);
        lines.push('END:VALARM');
        lines.push('END:VEVENT');
      });
    }
  });

  lines.push('END:VCALENDAR');

  const icsString = lines.join('\r\n');
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `care_schedule_${(patientName || 'patient').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
