import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";

export async function employeeLeavesGet(req: HttpRequest) {
  const id = (req.params?.id as string) || "";
  if (!id) return { status: 400, jsonBody: { error: "id required" } };

  const { rows } = await pool.query(`
  SELECT id, start_date, end_date, reason, status, created_at
  FROM leave_requests
  WHERE employee_id = $1
    AND status = 'approved'
  ORDER BY start_date DESC
`, [id]);


  return { jsonBody: rows };
}

app.http("employee-leaves-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "employees/{id}/leaves",
  handler: employeeLeavesGet,
});
