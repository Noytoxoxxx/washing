import { FormEvent, useRef, useState } from "react";
import { User, Shield, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { meApi } from "../../api/me";
import { api, ApiClientError } from "../../api/client";

export function ClientSettings() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "", phone: user?.phone || "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  const [notifs, setNotifs] = useState({
    notifyEmail: user?.notifyEmail ?? true,
    notifyBooking: user?.notifyBooking ?? true,
    notifyLikes: user?.notifyLikes ?? true,
    notifyFollows: user?.notifyFollows ?? true,
  });

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await meApi.update(profile);
      await refresh();
      toast.success("Profil mis à jour.");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const { url } = await api.upload(file);
      await meApi.update({ avatarUrl: url });
      await refresh();
      toast.success("Photo de profil mise à jour.");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Échec de l'envoi de l'image.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwdError(null);
    if (pwd.newPassword.length < 8) return setPwdError("8 caractères minimum.");
    if (pwd.newPassword !== pwd.confirm) return setPwdError("Les mots de passe ne correspondent pas.");
    setSavingPwd(true);
    try {
      await api.post("/auth/change-password", { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success("Mot de passe modifié.");
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwdError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setSavingPwd(false);
    }
  }

  async function saveNotifs(patch: Partial<typeof notifs>) {
    const next = { ...notifs, ...patch };
    setNotifs(next);
    await meApi.update(patch);
    toast.success("Préférences enregistrées.");
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Paramètres" description="Gérez votre profil, votre sécurité et vos notifications." />

      <section className="mb-8 rounded-lg border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink"><User size={18} /> Profil</h2>
        <div className="mb-5 flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-bg">
            {user?.avatarUrl && <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            <Button variant="outline" size="sm" loading={avatarUploading} onClick={() => fileRef.current?.click()}>
              Changer la photo
            </Button>
          </div>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} />
            <Input label="Nom" value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} />
          </div>
          <Input label="Email" value={user?.email || ""} disabled hint="Contactez le support pour changer votre email." />
          <Input label="Téléphone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>
              Enregistrer
            </Button>
          </div>
        </form>
      </section>

      <section className="mb-8 rounded-lg border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink"><Shield size={18} /> Sécurité</h2>
        <form onSubmit={savePassword} className="space-y-4">
          {pwdError && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{pwdError}</p>}
          <Input label="Mot de passe actuel" type="password" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
          <Input label="Nouveau mot de passe" type="password" hint="8 caractères minimum" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} />
          <Input label="Confirmer le mot de passe" type="password" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} />
          <div className="flex justify-end">
            <Button type="submit" loading={savingPwd}>
              Modifier le mot de passe
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink"><Bell size={18} /> Notifications</h2>
        <div className="space-y-4">
          <Switch label="Notifications par email" checked={notifs.notifyEmail} onChange={(v) => saveNotifs({ notifyEmail: v })} />
          <Switch label="Réservations" checked={notifs.notifyBooking} onChange={(v) => saveNotifs({ notifyBooking: v })} />
          <Switch label="Likes" checked={notifs.notifyLikes} onChange={(v) => saveNotifs({ notifyLikes: v })} />
          <Switch label="Nouveaux abonnés" checked={notifs.notifyFollows} onChange={(v) => saveNotifs({ notifyFollows: v })} />
        </div>
      </section>
    </div>
  );
}
