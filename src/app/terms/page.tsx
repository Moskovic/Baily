import type { Metadata } from "next";
import { PublicLayout } from "@/components/public-layout";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Baily",
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
          <header className="mb-12">
            <p className="text-sm font-medium text-primary">Juridique</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              Conditions générales d&apos;utilisation
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Dernière mise à jour : 12 avril 2026
            </p>
          </header>

          <div className="prose-baily">
            <Section title="1. Objet">
              <p>
                Les présentes conditions générales d&apos;utilisation (ci-après
                &laquo;&nbsp;CGU&nbsp;&raquo;) régissent l&apos;accès et
                l&apos;utilisation du service Baily, accessible à l&apos;adresse{" "}
                <a href="https://baily.app">baily.app</a>.
              </p>
              <p>
                Baily est un outil en ligne permettant aux propriétaires
                bailleurs de générer et d&apos;envoyer des quittances de loyer
                à leurs locataires.
              </p>
            </Section>

            <Section title="2. Éditeur du service">
              <p>
                Le service est édité par Marius Moskovic, joignable à
                l&apos;adresse{" "}
                <a href="mailto:contact@baily.app">contact@baily.app</a>.
              </p>
              <p>
                Hébergement : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA
                91723, USA.
              </p>
            </Section>

            <Section title="3. Inscription et compte">
              <p>
                L&apos;utilisation de Baily nécessite la création d&apos;un
                compte via une adresse email. L&apos;authentification se fait
                par code à usage unique (OTP) ou lien magique envoyé par email.
              </p>
              <p>
                Vous êtes responsable de la confidentialité de votre accès et
                de toutes les actions effectuées depuis votre compte.
              </p>
            </Section>

            <Section title="4. Description du service">
              <p>Baily permet de :</p>
              <ul>
                <li>Enregistrer des biens immobiliers, locataires et baux</li>
                <li>Générer des quittances de loyer au format PDF</li>
                <li>Envoyer ces quittances par email via votre propre compte Gmail</li>
                <li>Apposer une signature manuscrite numérique sur les quittances</li>
              </ul>
            </Section>

            <Section title="5. Tarification">
              <p>
                Baily est actuellement proposé <strong>gratuitement</strong>.
                Nous nous réservons le droit d&apos;introduire des
                fonctionnalités payantes à l&apos;avenir, auquel cas les
                utilisateurs existants seront informés au préalable.
              </p>
            </Section>

            <Section title="6. Connexion Gmail">
              <p>
                Pour envoyer des quittances par email, vous pouvez connecter
                votre compte Gmail à Baily. Cette connexion utilise le
                protocole OAuth 2.0 de Google.
              </p>
              <ul>
                <li>
                  Baily demande uniquement la permission d&apos;
                  <strong>envoyer des emails</strong> en votre nom (scope{" "}
                  <code>gmail.send</code>).
                </li>
                <li>
                  Baily <strong>ne lit jamais</strong> vos emails, contacts ou
                  autres données Gmail.
                </li>
                <li>
                  Vous pouvez révoquer cette connexion à tout moment depuis les
                  paramètres de Baily ou depuis votre{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    compte Google
                  </a>
                  .
                </li>
              </ul>
            </Section>

            <Section title="7. Responsabilités de l'utilisateur">
              <ul>
                <li>
                  Vous êtes seul responsable de l&apos;exactitude des
                  informations saisies (montants, dates, coordonnées).
                </li>
                <li>
                  Les quittances générées par Baily sont des documents fournis à
                  titre d&apos;outil. Il vous appartient de vérifier leur
                  conformité avec la législation en vigueur.
                </li>
                <li>
                  Baily ne se substitue pas à un conseil juridique ou comptable.
                </li>
              </ul>
            </Section>

            <Section title="8. Limitation de responsabilité">
              <p>
                Baily est fourni &laquo;&nbsp;en l&apos;état&nbsp;&raquo;. Nous
                nous efforçons d&apos;assurer la disponibilité et la fiabilité
                du service, mais ne garantissons pas une disponibilité
                ininterrompue.
              </p>
              <p>
                En aucun cas Baily ne pourra être tenu responsable de dommages
                indirects, pertes de données ou préjudices résultant de
                l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le
                service.
              </p>
            </Section>

            <Section title="9. Propriété intellectuelle">
              <p>
                Le code source, le design, les textes et la marque Baily sont
                la propriété de l&apos;éditeur. Vos données vous appartiennent
                — vous pouvez les exporter ou les supprimer à tout moment.
              </p>
            </Section>

            <Section title="10. Résiliation">
              <p>
                Vous pouvez cesser d&apos;utiliser Baily à tout moment. Pour
                demander la suppression de votre compte et de toutes vos
                données, contactez{" "}
                <a href="mailto:contact@baily.app">contact@baily.app</a>.
              </p>
              <p>
                Nous nous réservons le droit de suspendre ou supprimer un compte
                en cas d&apos;utilisation abusive ou contraire aux présentes
                CGU.
              </p>
            </Section>

            <Section title="11. Droit applicable">
              <p>
                Les présentes CGU sont soumises au droit français. Tout litige
                sera porté devant les tribunaux compétents de Paris.
              </p>
            </Section>

            <Section title="12. Modifications">
              <p>
                Nous pouvons modifier ces CGU à tout moment. Les modifications
                prennent effet dès leur publication. En cas de changement
                majeur, un email de notification sera envoyé aux utilisateurs
                inscrits.
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
      <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-muted-foreground [&_strong]:text-foreground [&_strong]:font-medium [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono">
        {children}
      </div>
    </section>
  );
}
