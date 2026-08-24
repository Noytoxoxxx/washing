import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { notificationsApi } from "../../api/notifications";
import { Dropdown } from "../ui/Dropdown";
import { EmptyState } from "../ui/EmptyState";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

export function NotificationBell() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: 30000,
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  async function handleRead(id: string) {
    setBusyId(id);
    await notificationsApi.markRead(id);
    await qc.invalidateQueries({ queryKey: ["notifications"] });
    setBusyId(null);
  }

  async function handleRemove(id: string) {
    setBusyId(id);
    await notificationsApi.remove(id);
    await qc.invalidateQueries({ queryKey: ["notifications"] });
    setBusyId(null);
  }

  async function handleReadAll() {
    await notificationsApi.markAllRead();
    await qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <Dropdown
      align="right"
      className="w-80 max-h-[70vh] overflow-y-auto"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} non lues)` : ""}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-text hover:bg-bg"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    >
      {() => (
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleReadAll} className="text-xs font-medium text-primary hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6">
              <EmptyState icon={Bell} title="Aucune notification" description="Vous serez notifié ici des nouveautés." />
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id} className={`border-t border-border px-4 py-3 ${!n.read ? "bg-primary-light/40" : ""}`}>
                  <Link to={n.link || "#"} onClick={() => !n.read && handleRead(n.id)} className="block">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                  </Link>
                  <div className="mt-1.5 flex gap-3">
                    {!n.read && (
                      <button
                        disabled={busyId === n.id}
                        onClick={() => handleRead(n.id)}
                        className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary"
                      >
                        <Check size={12} /> Marquer comme lu
                      </button>
                    )}
                    <button
                      disabled={busyId === n.id}
                      onClick={() => handleRemove(n.id)}
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
                    >
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Dropdown>
  );
}
