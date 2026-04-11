"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { disconnectGmail } from "./actions";

export function DisconnectGmailButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Déconnecter Gmail ?")) return;
        start(async () => {
          const r = await disconnectGmail();
          if (r?.error) toast.error(r.error);
          else toast.success("Gmail déconnecté");
        });
      }}
    >
      Déconnecter
    </Button>
  );
}
