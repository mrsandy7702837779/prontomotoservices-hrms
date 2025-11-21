import { app, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function employeesArchivedGet(): Promise<HttpResponseInit> {
  const { rows } = await pool.query(`
    SELECT id, emp_code, first_name, last_name,
           COALESCE(photo_url,'') AS photo_url,
           COALESCE(email,'') AS email,
           COALESCE(mobile,'') AS mobile,
           COALESCE(job_title,'') AS job_title,
           status
    FROM employees
    WHERE status='archived'
    ORDER BY emp_code ASC
    LIMIT 500
  `);
  return { jsonBody: rows };
}

app.http("employees-archived-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "employees-archived",
  handler: employeesArchivedGet
});
