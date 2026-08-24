import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Trash2, Heart, MessageCircle } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../context/ToastContext";

export function AdminPosts() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["admin-posts"], queryFn: adminApi.moderation.posts });
  const [toDelete, setToDelete] = useState<any>(null);

  async function handleDelete() {
    if (!toDelete) return;
    await adminApi.moderation.deletePost(toDelete.id);
    toast.success("Publication supprimée.");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["admin-posts"] });
  }

  const posts = data?.posts ?? [];

  return (
    <div>
      <PageHeader title="Publications" description="Modération du contenu publié par les professionnels." />
      {isLoading ? null : posts.length === 0 ? (
        <EmptyState icon={FileText} title="Aucune publication" description="Aucune publication n'a encore été créée." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {posts.map((p: any) => (
            <div key={p.id} className="overflow-hidden rounded-lg border border-border bg-white shadow-card">
              {p.images[0] && <img src={p.images[0]} alt="" className="h-32 w-full object-cover" />}
              <div className="p-3">
                <p className="truncate text-xs font-medium text-ink">{p.professional?.companyName || `${p.author.firstName} ${p.author.lastName}`}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><Heart size={11} /> {p._count.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={11} /> {p._count.comments}</span>
                </div>
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setToDelete(p)}>
                  <Trash2 size={13} className="text-danger" /> Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la publication"
        message="Cette publication sera définitivement supprimée."
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
