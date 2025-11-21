// src/functions/leaves-get.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function leavesGet(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const employeeId = req.params?.id;
    if (!employeeId) {
      return { status: 400, jsonBody: { error: "employee id required" } };
    }

    const { rows } = await pool.query(
      `SELECT id, start_date, end_date, reason, status, created_at
       FROM leave_requests
       WHERE employee_id = $1
       ORDER BY start_date DESC`,
      [employeeId]
    );

    // Normalize date strings to YYYY-MM-DD to avoid timezone display issues on client
    const normalized = rows.map((r: any) => ({
      ...r,
      start_date: r.start_date ? String(r.start_date).slice(0, 10) : null,
      end_date: r.end_date ? String(r.end_date).slice(0, 10) : null,
    }));

    return { status: 200, jsonBody: normalized };
  } catch (err: any) {
    console.error("leaves-get error:", err);
    return { status: 500, jsonBody: { error: err.message || "Server error" } };
  }
}

app.http("leaves-get", {
  route: "leaves/{id}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: leavesGet,
});
