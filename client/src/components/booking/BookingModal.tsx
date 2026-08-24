import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Car } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { vehiclesApi } from "../../api/vehicles";
import { bookingsApi } from "../../api/bookings";
import { useToast } from "../../context/ToastContext";
import { ApiClientError } from "../../api/client";
import { Link } from "react-router-dom";
import { paths } from "../../lib/paths";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  professionalId: string;
  professionalName: string;
  services: Service[];
  businessHours: { dayOfWeek: number; openTime: string | null; closeTime: string | null; closed: boolean }[];
  defaultServiceId?: string | null;
}

const STEPS = ["Prestation", "Véhicule", "Date", "Heure", "Résumé"];

function generateSlots(open: string | null, close: string | null) {
  if (!open || !close) return [];
  const [oh] = open.split(":").map(Number);
  const [ch] = close.split(":").map(Number);
  const slots: string[] = [];
  for (let h = oh; h < ch; h++) slots.push(`${String(h).padStart(2, "0")}:00`);
  return slots;
}

export function BookingModal({ open, onClose, professionalId, professionalName, services, businessHours, defaultServiceId }: Props) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(defaultServiceId || services[0]?.id || "");
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: vehiclesData } = useQuery({ queryKey: ["vehicles"], queryFn: vehiclesApi.list, enabled: open });
  const vehicles = vehiclesData?.vehicles ?? [];

  const selectedService = services.find((s) => s.id === serviceId);

  const slots = useMemo(() => {
    if (!date) return [];
    const dow = new Date(date).getDay();
    const hours = businessHours.find((h) => h.dayOfWeek === dow);
    if (!hours || hours.closed) return [];
    return generateSlots(hours.openTime, hours.closeTime);
  }, [date, businessHours]);

  function reset() {
    setStep(0);
    setServiceId(defaultServiceId || services[0]?.id || "");
    setVehicleId("");
    setDate("");
    setTimeSlot("");
    setNotes("");
    setSuccess(false);
    setError(null);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 200);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await bookingsApi.create({ professionalId, serviceId, vehicleId: vehicleId || undefined, date, timeSlot, notes: notes || undefined });
      setSuccess(true);
      toast.success("Votre demande de réservation a été envoyée.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  const canNext =
    (step === 0 && !!serviceId) ||
    (step === 1 && true) ||
    (step === 2 && !!date) ||
    (step === 3 && !!timeSlot) ||
    step === 4;

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : `Réserver — ${professionalName}`} size="md">
      {success ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 size={44} className="text-success" />
          <h3 className="mt-3 text-lg font-semibold text-ink">Demande envoyée !</h3>
          <p className="mt-1 text-sm text-muted">Le professionnel doit confirmer votre créneau. Vous serez notifié.</p>
          <div className="mt-5 flex gap-2">
            <Link to={paths.bookings}>
              <Button onClick={handleClose}>Voir mes réservations</Button>
            </Link>
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-5 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-1.5">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i <= step ? "bg-primary text-white" : "bg-bg text-muted"}`}>
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
          <p className="mb-4 text-sm font-semibold text-ink">{STEPS[step]}</p>

          {error && <p role="alert" className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          {step === 0 && (
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={`flex w-full items-center justify-between rounded-md border p-3 text-left ${serviceId === s.id ? "border-primary bg-primary-light" : "border-border"}`}
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-muted">{s.durationMinutes} min</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{s.price} €</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div>
              {vehicles.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted">
                  <Car size={20} className="mx-auto mb-2" />
                  Aucun véhicule dans votre garage.{" "}
                  <Link to={paths.garage} className="text-primary hover:underline" onClick={handleClose}>
                    Ajouter un véhicule
                  </Link>{" "}
                  (facultatif)
                </div>
              ) : (
                <Select
                  label="Véhicule (facultatif)"
                  value={vehicleId}
                  onChange={setVehicleId}
                  placeholder="Aucun véhicule sélectionné"
                  options={[{ value: "", label: "Aucun" }, ...vehicles.map((v) => ({ value: v.id, label: `${v.make} ${v.model}${v.nickname ? ` (${v.nickname})` : ""}` }))]}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <label htmlFor="booking-date" className="mb-1.5 block text-sm font-medium text-text">
                Date souhaitée
              </label>
              <input
                id="booking-date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => { setDate(e.target.value); setTimeSlot(""); }}
                className="w-full rounded-md border border-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          )}

          {step === 3 && (
            <div>
              {slots.length === 0 ? (
                <p className="text-sm text-muted">Le professionnel n'est pas disponible ce jour-là. Choisissez une autre date.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTimeSlot(s)}
                      className={`rounded-md border py-2 text-sm font-medium ${timeSlot === s ? "border-primary bg-primary text-white" : "border-border text-text hover:bg-bg"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && selectedService && (
            <div className="space-y-3 rounded-md border border-border p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Prestation</span><span className="font-medium text-ink">{selectedService.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Durée</span><span className="font-medium text-ink">{selectedService.durationMinutes} min</span></div>
              <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-medium text-ink">{date}</span></div>
              <div className="flex justify-between"><span className="text-muted">Heure</span><span className="font-medium text-ink">{timeSlot}</span></div>
              <div className="flex justify-between border-t border-border pt-3"><span className="text-muted">Prix</span><span className="text-base font-bold text-ink">{selectedService.price} €</span></div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Un message pour le professionnel (facultatif)"
                rows={2}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => (step === 0 ? handleClose() : setStep((s) => s - 1))}>
              {step === 0 ? "Annuler" : "Précédent"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Suivant
              </Button>
            ) : (
              <Button loading={submitting} onClick={handleConfirm}>
                Confirmer la demande
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
