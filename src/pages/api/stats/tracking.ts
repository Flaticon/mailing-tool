// src/pages/api/stats/tracking.ts - COPIA EXACTA DEL PATRON DEL DEBUG
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url, locals }) => { 
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
    
    // USAR EXACTAMENTE EL MISMO PATRON QUE EL DEBUG 
    const emailTrackingDB = locals.runtime.env.EMAIL_TRACKING 
    
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
    
    // MISMO TEST QUE EN DEBUG
    let dbTest = null
    try {
      const result = await emailTrackingDB.prepare("SELECT 1 as test").first()
      dbTest = { success: true, result }
    } catch (e) {
      dbTest = { success: false, error: e.message }
    }
    
    // QUERY REAL
    const opensResult = await emailTrackingDB.prepare(`
      SELECT tracking_id, timestamp, user_agent, ip_address, referer
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
        opens: opens,
        dbTest: dbTest
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}