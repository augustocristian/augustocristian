// Minimal RFC 5545 (iCalendar) writer — enough for the teaching calendars, and
// deliberately strict about the parts Outlook is picky over:
//
//  * CRLF line endings, and every line folded at 75 octets (never mid-codepoint);
//  * TEXT values escaped (backslash, semicolon, comma, newline);
//  * DTSTART/DTEND emitted in UTC ("...Z") rather than with a TZID, so no
//    VTIMEZONE block is needed and Google Calendar, Outlook (desktop + web) and
//    Apple Calendar all resolve the same instant.
const CRLF = '\r\n';

function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Fold a content line to 75 octets, continuing with a leading space. Splitting
// is done on the UTF-8 byte array but never inside a multi-byte sequence, so
// accented characters survive the fold.
function fold(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const chunks = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    while (end > start + 1 && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end -= 1;
    chunks.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
    limit = 74; // continuation lines lose one octet to the leading space
  }
  return chunks.join(`${CRLF} `);
}

// UTC timestamp in iCalendar basic format: 20260915T140000Z
function utcStamp(date) {
  return `${date.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
}

// Build a full VCALENDAR document from the event list produced by
// buildCalendarEvents(). `domain` only namespaces the UIDs.
export function buildIcs({
  name,
  description,
  events,
  timeZone = 'Europe/Madrid',
  domain = 'augustocristian.es',
}) {
  // A fixed DTSTAMP keeps rebuilds byte-identical (no spurious diffs in dist/).
  const stamp = utcStamp(new Date(Date.UTC(2026, 0, 1)));
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//augustocristian.es//Teaching Schedule//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
    // Display hint only — DTSTART/DTEND are absolute UTC instants, so the
    // events land at the right local time whatever the subscriber's zone.
    `X-WR-TIMEZONE:${escapeText(timeZone)}`,
  ];
  if (description) lines.push(`X-WR-CALDESC:${escapeText(description)}`);

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeText(event.uid)}@${domain}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utcStamp(event.start)}`,
      `DTEND:${utcStamp(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    if (event.url) lines.push(`URL:${escapeText(event.url)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join(CRLF)}${CRLF}`;
}
