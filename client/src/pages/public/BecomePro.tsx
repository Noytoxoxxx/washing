import { Link } from "react-router-dom";
import { Sparkles, Crown, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { paths } from "../../lib/paths";

const BENEFITS = [
  { icon: Users, title: "Une nouvelle clientèle", text: "Soyez visible auprès des automobilistes qui cherchent un professionnel du car care près de chez eux." },
  { icon: TrendingUp, title: "Un vrai tableau de bord", text: "Réservations, statistiques, avis clients et calendrier centralisés dans votre espace pro." },
  { icon: Sparkles, title: "Une vitrine sociale", text: "Publiez vos avant/après, vos prestations et développez votre communauté directement sur VEYZA." },
];

export function BecomePro() {
  return (
    <div>
      <section className="bg-ink px-4 py-20 text-center text-white sm:px-6">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <Crown size={14} /> Programme Founding Partner
          </span>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Rejoignez VEYZA en tant que professionnel</h1>
          <p className="mt-4 text-white/70">
            Les premiers professionnels à rejoindre VEYZA obtiennent le statut <strong>Founding Partner</strong> : accès PRO
            gratuit, à vie.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={paths.contact}>
              <Button size="lg">Nous contacter</Button>
            </Link>
            <Link to={paths.proLogin}>
              <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                J'ai déjà un compte pro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-lg border border-border bg-white p-6 shadow-card">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-primary-light">
                <b.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-ink">{b.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-ink">Comment ça marche ?</h2>
          <div className="mt-8 space-y-4">
            {[
              "Contactez-nous via le formulaire pour candidater au programme Founding Partner.",
              "Notre équipe crée votre accès professionnel et vous accompagne dans l'onboarding.",
              "Complétez votre profil, ajoutez vos prestations et vos photos.",
              "Votre profil est vérifié puis publié : vous apparaissez dans Explorer.",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-border p-4">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-sm text-text">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
