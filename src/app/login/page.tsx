"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 p-8 text-center">
        <h1 className="mb-2 text-xl font-semibold">Camino de Riesgo y Pago</h1>
        <p className="mb-6 text-sm text-gray-600">
          Responde un cuestionario breve y recibe un resultado simulado junto
          con una posible forma de pago. Inicia sesión para continuar.
        </p>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Redirigiendo…" : "Iniciar sesión con Google"}
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
