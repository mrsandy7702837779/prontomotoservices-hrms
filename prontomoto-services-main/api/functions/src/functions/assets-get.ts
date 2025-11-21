import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";

export async function assetsGet(req: HttpRequest) {
  const employeeId = req.params["id"];  // ✅ FIXED HERE
  if (!employeeId) {
    return { status: 400, jsonBody: { error: "employee id required" } };
  }

  const result = await pool.query(
    `SELECT id, item_name, item_code, issued_on, status, notes
     FROM employee_assets
     WHERE employee_id = $1
     ORDER BY issued_on DESC NULLS LAST`,
    [employeeId]
  );

  return { jsonBody: result.rows };
}

app.http("assets-get", {
  route: "assets/{id}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: assetsGet
});
