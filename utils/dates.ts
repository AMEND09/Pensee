// Utility helpers for normalizing and formatting dates consistently across
// the app.  The goal is to avoid surprises when the PocketBase server is in a
// different timezone than the client, and to treat session "dates" as local
// calendar days rather than UTC instants.

// ─────────────────────────────────────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a `YYYY-MM-DD` string for the given date **in the local timezone**.
 * Using `toISOString()` can shift the day when the local offset is negative
 * (e.g. late‑night in US/Canada), so we explicitly read the local components.
 */
export function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Normalize an arbitrary date/time string produced by PocketBase (or
 * elsewhere) to a calendar day in `YYYY-MM-DD` form.  If the input is already
 * a plain date string the value is returned unchanged; otherwise the offset is
 * stripped by converting to a `Date` and then formatting with
 * `localDateString`, which uses the local timezone.
 *
 * This prevents a server in a different zone from leaking its offset into the
 * client.  Example: a record created at `2026-02-25T00:00:00-08:00` should still
 * be treated as 2026‑02‑25 regardless of the client's local zone.
 */
export function normalizeDateString(raw?: string | null): string {
  if (!raw) return '';
  // If the value is already a plain calendar date we can return it directly.
  // Otherwise parse it and convert to the local timezone before formatting.
  //
  // The subtlety here is what we mean by "normalize to the user's timezone".
  //
  // * For a bare YYYY-MM-DD string we assume it already represents the local
  //   date the user intended and do not shift it.
  // * If the server supplied a full ISO timestamp (e.g. created/updated fields)
  //   the date should be interpreted in the user's zone so that midnight UTC
  //   doesn't appear as the wrong calendar day.  Parsing to `Date` and then
  //   serializing with `localDateString` accomplishes that.
  //
  // This covers both cases: textual dates are left alone and timestamps are
  // shifted to local time.

  const maybeDate = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) {
    return maybeDate;
  }

  const dt = new Date(raw);
  if (isNaN(dt.getTime())) {
    // parsing failed; fall back to the raw prefix to avoid throwing
    return maybeDate;
  }
  // format in local timezone
  return localDateString(dt);
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience formatters used in the UI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a date in `YYYY-MM-DD` form, return an object suitable for the small
 * day‑label used in the history list.
 */
export function niceDate(d: string) {
  const [year, month, day] = d.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    monthDay: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

/**
 * Human‑readable full date for a `YYYY-MM-DD` string.
 */
export function fullDate(d: string) {
  const [year, month, day] = d.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Today's date string (local calendar day).  Useful when comparing against
 * `Session.date` or caching daily prompts.
 */
export function todayLocalDate(): string {
  return localDateString(new Date());
}
