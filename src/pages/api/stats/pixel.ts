// src/pages/api/stats/pixel.ts
import type { APIRoute } from 'astro'

// Pixel transparente de 1x1 en formato PNG
const TRANSPARENT_PIXEL = new Uint8Array([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
  0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
])

export const POST: APIRoute = async ({ url, request, locals }) => {
  try { 
    const body : any = await request.json()
    const trackingId = body.id
    
    if (!trackingId) {
      // Devolver pixel transparente aunque no haya ID
      return new Response(TRANSPARENT_PIXEL, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // Registrar el tracking en la base de datos
    const emailTrackingDB = locals.runtime.env.EMAIL_TRACKING
    
    if (emailTrackingDB) {
      try {
        await emailTrackingDB.prepare(`
          INSERT INTO email_opens (tracking_id, timestamp, user_agent, ip_address, referer)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          trackingId,
          new Date().toISOString(),
          request.headers.get('user-agent') || '',
          request.headers.get('cf-connecting-ip') || 
          request.headers.get('x-forwarded-for') || '',
          request.headers.get('referer') || ''
        ).run()
        
        console.log(`✅ Pixel tracking registrado: ${trackingId}`)
      } catch (dbError) {
        console.error('❌ Error registrando tracking:', dbError)
        // No fallar, seguir devolviendo el pixel
      }
    } else {
      console.warn('⚠️ EMAIL_TRACKING binding no encontrado')
    }

    // Devolver pixel transparente de 1x1
    return new Response(TRANSPARENT_PIXEL, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('❌ Error en pixel endpoint:', error)
    
    // Incluso en error, devolver el pixel para no romper emails
    return new Response(TRANSPARENT_PIXEL, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache'
      }
    })
  }
}