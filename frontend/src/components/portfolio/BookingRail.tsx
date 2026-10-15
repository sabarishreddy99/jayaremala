"use client";

import useSWR from "swr";
import { apiGet, API_BASE_URL } from "@/lib/api/client";
import { profile } from "@/data/profile";

/**
 * The booking half of the contact chapter.
 *
 * `GET /ai/booking` returns the same payload the chat's BookingCard uses — up to
 * five real open 30-minute slots derived from Google Calendar free/busy. Showing
 * them here is the whole point of this rail: a generic "book a call" link claims
 * availability, a list of actual times proves it.
 *
 * Every failure path lands on the same floor — the booking link always renders —
 * so a cold backend, a disconnected calendar, or a fully-booked week degrades to
 * exactly what this surface used to be rather than to nothing. The fetch is a
 * progressive enhancement and never surfaces an error of its own.
 *
 * Slots are cached ~3 min server-side, so there is nothing to gain from
 * revalidating on focus and no retry storm worth starting on failure.
 */

export const BOOKING_KEY = `${API_BASE_URL}/ai/booking`;

interface BookingSlot {
  date: string;  // "Tuesday, June 16"
  start: string; // "2:00 PM"
  end: string;   // "2:30 PM"
  tz: string;    // "America/New_York"
}

interface BookingPayload {
  booking_url: string;
  open: boolean;
  slots: BookingSlot[];
}

const fetcher = () => apiGet<BookingPayload>("/ai/booking");

/** "America/Chicago" → "CST" (or "CDT" in summer), resolved from the zone
 *  itself so it never drifts out of sync with daylight saving.
 *
 *  The city fallback is deliberately kept for zones with no short name: the
 *  IANA city is not always the one the reader expects — "America/Chicago" is
 *  the correct zone for Dallas, but printing "Chicago" to a visitor just
 *  raises a question the abbreviation answers.
 *
 *  Safe against hydration: slots only ever arrive from a client-side fetch,
 *  so this never runs during the static render. */
function tzLabel(tz: string): string {
  try {
    const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    if (name) return name;
  } catch {
    /* unknown zone — fall through to the city */
  }
  return tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

export default function BookingRail() {
  const { data, error, isLoading } = useSWR<BookingPayload>(BOOKING_KEY, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const bookingUrl = data?.booking_url || profile.booking_url || "";
  const slots = data?.slots ?? [];
  const hasSlots = slots.length > 0;
  // A failed fetch is not an error state here — it just means no live times.
  const resolved = !isLoading || Boolean(error);

  return (
    <div className="flex h-full flex-col">
      <h3 className="text-base font-semibold text-fg">Book a call</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-subtle">
        Thirty minutes, on Google Calendar. The times below are real openings
        from my week.
      </p>

      {/* Hold the eventual height only while the calendar is in flight, so the
          list arriving does not shove the page. Once resolved the rail takes its
          natural height — an empty week is a short answer, not a tall void. */}
      <div className={`mt-5 ${resolved ? "" : "min-h-[11rem]"}`}>
        {!resolved && (
          <p className="flex items-center gap-2 text-[13px] text-fg-faint">
            <span aria-hidden className="inline-block h-1 w-1 shrink-0 rounded-full bg-fg-faint" />
            Checking the calendar…
          </p>
        )}

        {resolved && hasSlots && (
          <ul className="border-t border-border-subtle">
            {slots.map((s, i) => {
              // Openings cluster on the nearest free day, so the same date
              // usually repeats down the whole list. Print it once per day and
              // let the rest read as times under it, the way a schedule does.
              const newDay = i === 0 || s.date !== slots[i - 1].date;
              return (
                <li key={`${s.date}-${s.start}-${i}`}>
                  <a
                    href={bookingUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.date}, ${s.start} to ${s.end}`}
                    className="group flex items-baseline justify-between gap-4 border-b border-border-subtle py-2.5 transition-colors duration-150 hover:border-accent"
                  >
                    <span
                      className={`text-[13px] transition-colors ${
                        newDay
                          ? "font-medium text-fg-muted group-hover:text-fg"
                          : "text-fg-faint group-hover:text-fg-subtle"
                      }`}
                    >
                      {newDay ? s.date : " "}
                    </span>
                    <span className="shrink-0 text-[12px] tabular-nums text-fg-faint transition-colors group-hover:text-accent">
                      {s.start} – {s.end}
                    </span>
                  </a>
                </li>
              );
            })}
            <li className="pt-2 text-[11px] text-fg-faint">
              Times shown in {tzLabel(slots[0].tz)}.
            </li>
          </ul>
        )}

        {resolved && !hasSlots && (
          <p className="text-[13px] leading-relaxed text-fg-faint">
            Nothing open in the next seven days — my calendar has everything
            beyond that, and it books instantly.
          </p>
        )}
      </div>

      {bookingUrl && (
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-avo mt-6 inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-medium"
        >
          {hasSlots ? "Pick a time" : "Open my calendar"}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </a>
      )}

      {data?.open === false && (
        <p className="mt-3 text-[11px] text-fg-faint">
          Availability is limited right now, but the calendar is accurate.
        </p>
      )}
    </div>
  );
}
