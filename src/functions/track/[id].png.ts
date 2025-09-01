// functions/track/[id].png.ts

export const onRequestGet: PagesFunction = async ({ env, params, request }) => {
  const trackingId = params.id

  // Pixel GIF transparente 1x1 (más compatible con clientes de correo que PNG)
  const pixel = new Uint8Array([
    71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,
    255,255,255,33,249,4,1,0,0,1,0,44,0,0,
    0,0,1,0,1,0,0,2,2,68,1,0,59
  ])

  if (trackingId) {
    try {
      const userAgent = request.headers.get("user-agent") || "Unknown"
      const referer = request.headers.get("referer") || "Direct"
      const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0"
      const timestamp = new Date().toISOString()

      // Guardar evento en D1 (EMAIL_TRACKING debe estar en wrangler.toml)
      await env.EMAIL_TRACKING.prepare(
        `INSERT INTO email_opens (tracking_id, timestamp, user_agent, ip_address, referer) 
         VALUES (?, ?, ?, ?, ?)`
      ).bind(trackingId, timestamp, userAgent, ip, referer).run()

      console.log(`📩 Tracked open: ${trackingId} @ ${timestamp}`)
    } catch (err) {
      console.error("❌ Error saving tracking:", err)
    }
  } else {
    console.warn("⚠️ Tracking ID missing in request")
  }

  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Access-Control-Allow-Origin": "*"
    }
  })
}
