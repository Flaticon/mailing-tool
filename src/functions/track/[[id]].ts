// functions/track/[[id]].ts
export const onRequestGet: PagesFunction = async ({ env, params, request }) => {
  // Extraer el ID sin la extensión .png si está presente
  let trackingId = params.id as string;
  
  // Si el ID termina en .png, quitarlo
  if (trackingId && trackingId.endsWith('.png')) {
    trackingId = trackingId.slice(0, -4);
  }

  console.log(`📍 Tracking request for ID: ${trackingId}`);

  // Pixel GIF transparente 1x1
  const pixel = new Uint8Array([
    71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,
    255,255,255,33,249,4,1,0,0,1,0,44,0,0,
    0,0,1,0,1,0,0,2,2,68,1,0,59
  ]);

  if (trackingId) {
    try {
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const referer = request.headers.get("referer") || "Direct";
      const ip = request.headers.get("cf-connecting-ip") || 
                 request.headers.get("x-forwarded-for") || 
                 "0.0.0.0";
      const timestamp = new Date().toISOString();

      // Verificar que EMAIL_TRACKING existe
      if (!env.EMAIL_TRACKING) {
        console.error("❌ EMAIL_TRACKING binding not found");
      } else {
        // Guardar en la base de datos
        await env.EMAIL_TRACKING.prepare(
          `INSERT INTO email_opens (tracking_id, timestamp, user_agent, ip_address, referer) 
           VALUES (?, ?, ?, ?, ?)`
        ).bind(trackingId, timestamp, userAgent, ip, referer).run();

        console.log(`✅ Tracked open: ${trackingId} @ ${timestamp}`);
      }
    } catch (err) {
      console.error("❌ Error saving tracking:", err);
      // No fallar la respuesta aunque falle el guardado
    }
  } else {
    console.warn("⚠️ Tracking ID missing in request");
  }

  // Siempre devolver el pixel, incluso si hay errores
  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Access-Control-Allow-Origin": "*"
    }
  });
};