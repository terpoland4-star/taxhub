import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Seal, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { HAMADINE_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPending && user) void navigate({ to: "/app" });
  }, [isPending, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0],
          callbackURL: "/app",
        });
        if (res.error) throw new Error(res.error.message || "Inscription impossible");
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/app",
        });
        if (res.error) throw new Error(res.error.message || "Connexion impossible");
      }
      toast.success(mode === "up" ? "Compte créé" : "Connexion réussie");
      await navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d’authentification");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <Seal className="size-9" />
          <Wordmark className="text-xl" />
        </Link>
        <div className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)] sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Espace sécurisé</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">
            {mode === "in" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Vos déclarations restent attachées à votre compte — plus de données uniquement dans le navigateur.
          </p>

          {authEnabled ? (
            <>
              <div className="mt-6 flex flex-col gap-2">
                {HAMADINE_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="secondary"
                    onClick={() => signIn(p.providerId, { callbackURL: "/app" })}
                  >
                    Continuer avec {p.label}
                  </Button>
                ))}
              </div>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-subtle">
                <span className="h-px flex-1 bg-border" />
                ou par e-mail
                <span className="h-px flex-1 bg-border" />
              </div>
              <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                {mode === "up" ? (
                  <Field label="Nom">
                    <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  </Field>
                ) : null}
                <Field label="E-mail">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>
                <Field label="Mot de passe" hint="Au moins 8 caractères.">
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                  />
                </Field>
                <Button type="submit" disabled={busy}>
                  {busy ? "Veuillez patienter…" : mode === "in" ? "Se connecter" : "Créer le compte"}
                </Button>
              </form>
              <button
                type="button"
                className="mt-4 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
                onClick={() => setMode(mode === "in" ? "up" : "in")}
              >
                {mode === "in" ? "Pas encore de compte ? Inscription" : "Déjà inscrit ? Connexion"}
              </button>
            </>
          ) : (
            <p className="mt-6 text-sm text-muted">Connexion indisponible pour le moment.</p>
          )}
        </div>
      </div>
    </main>
  );
}
