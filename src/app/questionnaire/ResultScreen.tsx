import type { PaymentRouteType, RiskLevel } from "@/lib/supabase/types";

export type PaymentRouteView = {
  id: string;
  label: string;
  description: string;
  type: PaymentRouteType;
  isSimulated: boolean;
};

const riskCopy: Record<
  RiskLevel,
  { label: string; classes: string }
> = {
  low: {
    label: "Riesgo bajo (simulado)",
    classes: "border-green-300 bg-green-50 text-green-800",
  },
  moderate: {
    label: "Riesgo moderado (simulado)",
    classes: "border-yellow-300 bg-yellow-50 text-yellow-800",
  },
  high: {
    label: "Riesgo alto (simulado)",
    classes: "border-red-300 bg-red-50 text-red-800",
  },
};

const routeTypeLabels: Record<PaymentRouteType, string> = {
  installment_plan: "Plan de pago",
  imss_route: "Ruta IMSS-Bienestar",
  community_fund: "Fondo comunitario",
};

function RiskCard({
  riskLevel,
  explanation,
}: {
  riskLevel: RiskLevel;
  explanation: string;
}) {
  const copy = riskCopy[riskLevel];
  return (
    <div className={`mb-4 rounded-lg border p-4 ${copy.classes}`}>
      <p className="mb-1 text-lg font-semibold">{copy.label}</p>
      <p className="text-sm">{explanation}</p>
    </div>
  );
}

function PaymentRouteCard({ route }: { route: PaymentRouteView }) {
  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-medium">{route.label}</p>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {routeTypeLabels[route.type]}
        </span>
      </div>
      <p className="text-sm text-gray-600">{route.description}</p>
      {route.isSimulated && (
        <p className="mt-2 text-xs font-medium text-gray-500">
          Ruta simulada — no es una oferta real.
        </p>
      )}
    </div>
  );
}

function PaymentRoutesFallback({ riskLevel }: { riskLevel: RiskLevel }) {
  return (
    <div className="mb-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
      <p>
        Todavía no encontramos una forma de pago para mostrarte. Vuelve a
        esta pantalla en unos minutos.
      </p>
      {riskLevel === "high" && (
        <p className="mt-2 font-medium text-gray-700">
          Mientras tanto, no esperes: acude a tu centro de salud o clínica
          más cercana para que te revisen.
        </p>
      )}
    </div>
  );
}

// This component never renders a risk level without also rendering at least
// one payment route, or its fallback, in the same pass.
export function ResultScreen({
  riskLevel,
  explanation,
  paymentRoutes,
}: {
  riskLevel: RiskLevel;
  explanation: string;
  paymentRoutes: PaymentRouteView[];
}) {
  return (
    <main className="mx-auto min-h-screen max-w-md p-6">
      <h1 className="mb-4 text-xl font-semibold">Tu resultado</h1>

      <RiskCard riskLevel={riskLevel} explanation={explanation} />

      <h2 className="mb-2 text-base font-medium">Forma de pago sugerida</h2>
      {paymentRoutes.length > 0 ? (
        paymentRoutes.map((route) => (
          <PaymentRouteCard key={route.id} route={route} />
        ))
      ) : (
        <PaymentRoutesFallback riskLevel={riskLevel} />
      )}

      <p className="mt-4 text-xs text-gray-500">
        Este resultado fue generado por inteligencia artificial de forma
        simulada. No es un diagnóstico médico ni asesoría financiera
        profesional.
      </p>
    </main>
  );
}
