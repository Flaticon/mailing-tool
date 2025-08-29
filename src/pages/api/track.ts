export async function GET({ request, locals }) {
  const env = locals.runtime?.env;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id || !env?.DB) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const exists = await env.DB
      .prepare("SELECT opens_count FROM email_opens WHERE id = ?")
      .bind(id)
      .first();

    if (exists) {
      await env.DB
        .prepare("UPDATE email_opens SET opens_count = opens_count + 1 WHERE id = ?")
        .bind(id)
        .run();
    } else {
      await env.DB
        .prepare("INSERT INTO email_opens (id) VALUES (?)")
        .bind(id)
        .run();
    }
  } catch (err) {
    console.error("Error registrando apertura:", err);
    // No bloquea el envío de la imagen
  }

  const pixel = Uint8Array.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x01,
    0x05, 0x01, 0x02, 0xA7, 0x69, 0x79, 0x9F, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);

  return new Response(pixel, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    }
  });
}
