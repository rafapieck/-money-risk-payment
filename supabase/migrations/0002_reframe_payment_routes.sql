-- Reframe payment_routes copy: from "simulated example, not a real offer"
-- to real, actionable guidance. The specific numbers/institutions shown
-- are still example data for this demo (is_simulated stays true), but the
-- wording no longer undercuts itself on screen — repeating "simulado" /
-- "no es una oferta real" next to a payment suggestion read, in user
-- testing, as "there is no real help here," which is the opposite of
-- what this app is for. The underlying kind of help described (asking a
-- clinic for an installment plan, IMSS-Bienestar's general mandate,
-- organizing a tanda) is real; only the specific numbers are invented.
-- Matched by the old label so this is safe to re-run.

update public.payment_routes
set
  label = 'Plan de pago en 3 quincenas',
  description = 'Puedes proponerle a la clínica o laboratorio dividir el costo de tu consulta y estudios iniciales en 3 pagos quincenales. Pregunta si aceptan este tipo de acuerdo antes de tu cita.'
where label = 'Plan de pago simulado (3 pagos)';

update public.payment_routes
set
  label = 'Acude a un módulo de IMSS-Bienestar',
  description = 'IMSS-Bienestar ofrece consultas y valoraciones para personas sin seguro social. Busca el módulo más cercano a ti y pregunta por una cita de valoración.'
where label = 'Ruta simulada hacia IMSS-Bienestar';

update public.payment_routes
set
  label = 'Organiza un fondo con familiares o vecinos',
  description = 'Una tanda o caja de ahorro con personas de confianza puede ayudarte a juntar dinero rápido para un gasto médico imprevisto.'
where label = 'Fondo comunitario simulado';

update public.payment_routes
set
  label = 'Plan de pago en 6 mensualidades',
  description = 'Para tratamientos de mayor costo, pregunta en la clínica si aceptan dividir el pago en 6 mensualidades en lugar de pagar todo de una vez.'
where label = 'Plan de pago simulado (6 pagos)';
