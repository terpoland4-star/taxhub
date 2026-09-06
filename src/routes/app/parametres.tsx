import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { saveProfile } from "@/lib/server/workspace";
import { isUnauthorized, useRefreshWorkspace, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/app/parametres")({ component: SettingsPage });

function SettingsPage() {
  const ws = useWorkspace();
  const refresh = useRefreshWorkspace();
  const user = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<"pme" | "cabinet">("pme");
  const [cabinetName, setCabinetName] = useState("");

  useEffect(() => {
    if (!ws.data) return;
    setFullName(ws.data.profile.full_name);
    setPhone(ws.data.profile.phone);
    setAccountType(ws.data.profile.account_type === "cabinet" ? "cabinet" : "pme");
    setCabinetName(ws.data.cabinets[0]?.name ?? "");
  }, [ws.data]);

  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Compte</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Paramètres</h1>
        <p className="mt-1 text-sm text-muted">{user?.primaryEmail}</p>
      </header>
      <form
        className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await saveProfile({ data: { fullName, phone, accountType, cabinetName } });
            await refresh();
            toast.success("Profil enregistré");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Enregistrement impossible");
          }
        }}
      >
        <Field label="Nom">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Téléphone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Type de compte">
          <Select value={accountType} onChange={(e) => setAccountType(e.target.value as "pme" | "cabinet")}>
            <option value="pme">PME (une entreprise)</option>
            <option value="cabinet">Cabinet comptable</option>
          </Select>
        </Field>
        {accountType === "cabinet" ? (
          <Field label="Nom du cabinet">
            <Input value={cabinetName} onChange={(e) => setCabinetName(e.target.value)} />
          </Field>
        ) : null}
        <Button type="submit">Enregistrer</Button>
      </form>
      <p className="text-xs leading-relaxed text-subtle">
        Chiffrement au repos, journal d’accès et revue des permissions API sont prévus en durcissement
        Phase 2 — hors périmètre de cette démo, mais le modèle de données isole déjà chaque compte.
      </p>
    </div>
  );
}
