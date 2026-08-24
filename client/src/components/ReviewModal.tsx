import { useState } from "react";
import { Modal } from "./ui/Modal";
import { StarRating } from "./ui/StarRating";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { reviewsApi } from "../api/bookings";
import { useToast } from "../context/ToastContext";

export function ReviewModal({ open, onClose, bookingId, onSubmitted }: { open: boolean; onClose: () => void; bookingId: string; onSubmitted: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await reviewsApi.create({ bookingId, rating, text });
      toast.success("Merci pour votre avis !");
      onSubmitted();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Laisser un avis" size="sm">
      <div className="space-y-4">
        <div className="flex justify-center">
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>
        <Textarea label="Votre avis (facultatif)" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Partagez votre expérience..." />
        <Button fullWidth loading={loading} onClick={handleSubmit}>
          Publier l'avis
        </Button>
      </div>
    </Modal>
  );
}
