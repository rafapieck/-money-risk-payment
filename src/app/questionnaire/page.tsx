"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  insuranceStatusValues,
  questionnaireSchema,
  type QuestionnaireInput,
} from "@/lib/validation/questionnaire";
import { ResultScreen, type PaymentRouteView } from "./ResultScreen";
import type { RiskLevel } from "@/lib/supabase/types";

type FormState = {
  age: string;
  frequentThirst: boolean | null;
  blurryVision: boolean | null;
  frequentUrination: boolean | null;
  fatigue: boolean | null;
  familyHistory: boolean | null;
  insuranceStatus: "" | QuestionnaireInput["insuranceStatus"];
};

const initialState: FormState = {
  age: "",
  frequentThirst: null,
  blurryVision: null,
  frequentUrination: null,
  fatigue: null,
  familyHistory: null,
  insuranceStatus: "",
};

type QuestionnaireResult = {
  riskLevel: RiskLevel;
  explanation: string;
  paymentRoutes: PaymentRouteView[];
};

const insuranceLabels: Record<QuestionnaireInput["insuranceStatus"], string> = {
  private: "Sí, tengo seguro médico privado",
  public_imss: "Tengo IMSS u otro seguro público",
  none: "No tengo ningún seguro médico",
};

function YesNoQuestion({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  error?: string;
}) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-base font-medium">{label}</legend>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 rounded-md border px-4 py-3 text-base ${
            value === true
              ? "border-black bg-black text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 rounded-md border px-4 py-3 text-base ${
            value === false
              ? "border-black bg-black text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          No
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}

export default function QuestionnairePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionnaireResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const candidate = {
      age: form.age === "" ? undefined : Number(form.age),
      frequentThirst: form.frequentThirst ?? undefined,
      blurryVision: form.blurryVision ?? undefined,
      frequentUrination: form.frequentUrination ?? undefined,
      fatigue: form.fatigue ?? undefined,
      familyHistory: form.familyHistory ?? undefined,
      insuranceStatus: form.insuranceStatus === "" ? undefined : form.insuranceStatus,
    };

    const parsed = questionnaireSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();

      if (!res.ok) {
        if (body.fieldErrors) {
          setErrors(body.fieldErrors);
        }
        setFormError(body.error ?? "Algo salió mal. Intenta de nuevo.");
        setSubmitting(false);
        return;
      }

      setResult({
        riskLevel: body.riskLevel,
        explanation: body.explanation,
        paymentRoutes: body.paymentRoutes,
      });
      setSubmitting(false);
      router.refresh();
    } catch {
      setFormError("No se pudo conectar. Revisa tu internet e intenta de nuevo.");
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <ResultScreen
        riskLevel={result.riskLevel}
        explanation={result.explanation}
        paymentRoutes={result.paymentRoutes}
      />
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md p-6">
      <h1 className="mb-1 text-xl font-semibold">Cuestionario de riesgo</h1>
      <p className="mb-6 text-sm text-gray-600">
        Toma menos de 2 minutos. Ninguna respuesta se comparte fuera de esta
        app.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <label htmlFor="age" className="mb-2 block text-base font-medium">
            ¿Cuál es tu edad?
          </label>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-base"
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600">{errors.age[0]}</p>
          )}
        </div>

        <YesNoQuestion
          label="¿Sientes sed con mucha frecuencia, más de lo normal?"
          value={form.frequentThirst}
          onChange={(v) => setForm((f) => ({ ...f, frequentThirst: v }))}
          error={errors.frequentThirst?.[0]}
        />
        <YesNoQuestion
          label="¿Has notado la vista borrosa últimamente?"
          value={form.blurryVision}
          onChange={(v) => setForm((f) => ({ ...f, blurryVision: v }))}
          error={errors.blurryVision?.[0]}
        />
        <YesNoQuestion
          label="¿Vas al baño a orinar con más frecuencia de lo normal?"
          value={form.frequentUrination}
          onChange={(v) => setForm((f) => ({ ...f, frequentUrination: v }))}
          error={errors.frequentUrination?.[0]}
        />
        <YesNoQuestion
          label="¿Te sientes cansado(a) sin motivo aparente?"
          value={form.fatigue}
          onChange={(v) => setForm((f) => ({ ...f, fatigue: v }))}
          error={errors.fatigue?.[0]}
        />
        <YesNoQuestion
          label="¿Algún familiar cercano (papás, hermanos) ha tenido diabetes?"
          value={form.familyHistory}
          onChange={(v) => setForm((f) => ({ ...f, familyHistory: v }))}
          error={errors.familyHistory?.[0]}
        />

        <fieldset className="mb-8">
          <legend className="mb-2 text-base font-medium">
            ¿Tienes seguro médico?
          </legend>
          <div className="flex flex-col gap-3">
            {insuranceStatusValues.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, insuranceStatus: option }))
                }
                className={`rounded-md border px-4 py-3 text-left text-base ${
                  form.insuranceStatus === option
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {insuranceLabels[option]}
              </button>
            ))}
          </div>
          {errors.insuranceStatus && (
            <p className="mt-1 text-sm text-red-600">
              {errors.insuranceStatus[0]}
            </p>
          )}
        </fieldset>

        {formError && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-black px-4 py-3 text-base text-white disabled:opacity-50"
        >
          {submitting ? "Generando tu resultado…" : "Enviar respuestas"}
        </button>
        {submitting && (
          <p className="mt-2 text-center text-sm text-gray-500" role="status">
            Esto puede tardar unos segundos. No cierres esta pantalla.
          </p>
        )}
      </form>
    </main>
  );
}
