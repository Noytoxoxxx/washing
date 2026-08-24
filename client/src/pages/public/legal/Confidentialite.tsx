import { LegalPage } from "../../../components/layout/LegalPage";

export function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité" updated="24 août 2026">
      <p>
        <strong>[NOM ENTREPRISE]</strong> attache une grande importance à la protection des données personnelles des
        utilisateurs de VEYZA, conformément au Règlement Général sur la Protection des Données (RGPD).
      </p>
      <h2>1. Données collectées</h2>
      <p>
        Nous collectons les données que vous nous fournissez directement (identité, coordonnées, véhicules, historique de
        réservations) ainsi que des données techniques (adresse IP, géolocalisation si autorisée).
      </p>
      <h2>2. Finalités</h2>
      <p>Ces données sont utilisées pour la gestion de votre compte, la mise en relation avec les professionnels, l'amélioration du service et l'envoi de notifications liées à votre activité.</p>
      <h2>3. Destinataires</h2>
      <p>Vos données sont accessibles par [NOM ENTREPRISE] et, dans la limite nécessaire à la prestation, par le Professionnel avec lequel vous interagissez.</p>
      <h2>4. Durée de conservation</h2>
      <p>Vos données sont conservées pendant la durée de votre compte, puis archivées ou supprimées conformément aux obligations légales.</p>
      <h2>5. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos
        données. Pour exercer ces droits, contactez-nous à <strong>[EMAIL]</strong>.
      </p>
      <h2>6. Contact du délégué à la protection des données</h2>
      <p>[EMAIL]</p>
    </LegalPage>
  );
}
