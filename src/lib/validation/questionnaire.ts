import { z } from "zod";

// Shared schema: used for both client-side pre-checks and the
// authoritative server-side validation before anything touches the DB.
export const insuranceStatusValues = ["private", "public_imss", "none"] as const;

export const questionnaireSchema = z.object({
  age: z
    .number({ error: "Indica tu edad." })
    .int("La edad debe ser un número entero.")
    .min(1, "La edad debe ser mayor a 0.")
    .max(120, "Indica una edad válida."),
  frequentThirst: z.boolean({ error: "Responde esta pregunta." }),
  blurryVision: z.boolean({ error: "Responde esta pregunta." }),
  frequentUrination: z.boolean({ error: "Responde esta pregunta." }),
  fatigue: z.boolean({ error: "Responde esta pregunta." }),
  familyHistory: z.boolean({ error: "Responde esta pregunta." }),
  insuranceStatus: z.enum(insuranceStatusValues, {
    error: "Indica tu situación de seguro médico.",
  }),
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;

export const questionnaireFields: {
  key: keyof QuestionnaireInput;
  label: string;
  type: "boolean" | "number" | "select";
}[] = [
  { key: "age", label: "¿Cuál es tu edad?", type: "number" },
  {
    key: "frequentThirst",
    label: "¿Sientes sed con mucha frecuencia, más de lo normal?",
    type: "boolean",
  },
  {
    key: "blurryVision",
    label: "¿Has notado la vista borrosa últimamente?",
    type: "boolean",
  },
  {
    key: "frequentUrination",
    label: "¿Vas al baño a orinar con más frecuencia de lo normal?",
    type: "boolean",
  },
  {
    key: "fatigue",
    label: "¿Te sientes cansado(a) sin motivo aparente?",
    type: "boolean",
  },
  {
    key: "familyHistory",
    label: "¿Algún familiar cercano (papás, hermanos) ha tenido diabetes?",
    type: "boolean",
  },
  {
    key: "insuranceStatus",
    label: "¿Tienes seguro médico?",
    type: "select",
  },
];
