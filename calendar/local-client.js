/**
 * Local Calendar Client
 * Accesses Calendar.app via AppleScript
 */

const { runAppleScript, runJXA, escapeAppleScript, escapeJXA, formatAppleScriptDate } = require('../utils/applescript');
const config = require('../config');

/**
 * List upcoming events from all calendars
 * @param {number} count - Number of events to retrieve
 * @param {number} daysAhead - Number of days to look ahead
 * @returns {Promise<Array>} - List of events
 */
async function listEvents(count = 25, daysAhead = 30) {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  // Use batch property access (only essential fields for speed)
  const script = `
    const calendar = Application('Calendar');
    const cals = calendar.calendars;
    const calNames = cals.name();
    let allEvents = [];

    for (let i = 0; i < calNames.length; i++) {
      try {
        const cal = cals[i];
        const evts = cal.events;
        const uids = evts.uid();
        const summaries = evts.summary();
        const starts = evts.startDate();
        const ends = evts.endDate();
        const allDayFlags = evts.alldayEvent();

        const limit = Math.min(uids.length, 100);
        for (let j = 0; j < limit; j++) {
          allEvents.push({
            id: uids[j],
            summary: summaries[j] || '',
            startDate: starts[j] ? starts[j].toISOString() : null,
            endDate: ends[j] ? ends[j].toISOString() : null,
            isAllDay: allDayFlags[j] || false,
            calendar: calNames[i]
          });
        }
      } catch (e) {}
    }

    JSON.stringify(allEvents);
  `;

  try {
    const result = await runJXA(script);
    if (!result) return [];

    let events = JSON.parse(result);

    // Filter to date range and sort
    events = events.filter(e => {
      if (!e.startDate) return false;
      const start = new Date(e.startDate);
      return start >= now && start <= future;
    });

    events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    return events.slice(0, count).map((e) => ({
      ...e,
      start: e.startDate,
      end: e.endDate || e.startDate,
      calendarName: e.calendar,
      url: e.id
    }));
  } catch (error) {
    console.error('Calendar listEvents error:', error.message);
    return [];
  }
}

/**
 * List all calendars
 * @returns {Promise<Array>} - List of calendars
 */
async function listCalendars() {
  // Use batch property access - JXA iteration causes AppleEvent errors
  const script = `
    const calendar = Application('Calendar');
    const cals = calendar.calendars;
    const names = cals.name();
    const writables = cals.writable();

    let result = [];
    for (let i = 0; i < names.length; i++) {
      result.push({
        name: names[i],
        id: names[i], // Use name as ID since cal.id() causes errors
        writable: writables[i]
      });
    }

    JSON.stringify(result);
  `;

  const result = await runJXA(script);
  return result ? JSON.parse(result) : [];
}

/**
 * Create a new event
 * @param {Object} options - Event options
 * @returns {Promise<Object>} - Created event info
 */
async function createEvent({ summary, start, end, location, description, calendarName, calendarUrl, allDay = false }) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // calendarUrl from cloud tools maps to Calendar.app calendar name in local mode
  const targetCalendar = calendarName || calendarUrl || 'Calendar';

  if (allDay) {
    // All-day event
    const script = `
      tell application "Calendar"
        tell calendar "${escapeAppleScript(targetCalendar)}"
          set newEvent to make new event with properties {summary:"${escapeAppleScript(summary)}", start date:date "${formatAppleScriptDate(startDate)}", end date:date "${formatAppleScriptDate(endDate)}", allday event:true}
          ${location ? `set location of newEvent to "${escapeAppleScript(location)}"` : ''}
          ${description ? `set description of newEvent to "${escapeAppleScript(description)}"` : ''}
          return uid of newEvent
        end tell
      end tell
    `;

    const uid = await runAppleScript(script);
    return { success: true, id: uid, uid, calendar: targetCalendar, message: 'Event created successfully' };
  } else {
    const script = `
      tell application "Calendar"
        tell calendar "${escapeAppleScript(targetCalendar)}"
          set newEvent to make new event with properties {summary:"${escapeAppleScript(summary)}", start date:date "${formatAppleScriptDate(startDate)}", end date:date "${formatAppleScriptDate(endDate)}"}
          ${location ? `set location of newEvent to "${escapeAppleScript(location)}"` : ''}
          ${description ? `set description of newEvent to "${escapeAppleScript(description)}"` : ''}
          return uid of newEvent
        end tell
      end tell
    `;

    const uid = await runAppleScript(script);
    return { success: true, id: uid, uid, calendar: targetCalendar, message: 'Event created successfully' };
  }
}

/**
 * Update an existing event
 * @param {string} eventId - Event UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Result
 */
async function updateEvent(eventId, { summary, start, end, location, description }) {
  let updateCommands = [];

  if (summary) updateCommands.push(`set summary of theEvent to "${escapeAppleScript(summary)}"`);
  if (start) updateCommands.push(`set start date of theEvent to date "${formatAppleScriptDate(new Date(start))}"`);
  if (end) updateCommands.push(`set end date of theEvent to date "${formatAppleScriptDate(new Date(end))}"`);
  if (location !== undefined) updateCommands.push(`set location of theEvent to "${escapeAppleScript(location || '')}"`);
  if (description !== undefined) updateCommands.push(`set description of theEvent to "${escapeAppleScript(description || '')}"`);

  if (updateCommands.length === 0) {
    return { success: false, message: 'No updates provided' };
  }

  const script = `
    tell application "Calendar"
      set allCalendars to calendars
      repeat with cal in allCalendars
        try
          set theEvent to first event of cal whose uid is "${escapeAppleScript(eventId)}"
          ${updateCommands.join('\n          ')}
          return "updated"
        end try
      end repeat
      return "not found"
    end tell
  `;

  const result = await runAppleScript(script);
  if (result === 'not found') {
    return { success: false, message: 'Event not found' };
  }
  return { success: true, message: 'Event updated successfully' };
}

/**
 * Delete an event
 * @param {string} eventId - Event UID
 * @returns {Promise<Object>} - Result
 */
async function deleteEvent(eventId) {
  const script = `
    tell application "Calendar"
      set allCalendars to calendars
      repeat with cal in allCalendars
        try
          set theEvent to first event of cal whose uid is "${escapeAppleScript(eventId)}"
          delete theEvent
          return "deleted"
        end try
      end repeat
      return "not found"
    end tell
  `;

  const result = await runAppleScript(script);
  if (result === 'not found') {
    return { success: false, message: 'Event not found' };
  }
  return { success: true, message: 'Event deleted successfully' };
}

/**
 * Alias for caldav-client compatibility (calendar/index.js)
 */
async function getCalendars() {
  const calendars = await listCalendars();
  return calendars.map((cal) => ({
    displayName: cal.name,
    url: cal.id || cal.name
  }));
}

module.exports = {
  listEvents,
  listCalendars,
  getCalendars,
  createEvent,
  updateEvent,
  deleteEvent
};
