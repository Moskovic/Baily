"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";

export function ShowEndedToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  function onChange(value: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("ended", "1");
    else params.delete("ended");
    const qs = params.toString();
    start(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
      <Switch
        checked={initial}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        disabled={pending}
      />
      Afficher les baux terminés
    </label>
  );
}
