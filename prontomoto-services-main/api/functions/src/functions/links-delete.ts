// src/functions/links-delete.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function linksDelete(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const id = req.params?.id;
    if (!id) return { status: 400, jsonBody: { error: "id required" } };
    await pool.query("DELETE FROM company_links WHERE id=$1", [id]);
    return { status: 200, jsonBody: { ok: true } };
  } catch (err: any) {
    console.error("linksDelete error:", err);
    return { status: 500, jsonBody: { error: "failed to delete link", details: String(err) } };
  }
}

app.http("links-delete", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "links/{id}",
  handler: linksDelete,
});
