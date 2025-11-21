import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";

export async function archivedDelete(req: HttpRequest) {
  const id = (req.params?.id as string) || "";
  if (!id) return { status: 400, jsonBody: { error: "id required" } };

  // Only hard-delete if already archived
  await pool.query("DELETE FROM employees WHERE id = $1 AND status = 'archived'", [id]);
  return { jsonBody: { ok: true } };
}

app.http("employees-archived-delete", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "employees-archived/{id}",
  handler: archivedDelete,
});
