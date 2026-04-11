"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteReceipt } from "./actions";

export function DeleteReceiptButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer cette quittance ?")) return;
        start(async () => {
          const r = await deleteReceipt(id);
          if (r?.error) toast.error(r.error);
          else toast.success("Supprimée");
        });
      }}
    >
      <Trash2 />
    </Button>
  );
}
