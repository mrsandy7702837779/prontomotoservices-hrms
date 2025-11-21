import { app } from "@azure/functions";
import { pool } from "../shared/db";

// GET /api/employees/next-code?prefix=PMS
export async function employeesNextCode() {
  const prefix = "PMS";
  const { rows } = await pool.query(
    `SELECT emp_code
     FROM employees
     WHERE emp_code LIKE $1
     ORDER BY emp_code DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length) {
    const last = rows[0].emp_code || ""; // e.g., PMS012
    const num = parseInt(last.replace(prefix, ""), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const emp_code = `${prefix}${String(nextNum).padStart(3, "0")}`;
  return { jsonBody: { emp_code } };
}

app.http("employees-next-code", {
  route: "employees/next-code",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: employeesNextCode,
});
