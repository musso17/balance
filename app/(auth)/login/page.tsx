"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { useSupabase } from "@/components/providers/supabase-provider";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSessionChecked, setHasSessionChecked] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<string>("/dashboard");

  // Resolve redirect target on mount (no useSearchParams to avoid suspense requirement)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (!redirect) {
      setRedirectTarget("/dashboard");
      return;
    }
    try {
      const decoded = decodeURIComponent(redirect);
      setRedirectTarget(decoded.startsWith("/") ? decoded : "/dashboard");
    } catch {
      setRedirectTarget("/dashboard");
    }
  }, []);

  // Check existing session and redirect if already signed in
  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      if (data.session) {
        router.replace(redirectTarget);
      } else {
        setHasSessionChecked(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [redirectTarget, router, supabase]);

  const isLogin = mode === "login";
  const title = isLogin ? "Ingresa a Balance Compartido" : "Crea tu cuenta";
  const submitLabel = isLogin ? "Iniciar sesión" : "Registrarme";
  const toggleLabel = isLogin
    ? "¿No tienes cuenta? Regístrate"
    : "¿Ya tienes cuenta? Inicia sesión";

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setInfoMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Completa todos los campos.");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    setInfoMessage(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message || "No pudimos iniciar sesión.");
          return;
        }

        if (data.session) {
          toast.success("Sesión iniciada.");
          router.replace(redirectTarget);
        } else {
          toast.error("No pudimos iniciar sesión.");
        }
        return;
      }

      const {
        data: signUpData,
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`
              : undefined,
        },
      });

      if (signUpError) {
        toast.error(signUpError.message || "No pudimos crear la cuenta.");
        return;
      }

      if (signUpData.session) {
        toast.success("Cuenta creada. ¡Bienvenido!");
        router.replace(redirectTarget);
        return;
      }

      setInfoMessage(
        "Cuenta creada. Revisa tu correo para confirmar el acceso y luego inicia sesión.",
      );
      setMode("login");
      resetForm();
    } catch (error) {
      console.error("[auth] submit", error);
      toast.error("Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tus credenciales para continuar.
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

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-foreground">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              minLength={6}
              className="soft-input"
              required
            />
          </label>

          {!isLogin && (
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-foreground">
                Confirmar contraseña
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="********"
                minLength={6}
                className="soft-input"
                required
              />
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="cta-button w-full disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Procesando…" : submitLabel}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isLogin ? "register" : "login");
            resetForm();
          }}
          className="w-full text-center text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          {toggleLabel}
        </button>

        {infoMessage && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
            {infoMessage}
          </p>
        )}
      </div>
    </div>
  );
}
