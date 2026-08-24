import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, BadgeCheck, Crown, Trash2, Flag, Link as LinkIcon, Send } from "lucide-react";
import { postsApi, type Post } from "../../api/posts";
import { paths } from "../../lib/paths";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Dropdown, DropdownItem } from "../ui/Dropdown";
import { ConfirmDialog } from "../ui/ConfirmDialog";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [comments, setComments] = useState<any[] | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const isOwner = user && post.professional && user.role === "PROFESSIONAL";

  async function toggleLike() {
    if (!user) return toast.info("Connectez-vous pour aimer une publication.");
    await postsApi.like(post.id);
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function toggleSave() {
    if (!user) return toast.info("Connectez-vous pour enregistrer une publication.");
    await postsApi.save(post.id);
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function loadComments() {
    setShowComments((s) => !s);
    if (!comments) {
      const data = await postsApi.comments(post.id);
      setComments(data.comments);
    }
  }

  async function submitComment() {
    if (!comment.trim() || !user) return;
    const data = await postsApi.addComment(post.id, comment);
    setComments((c) => [...(c ?? []), data.comment]);
    setComment("");
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function handleShare() {
    const url = `${window.location.origin}${paths.discover}`;
    if (navigator.share) {
      await navigator.share({ title: "VEYZA", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers.");
    }
  }

  async function handleDelete() {
    await postsApi.remove(post.id);
    qc.invalidateQueries({ queryKey: ["feed"] });
    setConfirmDelete(false);
    toast.success("Publication supprimée.");
  }

  async function handleReport() {
    await postsApi.report(post.id, "Contenu inapproprié");
    toast.success("Publication signalée. Merci pour votre vigilance.");
  }

  return (
    <article className="rounded-lg border border-border bg-white shadow-card">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={post.professional ? paths.professional(post.professional.slug) : "#"} className="flex items-center gap-2.5">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-border bg-bg">
            {post.professional?.logoUrl && <img src={post.professional.logoUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-ink">{post.professional?.companyName || `${post.author.firstName} ${post.author.lastName}`}</p>
              {post.professional?.verified && <BadgeCheck size={14} className="text-primary" />}
              {post.professional?.isFounder && <Crown size={14} className="text-warning" />}
            </div>
            <p className="text-xs text-muted">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        <Dropdown
          align="right"
          trigger={({ toggle }) => (
            <button onClick={toggle} aria-label="Plus d'options" className="text-muted hover:text-ink">
              <MoreHorizontal size={18} />
            </button>
          )}
        >
          {(close) => (
            <div>
              <DropdownItem icon={<LinkIcon size={15} />} onClick={() => { close(); handleShare(); }}>
                Copier le lien
              </DropdownItem>
              {isOwner ? (
                <DropdownItem icon={<Trash2 size={15} />} danger onClick={() => { close(); setConfirmDelete(true); }}>
                  Supprimer
                </DropdownItem>
              ) : (
                <DropdownItem icon={<Flag size={15} />} onClick={() => { close(); handleReport(); }}>
                  Signaler
                </DropdownItem>
              )}
            </div>
          )}
        </Dropdown>
      </div>

      {post.images.length > 0 && (
        <div className="relative aspect-square w-full bg-bg">
          <img src={post.images[imgIndex]} alt="" className="h-full w-full object-cover" />
          {post.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {post.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full ${i === imgIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} aria-label={post.isLiked ? "Ne plus aimer" : "Aimer"} className="flex items-center gap-1.5 text-text hover:text-danger">
            <Heart size={20} className={post.isLiked ? "fill-danger text-danger" : ""} />
            <span className="text-sm">{post.likeCount}</span>
          </button>
          <button onClick={loadComments} aria-label="Commentaires" className="flex items-center gap-1.5 text-text hover:text-primary">
            <MessageCircle size={20} />
            <span className="text-sm">{post.commentCount}</span>
          </button>
          <button onClick={handleShare} aria-label="Partager" className="text-text hover:text-primary">
            <Share2 size={20} />
          </button>
          <button onClick={toggleSave} aria-label={post.isSaved ? "Retirer des enregistrements" : "Enregistrer"} className="ml-auto text-text hover:text-primary">
            <Bookmark size={20} className={post.isSaved ? "fill-ink text-ink" : ""} />
          </button>
        </div>
        {post.description && <p className="mt-2 text-sm text-text">{post.description}</p>}
        {post.hashtags && <p className="mt-1 text-sm text-primary">{post.hashtags}</p>}

        {showComments && (
          <div className="mt-3 space-y-2.5 border-t border-border pt-3">
            {comments === null ? (
              <p className="text-sm text-muted">Chargement...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted">Aucun commentaire. Soyez le premier à réagir.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <span className="font-medium text-ink">{c.user.firstName} {c.user.lastName}</span>
                  <span className="text-text">{c.text}</span>
                </div>
              ))
            )}
            {user && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder="Ajouter un commentaire..."
                  aria-label="Ajouter un commentaire"
                  className="flex-1 rounded-full border border-border bg-bg px-3.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={submitComment} aria-label="Envoyer" className="text-primary">
                  <Send size={17} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer la publication"
        message="Cette publication sera définitivement supprimée. Voulez-vous continuer ?"
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </article>
  );
}
