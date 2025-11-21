import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

/**
 * Normalize date fields to plain YYYY-MM-DD strings so frontend <input type="date">
 * and displays never get a timezone-shifted ISO string.
 */
function normalizeDateFields(row: any) {
  if (!row) return row;
  const dateFields = ["dob", "join_date", "marriage_date"];
  for (const f of dateFields) {
    const v = row[f];
    if (v instanceof Date) {
      // Convert Date -> YYYY-MM-DD (no timezone conversion)
      row[f] = v.toISOString().slice(0, 10);
    } else if (typeof v === "string" && v.includes("T")) {
      // e.g. "2024-10-24T18:30:00.000Z" -> "2024-10-24" (take date part)
      row[f] = v.slice(0, 10);
    } else if (typeof v === "string") {
      // already probably "YYYY-MM-DD" — keep first 10 chars to be safe
      row[f] = v.slice(0, 10);
    } else {
      // null/undefined — keep as-is
    }
  }
  return row;
}

export async function employeesGet(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const q = (req.query.get("q") || "").trim();
    const like = `%${q}%`;

    const sql = `
      SELECT 
        e.id,
        e.emp_code,
        e.first_name,
        e.last_name,
        e.email,
        e.mobile,
        e.job_title,
        e.department,
        e.project,
        e.manager,
        e.photo_url,
        e.dob,
        e.join_date,
        e.status,
        e.address,
        e.marital_status,
        e.marriage_date,
        e.blood_group,
        e.emergency_name,
        e.emergency_mobile,
        e.grad_college,
        e.grad_degree,
        e.grad_year,
        e.inter_college,
        e.inter_course,
        e.inter_year,
        COALESCE(es.presence, 'out') AS presence,
        COALESCE(es.last_seen_ts, now()) AS last_seen_ts
      FROM employees e
      LEFT JOIN employee_status es ON es.employee_id = e.id
      WHERE e.status = 'active'
        AND (
          $1 = '' OR
          e.emp_code ILIKE $2 OR
          e.first_name ILIKE $2 OR
          e.last_name ILIKE $2
        )
      ORDER BY e.emp_code ASC
      LIMIT 200;
    `;

    const params = q === "" ? ["", like] : [q, like];
    const { rows } = await pool.query(sql, params);

    // normalize all rows before returning
    const fixed = rows.map(normalizeDateFields);

    return {
      status: 200,
      jsonBody: fixed,
    };
  } catch (err: any) {
    console.error("employees-get error:", err);
    return {
      status: 500,
      jsonBody: { error: err.message || "Server error" },
    };
  }
}

app.http("employees-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "employees",
  handler: employeesGet,
});
