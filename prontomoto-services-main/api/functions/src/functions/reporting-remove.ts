// src/functions/reporting-remove.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

type RemoveBody = {
  employee_id?: string;
};

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export async function reportingRemove(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as RemoveBody;
    const { employee_id } = body || {};

    if (!employee_id || typeof employee_id !== "string" || !uuidRegex.test(employee_id)) {
      return { status: 400, jsonBody: { error: "employee_id is required and must be a valid UUID" } };
    }

    await pool.query(
      `UPDATE employees
       SET project = NULL, manager = NULL, updated_at = now()
       WHERE id = $1`,
      [employee_id]
    );

    const { rows } = await pool.query(
      `SELECT id, emp_code, first_name, last_name, project, manager, job_title
       FROM employees
       WHERE id = $1`,
      [employee_id]
    );

    return { status: 200, jsonBody: { success: true, message: "Employee removed from reporting matrix", updated: rows[0] || null } };
  } catch (err: any) {
    console.error("reportingRemove error:", err);
    return { status: 500, jsonBody: { error: "Failed to update employee", details: String(err) } };
  }
}

app.http("reporting-remove", {
  route: "reporting/remove",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: reportingRemove,
});
