"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { useSupabase } from "@/components/providers/supabase-provider";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSessionChecked, setHasSessionChecked] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      if (data.session) {
        router.replace("/dashboard");
      } else {
        setHasSessionChecked(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      toast.error("Ingresa un correo.");
      return;
    }

    setIsSubmitting(true);
    setInfoMessage(null);

    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("No pudimos enviar el enlace de acceso.");
      console.error("[auth] signInWithOtp", error);
      return;
    }

    toast.success("Revisa tu correo para continuar.");
    setInfoMessage(
      "Te enviamos un enlace mágico. Abre tu correo y sigue las instrucciones para iniciar sesión.",
    );
    setEmail("");
  };

  if (!hasSessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
        <p className="text-sm text-muted-foreground">Preparando login…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4 py-10">
      <div className="glass-panel w-full max-w-md space-y-6 p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Ingresa a Balance Compartido
          </h1>
          <p className="text-sm text-muted-foreground">
            Usaremos un enlace mágico enviado a tu correo.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium text-foreground">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="soft-input"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Enviando enlace…" : "Enviar enlace de acceso"}
          </button>
        </form>

        {infoMessage && (
          <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            {infoMessage}
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ¿Problemas para ingresar? Asegúrate de haber configurado proveedores
          y redirect URL en Supabase y vuelve a intentarlo.
        </p>
      </div>
    </div>
  );
}

