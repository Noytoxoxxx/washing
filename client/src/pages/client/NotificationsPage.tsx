import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import { notificationsApi } from "../../api/notifications";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list });
  const notifications = data?.notifications ?? [];

  async function markAllRead() {
    await notificationsApi.markAllRead();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markRead(id: string) {
    await notificationsApi.markRead(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function remove(id: string) {
    await notificationsApi.remove(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        action={
          data && data.unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Tout marquer comme lu
            </Button>
          ) : undefined
        }
      />
      {isLoading ? null : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Aucune notification" description="Vous serez notifié ici des nouveautés concernant votre compte." />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {notifications.map((n) => (
            <li key={n.id} className={`px-4 py-3.5 ${!n.read ? "bg-primary-light/40" : ""}`}>
              <Link to={n.link || "#"} onClick={() => !n.read && markRead(n.id)}>
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-muted">{n.message}</p>
                <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
              </Link>
              <div className="mt-2 flex gap-4">
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary">
                    <Check size={12} /> Marquer comme lu
                  </button>
                )}
                <button onClick={() => remove(n.id)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger">
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
