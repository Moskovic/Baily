"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendOverdueReminder } from "./actions";

export function OverdueTestButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const r = await sendOverdueReminder();
          if (r.error) {
            toast.error(r.error);
            return;
          }
          if (r.count === 0) {
            toast.success("Aucune quittance en retard", {
              description: "Rien à notifier, tout est à jour.",
            });
          } else {
            toast.success("Rappel envoyé", {
              description: `${r.count} quittance(s) en retard — email envoyé.`,
            });
          }
        });
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <BellRing />}
      Tester le rappel
    </Button>
  );
}
