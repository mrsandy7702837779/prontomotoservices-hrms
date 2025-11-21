// src/functions/requests-delete.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function requestsDelete(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const id = req.params?.id;
    if (!id) return { status: 400, jsonBody: { error: "request id required" } };

    const result = await pool.query(
      `DELETE FROM requests WHERE id = $1 AND status = 'pending' RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return {
        status: 404,
        jsonBody: { error: "Request not found or cannot delete approved/rejected requests" },
      };
    }

    return { status: 200, jsonBody: { ok: true, deleted_id: id } };
  } catch (err: any) {
    console.error("requests-delete error:", err);
    return { status: 500, jsonBody: { error: err.message || "Server error" } };
  }
}

app.http("requests-delete", {
  route: "requests/{id}",
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: requestsDelete,
});
