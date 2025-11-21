import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function employeeGet(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const id = req.params?.id || (req as any)?.params?.id;
    if (!id) {
      return { status: 400, jsonBody: { error: "Employee ID required (route param 'id')" } };
    }

    const { rows } = await pool.query(
      `SELECT
        e.id, e.emp_code, e.first_name, e.last_name, e.email, e.mobile, e.address,
        e.dob, e.join_date, e.marital_status, e.marriage_date, e.blood_group,
        e.emergency_name, e.emergency_mobile,
        e.job_title, e.department,
        e.grad_college, e.grad_degree, e.grad_year,
        e.inter_college, e.inter_course, e.inter_year,
        e.photo_url, e.project, e.manager, e.status,
        COALESCE(es.presence, 'out') AS presence,
        COALESCE(es.last_seen_ts, now()) AS last_seen_ts
      FROM employees e
      LEFT JOIN employee_status es ON es.employee_id = e.id
      WHERE e.id = $1
      LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return { status: 404, jsonBody: { error: "Employee not found" } };
    }

    return { status: 200, jsonBody: rows[0] };
  } catch (err: any) {
    console.error("employee-get error:", err);
    return { status: 500, jsonBody: { error: "Failed to get employee", details: String(err) } };
  }
}

app.http("employee-get", {
  route: "employees/{id}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: employeeGet,
});
