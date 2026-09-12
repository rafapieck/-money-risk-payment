import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { questionnaireSchema } from "@/lib/validation/questionnaire";
import { scoreRisk } from "@/lib/ai/riskScoring";
import { selectPaymentRoutes } from "@/lib/paymentRoutes";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido." },
      { status: 400 }
    );
  }

  const parsed = questionnaireSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Hay errores en el formulario.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { data: questionnaire, error: insertError } = await supabase
    .from("questionnaire_responses")
    .insert({
      user_id: user.id,
      answers: parsed.data,
    })
    .select("id")
    .single();

  if (insertError || !questionnaire) {
    return NextResponse.json(
      { error: "No se pudo guardar tu cuestionario. Intenta de nuevo." },
      { status: 500 }
    );
  }

  let riskAssessment;
  try {
    riskAssessment = await scoreRisk(parsed.data);
  } catch (err) {
    console.error("scoreRisk failed", err);
    return NextResponse.json(
      {
        error:
          "Guardamos tus respuestas, pero no pudimos generar tu resultado. Intenta de nuevo en un momento.",
        questionnaireId: questionnaire.id,
      },
      { status: 502 }
    );
  }

  // These two only depend on riskAssessment.riskLevel, not on each other,
  // so run them concurrently instead of paying for two sequential round trips.
  const [{ data: riskResult, error: riskInsertError }, paymentRoutes] =
    await Promise.all([
      supabase
        .from("risk_results")
        .insert({
          user_id: user.id,
          questionnaire_id: questionnaire.id,
          risk_level: riskAssessment.riskLevel,
          explanation: riskAssessment.explanation,
        })
        .select("id")
        .single(),
      selectPaymentRoutes(supabase, riskAssessment.riskLevel),
    ]);

  if (riskInsertError || !riskResult) {
    return NextResponse.json(
      {
        error: "No se pudo guardar tu resultado. Intenta de nuevo.",
        questionnaireId: questionnaire.id,
      },
      { status: 500 }
    );
  }

  if (paymentRoutes.length > 0) {
    const { error: linkError } = await supabase
      .from("risk_result_routes")
      .insert(
        paymentRoutes.map((route) => ({
          risk_result_id: riskResult.id,
          payment_route_id: route.id,
        }))
      );
    if (linkError) {
      console.error("risk_result_routes insert failed", linkError);
    }
  }

  return NextResponse.json(
    {
      questionnaireId: questionnaire.id,
      riskResultId: riskResult.id,
      riskLevel: riskAssessment.riskLevel,
      explanation: riskAssessment.explanation,
      paymentRoutes: paymentRoutes.map((route) => ({
        id: route.id,
        label: route.label,
        description: route.description,
        type: route.type,
        isSimulated: route.is_simulated,
      })),
    },
    { status: 201 }
  );
}
