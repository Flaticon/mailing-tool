
export async function POST({ request, locals }) {
  try {
    // Autenticación
    const auth = request.headers.get('Authorization');
    const env = locals.runtime?.env;

    if (!env?.API_KEY || auth !== `Bearer ${env.API_KEY}`) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No autorizado',
          hint: 'Incluye el header Authorization: Bearer TU_API_KEY'
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

    // Verificación simple: si no hay body, retornar mensaje de test
    const contentLength = request.headers.get('content-length');
    if (contentLength === '0' || contentLength === null) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Servidor funcionando correctamente 🚀 (sin payload)',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Parsear el body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Cuerpo JSON inválido',
        details: parseError.message
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Validar datos requeridos
    const { emails, subject, content } = body;
    if (!emails?.length || !subject || !content) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Faltan datos requeridos',
        required: ['emails (array)', 'subject (string)', 'content (string)'],
        received: { 
          emails: emails?.length || 0, 
          hasSubject: !!subject, 
          hasContent: !!content 
        }
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Verificar que tenemos acceso a la DB
    if (!env.DB) {
      throw new Error('Base de datos no disponible');
    }

    // Insertar logs iniciales en la base de datos
    console.log(`Procesando ${emails.length} emails...`);
    for (const email of emails) {
      await env.DB.prepare(`
        INSERT INTO email_logs (email, subject, content, status, created_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(email, subject, content, 'pending').run();
    }

    // Verificar variables de entorno para Resend
    if (!env.RESEND_API_KEY || !env.SENDER_EMAIL) {
      throw new Error('Variables de entorno RESEND_API_KEY o SENDER_EMAIL no configuradas');
    }

    // Enviar emails usando Resend
    console.log('Enviando emails via Resend...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.SENDER_EMAIL,
        to: emails,
        subject,
        html: emails.map(email => `
  <p>${content}</p>
  <img src="https://mailing-tool.pages.dev/api/track?id=${encodeURIComponent(email)}" width="1" height="1" style="display:none;" />
`).join('<hr>'),
      }),
    });

    const detail = await response.json();
    const status = response.ok ? 'sent' : 'error';

    console.log(`Resultado del envío: ${status}`, detail);

    // Actualizar el status en la base de datos
    for (const email of emails) {
      await env.DB.prepare(`
        UPDATE email_logs 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE email = ? AND status = 'pending'
      `).bind(status, email).run();
    }

    // Respuesta final
    return new Response(JSON.stringify({
      success: response.ok,
      message: status === 'sent' ? 'Correos enviados exitosamente' : 'Error en el envío',
      details: detail,
      processed: emails.length,
      status: status,
      timestamp: new Date().toISOString()
    }), { 
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error en endpoint send:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '⚠️ Error interno del servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}