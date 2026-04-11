"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: { full_name: string; address: string };
}) {
  const [pending, start] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  function onSubmit(formData: FormData) {
    start(async () => {
      const r = await updateProfile(formData);
      if (r?.error) toast.error(r.error);
      else toast.success("Profil mis à jour");
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Nom complet</Label>
        <div className="relative">
          <Input
            ref={nameRef}
            id="full_name"
            name="full_name"
            defaultValue={defaultValues.full_name}
          />
          {defaultValues.full_name && (
            <button
              type="button"
              onClick={() => {
                if (nameRef.current) nameRef.current.value = "";
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Effacer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Adresse postale</Label>
        <Input
          id="address"
          name="address"
          placeholder="12 rue de la Paix, 75002 Paris"
          defaultValue={defaultValues.address}
        />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
