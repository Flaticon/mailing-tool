// src/pages/api/stats/tracking.ts - VERSIÓN SIMPLIFICADA
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
    
    // Conectar a D1 Database - EXACTAMENTE igual que en debug
    const db = (globalThis as any).EMAIL_TRACKING
    
    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email tracking database not available',
        debug: {
          globalKeys: Object.keys(globalThis).filter(k => k.includes('DB') || k.includes('TRACK'))
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Obtener información del tracking
    const opensResult = await db.prepare(`
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
    
    const stats = {
      trackingId,
      totalOpens: opens.length,
      firstOpen: opens[0]?.timestamp || null,
      lastOpen: opens[opens.length - 1]?.timestamp || null,
      opens: opens,
      dataSource: 'D1 Database'
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: stats
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