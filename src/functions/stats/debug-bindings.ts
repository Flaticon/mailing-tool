// functions/stats/debug.ts
import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequest: PagesFunction = async (context) => {
  try {
    const env = context.env;
    const emailTrackingDB = env.EMAIL_TRACKING as D1Database | undefined;
    const regularDB = env.DB as D1Database | undefined;

    let dbTest: any = null;
    let error: string | null = null;

    if (emailTrackingDB) {
      try {
        const result = await emailTrackingDB.prepare("SELECT 1 as test").first();
        dbTest = { success: true, result };
      } catch (e: any) {
        error = e.message;
        dbTest = { success: false, error: e.message };
      }
    }

    return new Response(
      JSON.stringify(
        {
          bindings: {
            EMAIL_TRACKING: !!emailTrackingDB,
            DB: !!regularDB,
          },
          database_test: dbTest,
          error,
          env_keys: Object.keys(env),
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify(
        {
          error: error.message,
          stack: error.stack,
        },
        null,
        2
      ),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
