// src/pages/api/stats/tracking.ts - USAR CÓDIGO DEL DEBUG QUE FUNCIONA
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url }) => {
  try {
    const trackingId = url.searchParams.get('id')
    
    if (!trackingId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Tracking ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // USAR EXACTAMENTE EL MISMO CÓDIGO QUE EN DEBUG
    const emailTrackingDB = (globalThis as any).EMAIL_TRACKING
    
    if (!emailTrackingDB) {
      return new Response(JSON.stringify({
        success: false,
        error: 'EMAIL_TRACKING binding not found',
        debug: {
          availableKeys: Object.keys(globalThis).filter(k => k.includes('DB') || k.includes('TRACK'))
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Obtener datos - SIMPLE
    const opensResult = await emailTrackingDB.prepare(`
      SELECT 
        tracking_id,
        timestamp,
        user_agent,
        ip_address,
        referer
      FROM email_opens 
      WHERE tracking_id = ?
      ORDER BY timestamp ASC
    `).bind(trackingId).all()
    
    const opens = opensResult.results || []
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        trackingId,
        totalOpens: opens.length,
        firstOpen: opens[0]?.timestamp || null,
        lastOpen: opens[opens.length - 1]?.timestamp || null,
        opens: opens,
        dataSource: 'D1 Database'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}