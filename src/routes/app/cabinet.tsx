import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatXof, REGIME_LABELS } from "@/lib/fiscal/format";
import type { Activity, LegalForm, Regime } from "@/lib/fiscal/types";
import { saveCabinetBrand, saveProfile, setActiveCompany, upsertCompany } from "@/lib/server/workspace";
import { isUnauthorized, useRefreshWorkspace, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/cabinet")({ component: CabinetPage });

function CabinetPage() {
  const ws = useWorkspace();
  const refresh = useRefreshWorkspace();
  const [clientName, setClientName] = useState("");
  const [clientRegime, setClientRegime] = useState<Regime>("synthetique");
  const cab = ws.data?.cabinets[0];
  const [cabName, setCabName] = useState(cab?.name ?? "");
  const [initials, setInitials] = useState(cab?.logo_initials ?? "CB");
  const [accent, setAccent] = useState(cab?.accent_color ?? "#1F6B4A");

  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  if (ws.isPending) return <div className="h-40 animate-pulse rounded-xl bg-surface-2" />;

  const isCabinet = ws.data?.profile.account_type === "cabinet";
  const companies = ws.data?.companies ?? [];

  if (!isCabinet) {
    return (
      <div className="max-w-lg pb-16">
        <h1 className="font-display text-3xl font-medium tracking-tight">Mode cabinet</h1>
        <p className="mt-3 text-sm text-muted">
          Passez en compte cabinet pour rattacher plusieurs entreprises clientes, suivre leurs
          échéances et personnaliser l’interface.
        </p>
        <Button
          className="mt-6"
          onClick={async () => {
            await saveProfile({
              data: {
                fullName: ws.data?.profile.full_name ?? "",
                phone: ws.data?.profile.phone ?? "",
                accountType: "cabinet",
                cabinetName: "Cabinet",
              },
            });
            await refresh();
            toast.success("Compte cabinet activé");
          }}
        >
          Activer le mode cabinet
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Multi-dossiers</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">{cab?.name ?? "Cabinet"}</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-wide text-muted">Clients</p>
          <p className="mt-1 font-display text-2xl">{companies.length}</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-wide text-muted">À recouvrer</p>
          <p className="mt-1 font-display text-2xl tabular-nums">
            {formatXof(
              (ws.data?.declarations ?? [])
                .filter((d) => d.status !== "payee")
                .reduce((s, d) => s + d.total_due, 0),
            )}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-wide text-muted">Rôle</p>
          <p className="mt-1 font-display text-2xl">Admin</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <div className="px-5 py-4">
          <h2 className="text-sm font-medium">Portefeuille</h2>
        </div>
        <ul>
          {companies.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted">
                  {REGIME_LABELS[c.regime]} · {c.city}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await setActiveCompany({ data: c.id });
                  await refresh();
                  toast.success(`${c.name} est le dossier actif`);
                }}
              >
                Ouvrir
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <form
        className="flex flex-col gap-3 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await upsertCompany({
              data: {
                name: clientName.trim() || "Nouveau client",
                nif: "",
                legalForm: "ei" as LegalForm,
                activity: "commerce" as Activity,
                regime: clientRegime,
                city: "Niamey",
                phone: "",
                email: "",
                yearCreated: new Date().getFullYear(),
              },
            });
            setClientName("");
            await refresh();
            toast.success("Client ajouté");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Ajout impossible");
          }
        }}
      >
        <h2 className="font-medium">Ajouter un client</h2>
        <Field label="Raison sociale">
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
        </Field>
        <Field label="Régime">
          <Select value={clientRegime} onChange={(e) => setClientRegime(e.target.value as Regime)}>
            <option value="synthetique">Impôt synthétique</option>
            <option value="reel_simplifie">Réel simplifié</option>
            <option value="reel_normal">Réel normal</option>
          </Select>
        </Field>
        <Button type="submit">Rattacher</Button>
      </form>

      <form
        className="flex flex-col gap-3 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await saveCabinetBrand({ data: { name: cabName, initials, accent } });
            await refresh();
            toast.success("Marque blanche enregistrée");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Enregistrement impossible");
          }
        }}
      >
        <h2 className="font-medium">Marque blanche</h2>
        <Field label="Nom du cabinet">
          <Input value={cabName} onChange={(e) => setCabName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Initiales">
            <Input value={initials} maxLength={3} onChange={(e) => setInitials(e.target.value)} />
          </Field>
          <Field label="Couleur">
            <Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 place-items-center rounded-md text-sm font-semibold text-accent-fg"
            style={{ background: accent }}
          >
            {initials || "CB"}
          </span>
          <Badge tone="accent">Aperçu</Badge>
        </div>
        <Button type="submit" variant="secondary">
          Appliquer
        </Button>
        <p className="text-xs text-muted">
          Les rôles admin / collaborateur / lecture seule sont portés en base. L’invitation
          d’un collaborateur se fera après la validation juridique des accès DGI.
        </p>
        <Link to="/app/parametres" className="text-sm text-accent underline-offset-4 hover:underline">
          Paramètres du compte
        </Link>
      </form>
    </div>
  );
}
