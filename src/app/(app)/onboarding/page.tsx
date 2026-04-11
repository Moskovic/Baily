import { PageHeader } from "@/components/page-header";
import { getOnboardingStatus } from "./actions";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  const status = await getOnboardingStatus();

  return (
    <>
      <PageHeader
        title="Configuration"
        description="Configurez votre espace Baily en quelques étapes."
      />
      <OnboardingWizard initial={status} />
    </>
  );
}
