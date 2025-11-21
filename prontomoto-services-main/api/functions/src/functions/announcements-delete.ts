// src/functions/announcements-delete.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function announcementsDelete(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const id = req.params?.id;
    if (!id) {
      return { status: 400, jsonBody: { error: "id required" } };
    }

    await pool.query("DELETE FROM announcements WHERE id=$1", [id]);
    // Optionally you can notify clients here (SignalR) — omitted to keep polling-friendly.
    return { status: 200, jsonBody: { ok: true } };
  } catch (err: any) {
    console.error("announcementsDelete error:", err);
    return { status: 500, jsonBody: { error: "delete failed", details: String(err) } };
  }
}

app.http("announcements-delete", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "announcements/{id}",
  handler: announcementsDelete,
});
