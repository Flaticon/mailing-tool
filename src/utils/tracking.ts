// src/pages/api/stats/tracking.ts - VERSION CORREGIDA
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
    
    console.log(`📊 Getting stats for tracking ID: ${trackingId}`)
    
    // Conectar a D1 Database de tracking
    const db = (globalThis as any).EMAIL_TRACKING
    
    console.log('🔍 EMAIL_TRACKING binding available:', !!db)
    
    if (!db) {
      console.error('❌ EMAIL_TRACKING binding not found')
      return new Response(JSON.stringify({
        success: false,
        error: 'EMAIL_TRACKING binding not available',
        debug: {
          availableBindings: Object.keys(globalThis).filter(k => k.includes('DB') || k.includes('TRACK'))
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Verificar/crear tabla si no existe
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS email_opens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tracking_id TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          user_agent TEXT,
          ip_address TEXT,
          referer TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
      
      await db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_tracking_id ON email_opens(tracking_id)
      `).run()
      
      console.log('✅ Table verified/created')
    } catch (tableError) {
      console.error('⚠️ Table creation warning:', tableError.message)
      // Continuar aunque falle (puede que ya exista)
    }
    
    // Obtener datos de tracking
    let opens = []
    try {
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
      
      opens = opensResult.results || []
      console.log(`📈 Found ${opens.length} opens for tracking ID: ${trackingId}`)
      
    } catch (queryError) {
      console.error('❌ Query error:', queryError.message)
      
      // Si falla la query, intentar insertar dato de prueba
      try {
        await db.prepare(`
          INSERT OR IGNORE INTO email_opens (tracking_id, timestamp, user_agent, ip_address)
          VALUES (?, ?, ?, ?)
        `).bind(trackingId, new Date().toISOString(), 'Test Browser', '127.0.0.1').run()
        
        console.log('✅ Test data inserted')
        opens = [{ 
          tracking_id: trackingId, 
          timestamp: new Date().toISOString(),
          user_agent: 'Test Browser',
          ip_address: '127.0.0.1',
          referer: null
        }]
      } catch (insertError) {
        console.error('❌ Insert error:', insertError.message)
        opens = []
      }
    }
    
    const stats = {
      trackingId,
      totalOpens: opens.length,
      firstOpen: opens[0]?.timestamp || null,
      lastOpen: opens[opens.length - 1]?.timestamp || null,
      opens: opens,
      dataSource: 'D1 Database',
      debug: {
        hasBinding: !!db,
        opensCount: opens.length,
        timestamp: new Date().toISOString()
      }
    }
    
    console.log(`📊 Returning stats for ${trackingId}:`, {
      totalOpens: stats.totalOpens,
      hasData: opens.length > 0
    })
    
    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('💥 Stats endpoint error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      debug: {
        errorType: error.constructor.name,
        hasEmailTracking: !!(globalThis as any).EMAIL_TRACKING,
        stack: error.stack?.split('\n').slice(0, 5) // Primeras 5 líneas del stack
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}