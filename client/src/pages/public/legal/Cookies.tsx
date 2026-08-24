import { LegalPage } from "../../../components/layout/LegalPage";

export function Cookies() {
  return (
    <LegalPage title="Politique de cookies" updated="24 août 2026">
      <p>VEYZA utilise des cookies strictement nécessaires au fonctionnement de la plateforme.</p>
      <h2>1. Cookies essentiels</h2>
      <p>
        Un cookie de session (<code>veyza_session</code>) permet de vous maintenir connecté à votre compte de manière
        sécurisée. Il est indispensable au fonctionnement du site et ne peut être désactivé.
      </p>
      <h2>2. Cookies de préférence</h2>
      <p>Certaines préférences d'affichage (par exemple l'état réduit du menu latéral) sont stockées localement dans votre navigateur.</p>
      <h2>3. Cookies tiers</h2>
      <p>VEYZA n'utilise pas de cookies publicitaires ou de traceurs tiers à ce jour.</p>
      <h2>4. Gestion des cookies</h2>
      <p>Vous pouvez configurer votre navigateur pour refuser les cookies ; certaines fonctionnalités du site pourraient alors ne plus fonctionner correctement.</p>
      <h2>5. Contact</h2>
      <p>[EMAIL]</p>
    </LegalPage>
  );
}
