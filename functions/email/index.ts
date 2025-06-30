import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.API_KEY}`) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const { results } = await env.DB.prepare('SELECT * FROM email_logs ORDER BY created_at DESC').all();
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  });
};
