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
              Dernière mise à jour : 12 avril 2026
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

            <Section title="6. Hébergement et sous-traitants">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Usage</th>
                    <th>Localisation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Supabase</td>
                    <td>Base de données, authentification</td>
                    <td>UE (AWS eu-west)</td>
                  </tr>
                  <tr>
                    <td>Vercel</td>
                    <td>Hébergement de l&apos;application</td>
                    <td>Global (Edge)</td>
                  </tr>
                  <tr>
                    <td>Resend</td>
                    <td>Envoi d&apos;emails transactionnels</td>
                    <td>USA</td>
                  </tr>
                  <tr>
                    <td>Google (Gmail API)</td>
                    <td>Envoi de quittances depuis votre Gmail</td>
                    <td>USA</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section title="7. Durée de conservation">
              <p>
                Vos données sont conservées tant que votre compte est actif. En
                cas de suppression de compte, toutes vos données sont supprimées
                sous 30 jours.
              </p>
            </Section>

            <Section title="8. Vos droits">
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

            <Section title="9. Cookies">
              <p>
                Baily utilise uniquement des cookies strictement nécessaires au
                fonctionnement du service (session d&apos;authentification).
                Aucun cookie de tracking, d&apos;analytics ou publicitaire
                n&apos;est utilisé.
              </p>
            </Section>

            <Section title="10. Modifications">
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
