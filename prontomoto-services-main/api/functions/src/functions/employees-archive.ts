import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function employeesArchive(req: HttpRequest): Promise<HttpResponseInit> {
  const id = (req.params as any)?.id; // params is an object
  if (!id) return { status: 400, jsonBody: { error: "id required" } };

  await pool.query("UPDATE employees SET status='archived' WHERE id=$1", [id]);
  return { jsonBody: { ok: true } };
}

app.http("employees-archive", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "employees/{id}",
  handler: employeesArchive
});
