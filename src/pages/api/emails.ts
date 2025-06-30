export async function GET({ request, locals }) {
  // Verificación de salud
  if (request.headers.get('Health-Check') === 'true') {
    return new Response(
      JSON.stringify({ message: "✅ Servidor funcionando correctamente" }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // Autenticación
  const auth = request.headers.get('Authorization');
  const env = locals.runtime?.env;
  
  if (!env?.API_KEY || !auth || auth !== `Bearer ${env.API_KEY}`) {
    return new Response(
      JSON.stringify({ 
        message: "🔒 No autorizado",
        hint: "Incluye el header 'Authorization: Bearer TU_API_KEY'"
      }), 
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // Consulta a DB
  try {
    // Acceso al runtime de Cloudflare en Astro SSR
    const env = locals.runtime?.env;
    
    if (!env?.DB) {
      throw new Error('Base de datos no disponible');
    }

    const { results } = await env.DB.prepare('SELECT * FROM email_logs ORDER BY created_at DESC').all();
    
    return new Response(JSON.stringify({
      success: true,
      data: results,
      count: results.length
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error en endpoint emails:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "⚠️ Error en la base de datos",
        error: error.message 
      }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Health-Check',
    },
  });
}