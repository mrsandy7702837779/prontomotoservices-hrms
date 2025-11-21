import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";

export async function employeeAssetsGet(req: HttpRequest) {
  const id = (req.params?.id as string) || "";
  if (!id) return { status: 400, jsonBody: { error: "id required" } };

  const { rows } = await pool.query(
    `
    SELECT id, item_name, item_code, issued_on, returned_on, status, notes
    FROM employee_assets
    WHERE employee_id = $1
    ORDER BY COALESCE(issued_on, returned_on) DESC NULLS LAST, item_name ASC
    `,
    [id]
  );

  return { jsonBody: rows };
}

app.http("employee-assets-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "employees/{id}/assets",
  handler: employeeAssetsGet,
});
