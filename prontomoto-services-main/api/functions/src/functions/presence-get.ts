// src/functions/presence-get.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function presenceGet(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const whoInQuery = `
      SELECT 
        e.id, e.emp_code, e.first_name, e.last_name,
        COALESCE(e.photo_url, '') AS photo_url,
        COALESCE(e.job_title, '') AS job_title,
        COALESCE(es.last_seen_ts, now()) AS last_seen_ts
      FROM employee_status es
      JOIN employees e ON e.id = es.employee_id
      WHERE es.presence = 'in'
        AND e.status = 'active'
      ORDER BY es.last_seen_ts DESC;
    `;
    const whoIn = await pool.query(whoInQuery);

    const recentCheckoutsQuery = `
      SELECT 
        e.id, e.emp_code, e.first_name, e.last_name,
        COALESCE(e.photo_url, '') AS photo_url,
        COALESCE(e.job_title, '') AS job_title,
        a.check_out_ts
      FROM attendance_logs a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date = $1
        AND a.check_out_ts IS NOT NULL
      ORDER BY a.check_out_ts DESC;
    `;
    const recentCheckouts = await pool.query(recentCheckoutsQuery, [today]);

    return {
      status: 200,
      jsonBody: {
        in: whoIn.rows,
        out: recentCheckouts.rows,
      },
    };
  } catch (err: any) {
    console.error("presence-get error:", err);
    return {
      status: 500,
      jsonBody: { error: "Failed to fetch presence data", details: String(err) },
    };
  }
}

app.http("presence-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "presence",
  handler: presenceGet,
});
