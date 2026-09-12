import type { QuestionnaireInput } from "@/lib/validation/questionnaire";
import type { RiskLevel } from "@/lib/supabase/types";

export type RiskAssessment = {
  riskLevel: RiskLevel;
  explanation: string;
};

const SYMPTOM_LABELS: { key: keyof QuestionnaireInput; label: string }[] = [
  { key: "frequentThirst", label: "sed frecuente" },
  { key: "blurryVision", label: "visión borrosa" },
  { key: "frequentUrination", label: "orinar con más frecuencia de lo normal" },
  { key: "fatigue", label: "cansancio sin motivo aparente" },
];

// Simple, fully local point scale — no external calls. One point per
// present symptom, plus one for family history and one for age 45+.
// 0-1 points: low, 2-3: moderate, 4-6: high.
function computeScore(answers: QuestionnaireInput): number {
  let score = 0;
  for (const { key } of SYMPTOM_LABELS) {
    if (answers[key]) score += 1;
  }
  if (answers.familyHistory) score += 1;
  if (answers.age >= 45) score += 1;
  return score;
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 4) return "high";
  if (score >= 2) return "moderate";
  return "low";
}

function presentSymptoms(answers: QuestionnaireInput): string[] {
  const symptoms = SYMPTOM_LABELS.filter(({ key }) => answers[key]).map(
    ({ label }) => label
  );
  if (answers.familyHistory) symptoms.push("antecedentes familiares");
  return symptoms;
}

function buildExplanation(
  riskLevel: RiskLevel,
  answers: QuestionnaireInput
): string {
  const symptoms = presentSymptoms(answers);
  const symptomsText = symptoms.length > 0 ? symptoms.join(", ") : null;

  if (riskLevel === "high") {
    return symptomsText
      ? `Varias de tus respuestas (${symptomsText}) coinciden con señales de riesgo de diabetes tipo 2. Esto no es un diagnóstico: es importante que acudas con un médico pronto.`
      : "Tu edad coincide con señales de riesgo de diabetes tipo 2. Esto no es un diagnóstico: es importante que acudas con un médico pronto.";
  }

  if (riskLevel === "moderate") {
    return symptomsText
      ? `Algunas de tus respuestas (${symptomsText}) sugieren un riesgo moderado de diabetes tipo 2. No es un diagnóstico, pero sería bueno platicarlo con un médico en las próximas semanas.`
      : "Tus respuestas sugieren un riesgo moderado de diabetes tipo 2. No es un diagnóstico, pero sería bueno platicarlo con un médico en las próximas semanas.";
  }

  return "Por ahora tus respuestas no muestran señales fuertes de riesgo de diabetes tipo 2. De todas formas, si algo cambia o te sientes mal, no dudes en consultar a un médico.";
}

// Fully local simulated scoring — no external API calls. Simple rules,
// not a medical model; the result is always labeled as simulated on screen.
export function scoreRisk(answers: QuestionnaireInput): RiskAssessment {
  const riskLevel = scoreToRiskLevel(computeScore(answers));
  return { riskLevel, explanation: buildExplanation(riskLevel, answers) };
}
