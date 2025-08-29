import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ env }) => {
  try {
    const emailTrackingDB = env.EMAIL_TRACKING
    const regularDB = env.DB
    
    let dbTest = null
    let error = null
    
    if (emailTrackingDB) {
      try {
        const result = await emailTrackingDB.prepare("SELECT 1 as test").first()
        dbTest = { success: true, result }
      } catch (e: any) {
        error = e.message
        dbTest = { success: false, error: e.message }
      }
    }
    
    return new Response(JSON.stringify({
      bindings: {
        EMAIL_TRACKING: !!emailTrackingDB,
        DB: !!regularDB
      },
      database_test: dbTest,
      error,
      env_keys: Object.keys(env),
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
