import { LegalPage } from "../../../components/layout/LegalPage";

export function Cgv() {
  return (
    <LegalPage title="Conditions générales de vente" updated="24 août 2026">
      <p>
        Les présentes conditions générales de vente régissent l'utilisation de la plateforme VEYZA, éditée par{" "}
        <strong>[NOM ENTREPRISE]</strong> (<strong>[SIRET]</strong>), mettant en relation des professionnels du car care
        (« Professionnels ») et des particuliers (« Clients »).
      </p>
      <h2>1. Objet</h2>
      <p>VEYZA propose un service de mise en relation et de réservation de prestations automobiles entre Clients et Professionnels référencés sur la plateforme.</p>
      <h2>2. Réservations</h2>
      <p>
        Toute demande de réservation effectuée sur VEYZA est soumise à l'acceptation du Professionnel concerné. Le Client est
        informé du statut de sa demande (en attente, confirmée, refusée) directement sur son espace personnel.
      </p>
      <h2>3. Prix et paiement</h2>
      <p>
        Les prix affichés sont ceux communiqués par chaque Professionnel. Les modalités de paiement en ligne seront précisées
        lors de leur mise en place (voir architecture décrite en §90 de la spécification produit).
      </p>
      <h2>4. Commission VEYZA</h2>
      <p>
        VEYZA perçoit une commission sur les transactions réalisées via la plateforme, dont le taux dépend du plan
        d'abonnement du Professionnel au moment de la prestation. Ce taux est indiqué au Professionnel dans son espace dédié.
      </p>
      <h2>5. Programme Founding Partner</h2>
      <p>
        Les Professionnels ayant rejoint VEYZA en tant que Founding Partner bénéficient d'un accès PRO gratuit à vie. Ce
        statut est permanent et ne peut être retiré que par [NOM ENTREPRISE] en cas de manquement grave aux présentes CGV.
      </p>
      <h2>6. Annulation</h2>
      <p>Le Client et le Professionnel peuvent annuler une réservation tant que celle-ci n'a pas été marquée comme terminée, dans les conditions précisées sur la plateforme.</p>
      <h2>7. Contact</h2>
      <p>Pour toute question relative aux présentes CGV : <strong>[EMAIL]</strong>.</p>
    </LegalPage>
  );
}
