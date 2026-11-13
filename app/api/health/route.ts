import { connection } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  // Make this route dynamic: run on every request, never at build time
  await connection();

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT version()`;

    return Response.json({
      status: 'ok',
      database: rows[0].version,
    });
  } catch (error) {
    // Log details on the server, return a generic message to the client
    console.error('Health check failed:', error);

    return Response.json({ status: 'error' }, { status: 503 });
  }
}