import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { questionnaireSchema } from "@/lib/validation/questionnaire";

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

  const { data, error } = await supabase
    .from("questionnaire_responses")
    .insert({
      user_id: user.id,
      answers: parsed.data,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo guardar tu cuestionario. Intenta de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ questionnaireId: data.id }, { status: 201 });
}
