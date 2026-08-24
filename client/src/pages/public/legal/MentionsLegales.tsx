import { LegalPage } from "../../../components/layout/LegalPage";

export function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updated="24 août 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site VEYZA est édité par <strong>[NOM ENTREPRISE]</strong>, [FORME JURIDIQUE], au capital de [CAPITAL SOCIAL],
        immatriculée sous le numéro SIRET <strong>[SIRET]</strong>, dont le siège social est situé au <strong>[ADRESSE]</strong>.
      </p>
      <p>
        Directeur de la publication : [NOM DU DIRECTEUR DE PUBLICATION]
        <br />
        Contact : <strong>[EMAIL]</strong>
      </p>
      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>[HÉBERGEUR]</strong>, [ADRESSE DE L'HÉBERGEUR].
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments du site VEYZA (textes, marques, logos, illustrations) sont la propriété exclusive de{" "}
        <strong>[NOM ENTREPRISE]</strong>, sauf mention contraire, et ne peuvent être reproduits sans autorisation préalable.
      </p>
      <h2>Contact</h2>
      <p>Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l'adresse [EMAIL].</p>
    </LegalPage>
  );
}
