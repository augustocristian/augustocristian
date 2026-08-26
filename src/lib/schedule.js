// Teaching schedule: loads data/teaching/schedule/<subject>.yaml and expands it
// into the two shapes the site needs — the planning table rendered on the
// subject page, and a flat, dated event list for the .ics calendar export.
//
// The YAML keeps dates as "YYYY-MM-DD" strings and times as local "HH:MM" in
// the file's `timezone`; nothing here ever relies on the build machine's own
// timezone.
import fs from 'node:fs';
import path from 'node:path';
import { readYaml } from './data.js';

const SCHEDULE_DIR = path.resolve(process.cwd(), 'data', 'teaching', 'schedule');
const cache = new Map();

// Schedule for a subject, or null when the subject has no planning file.
export function loadSchedule(subjectId) {
  if (!cache.has(subjectId)) {
    const file = path.join(SCHEDULE_DIR, `${subjectId}.yaml`);
    cache.set(subjectId, fs.existsSync(file) ? readYaml(file) : null);
  }
  return cache.get(subjectId);
}

// Subject ids that have a planning file (used by the .ics build integration).
export function scheduledSubjectIds() {
  if (!fs.existsSync(SCHEDULE_DIR)) return [];
  return fs
    .readdirSync(SCHEDULE_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => path.basename(f, '.yaml'));
}

/* ---------------------------------------------------------------- dates --- */

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return { y, m, d };
}

// "YYYY-MM-DD" + n days, as "YYYY-MM-DD". Uses UTC arithmetic so the build
// machine's timezone can never shift a date across midnight.
export function addDays(dateStr, days) {
  const { y, m, d } = parseDate(dateStr);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

// Weekday index of a "YYYY-MM-DD" date, 0 = Monday … 6 = Sunday.
export function weekdayOf(dateStr) {
  const { y, m, d } = parseDate(dateStr);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

// Offset of `timeZone` from UTC, in minutes, at the given instant.
function tzOffsetMinutes(timeZone, instant) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asIfUtc - instant.getTime()) / 60000;
}

// Local wall-clock time in `timeZone` -> the UTC instant it denotes.
// Two passes converge even across a DST transition (the offset used to correct
// the guess is itself re-read at the corrected instant).
export function zonedToUtc(dateStr, timeStr, timeZone) {
  const { y, m, d } = parseDate(dateStr);
  const [hh, mm] = timeStr.split(':').map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let instant = new Date(naive);
  for (let i = 0; i < 2; i += 1) {
    instant = new Date(naive - tzOffsetMinutes(timeZone, instant) * 60000);
  }
  return instant;
}

/* ------------------------------------------------------------- expansion --- */

// One lab row resolved for one subgroup: the week-level lab block with that
// group's override merged on top, plus the concrete date it falls on.
function resolveLab(week, group) {
  const labs = week.labs;
  if (!labs) return null;
  if (labs.cancelled) {
    return { cancelled: true, reason: labs.note || '', date: addDays(week.start, group.weekday) };
  }
  const override = labs.groups?.[group.id] ?? {};
  const merged = { ...labs, ...override };
  delete merged.groups;

  if (merged.cancelled) {
    return {
      cancelled: true,
      reason: merged.reason || '',
      session: merged.session,
      title: merged.title,
      date: addDays(week.start, group.weekday),
    };
  }
  const moved = Boolean(merged.moved_to);
  return {
    ...merged,
    moved,
    date: merged.moved_to || addDays(week.start, group.weekday),
    start: group.start,
    end: group.end,
  };
}

// Planning table model: every week, with each subgroup's lab resolved to a real
// date, plus the week's theory rows and one-off events.
export function buildPlanningWeeks(schedule) {
  return schedule.weeks.map((week) => {
    const labs = schedule.groups.map((group) => ({ group, ...resolveLab(week, group) }));
    const running = labs.filter((lab) => !lab.cancelled);
    return {
      n: week.n,
      start: week.start,
      end: addDays(week.start, 4),
      note: week.note || '',
      labs,
      // The session most subgroups run this week — the headline of the lab row.
      // `null` when every subgroup is cancelled (holiday, defence week).
      primary: running[0] ?? null,
      allCancelled: running.length === 0,
      theory: (week.theory || []).map((row) => ({ ...row })),
      events: (week.events || []).map((row) => ({ ...row })),
    };
  });
}

// The three event kinds below share the same shape; `ctx` carries what every
// one of them needs (timezone, subject title, venue) so the builders stay flat.
function labEvent(ctx, week, group) {
  const lab = resolveLab(week, group);
  if (!lab || lab.cancelled) return null;
  const what = [lab.title, lab.extra].filter(Boolean).join(' + ');
  return {
    uid: `${ctx.subjectId}-w${week.n}-${group.id}-lab`,
    start: zonedToUtc(lab.date, lab.start, ctx.tz),
    end: zonedToUtc(lab.date, lab.end, ctx.tz),
    summary: `${ctx.title} · ${lab.session} ${what} (${group.id})`,
    description: [
      `Semana ${week.n} · Subgrupo ${group.id}`,
      lab.moved ? `Sesión recuperada: ${lab.reason || 'cambio de día'}` : '',
      week.note || '',
    ]
      .filter(Boolean)
      .join('\n'),
    location: ctx.location,
  };
}

function theoryEvent(ctx, week, row, i) {
  const label = row.kind === 'pa' ? 'Práctica de aula' : 'Teoría';
  return {
    uid: `${ctx.subjectId}-w${week.n}-theory-${i}`,
    start: zonedToUtc(row.date, row.start, ctx.tz),
    end: zonedToUtc(row.date, row.end, ctx.tz),
    summary: `${ctx.title} · ${label}: ${row.title}`,
    description: [
      `Semana ${week.n}`,
      row.detail || '',
      row.tentative ? 'Sesión pendiente de confirmar.' : '',
    ]
      .filter(Boolean)
      .join('\n'),
    location: ctx.location,
  };
}

function oneOffEvent(ctx, week, row, i) {
  return {
    uid: `${ctx.subjectId}-w${week.n}-event-${i}`,
    start: zonedToUtc(row.date, row.start, ctx.tz),
    end: zonedToUtc(row.date, row.end, ctx.tz),
    summary: `${ctx.title} · ${row.title}`,
    description: `Semana ${week.n}`,
    location: ctx.location,
  };
}

// Flat, dated event list for the calendar export. `groupId` selects one lab
// subgroup; pass null to include every subgroup (the teacher's own calendar).
// Theory, PA and one-off events are always included.
export function buildCalendarEvents(schedule, subjectId, subjectTitle, groupId) {
  const ctx = {
    subjectId,
    title: subjectTitle,
    tz: schedule.timezone,
    location: schedule.location || '',
  };
  const groups = groupId ? schedule.groups.filter((g) => g.id === groupId) : schedule.groups;

  const events = schedule.weeks.flatMap((week) => [
    ...groups.map((group) => labEvent(ctx, week, group)).filter(Boolean),
    ...(week.theory || []).map((row, i) => theoryEvent(ctx, week, row, i)),
    ...(week.events || []).map((row, i) => oneOffEvent(ctx, week, row, i)),
  ]);

  return events.sort((a, b) => a.start - b.start);
}
