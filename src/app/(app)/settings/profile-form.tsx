"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaultValues.full_name}
          required
        />
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
