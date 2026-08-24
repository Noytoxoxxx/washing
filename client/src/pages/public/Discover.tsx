import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { postsApi } from "../../api/posts";
import { PostCard } from "../../components/social/PostCard";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function Discover() {
  useDocumentTitle("Découvrir");
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "following">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["feed", tab, page],
    queryFn: () => postsApi.feed({ page, following: tab === "following" }),
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-xl font-bold text-ink">Découvrir</h1>
      {user && (
        <div className="mb-5 flex gap-1 rounded-md border border-border bg-white p-1">
          <button
            onClick={() => { setTab("all"); setPage(1); }}
            className={`flex-1 rounded-sm py-1.5 text-sm font-medium ${tab === "all" ? "bg-primary text-white" : "text-text"}`}
          >
            Pour vous
          </button>
          <button
            onClick={() => { setTab("following"); setPage(1); }}
            className={`flex-1 rounded-sm py-1.5 text-sm font-medium ${tab === "following" ? "bg-primary text-white" : "text-text"}`}
          >
            Abonnements
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !data || data.posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={tab === "following" ? "Aucune publication de vos abonnements" : "Aucune publication pour le moment"}
          description={tab === "following" ? "Suivez des professionnels pour voir leurs publications ici." : "Les premières publications VEYZA arrivent bientôt."}
        />
      ) : (
        <>
          <div className="space-y-5">
            {data.posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
          <div className="mt-6">
            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
