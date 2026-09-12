import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 p-6">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-500 underline hover:text-gray-800"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
        <h1 className="mb-2 text-xl font-semibold">
          Camino de Riesgo y Pago
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Responde un cuestionario breve de 2 minutos para recibir un
          resultado simulado y una posible forma de pago.
        </p>
        <Link
          href="/questionnaire"
          className="block w-full rounded-md bg-black px-4 py-2 text-center text-white"
        >
          Comenzar cuestionario
        </Link>
      </div>
    </div>
  );
}
