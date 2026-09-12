import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { QuestionnaireInput } from "@/lib/validation/questionnaire";

const riskAssessmentSchema = z.object({
  riskLevel: z.enum(["low", "moderate", "high"]),
  explanation: z
    .string()
    .describe(
      "2-3 short sentences in simple Spanish, no medical jargon, explaining the simulated risk level."
    ),
});

export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;

const SYSTEM_PROMPT = `Generas una evaluación de riesgo SIMULADA de tener diabetes tipo 2,
a partir de las respuestas de un cuestionario corto de síntomas. Esto NO es un
diagnóstico médico ni sustituye la consulta con un profesional de salud.

Clasifica el riesgo como "low", "moderate" o "high" considerando: edad, sed
frecuente, visión borrosa, micción frecuente, fatiga sin motivo aparente, y
antecedentes familiares de diabetes. Más síntomas presentes y mayor edad
sugieren mayor riesgo.

Escribe la explicación en español sencillo, en 2-3 frases, para una persona
adulta con poca familiaridad con aplicaciones. No uses tecnicismos. Deja claro
que es una simulación educativa y que debe acudir con un médico para un
diagnóstico real.`;

export async function scoreRisk(
  answers: QuestionnaireInput
): Promise<RiskAssessment> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify(answers),
      },
    ],
    output_config: {
      effort: "low",
      format: zodOutputFormat(riskAssessmentSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("La IA no devolvió un resultado válido.");
  }

  return response.parsed_output;
}
