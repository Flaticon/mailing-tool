import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  try {
    // Verificar bindings disponibles
    const allKeys = Object.keys(globalThis)
    const dbKeys = allKeys.filter(key => 
      key.includes('DB') || key.includes('TRACK') || key.includes('EMAIL')
    )
    
    // Intentar acceder a la base de datos
    const emailTrackingDB = (globalThis as any).EMAIL_TRACKING
    const regularDB = (globalThis as any).DB
    
    let dbTest = null
    let error = null
    
    if (emailTrackingDB) {
      try {
        const result = await emailTrackingDB.prepare("SELECT 1 as test").first()
        dbTest = { success: true, result }
      } catch (e) {
        error = e.message
        dbTest = { success: false, error: e.message }
      }
    }
    
    return new Response(JSON.stringify({
      bindings: {
        EMAIL_TRACKING: !!emailTrackingDB,
        DB: !!regularDB,
        found_keys: dbKeys
      },
      database_test: dbTest,
      error: error,
      all_keys_sample: allKeys.slice(0, 30),
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}