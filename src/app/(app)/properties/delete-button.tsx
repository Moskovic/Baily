"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProperty } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer ce bien ?")) return;
        start(async () => {
          const r = await deleteProperty(id);
          if (r?.error) toast.error(r.error);
          else toast.success("Supprimé");
        });
      }}
    >
      <Trash2 />
    </Button>
  );
}
