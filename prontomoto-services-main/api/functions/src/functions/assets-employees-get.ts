import { app } from "@azure/functions";
import { pool } from "../shared/db";

// ✅ Get all employees who have at least 1 asset
export async function assetsEmployeesGet() {
  const result = await pool.query(`
    SELECT DISTINCT e.id, e.emp_code, e.first_name, e.last_name,
           COALESCE(e.photo_url, '') AS photo_url,
           COALESCE(e.job_title, '') AS job_title,
           COALESCE(e.email, '') AS email
    FROM employees e
    JOIN employee_assets a ON a.employee_id = e.id
    WHERE e.status = 'active'
    ORDER BY e.emp_code ASC
  `);

  return {
    jsonBody: result.rows
  };
}

app.http("assets-employees-get", {
  route: "assets/employees",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: assetsEmployeesGet
});
