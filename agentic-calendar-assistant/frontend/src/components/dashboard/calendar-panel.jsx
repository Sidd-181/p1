import { useCallback, useEffect, useState } from "react";
import { CalendarDays, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { fetchCalendarEvents } from "@/lib/calendar";

const styles = {
  root: "mt-3 space-y-1.5",
  heading: "flex items-center justify-between px-0.5 text-sm font-semibold text-sidebar-foreground",
  refresh: "size-6",
  refreshIcon: "size-3.5",
  error: "px-0.5 text-xs text-destructive",
  empty: "rounded-xl bg-sidebar-accent/50 px-3 py-2 text-xs text-muted-foreground",
  list: "space-y-1",
  event: "rounded-xl bg-sidebar-accent/50 px-3 py-2",
  title: "truncate text-xs font-semibold text-sidebar-foreground",
  time: "mt-0.5 text-[11px] text-muted-foreground",
};

function formatEventTime(value) {
  if (!value) return "Time unavailable";
  if (value.length === 10) return "All day";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function CalendarPanel({ sessionToken, connected }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    if (!connected) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchCalendarEvents(sessionToken, { maxResults: 8 });
      setEvents(data.events ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load Google Calendar",
      );
    } finally {
      setLoading(false);
    }
  }, [connected, sessionToken]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (!connected) return null;

  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <span>Upcoming events</span>
        <Button
          size="icon-sm"
          variant="ghost"
          className={styles.refresh}
          disabled={loading}
          onClick={loadEvents}
          aria-label="Refresh Google Calendar events"
        >
          <RefreshCcw className={styles.refreshIcon} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-1">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : events.length === 0 ? (
        <p className={styles.empty}>No upcoming events.</p>
      ) : (
        <div className={styles.list}>
          {events.map((event) => (
            <a
              key={event.id}
              href={event.htmlLink ?? undefined}
              target="_blank"
              rel="noreferrer"
              className={styles.event}
            >
              <p className={styles.title}>{event.title}</p>
              <p className={styles.time}>{formatEventTime(event.start)}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default CalendarPanel;
