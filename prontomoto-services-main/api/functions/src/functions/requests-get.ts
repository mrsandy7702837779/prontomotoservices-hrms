import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";

export async function requestsList(req: HttpRequest) {
  try {
    const qtype = req.query.get("type") || null;
    const qstatus = req.query.get("status") || null;
    const qemp = req.query.get("employeeId") || null;

    const where: string[] = [];
    const vals: any[] = [];

    if (qtype) { vals.push(qtype); where.push(`r.type = $${vals.length}`); }
    if (qstatus) { vals.push(qstatus); where.push(`r.status = $${vals.length}`); }
    if (qemp) { vals.push(qemp); where.push(`r.employee_id = $${vals.length}`); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT r.*, e.emp_code, e.first_name, e.last_name, e.photo_url
      FROM requests r
      LEFT JOIN employees e ON e.id = r.employee_id
      ${whereSql}
      ORDER BY r.created_at DESC
      LIMIT 500;
    `;

    const { rows } = await pool.query(sql, vals);
    return { status: 200, jsonBody: rows || [] };
  } catch (err) {
    console.error("requests-get error:", err);
    return { status: 500, jsonBody: { error: "failed to list requests", details: String(err) } };
  }
}

app.http("requests-get", {
  route: "requests",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: requestsList,
});
