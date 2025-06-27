export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.API_KEY}`) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Cuerpo inválido' }), { status: 400 });
  }

  const { emails, subject, content } = body;
  if (!emails?.length || !subject || !content) {
    return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
  }

  for (const email of emails) {
    await env.DB.prepare('INSERT INTO email_logs (email, subject, content, status, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
      .bind(email, subject, content, 'pending').run();
  }

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
      html: `<p>${content}</p>`,
    }),
  });

  const detail = await response.json();
  const status = response.ok ? 'sent' : 'error';

  for (const email of emails) {
    await env.DB.prepare('UPDATE email_logs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?')
      .bind(status, email).run();
  }

  return new Response(JSON.stringify({
    message: status === 'sent' ? 'Correos enviados' : 'Error en envío',
    detalle: detail,
  }), { status: response.status });
};
