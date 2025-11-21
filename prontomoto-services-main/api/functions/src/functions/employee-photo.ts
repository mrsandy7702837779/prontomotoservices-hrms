// src/functions/employee-photo.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function employeePhoto(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const username = (req.query && (req.query as any).get ? (req.query as any).get("username") : new URL(req.url).searchParams.get("username")) || null;
    if (!username) return { status: 400, jsonBody: { error: "username required" } };

    // adjust query to match your login table structure
    const q = `
      SELECT e.photo_url, e.face_descriptor
      FROM employees e
      JOIN employee_logins l ON l.employee_id = e.id
      WHERE l.username = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [username]);
    if (!rows || rows.length === 0) {
      return { status: 404, jsonBody: { error: "employee not found" } };
    }

    const r = rows[0];
    // face_descriptor may be stored as jsonb/text — return as-is
    return { status: 200, jsonBody: { photo_url: r.photo_url || null, face_descriptor: r.face_descriptor || null } };
  } catch (err: any) {
    console.error("employeePhoto error:", err);
    return { status: 500, jsonBody: { error: "Server error", details: String(err) } };
  }
}

app.http("employee-photo", {
  route: "employee-photo",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: employeePhoto,
});
