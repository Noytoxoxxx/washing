import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bookingsApi } from "../../api/bookings";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { BookingStatusBadge } from "../../components/BookingStatusBadge";

type View = "day" | "week" | "month";
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function ProCalendar() {
  const { data } = useQuery({ queryKey: ["pro-bookings"], queryFn: bookingsApi.pro });
  const bookings = (data?.bookings ?? []).filter((b) => ["pending", "confirmed", "completed"].includes(b.status));
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [detail, setDetail] = useState<any>(null);

  function navigate(dir: -1 | 1) {
    const next = new Date(cursor);
    if (view === "day") next.setDate(next.getDate() + dir);
    else if (view === "week") next.setDate(next.getDate() + dir * 7);
    else next.setMonth(next.getMonth() + dir);
    setCursor(next);
  }

  const bookingsFor = (d: Date) => bookings.filter((b) => sameDay(new Date(b.date), d));

  const monthGrid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  return (
    <div>
      <PageHeader title="Calendrier" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(-1)} aria-label="Précédent"><ChevronLeft size={15} /></Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Aujourd'hui</Button>
          <Button size="sm" variant="outline" onClick={() => navigate(1)} aria-label="Suivant"><ChevronRight size={15} /></Button>
          <p className="ml-2 text-sm font-medium text-ink">
            {view === "month" ? cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : view === "week" ? `Semaine du ${startOfWeek(cursor).toLocaleDateString("fr-FR")}` : cursor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-white p-1">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-sm px-3 py-1 text-sm font-medium ${view === v ? "bg-primary text-white" : "text-text"}`}>
              {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="bg-bg px-2 py-1.5 text-center text-xs font-semibold text-muted">{d}</div>
          ))}
          {monthGrid.map((d, i) => {
            const dayBookings = bookingsFor(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <button
                key={i}
                onClick={() => { setCursor(d); setView("day"); }}
                className={`min-h-24 bg-white p-1.5 text-left ${!inMonth ? "text-muted/50" : ""} ${sameDay(d, new Date()) ? "ring-1 ring-inset ring-primary" : ""}`}
              >
                <span className="text-xs">{d.getDate()}</span>
                <div className="mt-1 space-y-0.5">
                  {dayBookings.slice(0, 2).map((b) => (
                    <div key={b.id} className="truncate rounded-sm bg-primary-light px-1 py-0.5 text-[10px] text-primary">{b.timeSlot} {b.service?.name}</div>
                  ))}
                  {dayBookings.length > 2 && <p className="text-[10px] text-muted">+{dayBookings.length - 2}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {view === "week" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
          {weekDays.map((d) => (
            <div key={d.toISOString()} className="rounded-lg border border-border bg-white p-2">
              <p className="mb-2 text-xs font-semibold text-ink">{d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</p>
              <div className="space-y-1.5">
                {bookingsFor(d).map((b) => (
                  <button key={b.id} onClick={() => setDetail(b)} className="block w-full rounded-md bg-primary-light px-2 py-1.5 text-left text-xs text-primary hover:bg-primary/20">
                    {b.timeSlot} — {b.service?.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "day" && (
        <div className="space-y-2">
          {bookingsFor(cursor).length === 0 ? (
            <p className="text-sm text-muted">Aucun rendez-vous ce jour-là.</p>
          ) : (
            bookingsFor(cursor)
              .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
              .map((b) => (
                <button key={b.id} onClick={() => setDetail(b)} className="flex w-full items-center justify-between rounded-lg border border-border bg-white p-4 text-left shadow-card hover:border-primary">
                  <div>
                    <p className="font-medium text-ink">{b.timeSlot} — {b.service?.name}</p>
                    <p className="text-sm text-muted">{b.client?.firstName} {b.client?.lastName}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </button>
              ))
          )}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Détail du rendez-vous" size="sm">
        {detail && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Client</span><span className="font-medium text-ink">{detail.client?.firstName} {detail.client?.lastName}</span></div>
            <div className="flex justify-between"><span className="text-muted">Prestation</span><span className="font-medium text-ink">{detail.service?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-medium text-ink">{new Date(detail.date).toLocaleDateString("fr-FR")}</span></div>
            <div className="flex justify-between"><span className="text-muted">Heure</span><span className="font-medium text-ink">{detail.timeSlot}</span></div>
            <div className="flex justify-between"><span className="text-muted">Prix</span><span className="font-medium text-ink">{detail.price} €</span></div>
            <div className="flex justify-between"><span className="text-muted">Statut</span><BookingStatusBadge status={detail.status} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
