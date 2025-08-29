// src/pages/api/track/[id].png.ts
import type { APIRoute } from 'astro'

// Función para crear pixel PNG transparente sin Buffer
function createPixelBuffer(): Uint8Array {
  // PNG transparente 1x1 en bytes
  return new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00,
    0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F,
    0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,
    0x54, 0x78, 0xDA, 0x63, 0x60, 0x60, 0xF8, 0x0F, 0x00, 0x00,
    0x87, 0x00, 0x81, 0xEB, 0xE0, 0x9A, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ])
}

export const GET: APIRoute = async ({ params, request, clientAddress }) => {
  const trackingId = params.id
  
  // PIXEL TRANSPARENTE 1x1 (siempre se devuelve)
  const pixelBuffer = createPixelBuffer()
  
  // TRACKING LOGIC - Solo si el ID es válido
  if (trackingId && trackingId.length >= 10) {
    try {
      const userAgent = request.headers.get('user-agent') || 'Unknown'
      const referer = request.headers.get('referer') || 'Direct'
      const timestamp = new Date().toISOString()
      
      // Log para debugging (temporal)
      console.log('📧 Email opened:', {
        trackingId,
        timestamp,
        userAgent: userAgent.substring(0, 100),
        ip: clientAddress,
        referer
      })
      
      // Conectar a D1 Database de tracking (si está disponible)
      const db = (globalThis as any).EMAIL_TRACKING
      
      if (db) {
        // Registrar apertura (evitar duplicados con INSERT OR IGNORE)
        await db.prepare(`
          INSERT OR IGNORE INTO email_opens 
          (tracking_id, timestamp, user_agent, ip_address, referer)
          VALUES (?, ?, ?, ?, ?)
        `).bind(trackingId, timestamp, userAgent, clientAddress, referer).run()
        
        console.log('✅ Tracking saved to database')
      } else {
        console.log('⚠️ Email tracking database not available, only logging to console')
      }
    } catch (error) {
      // NUNCA fallar el pixel - solo log del error
      console.error('❌ Tracking error:', error.message)
    }
  } else {
    console.log('⚠️ Invalid or missing tracking ID:', trackingId)
  }
  
  // SIEMPRE devolver el pixel (crítico para que los emails funcionen)
  return new Response(pixelBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Length': pixelBuffer.length.toString(),
      'Access-Control-Allow-Origin': '*'
    }
  })
}