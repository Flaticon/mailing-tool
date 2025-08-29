// src/pages/api/stats/tracking.ts
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
    
    // Conectar a D1 Database de tracking
    const db = (globalThis as any).EMAIL_TRACKING
    
    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email tracking database not available'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Obtener información del tracking
    const opens = await db.prepare(`
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
    
    const stats = {
      trackingId,
      totalOpens: opens.results?.length || 0,
      firstOpen: opens.results?.[0]?.timestamp || null,
      lastOpen: opens.results?.[opens.results.length - 1]?.timestamp || null,
      opens: opens.results || []
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Stats error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}