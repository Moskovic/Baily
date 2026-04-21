import type { Metadata } from "next";
import { PublicLayout } from "@/components/public-layout";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Baily",
};

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
          <header className="mb-12">
            <p className="text-sm font-medium text-primary">Juridique</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              Politique de confidentialité
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Dernière mise à jour : 21 avril 2026
            </p>
          </header>

          <div className="prose-baily">
            <Section title="1. Introduction">
              <p>
                Baily (<strong>baily.app</strong>) est un service en ligne
                permettant aux propriétaires bailleurs de créer, gérer et
                envoyer des quittances de loyer à leurs locataires.
              </p>
              <p>
                La présente politique de confidentialité décrit les données
                personnelles que nous collectons, pourquoi nous les collectons,
                et comment nous les utilisons.
              </p>
            </Section>

            <Section title="2. Responsable du traitement">
              <p>
                Le responsable du traitement est Marius Moskovic, éditeur du
                service Baily, joignable à l&apos;adresse{" "}
                <a href="mailto:contact@baily.app">contact@baily.app</a>.
              </p>
            </Section>

            <Section title="3. Données collectées">
              <h4>Données de compte</h4>
              <ul>
                <li>Adresse email (pour l&apos;authentification)</li>
                <li>Nom complet et adresse postale (optionnels, renseignés par l&apos;utilisateur)</li>
              </ul>

              <h4>Données de gestion locative</h4>
              <ul>
                <li>Informations sur les biens (libellé, adresse, type)</li>
                <li>Informations sur les locataires (nom, email, téléphone)</li>
                <li>Informations sur les baux (montants, dates, échéances)</li>
                <li>Quittances générées (montants, statut, dates d&apos;envoi)</li>
              </ul>

              <h4>Signature manuscrite</h4>
              <p>
                Si vous dessinez une signature dans l&apos;application, celle-ci
                est stockée sous forme d&apos;image encodée dans votre profil.
              </p>

              <h4>Connexion Gmail</h4>
              <p>
                Si vous connectez votre compte Gmail, nous stockons un jeton
                d&apos;actualisation (refresh token) permettant d&apos;envoyer
                des emails en votre nom. Nous n&apos;accédons qu&apos;au scope{" "}
                <code>gmail.send</code> — nous ne lisons jamais vos emails.
              </p>
            </Section>

            <Section title="4. Finalités du traitement">
              <ul>
                <li>Authentification et gestion de votre compte</li>
                <li>Génération et envoi de quittances de loyer (PDF + email)</li>
                <li>Affichage de votre signature sur les quittances</li>
                <li>Envoi d&apos;emails de connexion (codes OTP, liens magiques)</li>
              </ul>
            </Section>

            <Section title="5. Base légale">
              <p>
                Le traitement de vos données repose sur{" "}
                <strong>l&apos;exécution du contrat</strong> (fourniture du
                service) et, pour la connexion Gmail, sur votre{" "}
                <strong>consentement explicite</strong> (que vous pouvez
                révoquer à tout moment dans les paramètres).
              </p>
            </Section>

            <Section title="6. Partage des données">
              <p>
                <strong>
                  Nous ne vendons, ne louons et ne partageons jamais les données
                  utilisateur Google (Gmail user data) avec des tiers
                </strong>{" "}
                à des fins publicitaires, commerciales ou analytiques.
              </p>
              <p>
                Les données utilisateur Google (y compris votre adresse email
                Google, le jeton OAuth d&apos;actualisation et le contenu des
                quittances envoyées via votre Gmail) ne sont partagées
                qu&apos;avec les sous-traitants techniques strictement
                nécessaires au fonctionnement du service :
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Sous-traitant</th>
                    <th>Données traitées</th>
                    <th>Finalité</th>
                    <th>Localisation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Supabase</td>
                    <td>Email, jeton OAuth, données locatives</td>
                    <td>Base de données, authentification</td>
                    <td>UE (AWS eu-west)</td>
                  </tr>
                  <tr>
                    <td>Vercel</td>
                    <td>Trafic HTTP (sans stockage persistant)</td>
                    <td>Hébergement de l&apos;application</td>
                    <td>Global (Edge)</td>
                  </tr>
                  <tr>
                    <td>Resend</td>
                    <td>Email de l&apos;utilisateur (destinataire)</td>
                    <td>Envoi des codes de connexion</td>
                    <td>USA</td>
                  </tr>
                  <tr>
                    <td>Google (Gmail API)</td>
                    <td>Jeton OAuth, contenu des quittances</td>
                    <td>Envoi de quittances depuis votre propre Gmail</td>
                    <td>USA</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Ces sous-traitants sont liés contractuellement au respect de la
                confidentialité et à des obligations de sécurité. Les transferts
                hors UE (Vercel, Resend, Google) sont encadrés par les{" "}
                <strong>Clauses Contractuelles Types</strong> de la Commission
                européenne.
              </p>
              <p>
                Nous pouvons également divulguer certaines données si la loi
                l&apos;exige (réquisition judiciaire, obligation légale).
                Aucune autre forme de partage n&apos;est effectuée.
              </p>
              <h4>Restriction d&apos;usage spécifique aux données Google</h4>
              <p>
                L&apos;utilisation par Baily des données reçues via les API
                Google est conforme à la{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google API Services User Data Policy
                </a>
                , y compris les exigences d&apos;usage limité (Limited Use). Les
                données utilisateur Google ne sont <strong>pas utilisées</strong>{" "}
                pour du profilage, de la publicité, de la vente, de
                l&apos;analyse de contenu, de l&apos;entraînement de modèles
                d&apos;IA ou tout autre usage non nécessaire à la
                fonctionnalité d&apos;envoi de quittances.
              </p>
            </Section>

            <Section title="7. Sécurité et protection des données">
              <p>
                Nous mettons en œuvre des mesures techniques et
                organisationnelles pour protéger vos données, y compris les
                données sensibles telles que le jeton OAuth Gmail :
              </p>
              <ul>
                <li>
                  <strong>Chiffrement en transit</strong> — toutes les
                  communications sont chiffrées via HTTPS/TLS 1.2+.
                </li>
                <li>
                  <strong>Chiffrement au repos</strong> — la base de données
                  Supabase (PostgreSQL) est chiffrée au repos (AES-256) par
                  notre hébergeur.
                </li>
                <li>
                  <strong>Row Level Security (RLS)</strong> — chaque table de
                  notre base de données applique des politiques RLS strictes
                  garantissant qu&apos;un utilisateur ne peut accéder
                  qu&apos;à ses propres données.
                </li>
                <li>
                  <strong>Isolation des jetons OAuth</strong> — les jetons
                  d&apos;actualisation Gmail sont stockés dans une colonne
                  protégée par RLS et uniquement accessibles par le
                  back-end via une clé de service privée.
                </li>
                <li>
                  <strong>Authentification forte</strong> — l&apos;accès au
                  compte utilisateur se fait par code à usage unique (OTP) ou
                  lien magique envoyé par email, sans mot de passe réutilisable.
                </li>
                <li>
                  <strong>Accès minimal aux scopes</strong> — nous ne
                  demandons que le scope <code>gmail.send</code>, jamais
                  l&apos;accès en lecture à votre boîte mail, à vos contacts,
                  ou à vos autres données Google.
                </li>
                <li>
                  <strong>Secrets et clés API</strong> — les secrets
                  (Google Client Secret, clé de service Supabase, clés SMTP)
                  sont stockés dans les variables d&apos;environnement
                  chiffrées de notre plateforme d&apos;hébergement, et ne sont
                  jamais exposés au client.
                </li>
                <li>
                  <strong>Journalisation limitée</strong> — aucun contenu
                  d&apos;email ni jeton n&apos;est écrit dans nos logs.
                </li>
              </ul>
            </Section>

            <Section title="8. Durée de conservation et suppression">
              <p>
                Vos données sont conservées tant que votre compte est actif.
              </p>
              <ul>
                <li>
                  <strong>Révocation de l&apos;accès Gmail</strong> — vous
                  pouvez déconnecter votre compte Gmail à tout moment depuis la
                  page &laquo;&nbsp;Paramètres&nbsp;&raquo; de Baily. Le jeton
                  OAuth est immédiatement supprimé de notre base de données.
                  Vous pouvez également révoquer l&apos;accès depuis votre{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    compte Google
                  </a>
                  .
                </li>
                <li>
                  <strong>Suppression du compte</strong> — vous pouvez
                  demander la suppression complète de votre compte et de
                  l&apos;ensemble de vos données en écrivant à{" "}
                  <a href="mailto:contact@baily.app">contact@baily.app</a>.
                  Toutes les données sont supprimées définitivement sous{" "}
                  <strong>30 jours</strong> à compter de la demande.
                </li>
              </ul>
            </Section>

            <Section title="9. Vos droits">
              <p>
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul>
                <li><strong>Accès</strong> — consulter les données que nous détenons sur vous</li>
                <li><strong>Rectification</strong> — corriger vos informations</li>
                <li><strong>Suppression</strong> — demander la suppression de votre compte et de vos données</li>
                <li><strong>Portabilité</strong> — récupérer vos données dans un format structuré</li>
                <li><strong>Opposition</strong> — vous opposer à certains traitements</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à{" "}
                <a href="mailto:contact@baily.app">contact@baily.app</a>.
              </p>
            </Section>

            <Section title="10. Cookies">
              <p>
                Baily utilise uniquement des cookies strictement nécessaires au
                fonctionnement du service (session d&apos;authentification).
                Aucun cookie de tracking, d&apos;analytics ou publicitaire
                n&apos;est utilisé.
              </p>
            </Section>

            <Section title="11. Modifications">
              <p>
                Nous pouvons mettre à jour cette politique. En cas de
                modification substantielle, un bandeau vous en informera lors de
                votre prochaine connexion.
              </p>
            </Section>
          </div>
        </article>
      </main>
    </PublicLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h3 className="mb-4 text-xl font-semibold tracking-tight">{title}</h3>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-muted-foreground [&_strong]:text-foreground [&_strong]:font-medium [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-5 [&_h4]:mb-2 [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_th]:text-left [&_th]:font-medium [&_th]:text-foreground [&_th]:pb-2 [&_th]:pr-4 [&_th]:border-b [&_td]:py-2 [&_td]:pr-4 [&_td]:border-b">
        {children}
      </div>
    </section>
  );
}
