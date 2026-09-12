"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

function friendlyError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (message.includes("User already registered")) {
    return "Ya existe una cuenta con ese correo. Intenta iniciar sesión.";
  }
  if (message.includes("Password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (message.includes("Unable to validate email address")) {
    return "Ese correo no parece válido.";
  }
  return "Algo salió mal. Intenta de nuevo.";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(friendlyError(error.message));
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }

    if (data.session) {
      // Email confirmation is disabled on this project - session is active immediately.
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(
      "Te enviamos un correo para confirmar tu cuenta. Ábrelo y da clic en el enlace para poder iniciar sesión."
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 p-8">
        <h1 className="mb-2 text-center text-xl font-semibold">
          Camino de Riesgo y Pago
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Responde un cuestionario breve y recibe un resultado simulado junto
          con una posible forma de pago. Inicia sesión para continuar.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-base"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-base"
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-4 text-sm text-green-700" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-3 text-base text-white disabled:opacity-50"
          >
            {loading
              ? "Un momento…"
              : mode === "signin"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-center text-sm text-gray-600 underline"
        >
          {mode === "signin"
            ? "¿No tienes cuenta? Crea una"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </main>
  );
}
