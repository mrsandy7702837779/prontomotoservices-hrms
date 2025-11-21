// src/functions/reporting-assign.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

type AssignBody = {
  employee_ids: string[];
  project: string;
  manager: string;
  role?: string;
};

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export async function reportingAssign(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as AssignBody;
    const { employee_ids, project, manager, role } = body || {};

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return { status: 400, jsonBody: { error: "employee_ids is required and must be a non-empty array" } };
    }
    if (!project || typeof project !== "string") {
      return { status: 400, jsonBody: { error: "project is required" } };
    }
    if (!manager || typeof manager !== "string") {
      return { status: 400, jsonBody: { error: "manager is required" } };
    }

    // basic UUID validation (skip invalid values)
    const uuids = employee_ids.filter((id) => typeof id === "string" && uuidRegex.test(id));
    if (uuids.length === 0) {
      return { status: 400, jsonBody: { error: "No valid employee UUIDs provided" } };
    }

    // Update rows
    await pool.query(
      `UPDATE employees
       SET project = $1, manager = $2, job_title = COALESCE($3, job_title), updated_at = now()
       WHERE id = ANY($4::uuid[])`,
      [project, manager, role || null, uuids]
    );

    // Return updated rows for frontend convenience
    const { rows: updated } = await pool.query(
      `SELECT id, emp_code, first_name, last_name, project, manager, job_title
       FROM employees
       WHERE id = ANY($1::uuid[])`,
      [uuids]
    );

    return { status: 200, jsonBody: { success: true, message: "Project assigned successfully", updated } };
  } catch (err: any) {
    console.error("reportingAssign error:", err);
    return { status: 500, jsonBody: { error: "Failed to assign project", details: String(err) } };
  }
}

app.http("reporting-assign", {
  route: "reporting/assign",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: reportingAssign,
});
