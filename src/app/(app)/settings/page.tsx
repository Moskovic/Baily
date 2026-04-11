import { CheckCircle2, Mail, Palette, PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignaturePad } from "@/components/signature-pad";
import { ProfileForm } from "./profile-form";
import { DisconnectGmailButton } from "./disconnect-gmail";
import { ThemeSelect } from "@/components/theme-select";

type SearchParams = Promise<{ gmail_ok?: string; gmail_error?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { gmail_ok, gmail_error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, address, gmail_email, gmail_connected_at, signature_data_url")
    .eq("id", user!.id)
    .single();

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Vos informations de bailleur et connexion Gmail."
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5" />
              Apparence
            </CardTitle>
            <CardDescription>
              Choisissez le thème de l&apos;interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelect />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profil bailleur</CardTitle>
            <CardDescription>
              Ces informations apparaissent sur les quittances générées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultValues={{
                full_name: profile?.full_name ?? "",
                address: profile?.address ?? "",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="size-5" />
              Signature
            </CardTitle>
            <CardDescription>
              Dessinez votre signature. Elle sera ajoutée en bas de chaque
              quittance générée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignaturePad existing={profile?.signature_data_url ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Connexion Gmail
            </CardTitle>
            <CardDescription>
              Envoyez les quittances depuis votre propre compte Gmail.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {gmail_ok && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                Gmail connecté avec succès.
              </div>
            )}
            {gmail_error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Erreur de connexion : {gmail_error}
              </div>
            )}

            {profile?.gmail_email ? (
              <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{profile.gmail_email}</div>
                    <div className="text-xs text-muted-foreground">
                      Connecté — prêt à envoyer des quittances.
                    </div>
                  </div>
                </div>
                <DisconnectGmailButton />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Badge variant="secondary">Non connecté</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Vous ne pourrez pas envoyer de quittances tant que
                    Gmail n&apos;est pas connecté.
                  </p>
                </div>
                <Button asChild>
                  <a href="/api/gmail/connect">Connecter Gmail</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
