import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  // Opción 1: Solo verificación de salud (sin autenticación)
  if (request.headers.get('Health-Check') === 'true') {
    return new Response(
      JSON.stringify({ message: "✅ Servidor funcionando correctamente" }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Opción 2: Con autenticación pero sin DB (alternativa)
  const auth = request.headers.get('Authorization');
  if (!auth || auth !== `Bearer ${env.API_KEY}`) {
    return new Response(
      JSON.stringify({ 
        message: "🔒 No autorizado",
        hint: "Incluye el header 'Authorization: Bearer TU_API_KEY'"
      }), 
      { status: 401 }
    );
  }

  // Opción 3: Consulta a DB (comportamiento original)
  try {
    const { results } = await env.DB.prepare('SELECT * FROM email_logs ORDER BY created_at DESC').all();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        message: "⚠️ Error en la base de datos",
        error: error.message 
      }), 
      { status: 500 }
    );
  }
};